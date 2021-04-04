import TelegramBot from "node-telegram-bot-api";
import { SubTransaction } from "../classes/SubTransaction";
import Transaction from "../classes/Transaction";
import Context from "../Context";
import { ITransactionRecord } from "../interfaces";
import { generateFullName, getGroupId } from "../utils";

interface IDebtById {
  src: number;
  src_name: string;
  dst: number;
  dst_name: string;
  amount: number;
}
// util functions
/**
 * finds a debt record based on src and dst id
 */
const findDebt = (
  src: number,
  dst: number,
  data: IDebtById[]
): IDebtById | undefined =>
  data.find(
    (item) =>
      (item.src === src && item.dst === dst) ||
      (item.dst === src && item.dst === dst)
  );
const addDebt = async (
  src: number,
  dst: number,
  amount: number,
  context: Context,
  chatId: string,
  data: IDebtById[]
): Promise<IDebtById[]> => {
  // find the debt based on records
  const debt = findDebt(src, dst, data);
  // if not found. we have to create it
  if (!debt) {
    const src_name = generateFullName(
      (await context.bot.getChatMember(chatId, src + "")).user
    );
    const dst_name = generateFullName(
      (await context.bot.getChatMember(chatId, dst + "")).user
    );
    data.push({
      src: src,
      dst: dst,
      src_name,
      dst_name,
      amount: amount,
    });
    return data;
  }
  return data.map((item) => {
    if (item.src === src && item.dst === dst) {
      item.amount += amount;
    }
    if (item.dst === src && item.src === dst) {
      item.amount -= amount;
    }
    return item;
  });
};
const generateDebtsMessage = (data: IDebtById[]): string => {
  const result: string[] = data
    .filter((item) => (item.src === item.dst ? null : item))
    .map((item) => {
      if (item.amount < 0) {
        return `_${item.src_name}_ owes _${item.dst_name}_ \`${item.amount}\``;
      } else if (item.amount === 0) {
        return `_${item.src_name}_ and _${item.dst_name}_ are event`;
      } else {
        return `_${item.dst_name}_ owes _${item.src_name}_ \`${item.amount}\``;
      }
    });
  return result.join("\n");
};
// handle functions
/**
 * handle initial function, returns the first page of transactions
 */
export const handleInit = async (
  message: TelegramBot.Message,
  context: Context
): Promise<boolean> => {
  const groupId = getGroupId(message);
  if (groupId === 0) {
    await context.bot.sendMessage(
      message.chat.id,
      "you can use this command in a group chat"
    );
    return false;
  }
  // get records in group
  const records = await SubTransaction.getByGroup(groupId, context);
  // calculate debts
  const debtsByUserId: IDebtById[] = [];
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    await addDebt(
      parseInt(record.Src),
      parseInt(record.Dst),
      parseInt(record.Amount),
      context,
      message.chat.id + "",
      debtsByUserId
    );
  }
  // send message
  await context.sendMessage(
    message.chat.id,
    generateDebtsMessage(debtsByUserId),
    [[]]
  );
  return true;
};
