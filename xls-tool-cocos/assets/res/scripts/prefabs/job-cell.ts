
const {ccclass, property} = cc._decorator;

@ccclass
export default class JobCell extends cc.Component {

    @property(CC_EDITOR && {type: cc.Label, visible: true, displayName:"执行名"})
    private _jobNameLbl: cc.Label = null;

    @property(CC_EDITOR && {type: cc.Label, visible: true, displayName:"执行进度和信息"})
    private _infoLabel: cc.Label = null;

    @property(CC_EDITOR && {type: cc.Label, visible: true, displayName:"按钮文字"})
    private _btnLabel: cc.Label = null;

    // LIFE-CYCLE CALLBACKS:

    private _cellIdx: number = -1
    private _callFunc: Function = null
    private _cellClickCall: Function = null
    // onLoad () {}

    start () {

    }

    public onRefresh(index: number, titleStr: string, descStr: string, btnStr: string = "", cellClickCall: Function = null, callFunc: Function = null) {
        this._cellIdx = index
        this._callFunc = callFunc
        this._cellClickCall = cellClickCall
        if(this._jobNameLbl) {
            this._jobNameLbl.string = titleStr
        }
        if(this._infoLabel) {
            this._infoLabel.string = descStr
        }
        if(this._btnLabel) {
            this._btnLabel.node.parent.active = !!btnStr
            this._btnLabel.string = btnStr
        }
    }

    public on_Btn_Event() {
        this._callFunc && this._callFunc(this._cellIdx)
    }

    public on_Bg_Click_Event() {
        this._cellClickCall && this._cellClickCall(this._cellIdx)
    }

    // update (dt) {}
}
