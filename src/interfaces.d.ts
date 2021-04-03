export interface ITransactionRecord {
  ID: string;
  Creator: string;
  Amount: number;
  Description: string;
  GroupId: string;
  GroupName: string;
}
export interface ISubTransactionRecord {
  ID: string;
  Src: string;
  Dst: string;
  TransactionID: number;
  Amount: number;
}
export interface ICallBackData {
  action: string;
}
export interface IPageButtonData extends ICallBackData {
  page: number;
}
