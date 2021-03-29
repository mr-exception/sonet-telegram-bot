import TelegramBot from "node-telegram-bot-api";

export const generateFullName = (user: TelegramBot.User) => {
  const result = [];
  if (user.first_name) result.push(user.first_name);
  if (user.last_name) result.push(user.last_name);
  return result.join(" ");
};
