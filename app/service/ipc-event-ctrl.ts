import ElectronEventID from "./event-id"

const { ipcMain, dialog } = require('electron')

export default class IpcEventCtrl {
    private static _instance: IpcEventCtrl = null
    
    public static get instance(): IpcEventCtrl {
        if(!IpcEventCtrl._instance) {
            IpcEventCtrl._instance = new IpcEventCtrl()
        }
        return IpcEventCtrl._instance
    }

    public initDefaultEvents() {
        ipcMain.on(ElectronEventID.c2s_open_dir, this._c2s_open_dir)
        ipcMain.on(ElectronEventID.c2s_export_xls, this._c2s_export_xls)
    }

    private _c2s_open_dir(event: Electron.IpcMainEvent, ...args: any[]) {
        if(!args || !args.length) {
            return
        }
        let oldPath = args[0]
        let promise = dialog.showOpenDialog({
            title: "选择导出路径",
            defaultPath: oldPath,
            properties: ['openDirectory']
        })
        promise.then((data)=>{
            let operateStatus = data.canceled
            let filePaths = operateStatus ? oldPath : data.filePaths
            event.sender.send(ElectronEventID.s2c_open_dir, filePaths, args[1])
        })
    }

    private _c2s_export_xls(event: Electron.IpcMainEvent, ...args: any[]) {
        
    }
}