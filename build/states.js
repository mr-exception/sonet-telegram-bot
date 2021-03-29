"use strict";
var State = /** @class */ (function () {
    function State() {
        var _this = this;
        this.states = {};
        this.set = function (chatId, state, data) {
            _this.states[chatId] = {
                state: state,
                data: data,
            };
        };
        this.remove = function (chatId) {
            delete _this.states[chatId];
        };
        this.get = function (chatId) { return _this.states[chatId]; };
    }
    return State;
}());
module.exports = new State();
