/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import {
  app,
  BrowserWindow,
  shell,
  ipcMain,
  dialog,
  Tray,
  Menu,
} from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { uIOhook, UiohookKey } from 'uiohook-napi';
import { exec } from 'child_process';
import { stat } from 'fs/promises';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import currentSchemaData from './currentSchemaData';
import { setUnsavedWindowName } from './utils/mainWindowName';

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;
let audioHandlerWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

app.setAppUserModelId(app.name);
exec('chcp 65001');

const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'assets')
  : path.join(__dirname, '../../assets');

const getAssetPath = (...paths: string[]): string => {
  return path.join(RESOURCES_PATH, ...paths);
};

/** tray */
function createTray() {
  tray = new Tray(getAssetPath('icon.png'));
  tray.on('click', () => {
    mainWindow?.show();
  });

  const ctxMenu = Menu.buildFromTemplate([
    {
      label: '&退出应用',
      click: () => {
        mainWindow?.close();
        audioHandlerWindow?.close();
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(ctxMenu);
}

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  mainWindow = new BrowserWindow({
    show: false,
    width: 1040,
    height: 420,
    resizable: false,
    maximizable: false,
    alwaysOnTop: true,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
      webSecurity: false,
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('close', (event) => {
    event.preventDefault();
    mainWindow?.hide();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  audioHandlerWindow = new BrowserWindow({
    show: false,
    width: 300,
    height: 300,
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
      nodeIntegration: true,
      webSecurity: false,
    },
    skipTaskbar: true,
  });

  audioHandlerWindow.loadURL(resolveHtmlPath('index.html', '/audio-handler'));

  audioHandlerWindow.on('ready-to-show', () => {
    if (!audioHandlerWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      audioHandlerWindow.minimize();
    } else {
      audioHandlerWindow.hide();
    }
  });

  const menuBuilder = new MenuBuilder(mainWindow, audioHandlerWindow);
  menuBuilder.buildMenu();

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
      setTimeout(async () => {
        try {
          const dftPath = getAssetPath('modules', 'default', 'map.json');
          await stat(dftPath);
          menuBuilder.loadModule(getAssetPath('modules', 'default'));
        } catch (e) {}
      }, 200);
    }
  });
  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

const pressedKeys = new Set<number>();

function registerKeyboardListeners() {
  uIOhook.on('keydown', (e) => {
    const { keycode } = e;
    if (pressedKeys.has(keycode)) {
      return;
    }
    pressedKeys.add(keycode);
    audioHandlerWindow?.webContents?.send('keypress', e);
    mainWindow?.webContents?.send('keypress', e);
  });
  uIOhook.on('keyup', (e) => {
    pressedKeys.delete(e.keycode);
    mainWindow?.webContents.send('keyup', e);
  });
  uIOhook.start();
}

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    // app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    registerKeyboardListeners();
    createTray();
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);

/** events */
ipcMain.on('open-file', async (event, args) => {
  let res;
  if (mainWindow) {
    res = await dialog.showOpenDialog(mainWindow, {
      title: '打开',
      properties: ['dontAddToRecent', 'openFile'],
    });
  } else {
    res = await dialog.showOpenDialog({
      title: '打开',
      properties: ['dontAddToRecent', 'openFile'],
    });
  }

  const fp = !res.canceled && res.filePaths?.[0];
  if (fp) {
    event.reply('open-file', {
      file: fp,
      randId: args?.randId,
    });
  } else {
    event.reply('open-file', {
      file: null,
      randId: args?.randId,
    });
  }
});

ipcMain.on('change-schema', async (event, args) => {
  currentSchemaData.updateKeyMap(args?.key, args?.value);
  mainWindow?.webContents?.send('update-asset', currentSchemaData.getSchema());
  audioHandlerWindow?.webContents?.send(
    'update-keymap',
    currentSchemaData.getSchema()?.keymap
  );
  setUnsavedWindowName(currentSchemaData.getSchema(), mainWindow);
});
