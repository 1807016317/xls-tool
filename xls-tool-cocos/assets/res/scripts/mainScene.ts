/*
 * @Author: 惊仙 
 * @Date: 2022-10-30 14:59:52 
 * @Last Modified by: 惊仙
 * @Last Modified time: 2022-11-05 15:07:23
 */

import ElectronEventMgr from "./base/electron-event-mgr";
import Global from "./base/global";
import { inputJobInfo } from "./base/interface-define";
import SettingMgr from "./base/setting-mgr";
import ElectronEventID from "./config/event-id";
import exportPathListPopup from "./prefabs/export-path-list-popup";
import exportPathSetPopup from "./prefabs/export-path-set-popup";

const {ccclass, property} = cc._decorator;

const JOB_STATUS = {
    WAIT: "wait",
    OK: "ok",
    ERROR: "error",
}

@ccclass
export default class mainScene extends cc.Component {

    @property(CC_EDITOR && {type: cc.ScrollView, visible: true, displayName:"工作区列表"})
    private _scrollview: cc.ScrollView = null;

    @property(CC_EDITOR && {type: cc.Node, visible: true, displayName:"列表内容节点"})
    private _contentNode: cc.Node = null;

    @property(CC_EDITOR && {type: cc.Prefab, visible: true, displayName:"工作节点预制"})
    private _jobCellPrefab: cc.Prefab = null;

    @property(CC_EDITOR && {type: cc.Toggle, visible: true, displayName:"插件开启勾选"})
    private _pluginToggle: cc.Toggle = null;

    @property(CC_EDITOR && {type: cc.Label, visible: true, displayName:"顶部提示文字"})
    private _tipLabel: cc.Label = null;
    // LIFE-CYCLE CALLBACKS:

    private _electron: any = null;
    private _ipcRenderer: any = null;
    private _jobList: inputJobInfo[] = []
    private _runningJobIndex: number = 0 // 正在执行的excel文件索引
    private _runningStatusStr: string = ""
    
    onLoad () {
        this._registerEvent()
    }
    
    //window.electron = require('electron');
    //window.fs = require('fs');
    start() {
        console.log("[cclog] enter mainScene")
        this._electron = Global.instance.electron;
        this._ipcRenderer = this._electron.ipcRenderer;
        // this._ipcRenderer.on('test1', (event, info, detail) => {
        //     console.log("test1_receive...", event, info, detail);
        // })\
        SettingMgr.instance
        this._readMoveInJob()
    }

    private _registerEvent() {
        ElectronEventMgr.on(ElectronEventID.s2c_export_xls, this._s2c_export_xls.bind(this), this)
    }

    private _s2c_export_xls(event, ...arg) {
        console.log(arg)
    }

    // 获取拖入文件
    /*
    ondrag    该事件在元素正在拖动时触发     
    ondragend    该事件在用户完成元素的拖动时触发     
    ondragenter    该事件在拖动的元素进入放置目标时触发     
    ondragleave    该事件在拖动元素离开放置目标时触发     
    ondragover    该事件在拖动元素在放置目标上时触发     
    ondragstart    该事件在用户开始拖动元素时触发     
    ondrop    该事件在拖动元素放置在目标区域时触发
    */
    private _readMoveInJob() {
        const canvas = document.getElementById("GameCanvas")
        let self = this
        canvas.ondragover = () => {
            return false;
        }
        canvas.ondragleave = canvas.ondragend = () => {
            return false;
        }
        canvas.ondrop = (e) => {
            e.preventDefault();
            self._jobList.length = 0
            let inputFileData = e.dataTransfer.files
            if (inputFileData.length > 0) {
                self.addJobs(inputFileData);
            }
            return false;
        }
    }

    private addJobs(filesData: FileList) {
        this._jobList.length = 0
        let startJobId = 1
        let len = filesData.length
        for (let i = 0; i < len; i++) {
            const fileInfo = filesData.item(i)
            let jobInfo: inputJobInfo = {
                filename: fileInfo.name,
                path: fileInfo['path'],
                status: JOB_STATUS.WAIT,
                jobId: startJobId,
                outputs: [],
                error: "",
            }
            startJobId = startJobId + 1;
            this._jobList.push(jobInfo);
        }
        //need to force 
        //$scope.$apply();

        this._startRunJobs()
    }

    private _startRunJobs() {
        this._runningJobIndex = 0;
        this._runNextJob()
    }

    private _runNextJob() {
        if (this._runningJobIndex < this._jobList.length) {
            let job = this._jobList[this._runningJobIndex];
            this.runningStatusStr = this._runningJobIndex + "/" + this._jobList.length + ", 导出当中...."
            setTimeout(function() {
                ElectronEventMgr.send(ElectronEventID.c2s_export_xls, job.path, job.jobId)
                this._runningJobIndex++;
            }, 20);
        } else {
            //finished all
            this.runningStatusStr = this._runningJobIndex + "/" + this._jobList.length + ", 完成!"
        }
    }

    private set runningStatusStr(str: string) {
        this._runningStatusStr = str
        if(this._tipLabel) {
            this._tipLabel.string = str
        }
    }

    // update (dt) {}

    // EVENTS
    public on_Pulgin_Check_Open(e: cc.Toggle) {
        // 插件检查开启控制
        ElectronEventMgr.send(ElectronEventID.c2s_open_plugin, this._pluginToggle.isChecked)
    }

    public on_Open_Change_Path() {
        // 打开导出路径设置窗口
        exportPathListPopup.show()
    }
    // EVENTS END
}
