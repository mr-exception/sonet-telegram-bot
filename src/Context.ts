import TelegramBot from "node-telegram-bot-api";
import Database from "./db";

export interface IStateData {
  state: string;
  message_id: number;
}
export interface INewTransactionState extends IStateData {
  amount?: number;
  description?: string;
  creator_id?: number;
  creator_name?: string;
  selecteds?: number[];
  selecteds_name?: string[];
  group_id?: string;
  group_name?: string;
}

export default class Context {
  constructor(public bot: TelegramBot, public db: Database) {
    console.debug("context initialized...");
  }

  // states management
  states: { [key: string]: IStateData[] } = {};
  public getState(id: number, messageId: number): IStateData | undefined {
    return (this.states[id] || []).find(
      (item) => item.message_id === messageId
    );
  }
  public setState(id: number, state: IStateData): void {
    if (!this.states[id]) {
      this.states[id] = [];
    }
    let found = false;
    this.states[id].map((item) => {
      if (item.message_id === state.message_id) {
        found = true;
        return state;
      } else {
        return item;
      }
    });
    if (!found) this.states[id].push(state);
  }
  public removeState(id: number, messageId: number): void {
    if (!this.states[id]) return;
    this.states[id] = this.states[id].filter((item) =>
      item.message_id === messageId ? null : item
    );
    if (this.states[id].length === 0) {
      delete this.states[id];
    }
  }
}
