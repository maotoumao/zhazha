import { IChannels } from 'main/preload';

declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        sendMessage<T extends keyof IChannels>(
          channel: T,
          args: IChannels[T]
        ): void;
        on<T extends keyof IChannels>(
          channel: T,
          func: (arg: IChannels[T]) => void
        ): (() => void) | undefined;
        once<T extends keyof IChannels>(
          channel: T,
          func: (arg: IChannels[T]) => void
        ): void;
      };
    };
  }
}

export {};
