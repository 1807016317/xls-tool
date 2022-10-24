"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = void 0;
const electron_1 = require("electron");
const path_1 = require("path");
const ipc_1 = require("./ipc");
const dotenv = require("dotenv");
const jx_define_1 = require("./jx-define");
const main = () => {
    loadEnv();
    onReady();
    appListens();
};
exports.main = main;
function loadEnv() {
    // 加载环境
    dotenv.config();
    let env = process.env;
    jx_define_1.JX.DEBUG = JSON.parse(env['DEBUG']);
    jx_define_1.JX.NODE_DEV = JSON.parse(env['NODE_DEV']);
    jx_define_1.JX.UMI_DEV = JSON.parse(env['UMI_DEV']);
    jx_define_1.JX.PROD = JSON.parse(env['PROD']);
}
function onReady() {
    electron_1.app.whenReady().then(() => {
        const mainWindow = createWindow();
        mainWindowListens(mainWindow);
    });
}
function mainWindowListens(mainWindow) {
    ipcMainHandles(mainWindow);
    ipcMainOnS(mainWindow);
}
function ipcMainOnS(mainWindow) {
}
function ipcMainHandles(mainWindow) {
    electron_1.ipcMain.handle(ipc_1.ElectronChannel.openDialog, () => {
        electron_1.dialog.showOpenDialog(mainWindow).then(v => {
            console.log(v);
        });
    });
}
function createWindow() {
    const win = new electron_1.BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: (0, path_1.join)(__dirname, 'preload.js')
        }
    });
    if (jx_define_1.JX.UMI_DEV) {
        win.loadURL('http://localhost:8000');
    }
    else if (jx_define_1.JX.PROD) {
        const path = (0, path_1.join)(__dirname, 'dist', 'index.html');
        win.loadFile(path);
    }
    else if (jx_define_1.JX.NODE_DEV) {
        const path = (0, path_1.join)(__dirname, '../pages', 'index.html');
        console.log('path: ' + path);
        win.loadFile(path);
    }
    win.webContents.openDevTools();
    return win;
}
function appListens() {
    electron_1.app.on('window-all-closed', () => {
        if (process.platform !== 'darwin')
            electron_1.app.quit();
    });
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
}
//# sourceMappingURL=electron-main.js.map