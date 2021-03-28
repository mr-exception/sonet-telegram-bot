module.exports = class State {
  states = {};
  set = (chatId, state, data) => {
    this.states[chatId] = {
      state,
      data,
    };
  };
  remove = (chatId) => {
    delete this.states[chatId];
  };
  get = (chatId) => this.states[chatId];
};
