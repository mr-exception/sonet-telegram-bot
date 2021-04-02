import TelegramBot from "node-telegram-bot-api";
import Transaction from "../classes/Transaction";
import Context from "../Context";
// interfaces
interface ITransactionRecord {
  ID: string;
  Creator: string;
  Amount: number;
  Description: string;
  GroupId: string;
  GroupName: string;
}

const transactionSplitterString = "\n===========================\n";

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
      item.GroupName
    );
  });
  result.forEach(async (transaction) => {
    await transaction.loadSubTransactions();
  });
  return result;
};
// handle functions
export const handleInit = async (
  message: TelegramBot.Message,
  context: Context
): Promise<boolean> => {
  const transactions = await getTransactions(0, 10, context);
  context.bot.sendMessage(
    message.chat.id,
    transactions
      .map((transaction) => transaction.printMessage())
      .join(transactionSplitterString),
    { parse_mode: "Markdown" }
  );
  return true;
};
