const electron = require('electron')
const BrowserWindow = electron.BrowserWindow
const url = require('url')

let windowDict: {[name: number]: Electron.BrowserWindow} = Object.create(null)

export function createWindow(windowName: string, createParams: any, path: string, isOpenDev: boolean) {
	createParams.webPreferences = {
        nodeIntegration: true,
        contextIsolation: false,
    };
    let window = new BrowserWindow(createParams)

    // and load the index.html of the app.
    window.loadURL(url.format({
        pathname: path,
        protocol: 'file:',
        slashes: true
    }))

    if (isOpenDev) {
        window.webContents.openDevTools()
    }
    windowDict[window.id] = window;
    window.on('closed', function() {
        delete windowDict[window.id];
    });
    return window
}

export function getWindow(windowId: string) {
    return windowDict[windowId]
}

export function closeWindow(window: Electron.BrowserWindow) {
    if (window != null) {
        window.close();
        let windowId = window.id;
        delete windowDict[windowId];
    }
}