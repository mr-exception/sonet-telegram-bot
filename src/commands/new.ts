import TelegramBot from "node-telegram-bot-api";
import states from "../states";
import { generateFullName } from "../utils";
import db from "../db";
import { isFromUser } from "../utils";
import Context from "../Context";
// interfaces
interface IStateData {
  amount?: number;
  description?: string;
  creator_id?: number;
  creator_name?: string;
  selecteds?: number[];
  selecteds_name?: string[];
  group_id?: string;
  group_name?: string;
}
// util functions
const getDstsMessage = (data: IStateData): string => {
  const { amount, creator_name, selecteds_name, selecteds, description } = data;
  const part: number = Math.ceil((amount || 1) / (selecteds || []).length);
  let lines = [
    `\`${amount}\` is set for transaction amount, _${creator_name}_ has paid. whos chipping in?`,
    "",
    `description: _${description}_`,
    "",
    ...(selecteds_name || []).map((item) => `- _${item}_ (\`${part}\`)`),
  ];
  return lines.join("\n");
};
const saveTransaction = async (
  data: IStateData,
  context: Context
): Promise<void> => {
  // insert transaction
  const transactionId = await context.db.run(
    `INSERT INTO transactions (Description, Amount, Creator, GroupName, GroupId) Values (?,?,?,?,?)`,
    [
      data.description || "not defined",
      data.amount || "0",
      data.creator_id || "0",
      data.group_name || "not defined",
      data.group_id || "0",
    ]
  );
  // insert sub transactions
  const sub_amount = Math.ceil(
    (data.amount || 1) / (data.selecteds || [0]).length
  );
  (data.selecteds || []).forEach(async (dst) => {
    console.log(`chip => ${dst}`);
    await context.db.run(
      `INSERT INTO sub_transactions (Src, Dst, TransactionID, Amount) Values (?, ?, ?, ?)`,
      [data.creator_id || "0", dst, transactionId, sub_amount]
    );
  });
};

// handle functions

/**
 * this method trigers after sending /new command to user
 * @return true (progress was successful) or false (progress failed or unknow)
 */
export const handleInit = async (
  message: TelegramBot.Message,
  context: Context
): Promise<boolean> => {
  const chatId = message.chat.id;
  await context.bot.sendMessage(
    chatId,
    "please describe the transaction (< 200 chars):"
  );
  // create state data
  const data: IStateData = {};
  data.creator_id = message.from?.id;
  if (message.from) {
    data.creator_name = generateFullName(message.from);
  }
  // set chip data
  data.selecteds = [];
  data.selecteds_name = [];
  // set group data
  data.group_id = `` + message.chat.id;
  data.group_name = message.chat.title || "not defined";

  states.set(chatId, "getDescription", data);
  return true;
};
/**
 * this method gets the description sent by creator
 * @return true (progress was successful) or false (progress failed or unknow)
 */
export const handleGetDescription = async (
  message: TelegramBot.Message,
  context: Context
): Promise<boolean> => {
  const chatId = message.chat.id;
  const messageText = message.text || "no description";
  const chatState = states.get(chatId);

  // check if user has any active state
  if (!chatState) {
    return false;
  }
  // const { state, data } = chatState;
  const state = chatState.state;
  const data: IStateData = chatState.data;
  // check if the user is the creator
  if (!isFromUser(message.from, data.creator_id)) {
    context.bot.sendMessage(chatId, "only creator can send the description");
    return true;
  }
  // check if user is in getAmount state
  if (state !== "getDescription") {
    return false;
  }
  // fill the data
  data.description = messageText;
  await context.bot.sendMessage(chatId, "please set amount:");
  states.set(chatId, "getAmount", data);
  return true;
};
/**
 * this is the second step after user sends the /new command
 * here we get the transaction amount from user
 * @return true (progress was successful) or false (progress failed or unknow)
 */
export const handleGetAmount = async (
  message: TelegramBot.Message,
  context: Context
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
  // check if the user is the creator
  if (!isFromUser(message.from, data.creator_id)) {
    context.bot.sendMessage(chatId, "only creator can send the amount");
    return true;
  }
  // check if the sent message from user is a valid number
  if (!/^\d+$/.test(messageText)) {
    await context.bot.sendMessage(
      chatId,
      `amount *${messageText}* is invalid`,
      {
        parse_mode: "Markdown",
      }
    );
    return true;
  }
  // update data based on
  data.amount = parseInt(messageText);
  await context.bot.sendMessage(chatId, getDstsMessage(data), {
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
/**
 * this is the last step. every user in chat can chip in with this callback query
 * and the creator of transaction can close the progress by sending `done`
 * @return true (progress was successful) or false (progress failed or unknow)
 */
export const handleGetDsts = async (
  msg: TelegramBot.CallbackQuery,
  context: Context
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
    await context.bot.answerCallbackQuery(msg.id, {
      text: "you are not in",
    });
  } else {
    selecteds.push(userID);
    selecteds_name.push(name);
    await context.bot.answerCallbackQuery(msg.id, {
      text: "you are in",
    });
  }

  data.selecteds = selecteds;
  data.selecteds_name = selecteds_name;
  // edit message
  await context.bot.editMessageText(getDstsMessage(data), {
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
/**
 * this is the last step. creator of transaction sends `done` callback data
 * bot closes the transaction and saves the information in data storage
 * @return true (progress was successful) or false (progress failed or unknow)
 */
export const handleDone = async (
  msg: TelegramBot.CallbackQuery,
  context: Context
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
  if ((data.selecteds || []).length === 0) {
    await context.bot.answerCallbackQuery(msg.id, {
      text: "somebody must be in this transaction!",
    });
    return false;
  }
  if (data.creator_id !== userID) {
    await context.bot.answerCallbackQuery(msg.id, {
      text: "only creator can finish the transaction",
    });
    return false;
  }
  // edit message
  await context.bot.editMessageText(getDstsMessage(data), {
    message_id: msg.message.message_id,
    chat_id: chatId,
    parse_mode: "Markdown",
  });
  await saveTransaction(data, context);
  states.remove(chatId);
  return true;
};
