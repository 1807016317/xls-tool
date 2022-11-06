// 本地设置文件的处理文件

import Global from "./global";
import { exportPathConfigInfo, exportPathInfo } from "./interface-define";

export default class SettingMgr {
    private static _instance: SettingMgr = null
    private _settingpath: string = "cfg/setting"

    public static get instance(): SettingMgr {
        if(!SettingMgr._instance) {
            SettingMgr._instance = new SettingMgr()
        }
        return SettingMgr._instance
    }

    constructor() {
        cc.resources.load(this._settingpath, cc.JsonAsset, (err, jsonAsset: cc.JsonAsset)=>{
            if(jsonAsset) {
                let jsonObj = jsonAsset.json
                this._outConfigList = jsonObj
                console.log('this._outConfigList: ', this._outConfigList)
            } else {
                console.error(err)
            }
        })
    }

    private _outConfigList = []

    // 输出地址配置更新
    public updateExportSetting(index: number, exportPathInfo: exportPathInfo, setKey: string = "") {
        if(!exportPathInfo) {
            return
        }
        let OutConfig = this._outConfigList[index]
        if(!OutConfig) {
            console.error('OutConfig is null, index: ', index)
            return
        }
        if(setKey && setKey !== OutConfig.setKey) {
            console.error('OutConfig setKey is diff,', setKey, " != ", OutConfig.setKey)
            return
        }
        let outSettingList = OutConfig.settingList
        let len = outSettingList.length
        for (let i = 0; i < len; i++) {
            let config = outSettingList[i]
            if(config.id === exportPathInfo.id && exportPathInfo.text === config.text) {
                outSettingList[i].dir = exportPathInfo.dir
                outSettingList[i].need = exportPathInfo.need
            }
        }
    }

    // 获取输出地址配置
    public getExportSetting(index: number = 0, setKey: string = ""): exportPathInfo[] {
        let OutConfig = this._outConfigList[index]
        if(setKey && setKey !== OutConfig.setKey) {
            return []
        }
        return OutConfig ? OutConfig.settingList : []
    }

    public getExportSettingList(): exportPathConfigInfo[] {
        return this._outConfigList
    }

    public addExportSettingList(nameStr: string, descStr: string): boolean {
        let defultSetting = this._outConfigList[0]
        let len = this._outConfigList.length
        let newSetting: exportPathConfigInfo = {
            setKey: `$${len}`,
            setName: nameStr,
            setDesc: descStr,
            settingList: [],
        }
        newSetting.settingList.push(...defultSetting.settingList)
        this._outConfigList.push(newSetting)
        return true
    }

    public delExportSettingList(key: string): boolean {
        let len = this._outConfigList.length
        for (let index = len - 1; index >= 0; index--) {
            const OutConfig = this._outConfigList[index]
            if(OutConfig.setKey === key) {
                this._outConfigList.splice(index, 1)
                return true
            }
        }
        return false
    }

    public reWriteSetting() {
        let settingOut = JSON.stringify(this._outConfigList)
        Global.instance.nodeFs.writeFile(this._settingpath, settingOut, (err)=>{
            if(err) {
                console.error(err)
            }
        })

    }
}
