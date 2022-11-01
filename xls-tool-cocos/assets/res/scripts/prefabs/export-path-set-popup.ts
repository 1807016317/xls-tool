import ElectronEventMgr from "../base/electron-event-mgr";
import SettingUtil from "../base/setting-util";
import EventID from "../config/event-id";
import LayerBase from "./../base/layer-base";
import exportPathCell from "./export-path-cell";


const {ccclass, property} = cc._decorator;

@ccclass
export default class exportPathSetPopup extends LayerBase {

    @property(CC_EDITOR && {type: cc.ScrollView, visible: true, displayName:"输出地址列表"})
    private _scrollview: cc.ScrollView = null;

    @property(CC_EDITOR && {type: cc.Node, visible: true, displayName:"列表内容节点"})
    private _contentNode: cc.Node = null;

    @property(CC_EDITOR && {type: cc.Prefab, visible: true, displayName:"列表cell预制"})
    private _cellPrefab: cc.Prefab = null;

    // LIFE-CYCLE CALLBACKS:

    private _cellNodeList: cc.Node[] = []
    private _cellCompList: exportPathCell[] = []

    // onLoad () {}
    public static show(parent: cc.Node = null, showCall: (layer: LayerBase, node: cc.Node)=>void = null) {
        this.doShow("prefabs/export-path-set-popup", parent, showCall)
    }

    start () {
        this._registerEvent()
        this._initScrollView()
    }

    private _registerEvent() {
        ElectronEventMgr.on(EventID.s2c_open_dir, this.s2c_open_dir, this)
    }

    private s2c_open_dir(event, dir: string) {
        cc.log(event)
        cc.log('[cclog] dir', dir)
    }

    private _initScrollView() {
        this._cellNodeList.length = 0
        this._cellCompList.length = 0
        let outConfigList = SettingUtil.getExportSetting()
        let len = outConfigList.length
        for (let i = 0; i < len; i++) {
            let newNode = cc.instantiate(this._cellPrefab)
            newNode.parent = this._contentNode
            this._cellNodeList.push(newNode)
            let comp = newNode.getComponent(exportPathCell)
            if(comp) {
                comp.onRefresh(outConfigList[i])
                this._cellCompList.push(comp)
            }
        }
    }

    public on_Cancel_Event() {
        this.close()
    }

    public on_Save_Path_Event() {
        // 保存路径修改
        let len = this._cellCompList.length
        for (let i = 0; i < len; i++) {
            const comp = this._cellCompList[i]
            if(comp) {
                let info = comp.getOutPathInfo()
                if(info) {
                    SettingUtil.updateExportSetting(info)
                }
            }
        }
    }

    // update (dt) {}
}
