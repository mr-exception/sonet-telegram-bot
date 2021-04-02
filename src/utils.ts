import TelegramBot from "node-telegram-bot-api";

/**
 * generates the fullname of a Telergam.User object
 */
export const generateFullName = (user: TelegramBot.User): string => {
  const result = [];
  if (user.first_name) result.push(user.first_name);
  if (user.last_name) result.push(user.last_name);
  return result.join(" ");
};

export const isFromUser = (
  user: TelegramBot.User | undefined,
  userId: number | undefined
): boolean => {
  if (!user || !userId) return false;
  return userId === user.id;
};
