const TelegramBot = require("node-telegram-bot-api");
const Sqlite = require("sqlite3").verbose();
const fs = require("fs");
const State = require("./states");
// initializing database
const db = new Sqlite.Database("./data.sqlite");
db.serialize(() => {
  const query = fs.readFileSync("./init.sql").toString().split("\n");
  query.forEach((q) => db.run(q));
  console.debug("database initialized...");
});

const states = new State();

const token = process.env.TELEGRAM_TOKEN;
let amountStates = [];

const bot = new TelegramBot(token, { polling: true });
bot.onText(/\/new/, async (msg, match) => {
  const chatId = msg.chat.id;
  await bot.sendMessage(chatId, "please set amount:");
  states.set(chatId, "getAmount", {});
});
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;
  const chatState = states.get(chatId);
  if (chatState) {
    const { state, data } = chatState;
    if (state === "getAmount") {
      if (/^\d+$/) {
        await bot.sendMessage(chatId, `amount *${messageText}* is invalid`, {
          parse_mode: "Markdown",
        });
        return;
      }
      const amount = parseInt(messageText);
      await bot.sendMessage(chatId, `ok: ${amount}`, {
        parse_mode: "Markdown",
      });
      states.remove(chatId);
    }
  }
});
