import { exportPathConfigInfo } from "../base/interface-define";
import LayerBase from "../base/layer-base";
import SettingMgr from "../base/setting-mgr";
import exportPathSetPopup from "./export-path-set-popup";
import JobCell from "./job-cell";

const {ccclass, property} = cc._decorator;

@ccclass
export default class exportPathListPopup extends LayerBase {


    @property(CC_EDITOR && {type: cc.ScrollView, visible: true, displayName:"输出地址列表"})
    private _scrollview: cc.ScrollView = null;

    @property(CC_EDITOR && {type: cc.Node, visible: true, displayName:"列表内容节点"})
    private _contentNode: cc.Node = null;

    @property(CC_EDITOR && {type: cc.Prefab, visible: true, displayName:"列表cell预制"})
    private _cellPrefab: cc.Prefab = null;

    @property(CC_EDITOR && {type: cc.Node, visible: true, displayName:"新建"})
    private _newSettingNode: cc.Node = null;

    @property(CC_EDITOR && {type: cc.EditBox, visible: true, displayName:"名字输入框"})
    private _nameEditBox: cc.EditBox = null;

    @property(CC_EDITOR && {type: cc.EditBox, visible: true, displayName:"备注输入框"})
    private _descEditBox: cc.EditBox = null;


    private _cellNodePool: cc.NodePool = new cc.NodePool()
    private _cellCompList: JobCell[] = []
    private _outInfoList: exportPathConfigInfo[] = []
    // LIFE-CYCLE CALLBACKS:
    public static show(params: any = null, parent: cc.Node = null, showCall: (layer: exportPathListPopup, node: cc.Node)=>void = null) {
        exportPathListPopup.doShow("prefabs/export-path-list-popup", params, parent, showCall)
    }

    start () {
        this._newSettingNode.active = false
        this._initScrollView()
    }

    private _initScrollView() {
        this._cellNodePool.clear()
        this._cellCompList.length = 0
        this._outInfoList.length = 0
        let outConfigSettingList = SettingMgr.instance.getExportSettingList()
        this._outInfoList.push(...outConfigSettingList)
        let len = outConfigSettingList.length
        for (let i = 0; i < len; i++) {
            let newNode = this._getPool(this._contentNode)
            let comp = newNode.getComponent(JobCell)
            if(comp) {
                let setting = outConfigSettingList[i]
                comp.onRefresh(i, setting.setName, setting.setDesc, "删除", this.cellClickCall.bind(this), this.delCallFunc.bind(this))
                this._cellCompList.push(comp)
            }
        }
    }

    private _push(node: cc.Node) {
        this._cellNodePool.put(node)
    }

    private _getPool(parent: cc.Node = null): cc.Node {
        let node: cc.Node = null
        if(!this._cellNodePool.size()) {
            node = cc.instantiate(this._cellPrefab)
        } else {
            node = this._cellNodePool.get()
        }
        if(parent) {
            node.parent = parent
        }
        return node
    }

    private _addNewOutConfig() {
        this._outInfoList.length = 0
        let outConfigSettingList = SettingMgr.instance.getExportSettingList()
        this._outInfoList.push(...outConfigSettingList)
        let newNode = this._getPool(this._contentNode)
        let comp = newNode.getComponent(JobCell)
        if(comp) {
            let lastIdx = outConfigSettingList.length - 1
            let setting = outConfigSettingList[lastIdx]
            comp.onRefresh(lastIdx, setting.setName, setting.setDesc, "删除", this.cellClickCall.bind(this), this.delCallFunc.bind(this))
            this._cellCompList.push(comp)
        }
    }

    public on_New_Setting_Event() {
        this._newSettingNode.active = true
    }

    public delCallFunc(cellIdx: number) {
        let children = this._contentNode.children
        this._push(children[cellIdx])
        let key = this._outInfoList[cellIdx].setKey
        let res = SettingMgr.instance.delExportSettingList(key)
        if(!res) {
            console.error("删除失败")
        }
    }

    public cellClickCall(cellIdx: number) {
        let self = this
        exportPathSetPopup.show({
            index: cellIdx,
            setKey: this._outInfoList[cellIdx].setKey,
        }, null, ()=>{
            self.close()
        })
    }

    public on_Cancel_Event() {
        this._newSettingNode.active = false
        SettingMgr.instance.reWriteSetting()
    }

    public on_Save_New_Event() {
        let nameStr = this._nameEditBox.string.trim()
        let descStr = this._descEditBox.string.trim()
        if(!nameStr) {
            return
        }
        let ret = SettingMgr.instance.addExportSettingList(nameStr, descStr)
        if(ret) {
            this._addNewOutConfig()
            this._newSettingNode.active = false
        } else {
            console.error("新建失败")
        }
    }
}
