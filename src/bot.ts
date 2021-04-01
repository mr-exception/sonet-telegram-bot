import TelegramBot from "node-telegram-bot-api";

const token = process.env.TELEGRAM_TOKEN;
if (!token) {
  console.error("please set TELEGRAM_TOKEN in enviroment");
  process.exit(2);
}
const bot = new TelegramBot(token, { polling: true });
export default bot;
