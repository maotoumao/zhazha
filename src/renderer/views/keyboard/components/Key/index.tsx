import React, { memo, useEffect, useState } from 'react';
import clsn from 'renderer/utils/clsn';
import ee, { EventKeys } from '../../events/ee';
import styles from './index.module.css';

interface IKeyProps {
  realKey: string | number;
  name: string | number;
  active?: boolean;
  enabled?: boolean;
  classNames?: string;
  theme?: ISchema['theme'];
}

function Key(props: IKeyProps) {
  const { name, active, enabled, classNames = '', theme, realKey } = props;
  const colors = theme?.colors;

  return (
    <div
      className={clsn({
        [styles.keyWrapper]: true,
        [styles.keyWrapperActive]: !!(enabled && active),
        [styles.keyWrapperDisable]: !enabled,
        [classNames]: !!classNames,
      })}
      style={{
        backgroundColor: enabled
          ? active
            ? colors?.activeKey
            : colors?.normalKey
          : colors?.disabledKey,
        color: colors?.text,
      }}
      role="button"
      tabIndex={-1}
      onDoubleClick={() => {
        ee.emit(EventKeys.SetKey, realKey);
      }}
    >
      {name}
    </div>
  );
}

export default memo(
  Key,
  (prev, curr) =>
    prev.realKey === curr.realKey &&
    prev.name === curr.name &&
    prev.classNames === curr.classNames &&
    prev.theme === curr.theme &&
    prev.enabled === curr.enabled &&
    (!curr.enabled || prev.active === curr.active)
);
