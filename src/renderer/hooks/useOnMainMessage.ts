import { IChannels } from 'main/preload';
import { useEffect } from 'react';

/** 来自主进程的消息 */
export default function <T extends keyof IChannels>(
  channel: T,
  listener: (arg: IChannels[T]) => void
) {
  useEffect(() => {
    const unlisten = window.electron.ipcRenderer.on(channel, listener);

    return () => {
      unlisten?.();
    };
  }, []);
}
