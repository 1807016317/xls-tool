import EventID from "./event-id"

const { ipcMain, dialog } = require('electron')

export default class IpcEventCtrl {
    private static _instance: IpcEventCtrl
    
    public static get instance(): IpcEventCtrl {
        if(!IpcEventCtrl._instance) {
            IpcEventCtrl._instance = new IpcEventCtrl()
        }
        return IpcEventCtrl._instance
    }

    public initDefaultEvents() {
        ipcMain.on(EventID.c2s_open_dir, this._c2s_open_dir)
    }

    private _c2s_open_dir(event: Electron.IpcMainEvent, ...args: any[]) {
        if(!args || !args.length) {
            return
        }
        dialog.showOpenDialog({
            title: "选择导出路径",
            defaultPath: args[0],
            properties: ['openDirectory']
        })
    }
}