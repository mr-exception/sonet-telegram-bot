import TelegramBot from "node-telegram-bot-api";

export const handleInit = async (
  message: TelegramBot.Message
): Promise<boolean> => {
  return true;
};
