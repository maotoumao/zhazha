import { memo, useCallback, useRef, useState } from 'react';
import useOnMainMessage from 'renderer/hooks/useOnMainMessage';
import { Howl } from 'howler';
import ee, { EventKeys } from '../../events/ee';
import styles from './index.module.css';

function SetKeyModal() {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [soundFile, setSoundFile] = useState<string | null>(null);

  const currentAudioRef = useRef<Howl | null>(null);

  const resultRef = useRef<Record<string, string>>({});
  const randIdRef = useRef<number>(0);

  ee.useOnMount(EventKeys.SetKey, (key) => {
    setEditingKey(key);
  });

  useOnMainMessage('open-file', (payload) => {
    if (payload.randId === randIdRef.current && payload.file) {
      setSoundFile(payload.file);
      currentAudioRef.current = null;
    }
  });

  const closeModal = useCallback(() => {
    setEditingKey(null);
    resultRef.current = {};
    randIdRef.current = 0;
    setSoundFile(null);
    currentAudioRef.current = null;
  }, []);

  return editingKey !== null ? (
    <div
      className={styles.modalWrapper}
      role="button"
      tabIndex={-1}
      onClick={closeModal}
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={styles.modalContent}
      >
        <div className={styles.title}>
          设置按键【<span>{editingKey}</span>】
        </div>
        <div className={styles.divider} />
        <div className={styles.props}>
          <div className={styles.row}>
            <span className={styles.label}>展示名称:</span>{' '}
            <input
              maxLength={20}
              onChange={(e) => {
                resultRef.current.display = e.target.value;
              }}
            />
          </div>
          <div className={styles.row}>
            <span className={styles.label}>音效:</span>{' '}
            <div
              role="button"
              tabIndex={-1}
              onClick={() => {
                randIdRef.current = Math.random();
                window.electron.ipcRenderer.sendMessage('open-file', {
                  randId: randIdRef.current,
                });
              }}
            >
              {soundFile ?? '选择文件'}
            </div>
            {soundFile ? (
              <div
                className={styles.playSound}
                tabIndex={-1}
                role="button"
                onClick={() => {
                  if (!currentAudioRef.current) {
                    currentAudioRef.current = new Howl({
                      src: [soundFile],
                    });
                  }
                  currentAudioRef.current.play();
                }}
              >
                🔈
              </div>
            ) : null}
          </div>
        </div>
        <div className={styles.divider} />
        <div className={styles.operations}>
          <div
            className={styles.button}
            onClick={() => {
              window.electron.ipcRenderer.sendMessage('change-schema', {
                key: editingKey,
                value: {
                  display: resultRef.current?.display,
                  path: soundFile ?? '',
                },
              });
              closeModal();
            }}
          >
            确认
          </div>
        </div>
      </div>
    </div>
  ) : null;
}

export default memo(SetKeyModal, () => true);
