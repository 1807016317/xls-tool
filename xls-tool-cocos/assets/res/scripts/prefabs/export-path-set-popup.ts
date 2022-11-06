import ElectronEventMgr from "../base/electron-event-mgr";
import { exportPathInfo, exportPathSetPopupEnter } from "../base/interface-define";
import SettingMgr from "../base/setting-mgr";
import ElectronEventID from "../config/event-id";
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
    private _outInfoList: exportPathInfo[] = []
    private _outConfigIdx: number = 0
    private _outConfigKey: string = ""

    // onLoad () {}
    public static show(params: exportPathSetPopupEnter, parent: cc.Node = null, showCall: (layer: exportPathSetPopup, node: cc.Node)=>void = null) {
        if(!params) {
            return
        }
        exportPathSetPopup.doShow("prefabs/export-path-set-popup", params, parent, showCall)
    }
    
    onLoad () {
        this._registerEvent()
    }

    protected onInit(params: exportPathSetPopupEnter) {
        this._outConfigIdx = params.index
        this._outConfigKey = params.setKey
        this._initScrollView()
    }

    private _registerEvent() {
        ElectronEventMgr.on(ElectronEventID.s2c_open_dir, this._s2c_open_dir.bind(this), this)
    }

    private _s2c_open_dir(event, dir: string, id: number) {
        console.log(event)
        console.log(id, ' [cclog] dir', dir)
        if(!this._outInfoList) {
            return
        }
        let len = this._outInfoList.length
        for (let i = 0; i < len; i++) {
            let outInfo = this._outInfoList[i]
            if(outInfo.id == id) {
                outInfo.dir = dir
                SettingMgr.instance.updateExportSetting(this._outConfigIdx, outInfo, this._outConfigKey)
                this._cellCompList[i].onRefresh(outInfo)
                break
            }
        }
    }

    private _initScrollView() {
        this._cellNodeList.length = 0
        this._cellCompList.length = 0
        let outConfigList = SettingMgr.instance.getExportSetting(this._outConfigIdx, this._outConfigKey)
        this._outInfoList.push(...outConfigList)
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
                    SettingMgr.instance.updateExportSetting(this._outConfigIdx, info, this._outConfigKey)
                }
            }
        }
    }

    // update (dt) {}
}
