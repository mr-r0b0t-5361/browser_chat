const express = require("express");
const app = express();
const session = require("express-session");
const http = require("http").Server(app);
const io = require("socket.io")(http);
const low = require('lowdb');

const { getStockPrice } = require('./util/bot');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('db.json');
const db = low(adapter);

db.defaults({ users: [], messages: [] })
.write();

db.set('users', [])
  .write()

db.set('messages', [])
  .write()

// Add test users
db.get('users')
  .push({ id: 1, email: 'user1', password: '12345'})
  .write();

app.get("/", (_, res) => {
  res.render("login.ejs");
});

app.use(
  session({
    secret: "2C44-4D44-WppQ38S",
    resave: true,
    saveUninitialized: true
  })
);

var auth = (req, res, next) => {
  if (req.session && req.session.admin)
    return next();
  else return res.sendStatus(401);
};

app.get("/chat", auth, (_, res) => {
  res.render("chat.ejs");
});

app.get("/login", (req, res) => {
    const result = db.get('users')
    .find({ email: req.query.username, password: req.query.password})
    .value();

  if (!req.query.username || !req.query.password) {
    res.send("login failed");
  } else if (result && req.query.username === result.email && req.query.password === result.password) {
    req.session.user = req.query.username;
    req.session.admin = true;

    res.redirect("/chat");
  } else {
    res.send("Wrong user, please try again!");
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.send("logout success!");
});

io.sockets.on("connection", socket => {
  socket.on("username", username => {
    socket.username = username;
    io.emit(
      "access_room_update",
      "🔵 <i>" + socket.username + " joined the chat..</i>"
    );

  });

  socket.on("disconnect", username => {
    io.emit(
      "access_room_update",
      "🔴 <i>" + socket.username + " left the chat..</i>"
    );
  });

  socket.on("new_message", async message => {
    if (message.includes("/stock") && message.split(" ").length > 1) {
      const stockCode = message.split(" ")[1];
      
      try {
        const price = await getStockPrice(stockCode);
        io.emit(
          "new_message",
          "<strong>" +
            socket.username +
            "</strong>: " +
            `${stockCode.toUpperCase()} quote is $${price} per share`
        );
      } catch (error) {
        console.log("Could not find stock price for this code!");
      }
    } else {
      db.get("messages")
        .push({ message, from: socket.username })
        .write();

      if(db.get("messages").value().length > 49) {
        db.get("messages").shift().write()
        io.emit("shift_messages");
      }

      io.emit(
        "new_message",
        "<strong>" + socket.username + "</strong>: " + message
      );
    }
  });
});

http.listen(8080, () => {
  console.log("Running on localhost:8080");
});
