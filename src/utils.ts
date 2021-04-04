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
/**
 * checks if the sent message is from the passed user id
 * @returns
 */
export const isFromUser = (
  user: TelegramBot.User | undefined,
  userId: number | undefined
): boolean => {
  if (!user || !userId) return false;
  return userId === user.id;
};
/**
 * returns groupId of the sent message. if it's a private message returns 0
 * otherwise returns chat id
 * @returns
 */
export const getGroupId = (message: TelegramBot.Message): number => {
  const chatType = message.chat.type;
  const groupId = chatType === "private" ? 0 : message.chat.id;
  return groupId;
};
