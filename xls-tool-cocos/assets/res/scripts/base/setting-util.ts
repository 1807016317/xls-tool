// 本地设置文件的处理文件

import OutConfig = require("../config/out-config");
import { exportPathInfo } from "./interface-define";

export default class SettingUtil {
    // 输出地址配置更新
    public static updateExportSetting(exportPathInfo: exportPathInfo) {
        if(!exportPathInfo) {
            return
        }
        let len = OutConfig.length
        for (let i = 0; i < len; i++) {
            const config = OutConfig[i]
            if(config.id === exportPathInfo.id && exportPathInfo.text === config.text) {
                OutConfig[i].dir = exportPathInfo.dir
                OutConfig[i].need = exportPathInfo.need
            }
        }
    }

    // 获取输出地址配置
    public static getExportSetting(): exportPathInfo[] {
        return OutConfig
    }
}
