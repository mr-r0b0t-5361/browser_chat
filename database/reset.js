const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const adapter = new FileSync("db.json");
const db = low(adapter);

const resetDatabase = () => {
  db.defaults({ users: [], messages: [] }).write();
  db.set("users", []).write();
  db.set("messages", []).write();

  // Adds test users
  db.get("users")
    .push({ id: 1, email: "user1", password: "12345" })
    .write();
};

module.exports = {
  resetDatabase
};
