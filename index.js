const express = require("express");
const app = express();
const session = require("express-session");
const http = require("http").Server(app);

const { loginHandler } = require('./handlers/login');
const { logoutHandler } = require('./handlers/logout');
const { setSocketEvents } = require('./sockets/events');
const { resetDatabase } = require('./database/reset');
const { SESSION_SECRET } = require("./constants/secrets");

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

app.get("/", (_, res) => res.render("login.ejs"));
app.get("/chat", auth, (_, res) => res.render("chat.ejs"));
app.get("/login", loginHandler);
app.get("/logout", logoutHandler);

setSocketEvents(http);

http.listen(8080, () => {
  console.log("Running on localhost:8080");
});
