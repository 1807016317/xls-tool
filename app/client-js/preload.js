"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.preDefine = void 0;
/*
 * @Author: 惊仙
 * @Date: 2022-10-21 10:24:55
 * @Last Modified by: 惊仙
 * @Last Modified time: 2022-10-23 20:01:45
 * 渲染进程与主进程的沟通文件
 */
const electron_1 = require("electron");
const ipc_1 = require("./ipc");
const api = {
    openDialog: () => {
        return electron_1.ipcRenderer.invoke(ipc_1.ElectronChannel.openDialog);
    },
    startDrag: (fileName) => {
        electron_1.ipcRenderer.invoke(ipc_1.ElectronChannel.onDragStart, fileName);
    }
};
class preDefine {
}
exports.preDefine = preDefine;
electron_1.contextBridge.exposeInMainWorld(ipc_1.electronApi, api);
//# sourceMappingURL=preload.js.map