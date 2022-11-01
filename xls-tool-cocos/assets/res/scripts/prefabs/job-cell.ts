
const {ccclass, property} = cc._decorator;

@ccclass
export default class JobCell extends cc.Component {

    @property(CC_EDITOR && {type: cc.Label, visible: true, displayName:"执行文件名"})
    private _jobNameLbl: cc.Label = null;

    @property(CC_EDITOR && {type: cc.Label, visible: true, displayName:"执行进度和错误信息"})
    private _infoLabel: cc.Label = null;

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {

    }

    // update (dt) {}
}
