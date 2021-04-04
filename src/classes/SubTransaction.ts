import TelegramBot from "node-telegram-bot-api";
import Context from "../Context";
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
}
