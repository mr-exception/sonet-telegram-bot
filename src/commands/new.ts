import TelegramBot from "node-telegram-bot-api";
import states from "../states";
import bot from "../bot";
import { generateFullName } from "../utils";
import db from "../db";
import { RunResult } from "sqlite3";
// interfaces
interface IStateData {
  amount?: number;
  creator_id?: number;
  creator_name?: string;
  selecteds?: number[];
  selecteds_name?: string[];
}
// util functions
const getDstsMessage = (data: IStateData): string => {
  const { amount, creator_name, selecteds_name } = data;
  const part: number = Math.ceil(amount || 1 / (selecteds_name || []).length);
  let lines = [
    `${amount} is set for transaction amount, ${creator_name} has paid. whos chipping in?`,
    "",
    ...(selecteds_name || []).map((item) => `- ${item} (${part})`),
  ];
  return lines.join("\n");
};
const saveTransaction = (data: IStateData): void => {
  db.run(
    `INSERT INTO transactions (Description, Amount, Creator) Values (?,?,?)`,
    ["test transaction", data.amount, data.creator_id],
    function (error: Error | null) {
      if (error) {
        console.error("Error: " + error.message);
        return;
      }
      const transaction_id = this.lastID;
      const sub_amount = Math.ceil(
        (data.amount || 1) / (data.selecteds || [0]).length
      );
      (data.selecteds || []).forEach((dst) =>
        db.run(
          `INSERT INTO sub_transactions (Src, Dst, TransactionID, Amount) Values (?, ?, ?, ?)`,
          [data.creator_id, dst, transaction_id, sub_amount],
          function (error) {
            if (error) {
              console.error("Error: " + error.message);
            }
          }
        )
      );
    }
  );
};
// handle functions
export const handleInit = async (
  message: TelegramBot.Message
): Promise<boolean> => {
  const chatId = message.chat.id;
  await bot.sendMessage(chatId, "please set amount:");
  // create state data
  const data: IStateData = {};
  data.creator_id = message.from?.id;
  if (message.from) {
    data.creator_name = generateFullName(message.from);
  }
  data.selecteds = [];
  data.selecteds_name = [];
  states.set(chatId, "getAmount", data);
  return true;
};
export const handleGetAmount = async (
  message: TelegramBot.Message
): Promise<boolean> => {
  const chatId = message.chat.id;
  const messageText = message.text || "";
  const chatState = states.get(chatId);
  // check if user has any active state
  if (!chatState) {
    return false;
  }
  // const { state, data } = chatState;
  const state = chatState.state;
  const data: IStateData = chatState.data;
  // check if user is in getAmount state
  if (state !== "getAmount") {
    return false;
  }
  // check if the sent message from user is a valid number
  if (!/^\d+$/.test(messageText)) {
    await bot.sendMessage(chatId, `amount *${messageText}* is invalid`, {
      parse_mode: "Markdown",
    });
    return true;
  }
  // update data based on
  data.amount = parseInt(messageText);
  await bot.sendMessage(chatId, getDstsMessage(data), {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: `I'm in!`, callback_data: "i_am" }],
        [{ text: "done!", callback_data: "done" }],
      ],
    },
  });
  states.set(chatId, "getDsts", data);
  return true;
};
export const handleGetDsts = async (
  msg: TelegramBot.CallbackQuery
): Promise<boolean> => {
  if (!msg.message) {
    return false;
  }
  if (msg.data !== "i_am") {
    return false;
  }
  const chatId = msg.message?.chat.id;
  const userID = msg.from.id;
  const name = generateFullName(msg.from);

  const stateData: { state: string; data: IStateData } = states.get(chatId);
  if (!stateData) return true;
  const { state, data } = stateData;
  if (state !== "getDsts") {
    return false;
  }
  let selecteds = data.selecteds || [];
  let selecteds_name = data.selecteds_name || [];
  if (selecteds.includes(userID)) {
    selecteds = selecteds.filter((item) => (item === userID ? null : item));
    selecteds_name = selecteds_name.filter((item) =>
      item === name ? null : item
    );
    await bot.answerCallbackQuery(msg.id, {
      text: "you are not in",
    });
  } else {
    selecteds.push(userID);
    selecteds_name.push(name);
    await bot.answerCallbackQuery(msg.id, {
      text: "you are in",
    });
  }

  data.selecteds = selecteds;
  data.selecteds_name = selecteds_name;
  // edit message
  await bot.editMessageText(getDstsMessage(data), {
    message_id: msg.message?.message_id,
    chat_id: chatId,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: `I'm in!`, callback_data: "i_am" }],
        [{ text: "done!", callback_data: "done" }],
      ],
    },
  });
  data.selecteds = selecteds;
  states.set(chatId, "getDsts", data);
  return true;
};
export const handleDone = async (
  msg: TelegramBot.CallbackQuery
): Promise<boolean> => {
  if (!msg.message) {
    return false;
  }
  if (msg.data !== "done") {
    return false;
  }
  const chatId = msg.message.chat.id;
  const userID = msg.from.id;

  const stateData: { state: string; data: IStateData } = states.get(chatId);
  if (!stateData) return true;
  const { state, data } = stateData;
  if (state !== "getDsts") {
    return false;
  }
  if (data.creator_id !== userID) {
    await bot.answerCallbackQuery(msg.id, {
      text: "only creator can finish the transaction",
    });
  }
  let selecteds = data.selecteds || [];
  // edit message
  await bot.editMessageText(getDstsMessage(data), {
    message_id: msg.message.message_id,
    chat_id: chatId,
    parse_mode: "Markdown",
  });
  saveTransaction(data);
  return true;
};
