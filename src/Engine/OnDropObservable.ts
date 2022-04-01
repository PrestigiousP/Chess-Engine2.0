export default class OnDropObservable {
  onDropFunction: Function;

  constructor(onDropFunction: Function) {
    this.onDropFunction = onDropFunction;
  }

  subscribe(observer: Function) {
    return this.onDropFunction(observer);
  }
}
