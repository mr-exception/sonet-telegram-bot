import TelegramBot from "node-telegram-bot-api";
import Transaction from "../classes/Transaction";
import Context from "../Context";
import { ITransactionRecord } from "../interfaces";
// util functions
/**
 * returns a transaction by given id
 */
const getTransaction = async (
  id: number,
  context: Context
): Promise<Transaction | null> => {
  const data = await context.db.select(
    "SELECT * FROM transactions WHERE ID = ?",
    [id]
  );
  if (data.length === 0) {
    return null;
  } else {
    const transactionRecord = data[0] as ITransactionRecord;
    return new Transaction(
      parseInt(transactionRecord.ID + ""),
      transactionRecord.Description,
      parseInt(transactionRecord.Creator + ""),
      parseInt(transactionRecord.Amount + ""),
      parseInt(transactionRecord.GroupId + ""),
      transactionRecord.GroupName,
      context
    );
  }
};
// handle functions
/**
 * handle initial function, returns the first page of transactions
 */
export const handleInit = async (
  message: TelegramBot.Message,
  context: Context
): Promise<boolean> => {
  const transactionId = parseInt((message.text || "").substr(2));
  const transaction = await getTransaction(transactionId, context);
  const sender = message.from;
  if (!sender) {
    return false;
  }
  if (!transaction) {
    await context.bot.sendMessage(message.chat.id, "no transaction found", {
      reply_to_message_id: message.message_id,
    });
    return false;
  }
  if (transaction.creatorId !== sender.id) {
    await context.bot.sendMessage(
      message.chat.id,
      "you are not the creator of this transaction",
      {
        reply_to_message_id: message.message_id,
      }
    );
    return false;
  }
  if (transaction.groupId !== message.chat.id) {
    await context.bot.sendMessage(
      message.chat.id,
      "you have to delete this transaction where you created",
      {
        reply_to_message_id: message.message_id,
      }
    );
    return false;
  }
  await transaction.delete();
  await context.bot.sendMessage(message.chat.id, "transaction deleted", {
    reply_to_message_id: message.message_id,
  });
  return true;
};
