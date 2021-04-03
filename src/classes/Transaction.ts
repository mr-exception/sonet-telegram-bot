import Context from "../Context";
import { ISubTransactionRecord } from "../interfaces";
import { SubTransaction } from "./SubTransaction";

export default class Transaction {
  public subTransactions: SubTransaction[] = [];
  constructor(
    public id: string,
    public description: string,
    public creatorId: string,
    public amount: number,
    public groupId: string,
    public groupName: string,
    public context: Context
  ) {}

  public loadSubTransactions = async (): Promise<void> => {
    this.subTransactions = ((await this.context.db.select(
      "SELECT * FROM sub_transactions WHERE transactionId = ?",
      [this.id]
    )) as ISubTransactionRecord[]).map(
      (data) =>
        new SubTransaction(
          data.ID,
          data.Src,
          data.Dst,
          this,
          data.Amount,
          this.context
        )
    );
    for (let i = 0; i < this.subTransactions.length; i++) {
      const subTransaction = this.subTransactions[i];
      await subTransaction.loadExtraInfo();
    }
  };

  public generateDeleteCommand = (): string => {
    return this.id.toString().padStart(6, "0");
  };
  public printMessage = (): string => {
    return [
      `_description:_ ${this.description}`,
      `_amount:_ ${this.amount}`,
      `_members:_ ${this.subTransactions
        .map((sub) => sub.printMessage())
        .join(", ")}`,
      `*delete*: /d${this.generateDeleteCommand()}`,
    ].join("\n");
  };
}
