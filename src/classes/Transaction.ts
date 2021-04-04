import Context from "../Context";
import { ISubTransactionRecord } from "../interfaces";
import { SubTransaction } from "./SubTransaction";

export default class Transaction {
  public subTransactions: SubTransaction[] = [];
  constructor(
    public id: number,
    public description: string,
    public creatorId: number,
    public amount: number,
    public groupId: number,
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
          parseInt(data.ID + ""),
          parseInt(data.Src + ""),
          parseInt(data.Dst + ""),
          this,
          parseInt(data.Amount + ""),
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

  public delete = async (): Promise<void> => {
    await this.context.db.run("DELETE FROM transactions WHERE ID = ?", [
      this.id,
    ]);
    await this.context.db.run(
      "DELETE FROM sub_transactions WHERE TransactionID = ?",
      [this.id]
    );
  };
}
