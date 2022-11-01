import Global from "./global";

export default class ElectronEventMgr {
    private static _eventListenDict: {[event: string]: [any, Function]} = Object.create(null)
    private static _eventSendDict: {[event: string]: [any, Function]} = Object.create(null)
    private static hasOwnKey = Function.call.bind(Object.hasOwnProperty);

    public static on(event: string, callFunc: Function, target: any) {
        if(ElectronEventMgr._findEvent(event, callFunc, target, false)) {
            return
        }
        let electron = Global.instance.electron
        if(!electron) {
            return
        }
        let ipcRenderer = electron.ipcRenderer
        ipcRenderer.on(event, callFunc)
    }

    public static send(event: string, ...arg: any) {
        let electron = Global.instance.electron
        if(!electron) {
            return
        }
        let ipcRenderer = electron.ipcRenderer
        ipcRenderer.send(event, ...arg)
    }

    public static sendSync(event: string, ...arg: any) {
        let electron = Global.instance.electron
        if(!electron) {
            return
        }
        let ipcRenderer = electron.ipcRenderer
        ipcRenderer.sendSync(event, ...arg)
    }

    public static getOnCallByEvent(event: string) {
        return ElectronEventMgr._eventListenDict[event] || null
    }

    private static _findEvent(event: string, func: Function, target: any, isSend: boolean) {
        if (!event || !func || !target) {
            return true;
        }
        let dict = isSend ? ElectronEventMgr._eventSendDict : ElectronEventMgr._eventListenDict
        if (!ElectronEventMgr.hasOwnKey(dict, event)) {
            return false;
        }
        let eventArr = dict[event]
        if (eventArr) {
            for (let value of eventArr) {
                if (value[0] == target && value[1] == func) {
                    return true;
                }
            }
        }
        return false;
    }
}