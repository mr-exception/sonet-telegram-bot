export default class Transaction {
  constructor(
    public id: string,
    public description: string,
    public creatorId: string,
    public amount: number,
    public groupId: string,
    public groupName: string
  ) {}

  public loadSubTransactions = async (): Promise<void> => {};

  public generateDeleteCommand = (): string => {
    return this.id.toString().padStart(6, "0");
  };
  public printMessage = (): string => {
    return [
      `_description:_ ${this.description}`,
      `_amount:_ ${this.amount}`,
      `*delete*: /d${this.generateDeleteCommand()}`,
    ].join("\n");
  };
}
