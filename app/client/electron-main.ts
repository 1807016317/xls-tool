import { BrowserWindow, app, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { ElectronChannel } from './ipc'
import * as dotenv from "dotenv"
import { JX } from './jx-define'

export const main = () => {
    loadEnv()
    onReady()
    appListens()
}

function loadEnv() {
    // 加载环境
    dotenv.config()
    let env = process.env
    JX.DEBUG = JSON.parse(env['DEBUG'] as string)
    JX.NODE_DEV = JSON.parse(env['NODE_DEV'] as string)
    JX.UMI_DEV = JSON.parse(env['UMI_DEV'] as string)
    JX.PROD = JSON.parse(env['PROD'] as string)
}

function onReady() {
    app.whenReady().then(() => {
        const mainWindow = createWindow()
        mainWindowListens(mainWindow)
    })
}

function mainWindowListens(mainWindow: BrowserWindow) {
    ipcMainHandles(mainWindow)
    ipcMainOnS(mainWindow)
}

function ipcMainOnS(mainWindow: BrowserWindow) {
}

function ipcMainHandles(mainWindow: BrowserWindow) {
    ipcMain.handle(ElectronChannel.openDialog, () => {
        dialog.showOpenDialog(mainWindow).then(v => {
            console.log(v)
        })
    })
}

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: join(__dirname, 'preload.js')
        }
    })
    if (JX.UMI_DEV) {
        win.loadURL('http://localhost:8000')
    } else if (JX.PROD) {
        const path = join(__dirname, 'dist', 'index.html')
        win.loadFile(path)
    } else if (JX.NODE_DEV) {
        const path = join(__dirname, '../pages', 'index.html')
        console.log('path: ' + path)
        win.loadFile(path)
    }
    win.webContents.openDevTools()
    return win
}

function appListens() {
    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin')
            app.quit()
    })
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0)
            createWindow()
    })
}
