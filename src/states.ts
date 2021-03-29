interface IState {
  state: string;
  data: object;
}
class State {
  states: { [key: string]: IState } = {};
  set = (chatId: number, state: string, data: object): void => {
    this.states[chatId] = {
      state,
      data,
    };
  };
  remove = (chatId: number): void => {
    delete this.states[chatId];
  };
  get = (chatId: number): IState => this.states[chatId];
}
const state = new State();
export default state;
