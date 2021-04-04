export interface ITransactionRecord {
  ID: string;
  Creator: string;
  Amount: string;
  Description: string;
  GroupId: string;
  GroupName: string;
}
export interface ISubTransactionRecord {
  ID: string;
  Src: string;
  Dst: string;
  TransactionID: string;
  Amount: string;
}
export interface ICallBackData {
  action: string;
}
export interface IPageButtonData extends ICallBackData {
  page: number;
}
