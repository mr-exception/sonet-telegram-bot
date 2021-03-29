import TelegramBot from "node-telegram-bot-api";

const token = process.env.TELEGRAM_TOKEN;
if (!token) {
  process.exit(2);
}
const bot = new TelegramBot(token, { polling: true });
export default bot;
