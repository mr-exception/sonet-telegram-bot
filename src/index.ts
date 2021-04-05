import {
  handleDone,
  handleGetAmount,
  handleGetDescription,
  handleGetDsts,
  handleInit as initNewCommand,
  handleInitInline as initNewInlineCommand,
} from "./commands/new";
import { handleGoPage, handleInit as initListCommand } from "./commands/list";
import { handleInit as initDeleteCommand } from "./commands/delete";
import { handleInit as initReportCommand } from "./commands/report";
import { handleInit as initHelpCommand } from "./commands/help";
import TelegramBot from "node-telegram-bot-api";
import Database from "./db";
import Context from "./Context";

import express from "express";

const run = async () => {
  // creating context
  // creating context: database
  const db = new Database("./data/data.sqlite");
  await db.initDatabase();
  // creating context: telegram bot
  const token = process.env.TELEGRAM_TOKEN;
  if (!token) {
    console.error("please set TELEGRAM_TOKEN in enviroment");
    process.exit(2);
  }
  // creating context: telergam bot
  const bot = new TelegramBot(token, { polling: true });
  // creating context: final step
  const context = new Context(bot, db);

  // in private
  bot.onText(/^\/new$/, (msg) => initNewCommand(msg, context));
  bot.onText(/^\/new\s\d+\s.*$/, (msg) => initNewInlineCommand(msg, context));
  bot.onText(/^\/list$/, (msg) => initListCommand(msg, context));
  bot.onText(/^\/report$/, (msg) => initReportCommand(msg, context));
  bot.onText(/^\/help$/, (msg) => initHelpCommand(msg, context));
  bot.onText(/^\/start$/, (msg) => initHelpCommand(msg, context));
  // in group
  bot.onText(/^\/new@sonet_bot$/, (msg) => initNewCommand(msg, context));
  bot.onText(/^\/list@sonet_bot$/, (msg) => initListCommand(msg, context));
  bot.onText(/^\/report@sonet_bot$/, (msg) => initReportCommand(msg, context));
  bot.onText(/^\/help@sonet_bot$/, (msg) => initHelpCommand(msg, context));
  // delete command
  bot.onText(/\/[d]\d+/, (msg) => initDeleteCommand(msg, context));
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
    if (await handleGoPage(msg, context)) {
      return;
    }
  });
};
run();
// start express
const app = express();
const port = 8080;

app.get("/", (req, res) => {
  res.send("this is sonet bot!");
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
