import {
  handleDone,
  handleGetAmount,
  handleGetDescription,
  handleGetDsts,
  handleInit as initNewCommand,
} from "./commands/new";
import { handleInit as initListCommand } from "./commands/list";
import TelegramBot from "node-telegram-bot-api";
import Database from "./db";
import Context from "./Context";

const run = async () => {
  // creating context
  // creating context: database
  const db = new Database("./data.sqlite");
  await db.initDatabase();
  // creating context: telegram bot
  const token = process.env.TELEGRAM_TOKEN;
  if (!token) {
    console.error("please set TELEGRAM_TOKEN in enviroment");
    process.exit(2);
  }
  const bot = new TelegramBot(token, { polling: true });

  const context = new Context(bot, db);

  bot.onText(/\/new/, (msg) => initNewCommand(msg, context));
  bot.onText(/\/list/, (msg) => initListCommand(msg, context));
  bot.on("message", async (msg: TelegramBot.Message) => {
    console.log(`msg ${msg.chat.id}: ${msg.text}`);
    if (await handleGetDescription(msg, context)) {
      return;
    }
    if (await handleGetAmount(msg, context)) {
      return;
    }
  });
  bot.on("callback_query", async (msg: TelegramBot.CallbackQuery) => {
    console.log(`cbk ${msg.from.id}: ${msg.data}`);
    if (await handleGetDsts(msg, context)) {
      return;
    }
    if (await handleDone(msg, context)) {
      return;
    }
  });
};
run();
