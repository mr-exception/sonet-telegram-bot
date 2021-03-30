import bot from "./bot";
import {
  handleDone,
  handleGetAmount,
  handleGetDescription,
  handleGetDsts,
  handleInit as initNewCommand,
} from "./commands/new";
import TelegramBot from "node-telegram-bot-api";
bot.onText(/\/new/, initNewCommand);
bot.on("message", async (msg: TelegramBot.Message) => {
  console.log(`${msg.chat.id}: ${msg.text}`);
  if (await handleGetDescription(msg)) {
    return;
  }
  if (await handleGetAmount(msg)) {
    return;
  }
});
bot.on("callback_query", async (msg: TelegramBot.CallbackQuery) => {
  if (await handleGetDsts(msg)) {
    return;
  }
  if (await handleDone(msg)) {
    return;
  }
});
