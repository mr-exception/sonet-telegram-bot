import TelegramBot from "node-telegram-bot-api";
import { count } from "node:console";
import Transaction from "../classes/Transaction";
import Context from "../Context";
import { ITransactionRecord } from "../interfaces";
const splitLine = "\n===========================\n";
// util functions
/**
 * returns an array of transactions from data storage
 * @param page default 0
 * @param pageSize default 10
 */
const getTransactions = async (
  page: number = 0,
  pageSize: number = 10,
  context: Context
): Promise<Transaction[]> => {
  const data = await context.db.select(
    "SELECT * FROM transactions limit ? offset ?",
    [pageSize, page * pageSize]
  );
  const result = data.map((record) => {
    const item = record as ITransactionRecord;
    return new Transaction(
      item.ID,
      item.Description,
      item.Creator,
      item.Amount,
      item.GroupId,
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
const getTransactionsCount = async (context: Context): Promise<number> => {
  const data = (await context.db.select(
    "SELECT count(*) as count FROM transactions",
    []
  )) as { count: number }[];
  return data[0].count;
};
const generateTransactionList = async (
  page: number = 0,
  context: Context
): Promise<string | null> => {
  const transactions = await getTransactions(page, 10, context);
  if (transactions.length === 0) return null;
  return transactions
    .map((transaction) => transaction.printMessage())
    .join(splitLine);
};
const generateTansactionPage = async (
  transactions: string,
  count: number,
  context: Context
): Promise<string> => {
  return `${transactions}${splitLine}count: ${count}\ntotal pages: ${Math.ceil(
    count / 10
  )}`;
};
const generateListButtons = async (
  page: number,
  pageCount: number
): Promise<TelegramBot.InlineKeyboardButton[][]> => {
  const hasNext = page < pageCount - 1;
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
  const list = await generateTransactionList(0, context);
  const count = await getTransactionsCount(context);
  if (!list) {
    await context.bot.sendMessage(message.chat.id, "no transactions found");
    return false;
  }
  await context.bot.sendMessage(
    message.chat.id,
    await generateTansactionPage(list, count, context),
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
  const list = await generateTransactionList(page, context);
  const count = await getTransactionsCount(context);
  if (!list) {
    await context.bot.answerCallbackQuery(msg.id, {
      text: "no transaction found",
    });
    return false;
  }
  await context.bot.editMessageText(
    await generateTansactionPage(list, count, context),
    {
      parse_mode: "Markdown",
      message_id: message.message_id,
      chat_id: message.chat.id,
      reply_markup: {
        inline_keyboard: await generateListButtons(page, Math.ceil(count / 10)),
      },
    }
  );
  await context.bot.answerCallbackQuery(msg.id, {
    text: `page ${page} loaded`,
  });

  return true;
};
