import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { UiohookKeyboardEvent } from 'uiohook-napi';

/** 主进程/渲染进程通信参数 */
export interface IChannels {
  'ipc-example': any[];
  keypress: UiohookKeyboardEvent;
  keyup: UiohookKeyboardEvent;
  'update-asset': ISchema;
  'update-keymap': ISchema['keymap'];
  'open-file': {
    randId: number;
    file?: string | null;
  };
  'change-schema': {
    key: string;
    value: ISchema['keymap'][string];
  };
}

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    sendMessage<T extends keyof IChannels>(channel: T, args: IChannels[T]) {
      ipcRenderer.send(channel, args);
    },
    on<T extends keyof IChannels>(
      channel: T,
      func: (arg: IChannels[T]) => void
    ) {
      const subscription = (_event: IpcRendererEvent, arg: IChannels[T]) =>
        func(arg);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once<T extends keyof IChannels>(
      channel: T,
      func: (arg: IChannels[T]) => void
    ) {
      ipcRenderer.once(channel, (_event, arg) => func(arg));
    },
  },
});
