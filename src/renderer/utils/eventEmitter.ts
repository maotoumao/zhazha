import _EventEmitter from 'events';
import { useEffect } from 'react';

export default class EventEmitter extends _EventEmitter {
  useOnMount(event: string, cb: (...args: any[]) => void) {
    useEffect(() => {
      this.on(event, cb);
      return () => {
        this.off(event, cb);
      };
    }, []);
  }
}
