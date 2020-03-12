const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const adapter = new FileSync("db.json");
const db = low(adapter);
const { MESSAGE_LIMIT } = require("../constants/chat");
const { getUser } = require("../util/chat");
const { getStockPrice } = require('../util/bot');

const setSocketEvents = http => {
  const io = require("socket.io")(http);

  io.sockets.on("connection", socket => {
    socket.on("username", username => {
      socket.username = username;
      io.emit(
        "access_room_update",
        "🔵 <i>" + socket.username + " joined the chat..</i>"
      );
    });

    socket.on("disconnect", () => {
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
            getUser(socket.username) + getStockMsg(stockCode, price)
          );
        } catch (error) {
          console.log("Could not find stock price for this code!");
        }
      } else {
        db.get("messages")
          .push({ message, from: socket.username })
          .write();

        if (db.get("messages").value().length >= MESSAGE_LIMIT) {
          db.get("messages")
            .shift()
            .write();
          io.emit("shift_messages");
        }

        io.emit("new_message", getUser(socket.username) + message);
      }
    });
  });
};

module.exports = {
  setSocketEvents
};
