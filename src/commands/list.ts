import TelegramBot from "node-telegram-bot-api";
import { count, group } from "node:console";
import Transaction from "../classes/Transaction";
import Context from "../Context";
import { ITransactionRecord } from "../interfaces";
const splitLine = "\n===========================\n";
// util functions
const getGroupId = (message: TelegramBot.Message): number => {
  const chatType = message.chat.type;
  const groupId = chatType === "private" ? 0 : message.chat.id;
  return groupId;
};
/**
 * returns an array of transactions from data storage
 * @param page default 0
 * @param pageSize default 10
 */
const getTransactions = async (
  page: number = 0,
  pageSize: number = 10,
  context: Context,
  groupId: number = 0,
  creatorId: number = 0
): Promise<Transaction[]> => {
  let data: object[];
  if (groupId !== 0) {
    data = await context.db.select(
      "SELECT * FROM transactions WHERE GroupID = ? limit ? offset ?",
      [groupId, pageSize, page * pageSize]
    );
  } else {
    data = await context.db.select(
      "SELECT * FROM transactions WHERE Creator = ? limit ? offset ?",
      [creatorId, pageSize, page * pageSize]
    );
  }
  const result = data.map((record) => {
    const item = record as ITransactionRecord;
    return new Transaction(
      parseInt(item.ID + ""),
      item.Description,
      parseInt(item.Creator + ""),
      parseInt(item.Amount + ""),
      parseInt(item.GroupId + ""),
      item.GroupName,
      context
    );
  });
  for (let i = 0; i < result.length; i++) {
    const transaction = result[i];
    await transaction.loadSubTransactions();
  }
  return result;
};
const getTransactionsCount = async (
  context: Context,
  groupId: number,
  creatorId: number
): Promise<number> => {
  let data;
  if (groupId !== 0) {
    data = (await context.db.select(
      "SELECT count(*) as count FROM transactions WHERE GroupID = ?",
      [groupId]
    )) as { count: number }[];
  } else {
    data = (await context.db.select(
      "SELECT count(*) as count FROM transactions WHERE Creator = ?",
      [creatorId]
    )) as { count: number }[];
  }
  return data[0].count;
};
const generateTransactionList = async (
  page: number = 0,
  context: Context,
  groupId: number = 0,
  userId: number = 0
): Promise<string | null> => {
  const transactions = await getTransactions(
    page,
    10,
    context,
    groupId,
    userId
  );
  if (transactions.length === 0) return null;
  return transactions
    .map((transaction) => transaction.printMessage())
    .join(splitLine);
};
const generateTansactionPage = async (
  transactions: string,
  count: number
): Promise<string> => {
  return `${transactions}${splitLine}count: ${count}\ntotal pages: ${Math.ceil(
    count / 10
  )}`;
};
const generateListButtons = async (
  page: number,
  pageCount: number
): Promise<TelegramBot.InlineKeyboardButton[][]> => {
  const result: TelegramBot.InlineKeyboardButton[] = [];
  if (page > 0) {
    result.push({ text: "<<", callback_data: `goPage:${page - 1}` });
  }
  if (page < pageCount - 1) {
    result.push({ text: ">>", callback_data: `goPage:${page + 1}` });
  }
  return [result];
};
// handle functions
/**
 * handle initial function, returns the first page of transactions
 */
export const handleInit = async (
  message: TelegramBot.Message,
  context: Context
): Promise<boolean> => {
  const list = await generateTransactionList(
    0,
    context,
    getGroupId(message),
    (message.from || {}).id || 0
  );
  const count = await getTransactionsCount(
    context,
    getGroupId(message),
    (message.from || {}).id || 0
  );
  if (!list) {
    await context.bot.sendMessage(message.chat.id, "no transactions found");
    return false;
  }
  await context.bot.sendMessage(
    message.chat.id,
    await generateTansactionPage(list, count),
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: await generateListButtons(0, Math.ceil(count / 10)),
      },
    }
  );
  return true;
};
/**
 * handle the goPage command in callback query. returns the entered page of transactions
 */
export const handleGoPage = async (
  msg: TelegramBot.CallbackQuery,
  context: Context
): Promise<boolean> => {
  const data = msg.data || "";
  const message = msg.message;
  if (!message) {
    return false;
  }
  if (!/goPage:\d+/.test(data)) {
    return false;
  }
  const page = parseInt(data.split(":")[1]);
  const list = await generateTransactionList(
    page,
    context,
    getGroupId(message),
    (message.from || {}).id || 0
  );
  const count = await getTransactionsCount(
    context,
    getGroupId(message),
    (message.from || {}).id || 0
  );
  if (!list) {
    await context.bot.answerCallbackQuery(msg.id, {
      text: "no transaction found",
    });
    return false;
  }
  await context.bot.editMessageText(await generateTansactionPage(list, count), {
    parse_mode: "Markdown",
    message_id: message.message_id,
    chat_id: message.chat.id,
    reply_markup: {
      inline_keyboard: await generateListButtons(page, Math.ceil(count / 10)),
    },
  });
  await context.bot.answerCallbackQuery(msg.id, {
    text: `page ${page + 1} loaded`,
  });

  return true;
};
