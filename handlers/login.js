
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('db.json');
const db = low(adapter);

const loginHandler = (req, res) => {
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
}

module.exports = {
  loginHandler
};