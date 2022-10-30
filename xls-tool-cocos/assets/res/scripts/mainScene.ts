/*
 * @Author: 惊仙 
 * @Date: 2022-10-30 14:59:52 
 * @Last Modified by: 惊仙
 * @Last Modified time: 2022-10-30 20:18:01
 */

const {ccclass, property} = cc._decorator;

@ccclass
export default class mainScene extends cc.Component {

    @property(CC_EDITOR && {type: cc.ScrollView, visible: true, displayName:"工作区列表"})
    private _scrollview: cc.ScrollView = null;

    @property(CC_EDITOR && {type: cc.Node, visible: true, displayName:"列表内容节点"})
    private _contentNode: cc.Node = null;

    @property(CC_EDITOR && {type: cc.Prefab, visible: true, displayName:"工作节点预制"})
    private _jobCellPrefab: cc.Prefab = null;
    // LIFE-CYCLE CALLBACKS:

    private _electron = null;
    private _ipcRenderer = null;
    
    onLoad () {
    }
    
    //window.electron = require('electron');
    start() {
        console.log("[cclog] enter mainScene")
        this._electron = window['electron'];
        this._ipcRenderer = this._electron.ipcRenderer;
        this._ipcRenderer.on('test1', (event, info, detail) => {
            console.log("test1_receive...", event, info, detail);
        })

    }

    // update (dt) {}

    // EVENTS
    public on_Pulgin_Check_Open(e: cc.Toggle) {
        // 插件检查开启控制
    }
    // EVENTS END
}
