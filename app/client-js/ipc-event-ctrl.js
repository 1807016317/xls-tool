"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const event_id_1 = require("./event-id");
const { ipcMain, dialog } = require('electron');
class IpcEventCtrl {
    static _instance;
    static get instance() {
        if (!IpcEventCtrl._instance) {
            IpcEventCtrl._instance = new IpcEventCtrl();
        }
        return IpcEventCtrl._instance;
    }
    initDefaultEvents() {
        ipcMain.on(event_id_1.default.c2s_open_dir, this._c2s_open_dir);
    }
    _c2s_open_dir(event, ...args) {
        if (!args || !args.length) {
            return;
        }
        dialog.showOpenDialog({
            title: "选择导出路径",
            defaultPath: args[0],
            properties: ['openDirectory']
        });
    }
}
exports.default = IpcEventCtrl;
//# sourceMappingURL=ipc-event-ctrl.js.map