import TelegramBot from "node-telegram-bot-api";
import Context from "../Context";
import fs from "fs";
// util functions
const readHelp = (): string => {
  return fs.readFileSync("./help.md").toString();
};
// handle functions

/**
 * this method triggers when user sends /help command
 * @return true (progress was successful) or false (progress failed or unknow)
 */
export const handleInit = async (
  message: TelegramBot.Message,
  context: Context
): Promise<boolean> => {
  context.bot.sendMessage(message.chat.id, readHelp(), {
    parse_mode: "Markdown",
  });
  return true;
};
