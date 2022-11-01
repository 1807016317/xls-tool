"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeWindow = exports.getWindow = exports.createWindow = void 0;
const electron = require('electron');
const BrowserWindow = electron.BrowserWindow;
const url = require('url');
let windowDict = Object.create(null);
function createWindow(windowName, createParams, path, isOpenDev) {
    createParams.webPreferences = {
        nodeIntegration: true,
        contextIsolation: false,
    };
    let window = new BrowserWindow(createParams);
    // and load the index.html of the app.
    window.loadURL(url.format({
        pathname: path,
        protocol: 'file:',
        slashes: true
    }));
    if (isOpenDev) {
        window.webContents.openDevTools();
    }
    windowDict[window.id] = window;
    window.on('closed', function () {
        delete windowDict[window.id];
    });
    return window;
}
exports.createWindow = createWindow;
function getWindow(windowId) {
    return windowDict[windowId];
}
exports.getWindow = getWindow;
function closeWindow(window) {
    if (window != null) {
        window.close();
        let windowId = window.id;
        delete windowDict[windowId];
    }
}
exports.closeWindow = closeWindow;
//# sourceMappingURL=windows-ctrl.js.map