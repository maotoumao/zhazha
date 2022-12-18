import { BrowserWindow } from 'electron';

const appName = '喳喳';
let windowNameChanged = false;
export function setNewWindowName(mainWindow?: BrowserWindow | null) {
  mainWindow?.setTitle(`未命名* - ${appName}`);
  windowNameChanged = true;
}

export function setUnsavedWindowName(
  schema: ISchema | null,
  mainWindow?: BrowserWindow | null
) {
  const name = schema?.name ?? '未命名';
  mainWindow?.setTitle(`${name}* - ${appName}`);
  windowNameChanged = true;
}

export function setSavedWindowName(
  schema: ISchema | null,
  mainWindow?: BrowserWindow | null
) {
  const name = schema?.name ?? '未命名';

  mainWindow?.setTitle(`${name} - ${appName}`);
  windowNameChanged = false;
}

export function getWindowNameChanged() {
  return windowNameChanged;
}
