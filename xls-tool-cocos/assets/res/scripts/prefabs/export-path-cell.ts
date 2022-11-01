import ElectronEventMgr from "../base/electron-event-mgr";
import Global from "../base/global";
import { exportPathInfo } from "../base/interface-define";
import EventID from "../config/event-id";

const {ccclass, property} = cc._decorator;

@ccclass
export default class exportPathCell extends cc.Component {

    @property(CC_EDITOR && {type: cc.Label, visible: true, displayName:"输出类型"})
    private _exportTypeLabel: cc.Label = null;

    @property(CC_EDITOR && {type: cc.Toggle, visible: true, displayName:"toggle"})
    private _toggle: cc.Toggle = null;

    @property(CC_EDITOR && {type: cc.EditBox, visible: true, displayName:"地址输入框"})
    private _editBox: cc.EditBox = null;

    @property(CC_EDITOR && {type: cc.Node, visible: true, displayName:"打开文件夹"})
    private _openDirNode: cc.Node = null;

    // LIFE-CYCLE CALLBACKS:
    private _curDir: string = ""
    private _isNeed: boolean = false
    private _exportPathInfo: exportPathInfo = null
    private _hadOpenDir: boolean = false

    protected start() {
        if(this._openDirNode) {
            this._openDirNode.on(cc.Node.EventType.TOUCH_START, this.on_TOUCH_START, this)
            this._openDirNode.on(cc.Node.EventType.TOUCH_END, this.on_Open_Dir_Event, this)
            this._openDirNode.on(cc.Node.EventType.TOUCH_CANCEL, this.on_Open_Dir_Event, this)
        }
    }

    public onRefresh(outPathInfo: exportPathInfo) {
        if(!outPathInfo) {
            return
        }
        this._hadOpenDir = false
        this._exportPathInfo = outPathInfo
        if(this._exportTypeLabel) {
            this._exportTypeLabel.string = outPathInfo.text
        }
        if(this._toggle) {
            this._toggle.isChecked = outPathInfo.need
            this._isNeed = outPathInfo.need
        }
        if(outPathInfo.dir) {
            this._curDir = outPathInfo.dir
            this._editBox.string = outPathInfo.dir
        }
    }

    public getOutPathInfo(): exportPathInfo {
        if(!this._exportPathInfo) {
            return null
        }
        this._exportPathInfo.need = this._isNeed
        this._exportPathInfo.dir = this._curDir
        return this._exportPathInfo
    }

    public on_Open_Dir_Event() {
        if(!this._hadOpenDir) {
            this._hadOpenDir = true
            ElectronEventMgr.sendSync(EventID.c2s_open_dir, this._curDir)
            this._openDirNode.scale = 1
        }
    }

    public on_TOUCH_START() {
        this._openDirNode.scale = 1.1
    }

    public on_Toggle_Event() {
        this._isNeed = this._toggle.isChecked
    }

    public on_Edit_End() {
        let dirStr = this._editBox.string.trim()
        this._curDir = dirStr
    }

    protected onDestroy() {
        if(this._openDirNode) {
            this._openDirNode.targetOff(this)
        }
    }
    // update (dt) {}
}
