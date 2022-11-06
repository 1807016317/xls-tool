"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const nodePath = require("path");
class XlsxData {
    static _instance;
    static get instance() {
        if (!XlsxData._instance) {
            XlsxData._instance = new XlsxData();
        }
        return XlsxData._instance;
    }
    _filePath = ""; // 表格文件路径
    _curXlsxName = ""; // 表格文件名字
    _curSheetName = ""; // 表格Sheet名字
    _exportStateStr = "ok"; // 输出提示
    _errorMsgList = []; // 错误信息数组
    _relationValueDict = {}; // 关联关系字典
    _projectCfgFileName = "_xlsxProject.json"; // 项目表格配置信息名称
    _projectCfgDict = {}; // 项目表格配置信息
    _checkedTableDict = {}; // 已查询过的关联表数据
    _checkedTableSheetDict = {}; // 已查询过的关联表数据
    _localSetDict = Object.create(null);
    _localSetKey1 = "plugin_open_status";
    _ERROR_MAX_LEN = 5;
    _VERSION = 202205311;
    _RET = {
        OK: 1,
    };
    _NEED_SORT_APPID = [1, 3];
    _PROJECT_UNIQUE = {
        DEFAULT: 'default',
        NGAME_MORE: 'ngame_more',
        NGAME_ITEM: 'ngame_item',
        XLSX_MORE_SHEETS: 'xlsx_more_sheets',
        OLD_EXPORT_FORMAT: 'old_export_format',
        APP_ID: "app_id",
        VERSION: "version", // 版本号
    };
    is_need_sort_col_name() {
        let appId = this.get_project_cfg_by_key(this._PROJECT_UNIQUE.APP_ID);
        return this._NEED_SORT_APPID.includes(appId);
    }
    set_cur_filePath(path) {
        let reg = /((?:.(?!\b\s+$|$))*(?:\w+\.)*(?:.(?!\b\s+$|$))*(?:\w+\.)*[\\\/])?/m;
        let match = path.match(reg);
        this._filePath = match ? match[0] : "";
    }
    get_cur_filePath() {
        return this._filePath;
    }
    set_cur_xlsx_name(fileName) {
        this._curXlsxName = fileName || "";
    }
    get_cur_xlsx_name() {
        return this._curXlsxName;
    }
    set_cur_sheet_name(sheetName) {
        this._curSheetName = sheetName || "";
    }
    get_cur_table_name() {
        let xlsxMoreSheets = this.get_project_cfg_by_key(this._PROJECT_UNIQUE.XLSX_MORE_SHEETS);
        if (xlsxMoreSheets) {
            return this._curSheetName;
        }
        return this._curXlsxName;
    }
    // 更新导出状态
    set_export_state_str(stateStr) {
        this._exportStateStr = stateStr;
        this.add_errorMsg(stateStr);
    }
    // 获取导出状态
    get_export_state_str() {
        return this._exportStateStr;
    }
    add_errorMsg(errMsg) {
        if (this.can_add_errorMsg()) {
            this._errorMsgList.push(errMsg);
        }
    }
    clear_errorMsgList() {
        this._errorMsgList.length = 0;
    }
    can_add_errorMsg() {
        return this._errorMsgList.length < this._ERROR_MAX_LEN;
    }
    init_cur_table_relation_dict() {
        this._relationValueDict = {};
    }
    set_cur_table_relation_dict(key, value) {
        if (key === null && value === null) {
            return;
        }
        let idx = 0;
        for (const keyName in this._relationValueDict) {
            let valueStr = this._relationValueDict[keyName];
            if (valueStr.includes(key)) {
                idx += 1;
            }
        }
        value += idx;
        this._relationValueDict[key] = value;
    }
    get_cur_table_relation_dict() {
        return this._relationValueDict;
    }
    set_checked_xslx(tableName, excelBook) {
        if (this._checkedTableSheetDict[tableName]) {
            return;
        }
        this._checkedTableSheetDict[tableName] = excelBook;
    }
    get_checked_xlsx(tableName) {
        return this._checkedTableSheetDict[tableName] || null;
    }
    // 解析项目配置信息
    parse_project_cfg() {
        let cfgFilePath = this.get_cur_filePath();
        let cfgPath = nodePath.join(cfgFilePath, this._projectCfgFileName);
        let projectCfgBuf = null;
        let exist = fs.existsSync(cfgPath);
        if (!exist) {
            let dir = cfgFilePath.substring(0, cfgFilePath.length - 1);
            let lastIdx = dir.lastIndexOf('\\');
            cfgFilePath = cfgFilePath.substring(0, lastIdx);
            cfgPath = nodePath.join(cfgFilePath, this._projectCfgFileName);
        }
        try {
            projectCfgBuf = fs.readFileSync(cfgPath);
        }
        catch (err) {
            console.error(`${cfgPath} 文件不存在，无法使用配置方案`);
            return;
        }
        let projectCfg = JSON.parse(projectCfgBuf);
        if (!!projectCfg) {
            this._projectCfgDict = projectCfg;
        }
    }
    // 获取项目配置文件参数
    get_project_cfg_by_key(key) {
        let cfgValue = this._projectCfgDict[key];
        if (cfgValue == null || cfgValue == undefined) {
            // set_export_state_str('xlsxProject.json is missing parameter')
            return null;
        }
        return cfgValue;
    }
    update_relation_table_id(tableName, curValue) {
        if (!this._checkedTableDict[tableName]) {
            this._checkedTableDict[tableName] = [];
        }
        if (!this._checkedTableDict[tableName].includes(curValue)) {
            this._checkedTableDict[tableName].push(curValue);
        }
    }
    relation_table_includes_id(tableName, curValue) {
        if (!this._checkedTableDict[tableName]) {
            return false;
        }
        return this._checkedTableDict[tableName].includes(curValue);
    }
    is_right_version() {
        if (this.get_project_cfg_by_key(this._PROJECT_UNIQUE.APP_ID) != 1) {
            return true;
        }
        if (this.get_project_cfg_by_key(this._PROJECT_UNIQUE.VERSION) == this._VERSION) {
            return true;
        }
        return false;
    }
    // 修改插件检查规则的开启状态
    update_plugin_open(status) {
        this.update_local_set({ [this._localSetKey1]: status });
    }
    get_plugin_open_status() {
        if (!this._localSetDict[this._localSetKey1]) {
            let localSetFileName = "../local_set.json";
            let localSetPath = nodePath.join(__dirname, localSetFileName);
            let exist = fs.existsSync(localSetPath);
            if (!exist) {
                return false;
            }
            let localSetBuf = fs.readFileSync(localSetPath);
            let localSetCfg = localSetBuf ? JSON.parse(localSetBuf) : null;
            if (localSetCfg) {
                this._localSetDict = localSetCfg;
            }
        }
        return this._localSetDict[this._localSetKey1];
    }
    update_local_set(infoDict) {
        let localSetFileName = "../local_set.json";
        let localSetPath = nodePath.join(__dirname, localSetFileName);
        let exist = fs.existsSync(localSetPath);
        if (!exist) {
            this._localSetDict = infoDict;
            fs.writeFileSync(localSetPath, JSON.stringify(infoDict));
            return;
        }
        let localSetBuf = null;
        try {
            localSetBuf = fs.readFileSync(localSetPath);
        }
        catch (err) {
            console.error(`${localSetPath} 文件更新错误`);
            return;
        }
        let localSetCfg = JSON.parse(localSetBuf);
        if (!!localSetCfg) {
            for (const key in infoDict) {
                localSetCfg[key] = infoDict[key];
            }
            this._localSetDict = localSetCfg;
            fs.writeFileSync(localSetPath, JSON.stringify(localSetCfg));
        }
    }
}
exports.default = XlsxData;
//# sourceMappingURL=xlsx-data.js.map