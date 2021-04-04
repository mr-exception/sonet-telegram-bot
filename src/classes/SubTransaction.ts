import TelegramBot from "node-telegram-bot-api";
import Context from "../Context";
import { ISubTransactionRecord } from "../interfaces";
import { generateFullName } from "../utils";
import Transaction from "./Transaction";

export class SubTransaction {
  public dstUser?: TelegramBot.User;
  constructor(
    public id: number,
    public src: number,
    public dst: number,
    public transaction: Transaction,
    public amount: number,
    public context: Context
  ) {}

  public loadExtraInfo = async (): Promise<void> => {
    this.dstUser = (
      await this.context.bot.getChatMember(
        this.transaction.groupId,
        this.dst + ""
      )
    ).user;
  };

  public printMessage = (): string => {
    if (this.dstUser) {
      return generateFullName(this.dstUser);
    } else {
      return `user ${this.dst}`;
    }
  };

  // =====================================
  //          static methods
  // =====================================

  static getByGroup = async (
    groupId: number,
    context: Context
  ): Promise<ISubTransactionRecord[]> => {
    const sub_transactions = (await context.db.select(
      "SELECT sub_transactions.* FROM sub_transactions INNER JOIN transactions ON transactions.ID = sub_transactions.TransactionID WHERE transactions.GroupId = ?",
      [groupId]
    )) as ISubTransactionRecord[];
    return sub_transactions;
  };
}
