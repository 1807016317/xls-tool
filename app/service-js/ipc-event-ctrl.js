"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const event_id_1 = require("./event-id");
const { ipcMain, dialog } = require('electron');
class IpcEventCtrl {
    static _instance = null;
    static get instance() {
        if (!IpcEventCtrl._instance) {
            IpcEventCtrl._instance = new IpcEventCtrl();
        }
        return IpcEventCtrl._instance;
    }
    initDefaultEvents() {
        ipcMain.on(event_id_1.default.c2s_open_dir, this._c2s_open_dir);
        ipcMain.on(event_id_1.default.c2s_export_xls, this._c2s_export_xls);
    }
    _c2s_open_dir(event, ...args) {
        if (!args || !args.length) {
            return;
        }
        let oldPath = args[0];
        let promise = dialog.showOpenDialog({
            title: "选择导出路径",
            defaultPath: oldPath,
            properties: ['openDirectory']
        });
        promise.then((data) => {
            let operateStatus = data.canceled;
            let filePaths = operateStatus ? oldPath : data.filePaths;
            event.sender.send(event_id_1.default.s2c_open_dir, filePaths, args[1]);
        });
    }
    _c2s_export_xls(event, ...args) {
    }
}
exports.default = IpcEventCtrl;
//# sourceMappingURL=ipc-event-ctrl.js.map