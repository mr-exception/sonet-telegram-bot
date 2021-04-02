import TelegramBot from "node-telegram-bot-api";
import Database from "./db";

export default class Context {
  constructor(public bot: TelegramBot, public db: Database) {
    console.debug("context initialized...");
  }
}
