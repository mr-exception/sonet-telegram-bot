"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var states = require("../states");
var bot = require("../bot");
var text = require("express").text;
var generateFullName = require("../utils").generateFullName;
// util functions
var getDstsMessage = function (data) {
    var amount = data.amount, creator_name = data.creator_name, selecteds = data.selecteds, selecteds_name = data.selecteds_name;
    var result = amount + " is set for transaction amount, " + creator_name + " has paid. whos chipping in?";
};
// handle functions
var handleInit = function (message) { return __awaiter(void 0, void 0, void 0, function () {
    var chatId, data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                chatId = message.chat.id;
                return [4 /*yield*/, bot.sendMessage(chatId, "please set amount:")];
            case 1:
                _a.sent();
                data = {};
                data.creator_id = message.from.id;
                data.creator_name = generateFullName(message.from);
                data.selecteds = [];
                data.selecteds_name = [];
                states.set(chatId, "getAmount", data);
                return [2 /*return*/];
        }
    });
}); };
var handleGetAmount = function (message) { return __awaiter(void 0, void 0, void 0, function () {
    var chatId, creator_id, messageText, chatState, state, data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                chatId = message.chat.id;
                creator_id = message.from.id;
                messageText = message.text;
                chatState = states.get(chatId);
                // check if user has any active state
                if (!chatState) {
                    return [2 /*return*/, false];
                }
                state = chatState.state, data = chatState.data;
                // check if user is in getAmount state
                if (state !== "getAmount") {
                    return [2 /*return*/, false];
                }
                if (!!/^\d+$/.test(messageText)) return [3 /*break*/, 2];
                return [4 /*yield*/, bot.sendMessage(chatId, "amount *" + messageText + "* is invalid", {
                        parse_mode: "Markdown",
                    })];
            case 1:
                _a.sent();
                return [2 /*return*/, true];
            case 2:
                // update data based on
                data.amount = parseInt(messageText);
                return [4 /*yield*/, bot.sendMessage(chatId, getDstsMessage(data), {
                        parse_mode: "Markdown",
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: "I'm in!", callback_data: "i_am" }],
                                [{ text: "done!", callback_data: "done" }],
                            ],
                        },
                    })];
            case 3:
                _a.sent();
                states.set(chatId, "getDsts", data);
                return [2 /*return*/, true];
        }
    });
}); };
var handleGetDsts = function (msg) { return __awaiter(void 0, void 0, void 0, function () {
    var chatId, userID, name, stateData, state, data, selecteds, chipedList;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                chatId = msg.message.chat.id;
                userID = msg.from.id;
                name = generateFullName(msg.from);
                stateData = states.get(chatId);
                if (!stateData)
                    return [2 /*return*/, true];
                state = stateData.state, data = stateData.data;
                selecteds = data.selecteds;
                if (!selecteds.includes(userID)) return [3 /*break*/, 2];
                selecteds = selecteds.filter(function (item) { return (item === userID ? null : item); });
                return [4 /*yield*/, bot.answerCallbackQuery(msg.id, {
                        text: "you are in",
                    })];
            case 1:
                _a.sent();
                return [3 /*break*/, 4];
            case 2:
                selecteds.push(userID);
                return [4 /*yield*/, bot.answerCallbackQuery(msg.id, {
                        text: "you are not in",
                    })];
            case 3:
                _a.sent();
                _a.label = 4;
            case 4:
                chipedList = selecteds.map(function (id) { return __awaiter(void 0, void 0, void 0, function () {
                    var member;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, bot.getChatMember(chatId, id)];
                            case 1:
                                member = _a.sent();
                                return [2 /*return*/, generateFullName(member.user)];
                        }
                    });
                }); });
                return [4 /*yield*/, bot.editMessageText(msg.message.id, "test")];
            case 5:
                _a.sent();
                data.selecteds = selecteds;
                states.set(chatId, "getDsts", data);
                return [2 /*return*/, true];
        }
    });
}); };
module.exports = {
    handleInit: handleInit,
    handleGetAmount: handleGetAmount,
    handleGetDsts: handleGetDsts,
};
