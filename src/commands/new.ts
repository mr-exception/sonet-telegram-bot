import TelegramBot from "node-telegram-bot-api";
import states from "../states";
import { generateFullName } from "../utils";
import { isFromUser } from "../utils";
import Context, { INewTransactionState, IStateData } from "../Context";
// interfaces

// util functions
const getDstsMessage = (data: INewTransactionState): string => {
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
  data: INewTransactionState,
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

export const handleInitInline = async (
  message: TelegramBot.Message,
  context: Context
): Promise<boolean> => {
  const chatId = message.chat.id;
  const text = message.text;
  if (!text) {
    return false;
  }
  const commandParts: string[] = text.split(" ");

  if (!/^\d+$/.test(commandParts[1])) {
    await context.bot.sendMessage(
      chatId,
      `amount *${commandParts[1]}* is invalid`,
      {
        parse_mode: "Markdown",
      }
    );
    return true;
  }

  const amount = parseInt(commandParts[1]);
  const description = commandParts.slice(2).join(" ");

  // create state data
  const data: INewTransactionState = {
    message_id: 0,
    state: "getDsts",
  };
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
  // set amount
  data.amount = amount;
  // set description
  data.description = description;

  // generate and send transaction message
  const transactionMessage = await context.bot.sendMessage(
    chatId,
    getDstsMessage(data),
    {
      parse_mode: "Markdown",
      reply_to_message_id: message.message_id,
      reply_markup: {
        inline_keyboard: [
          [{ text: `I'm in!`, callback_data: "i_am" }],
          [{ text: "done!", callback_data: "done" }],
        ],
      },
    }
  );

  data.message_id = transactionMessage.message_id;

  // set state
  context.setState(chatId, data);
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
  const chatId = msg.message.chat.id;
  const messageId = msg.message.message_id;
  const userID = msg.from.id;
  const name = generateFullName(msg.from);

  const state = context.getState(chatId, messageId) as INewTransactionState;
  console.log(state);
  if (!state) return true;
  if (state.state !== "getDsts") {
    return false;
  }

  let selecteds = state.selecteds || [];
  let selecteds_name = state.selecteds_name || [];
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

  state.selecteds = selecteds;
  state.selecteds_name = selecteds_name;
  // edit message
  await context.bot.editMessageText(getDstsMessage(state), {
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
  state.selecteds = selecteds;
  // set state
  context.setState(chatId, state);
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
  const messageId = msg.message.message_id;
  const userID = msg.from.id;

  const state = context.getState(chatId, messageId) as INewTransactionState;
  if (!state) return true;
  if (state.state !== "getDsts") {
    return false;
  }
  if ((state.selecteds || []).length === 0) {
    await context.bot.answerCallbackQuery(msg.id, {
      text: "somebody must be in this transaction!",
    });
    return false;
  }
  if (state.creator_id !== userID) {
    await context.bot.answerCallbackQuery(msg.id, {
      text: "only creator can finish the transaction",
    });
    return false;
  }
  // edit message
  await context.bot.editMessageText(getDstsMessage(state), {
    message_id: msg.message.message_id,
    chat_id: chatId,
    parse_mode: "Markdown",
  });
  await saveTransaction(state, context);
  // remove state
  context.removeState(chatId, messageId);
  return true;
};
