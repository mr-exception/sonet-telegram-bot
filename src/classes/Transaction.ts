import Context from "../Context";
import { ISubTransactionRecord, ITransactionRecord } from "../interfaces";
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

  // =====================================
  //          static methods
  // =====================================
  static get = async (
    page: number = 0,
    pageSize: number = 10,
    context: Context,
    groupId: number = 0,
    creatorId: number = 0
  ): Promise<Transaction[]> => {
    // geerate query
    const statements = [];
    if (groupId !== 0) {
      statements.push(`GroupID = ${groupId}`);
    }
    if (creatorId !== 0 && groupId === 0) {
      statements.push(`Creator = ${creatorId}`);
    }
    const data = await context.db.select(
      `SELECT * FROM transactions WHERE ${statements.join(
        " AND "
      )} limit ? offset ?`,
      [pageSize, page * pageSize]
    );
    // parsing results
    const result = data.map((record) => {
      const item = record as ITransactionRecord;
      return new Transaction(
        parseInt(item.ID + ""),
        item.Description,
        parseInt(item.Creator + ""),
        parseInt(item.Amount + ""),
        parseInt(item.GroupId + ""),
        item.GroupName,
        context
      );
    });
    for (let i = 0; i < result.length; i++) {
      const transaction = result[i];
      await transaction.loadSubTransactions();
    }
    return result;
  };

  static count = async (
    context: Context,
    groupId: number,
    creatorId: number
  ): Promise<number> => {
    // geerate query
    const statements = [];
    if (groupId !== 0) {
      statements.push(`GroupID = ${groupId}`);
    }
    if (creatorId !== 0) {
      statements.push(`Creator = ${creatorId}`);
    }
    const data = (await context.db.select(
      `SELECT count(*) as count FROM transactions WHERE ${statements.join(
        " AND "
      )}`,
      []
    )) as { count: number }[];
    return data[0].count;
  };
}
