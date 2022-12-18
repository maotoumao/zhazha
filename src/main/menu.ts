import {
  app,
  Menu,
  shell,
  BrowserWindow,
  MenuItemConstructorOptions,
  dialog,
  Notification,
} from 'electron';

import fs from 'fs/promises';
import path from 'path';
import currentSchemaData from './currentSchemaData';
import {
  getWindowNameChanged,
  setNewWindowName,
  setSavedWindowName,
} from './utils/mainWindowName';

interface DarwinMenuItemConstructorOptions extends MenuItemConstructorOptions {
  selector?: string;
  submenu?: DarwinMenuItemConstructorOptions[] | Menu;
}

export default class MenuBuilder {
  mainWindow: BrowserWindow;

  audioHandlerWindow?: BrowserWindow;

  constructor(mainWindow: BrowserWindow, audioHandlerWindow?: BrowserWindow) {
    this.mainWindow = mainWindow;
    this.audioHandlerWindow = audioHandlerWindow;
  }

  buildMenu(): Menu {
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.DEBUG_PROD === 'true'
    ) {
      this.setupDevelopmentEnvironment();
    }

    const template: any =
      process.platform === 'darwin'
        ? this.buildDarwinTemplate()
        : this.buildDefaultTemplate();

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    return menu;
  }

  setupDevelopmentEnvironment(): void {
    this.mainWindow.webContents.on('context-menu', (_, props) => {
      const { x, y } = props;

      Menu.buildFromTemplate([
        {
          label: 'Inspect element',
          click: () => {
            this.mainWindow.webContents.inspectElement(x, y);
          },
        },
      ]).popup({ window: this.mainWindow });
    });
  }

  /** TODO: 没改 */
  buildDarwinTemplate(): MenuItemConstructorOptions[] {
    const subMenuAbout: DarwinMenuItemConstructorOptions = {
      label: 'Electron',
      submenu: [
        {
          label: 'About ElectronReact',
          selector: 'orderFrontStandardAboutPanel:',
        },
        { type: 'separator' },
        { label: 'Services', submenu: [] },
        { type: 'separator' },
        {
          label: 'Hide ElectronReact',
          accelerator: 'Command+H',
          selector: 'hide:',
        },
        {
          label: 'Hide Others',
          accelerator: 'Command+Shift+H',
          selector: 'hideOtherApplications:',
        },
        { label: 'Show All', selector: 'unhideAllApplications:' },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    };
    const subMenuEdit: DarwinMenuItemConstructorOptions = {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'Command+Z', selector: 'undo:' },
        { label: 'Redo', accelerator: 'Shift+Command+Z', selector: 'redo:' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'Command+X', selector: 'cut:' },
        { label: 'Copy', accelerator: 'Command+C', selector: 'copy:' },
        { label: 'Paste', accelerator: 'Command+V', selector: 'paste:' },
        {
          label: 'Select All',
          accelerator: 'Command+A',
          selector: 'selectAll:',
        },
      ],
    };
    const subMenuViewDev: MenuItemConstructorOptions = {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'Command+R',
          click: () => {
            this.mainWindow.webContents.reload();
          },
        },
        {
          label: 'Toggle Full Screen',
          accelerator: 'Ctrl+Command+F',
          click: () => {
            this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
          },
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'Alt+Command+I',
          click: () => {
            this.mainWindow.webContents.toggleDevTools();
          },
        },
      ],
    };
    const subMenuViewProd: MenuItemConstructorOptions = {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Full Screen',
          accelerator: 'Ctrl+Command+F',
          click: () => {
            this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
          },
        },
      ],
    };
    const subMenuWindow: DarwinMenuItemConstructorOptions = {
      label: 'Window',
      submenu: [
        {
          label: 'Minimize',
          accelerator: 'Command+M',
          selector: 'performMiniaturize:',
        },
        { label: 'Close', accelerator: 'Command+W', selector: 'performClose:' },
        { type: 'separator' },
        { label: 'Bring All to Front', selector: 'arrangeInFront:' },
      ],
    };
    const subMenuHelp: MenuItemConstructorOptions = {
      label: 'Help',
      submenu: [
        {
          label: 'Learn More',
          click() {
            shell.openExternal('https://electronjs.org');
          },
        },
        {
          label: 'Documentation',
          click() {
            shell.openExternal(
              'https://github.com/electron/electron/tree/main/docs#readme'
            );
          },
        },
        {
          label: 'Community Discussions',
          click() {
            shell.openExternal('https://www.electronjs.org/community');
          },
        },
        {
          label: 'Search Issues',
          click() {
            shell.openExternal('https://github.com/electron/electron/issues');
          },
        },
      ],
    };

    const subMenuView =
      process.env.NODE_ENV === 'development' ||
      process.env.DEBUG_PROD === 'true'
        ? subMenuViewDev
        : subMenuViewProd;

    return [subMenuAbout, subMenuEdit, subMenuView, subMenuWindow, subMenuHelp];
  }

  buildDefaultTemplate() {
    const templateDefault = [
      {
        label: '&文件',
        submenu: [
          {
            label: '&新建',
            click: async () => {
              currentSchemaData.newSchema();
              this.mainWindow?.webContents?.send(
                'update-asset',
                currentSchemaData.getSchema()
              );
              this.audioHandlerWindow?.webContents?.send(
                'update-keymap',
                currentSchemaData.getSchema()
              );
              setNewWindowName(this.mainWindow);
            },
          },
          {
            label: '&加载',
            click: async () => {
              const res = await dialog.showOpenDialog(this.mainWindow, {
                title: '加载音源',
                properties: ['openDirectory'],
              });
              if (!res.canceled) {
                const fp = res.filePaths[0];
                this.loadModule(fp);
              }
            },
          },
          {
            label: '&保存',
            click: async () => {
              if (!getWindowNameChanged()) {
                return;
              }
              const filePath = currentSchemaData.getSchemaPath();

              if (!filePath) {
                this.saveAs();
              } else {
                const basePath = path.parse(filePath).dir;

                const assetPath = path.resolve(basePath, './assets/');
                try {
                  try {
                    await fs.stat(assetPath);
                  } catch {
                    await fs.mkdir(assetPath, {
                      recursive: true,
                    });
                  }
                  const schema = currentSchemaData.getSchema();
                  const keymaps = schema?.keymap ?? {};
                  const newKeyMap: ISchema['keymap'] = {};
                  for (const key in keymaps) {
                    const fp = keymaps[key]?.path;
                    if (fp) {
                      await fs.copyFile(
                        path.resolve(basePath, fp),
                        path.resolve(assetPath, `./${key}.mp3`)
                      );
                      newKeyMap[key] = {
                        ...keymaps[key],
                        path: `./assets/${key}.mp3`,
                      };
                    }
                  }
                  const newSchema = {
                    ...schema,
                    keymap: newKeyMap,
                  };
                  const mapJson = JSON.stringify(newSchema);
                  await fs.writeFile(
                    path.resolve(basePath, './map.json'),
                    mapJson,
                    'utf-8'
                  );
                  setSavedWindowName(
                    currentSchemaData.getSchema(),
                    this.mainWindow
                  );
                  new Notification({
                    title: '保存成功',
                  }).show();
                } catch (e: any) {
                  new Notification({
                    title: '保存失败',
                    body: e?.message ?? '',
                  }).show();
                }
              }
            },
          },
          {
            label: '&另存为',
            click: async () => {
              this.saveAs();
            },
          },

          {
            type: 'separator',
          },
          {
            label: '&退出应用',
            click: () => {
              this.mainWindow?.close();
              this.audioHandlerWindow?.close();
              app.quit();
            },
          },
        ],
      },
      {
        label: '关于',
        click: async () => {
          const result = await dialog.showMessageBox(this.mainWindow, {
            title: 'About 喳喳',
            message: `这又是猫头猫的一个无聊作品, 敲键盘真是太无聊了。写这个东西还把MusicFree停更了一个星期。随缘更新，可以去github瞅瞅，反正是做着玩。

@author: 猫头猫
@github: https://github.com/maotoumao
@公众号: 一只猫头猫
@bilibili: 不想睡觉猫头猫
@开源协议：GPL
            `,
            buttons: [
              '知道啦',
              '去Github看看猫头猫',
              '去B站看看猫头猫',
              '啥是MusicFree?',
            ],
          });
          switch (result.response) {
            case 1:
              shell.openExternal('https://github.com/maotoumao');
              break;
            case 2:
              shell.openExternal('https://space.bilibili.com/12866223');
              break;
            case 3:
              shell.openExternal('https://github.com/maotoumao/MusicFree');
              break;
          }
        },
      },
    ];

    return templateDefault;
  }

  async saveAs() {
    const res = await dialog.showSaveDialog(this.mainWindow, {
      title: '另存为',
      properties: ['dontAddToRecent'],
    });
    if (!res.canceled && res.filePath) {
      const name = path.basename(res.filePath, '.json');
      const assetPath = path.resolve(res.filePath, './assets/');
      try {
        try {
          await fs.stat(assetPath);
        } catch {
          await fs.mkdir(assetPath, {
            recursive: true,
          });
        }
        const schema = currentSchemaData.getSchema();
        const keymaps = schema?.keymap ?? {};
        const newKeyMap: ISchema['keymap'] = {};
        for (const key in keymaps) {
          const fp = keymaps[key]?.path;
          if (fp) {
            await fs.copyFile(fp, path.resolve(assetPath, `./${key}.mp3`));
            newKeyMap[key] = {
              ...keymaps[key],
              path: `./assets/${key}.mp3`,
            };
          }
        }
        currentSchemaData.setSchema({
          ...schema,
          keymap: newKeyMap,
          name,
        });
        const mapJson = JSON.stringify(currentSchemaData.getSchema());
        await fs.writeFile(
          path.resolve(res.filePath, './map.json'),
          mapJson,
          'utf-8'
        );
        setSavedWindowName(currentSchemaData.getSchema(), this.mainWindow);
        currentSchemaData.setSchemaPath(
          path.resolve(res.filePath, './map.json')
        );
        new Notification({
          title: '保存成功',
        }).show();
      } catch (e: any) {
        new Notification({
          title: '保存失败',
          body: e?.message ?? '',
        }).show();
      }
    }
  }

  async loadModule(fp: string) {
    if (fp) {
      const mapFile = path.resolve(fp, './map.json');
      console.log(mapFile, 'mapfile');
      try {
        await fs.access(mapFile, fs.constants.R_OK);
        const mapJson: ISchema = JSON.parse(
          await fs.readFile(mapFile, 'utf-8')
        );
        const keymap = mapJson.keymap ?? {};
        const validKeymap: ISchema['keymap'] = {};
        let detail;
        for (const k in keymap) {
          detail = keymap[k];
          if (detail?.path) {
            validKeymap[k] = {
              ...detail,
              path: path.resolve(fp, detail.path),
            };
          }
        }
        mapJson.keymap = validKeymap;
        // 发送给renderer
        this.audioHandlerWindow?.webContents?.send(
          'update-keymap',
          validKeymap
        );
        currentSchemaData.setSchema(mapJson);
        currentSchemaData.setSchemaPath(mapFile);
        this.mainWindow?.webContents?.send('update-asset', mapJson);
        setSavedWindowName(mapJson, this.mainWindow);
      } catch (e) {
        // 解析失败
        console.log(e, '挂了');
      }
    }
  }
}
