import React, { useEffect, useRef } from 'react';
import useOnMainMessage from 'renderer/hooks/useOnMainMessage';
import { Howl, Howler } from 'howler';
import keyCodeMap from 'renderer/constants/keyCodeMap';

// 后台运行的窗口，播放等逻辑都在这里
export default function () {
  const audiosRef = useRef<Record<string, Howl>>({});
  const defaultAudioRef = useRef<Howl | null>(null);

  useOnMainMessage('update-keymap', (_payload) => {
    audiosRef.current = {};
    defaultAudioRef.current = null;
    const payload = _payload ?? {};
    for (const k in payload) {
      audiosRef.current[k] = new Howl({
        src: [payload[k].path],
        preload: true,
      });
    }
    if (payload['*']) {
      defaultAudioRef.current = audiosRef.current['*'];
    }
  });
  useOnMainMessage('keypress', (arg) => {
    const key = keyCodeMap[arg.keycode];
    const audio = audiosRef.current[key] ?? defaultAudioRef.current;
    if (audio) {
      audio.play();
    }
  });

  return null;
}
