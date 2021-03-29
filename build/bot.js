"use strict";
var TelegramBot = require("node-telegram-bot-api");
var token = process.env.TELEGRAM_TOKEN;
var bot = new TelegramBot(token, { polling: true });
module.exports = bot;
