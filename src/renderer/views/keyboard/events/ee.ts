import EventEmitter from 'renderer/utils/eventEmitter';

export enum EventKeys {
  SetKey = 'set-key',
}
export default new EventEmitter();
