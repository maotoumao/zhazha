import { useMemo, useState } from 'react';
import keyCodeMap from 'renderer/constants/keyCodeMap';
import keyNameMap from 'renderer/constants/keyNameMap';
import useOnMainMessage from 'renderer/hooks/useOnMainMessage';
import Key from './components/Key';
import SetKeyModal from './components/SetKeyModal';
import { mainAreaKeys, opeartionAreaKeys } from './constants/keyLayout';
import './index.css';

/** 50x50  */
export default function Keyboard() {
  const [active, setActive] = useState<Record<string, boolean>>({});

  const [asset, setAsset] = useState<ISchema | null>(null);

  const keyMap = useMemo(() => asset?.keymap ?? {}, [asset]);
  const theme = useMemo(() => asset?.theme, [asset]);

  useOnMainMessage('keypress', (arg) => {
    const key = keyCodeMap[arg.keycode];
    setActive((prev) => ({
      ...prev,
      [key]: true,
    }));
  });

  useOnMainMessage('keyup', (arg) => {
    const key = keyCodeMap[arg.keycode];
    setActive((prev) => ({
      ...prev,
      [key]: false,
    }));
  });

  useOnMainMessage('update-asset', (payload) => {
    setAsset(payload);
  });

  return (
    <div className="keyboard-wrapper">
      <div className="keyboard-main">
        {mainAreaKeys.map((key) => (
          <Key
            key={key}
            realKey={key}
            name={keyMap[key]?.display ?? keyNameMap[key]}
            theme={theme}
            classNames={`key-${key}`}
            active={!!active[key]}
            enabled={!!(keyMap[key] ?? keyMap['*'])}
          />
        ))}
      </div>
      <div className="keyboard-opeartion">
        {opeartionAreaKeys.map((key) => (
          <Key
            key={key}
            realKey={key}
            theme={theme}
            name={keyMap[key]?.display ?? keyNameMap[key]}
            classNames={`key-${key}`}
            active={!!active[key]}
            enabled={!!(keyMap[key] ?? keyMap['*'])}
          />
        ))}
      </div>
      <SetKeyModal />
      <a
        className="sy"
        target="_blank"
        rel="noreferrer"
        href="https://github.com/maotoumao"
      >
        @猫头猫
      </a>
    </div>
  );
}
