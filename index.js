const express = require("express");
const app = express();
const session = require("express-session");
const http = require("http").Server(app);
const io = require("socket.io")(http);
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('db.json');
const db = low(adapter);

const { resetDatabase } = require('./database/reset');
const { getStockPrice } = require('./util/bot');
const { MESSAGE_LIMIT } = require("./constants/chat");
const { SESSION_SECRET } = require("./constants/secrets");
const { getUser } = require("./util/chat");

resetDatabase();

app.use(
  session({
    secret: SESSION_SECRET,
    resave: true,
    saveUninitialized: true
  })
);

const auth = (req, res, next) => {
  if (req.session && req.session.admin) {
    return next();
  }
  res.sendStatus(401);
};

app.get("/", (_, res) => {
  res.render("login.ejs");
});

app.get("/chat", auth, (_, res) => {
  res.render("chat.ejs");
});

app.get("/login", (req, res) => {
  const { username, password } = req.query;
  const result = db.get("users").find({ email: username, password: password }).value();

  if (!username || !password) {
    res.send("login failed");
  } else if (result && username === result.email && password === result.password) {
    req.session.user = username;
    req.session.admin = true;

    res.redirect("/chat");
  } else {
    res.send("Wrong user, please try again!");
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.send("logout successfully!");
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
        io.emit("new_message", getUser(socket.username) + getStockMsg(stockCode, price));
      } catch (error) {
        console.log("Could not find stock price for this code!");
      }
    } else {
      db.get("messages")
        .push({ message, from: socket.username })
        .write();

      if(db.get("messages").value().length >= MESSAGE_LIMIT) {
        db.get("messages").shift().write()
        io.emit("shift_messages");
      }

      io.emit("new_message", getUser(socket.username) + message);
    }
  });
});

http.listen(8080, () => {
  console.log("Running on localhost:8080");
});
