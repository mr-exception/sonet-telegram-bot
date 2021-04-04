import TelegramBot from "node-telegram-bot-api";
import Database from "./db";

export default class Context {
  constructor(public bot: TelegramBot, public db: Database) {
    console.debug("context initialized...");
  }
  public sendMessage = async (
    chatId: number,
    text: string,
    inlineKeyboard: TelegramBot.InlineKeyboardButton[][],
    reply_id?: number
  ): Promise<void> => {
    const option: TelegramBot.SendMessageOptions = { parse_mode: "Markdown" };
    option.reply_markup = {
      inline_keyboard: inlineKeyboard,
      remove_keyboard: true,
    };
    if (reply_id) {
      option.reply_to_message_id = reply_id;
    }
    await this.bot.sendMessage(chatId, text, option);
    await this.bot.setMyCommands([
      { command: "new", description: "add new transaction" },
      { command: "list", description: "get list of transactions" },
      { command: "report", description: "show reports" },
    ]);
  };
}
