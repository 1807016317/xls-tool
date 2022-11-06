"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("./util");
const path = require('path');
// const { ipcMain, dialog } = require('electron')
const electron_1 = require("electron");
const XLSX = require("xlsx");
const fs = require("fs");
// const nunjucks = require('nunjucks');
const CHECKMODULE = require('./check');
const exportToFile = require('./exportToFile');
const xlsxData = require('./xlsxData');
const NGameConst = require('./NGame/NGameConst');
// nunjucks.configure({ autoescape: false });
class XlsxService {
    start() {
        electron_1.ipcMain.on('c2s_change_plugin_check', (event, status) => {
            xlsxData.update_plugin_open(status);
        });
        electron_1.ipcMain.on('c2s_export_xls', (event, filePath, jobId) => {
            this.init_export(event, filePath, jobId);
        });
    }
    get_need_col_list(parseResult, setting) {
        let needColumns = [];
        let needColumnsData = [];
        let isLua = setting.text == 'lua';
        let columnList = parseResult['columns_lua'] && isLua ? parseResult['columns_lua'] : parseResult['columns'];
        let columnsInfo = parseResult['columnsInfo_lua'] && isLua ? parseResult['columnsInfo_lua'] : parseResult.columnsInfo;
        for (let index = 0, len = columnList.length; index < len; index++) {
            const col = columnList[index];
            let needExportStr = columnsInfo[col].export;
            let re = new RegExp(setting.reg, "i");
            if (needExportStr.match(re)) {
                needColumns.push(col);
                needColumnsData.push({ column: col, desc: columnsInfo[col].desc, type: columnsInfo[col].type });
            }
        }
        return {
            needColumns: needColumns,
            needColumnsData: needColumnsData
        };
    }
    //解析xls, 获得表格内容和其他基本信息
    parse_xls(worksheet, parseResult, sheetName) {
        // parseResult = {
        //     maxRow: null,
        //     maxColumn: null,
        //     enums: [],
        //     columns: [],
        //     columnsInfo: null,
        //     indexOfColumns: null,
        //     typeAndIndex: [],
        //     keyTypeList: [],
        //     rows: [],
        //     sub_classes: null,
        //     indexType: "",
        //     indexData: null,
        //     key_counts: [],
        // }
        let xlsxFileName = sheetName;
        xlsxData.set_cur_sheet_name(sheetName);
        let range = worksheet["!ref"];
        if (!range) {
            return `no data in the xlsx file: ${xlsxFileName}`;
        }
        let re = /\:([A-Z]+)(\d+)/;
        let found = range.match(re);
        let maxColumn = "A";
        let maxRow = 1;
        if (found && found[1] != null && found[2] != null) {
            maxColumn = found[1];
            maxRow = found[2];
        }
        else {
            return `no data in the xlsx file: ${xlsxFileName}`;
        }
        parseResult.maxRow = maxRow;
        parseResult.maxColumn = maxColumn;
        if (maxRow < 5) {
            return `${xlsxFileName} 缺少字段定义`;
        }
        //columns
        let startColumn = 'A';
        let columnTypeRow = 2; // 数据类型
        let columnDescRow = 3; // 描述
        let columnExportRow = 4; // 导出使用（前端/后端）
        let columnNameRow = 6; // 变量命名
        let columnRelationRow = 5; // 关联表查询
        let columnContentRow = 7; // 内容开始
        let columns = [];
        let columnsInfo = Object.create(null);
        /**
         * {本表列名：{
         * 关联表名，
         * 关联列名，
         * }}
         */
        /**
         * 关联表列值字典 - relationColValueDict
         * {本表列名：{关联表名：[关联表对应列值]}}
         */
        let relationColValueDict = {};
        /* --------------------------兼容无关联表检查列的存在情况start---------------------- */
        let indexString = util_1.default.get_cell_v(worksheet["A1"]);
        indexString = indexString.split(',')[0];
        while (true) {
            let fiveCellValue = worksheet[startColumn + columnRelationRow.toString()];
            fiveCellValue = util_1.default.get_cell_v(fiveCellValue);
            if (fiveCellValue === indexString) {
                columnNameRow = 5;
                columnContentRow = 6;
                break;
            }
            if (startColumn == maxColumn) {
                break;
            }
            startColumn = util_1.default.get_nextAZ(startColumn);
        }
        startColumn = 'A';
        /* --------------------------兼容无关联表检查列的存在情况end---------------------- */
        parseResult.columnContentRow = columnContentRow;
        //索引
        indexString = util_1.default.get_cell_v(worksheet["A1"]);
        indexString = indexString.replace(/\s/, "");
        let indexOfColumns = indexString.split(",");
        parseResult.indexOfColumns = indexOfColumns;
        while (true) {
            let cellType = worksheet[startColumn + columnTypeRow.toString()];
            let cellDesc = worksheet[startColumn + columnDescRow.toString()];
            let cellExport = worksheet[startColumn + columnExportRow.toString()];
            let cellName = worksheet[startColumn + columnNameRow.toString()];
            let cellRelation = worksheet[startColumn + columnRelationRow.toString()];
            if (cellName == null || cellDesc == null || cellExport == null) {
                break;
            }
            let columnName = util_1.default.get_cell_v(cellName);
            let isError = CHECKMODULE.check_column_name(columnName);
            if (!isError) {
                return;
            }
            let relationStr = util_1.default.get_cell_v(cellRelation);
            let relationInfoDict = CHECKMODULE.get_relation_value_dict(relationStr, columnName);
            if (!!relationInfoDict) {
                relationColValueDict[columnName] = relationInfoDict;
            }
            let comment = util_1.default.get_cell_c(cellName); // 获取变量名行的批注
            if (comment) {
                let isRepeat = CHECKMODULE.check_enum_repeat(comment.valList);
                if (!isRepeat) {
                    util_1.default.show_error_dialog(`${xlsxFileName} 的 ${columnName} 批注有错误`);
                    return;
                }
                if (!parseResult.enums) {
                    parseResult.enums = [];
                }
                parseResult.enums.push(comment);
            }
            columns.push(columnName);
            cellType = util_1.default.get_cell_v(cellType);
            if (cellType != 'int' && cellType != 'string' && !cellType.includes('array')) {
                util_1.default.show_error_dialog(`${xlsxFileName} 的第二行类型值 ${cellType} 错误`);
                return;
            }
            columnsInfo[columnName] = {
                type: cellType,
                desc: util_1.default.get_cell_v(cellDesc),
                export: util_1.default.get_cell_v(cellExport),
            };
            if (startColumn == maxColumn) {
                break;
            }
            startColumn = util_1.default.get_nextAZ(startColumn);
        }
        parseResult.columnsInfo = columnsInfo;
        //check columns duplicated name
        let checkColumnName = {};
        for (let j = 0; j < columns.length; j++) {
            let columnName = columns[j];
            if (columnName != "" && checkColumnName[columnName]) {
                return `${xlsxFileName} 存在重复字段名: ${columnName}`;
            }
            checkColumnName[columnName] = 1;
        }
        let typeAndIndex = [];
        let keyTypeList = [];
        for (let col of indexOfColumns) {
            if (columnsInfo[col] == null) {
                return `${xlsxFileName} index of ${col} is not exists`;
            }
            else if (!(columnsInfo[col].type)) {
                return `${xlsxFileName} index of ${col} type is error!`;
            }
            else if (columnsInfo[col].type === "int") {
                keyTypeList.push('number');
                typeAndIndex.push([col] + ": number");
            }
            else {
                keyTypeList.push(columnsInfo[col].type);
                typeAndIndex.push([col] + ": " + columnsInfo[col].type);
            }
        }
        parseResult.typeAndIndex = typeAndIndex;
        parseResult.keyTypeList = keyTypeList;
        //rows
        let rows = [];
        // let regRef = new RegExp('\#([\w\_]+)\#', 'g')
        for (let i = columnContentRow; i <= maxRow; i++) {
            startColumn = 'A';
            let rowData = {};
            let isEmptyRow = true;
            for (let j = 0; j < columns.length; j++) {
                let cell = worksheet[startColumn + i.toString()];
                let columnName = columns[j];
                let columnInfo = columnsInfo[columnName];
                let cellVal = util_1.default.get_cell_v(cell);
                if (indexOfColumns.includes(columnName) && !cell) {
                    maxRow = i;
                }
                if (cell && indexOfColumns.includes(columnName) && cellVal === "") {
                    return `${xlsxFileName}主键字段不能为空！第${i}行`;
                }
                if (columnInfo != null) {
                    if (cellVal != "") {
                        isEmptyRow = false;
                    }
                    else if (cellVal == "" && columnInfo.type === 'int') {
                        cellVal = 0;
                    }
                    rowData[columnName] = cellVal.toString().trim();
                    let relationValueDict = relationColValueDict[columnName];
                    CHECKMODULE.check_relation_in_cur_default(relationValueDict, rowData, columnName);
                }
                startColumn = util_1.default.get_nextAZ(startColumn);
            }
            if (!isEmptyRow) {
                //有一些字段包含#xxxx#的字段， 用正则匹配给替换成最终的值
                // 这个正则表达式好像有点问题啊： $(.+?)$， 知道了，这是之前有表格内容有这个规则，现在没了
                for (let columnName in rowData) {
                    let val = rowData[columnName];
                    let regRef = new RegExp('$(.+?)$', 'g');
                    let result = null;
                    let results = [];
                    while ((result = regRef.exec(val)) != null) {
                        results.push(result[1]);
                    }
                    if (results && results.length > 0) {
                        for (let r of results) {
                            if (rowData[r] != null) {
                                val = val.replace("$" + r + "$", rowData[r]);
                            }
                        }
                        rowData[columnName] = val;
                    }
                }
                // let checkInfo = checkModule.check_existent_in_enum(rowData, parseResult["enums"])
                // if(checkInfo.notExistent) {
                //     util.show_error_dialog(`${xlsxFileName} id：${checkInfo.rowId} 列：${checkInfo.checkColName} 的值超出枚举范围`)
                //     return 
                // }
                rows.push(rowData);
            }
            CHECKMODULE.check_relation_in_cur_res(rowData);
        }
        parseResult.maxRow = maxRow;
        parseResult.rows = rows;
        parseResult.columns = columns;
        let subclassValue = util_1.default.get_cell_v(worksheet["B1"]);
        if (subclassValue) {
            let subclassArr = subclassValue.split(",");
            let idIndex = columns.indexOf("id");
            parseResult.sub_classes = Object.create(null);
            if (subclassArr.length > 0 && idIndex >= 0) {
                for (let subclassString of subclassArr) {
                    parseResult.sub_classes[subclassString] = [];
                    let classes = {};
                    for (let row of rows) {
                        let cl = row[subclassString] ? row[subclassString] : '0';
                        if (!classes[cl]) {
                            classes[cl] = [];
                        }
                        let mainKeyList = [];
                        for (let col of indexOfColumns) {
                            mainKeyList.push(row[col]);
                        }
                        if (mainKeyList.length > 1) {
                            mainKeyList = `[${mainKeyList}]`;
                            classes[cl].push(mainKeyList);
                        }
                        else {
                            classes[cl].push(mainKeyList[0]);
                        }
                    }
                    for (let key in classes) {
                        let val = classes[key];
                        parseResult.sub_classes[subclassString].push({
                            key: key,
                            value: val
                        });
                    }
                }
            }
        }
        //索引类型
        let indexType = "int";
        let mainKeyCount = indexOfColumns.length; // 主键的数量
        if (mainKeyCount > 1) {
            indexType = "string";
        }
        else if (mainKeyCount == 1) {
            let column = indexOfColumns[0];
            if (columnsInfo[column].type == "string") {
                indexType = "string";
            }
        }
        parseResult.indexType = indexType;
        //生成索引数据
        let indexData = {};
        for (let i = 0; i < rows.length; i++) {
            let r = rows[i];
            let indexValues = [];
            let notNulCount = mainKeyCount; // 非空的key值
            for (let col of indexOfColumns) {
                if (r[col] != "") {
                    indexValues.push(r[col]);
                    continue;
                }
                notNulCount--;
            }
            if (notNulCount === 0) {
                return `${xlsxFileName}主键字段不能为空！第${i}行`;
            }
            let key = indexValues.join("_");
            if (indexData[key] != null || indexData[key] != undefined) {
                return `${xlsxFileName}主键重复了, id 是: ${key}`;
            }
            indexData[key] = i;
        }
        parseResult.indexData = indexData;
        //找出key的数量，例如type_1,type_2
        let namesHash = {};
        for (let j = 0; j < columns.length; j++) {
            let columnName = columns[j];
            if (!namesHash[columnName]) {
                namesHash[columnName] = 1;
            }
        }
        let cellNames = Object.keys(namesHash);
        let resultHash = this.get_resemble_keys(cellNames);
        let keyCountList = [];
        for (let name in resultHash) {
            //type.value.size同时存在时，只输入第一个
            let hasType = name.indexOf("type") != -1;
            let hasValue = name.indexOf("value") != -1;
            let hasSize = name.indexOf("size") != -1;
            if (hasType || hasValue || hasSize) {
                let str = "";
                if (hasType) {
                    str = "type";
                }
                else if (hasValue) {
                    str = "value";
                }
                else if (hasSize) {
                    str = "size";
                }
            }
            let count = resultHash[name];
            if (count > 1) {
                let key = "";
                if (name.endsWith("_")) {
                    key = name + "count";
                }
                else {
                    key = name + "_count";
                }
                keyCountList.push({
                    name: key,
                    value: count
                });
            }
        }
        if (keyCountList && keyCountList.length > 0) {
            parseResult.key_counts = keyCountList;
        }
        let stateStr = xlsxData.get_export_state_str();
        return stateStr;
    }
    get_resemble_keys(keys) {
        let keyHash = {};
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            key = key.replace(/\d+/, ""); //不能用key.replace(/\d+/g, "")会有问题
            if (keyHash[key]) {
                keyHash[key]++;
            }
            else {
                keyHash[key] = 1;
            }
        }
        return keyHash;
    }
    export_xls(filePath, settings, sheetIdx = 0) {
        let workbook = XLSX.readFile(filePath);
        let isMoreSheetsExport = !!xlsxData.get_project_cfg_by_key(xlsxData.PROJECT_UNIQUE.XLSX_MORE_SHEETS);
        let xlsxFileNameList = filePath.match(/.*?([\w]+)\.xlsx$/);
        if (!xlsxFileNameList || !xlsxFileNameList[0]) {
            xlsxFileNameList = filePath.match(/.*?([\u4e00-\u9fa5]+)\.xlsx$/);
        }
        if (workbook == null || xlsxFileNameList == null) {
            util_1.default.show_error_dialog(`can't read as xlsx file: ${xlsxFileNameList}`);
            return {
                ret: `can't read as xlsx file: ${xlsxFileNameList}`,
                outputList: []
            };
        }
        let xlsxFileName = xlsxFileNameList[1];
        let outputs = [];
        // 将一个xlsx文件中的多个工作簿导出
        let sheet_name = workbook.SheetNames[sheetIdx];
        if (isMoreSheetsExport && !!sheet_name && !sheet_name.includes('_info')) {
            if (sheetIdx === 0) {
                util_1.default.show_error_dialog(`${xlsxFileName} 文件中不存在任何表格工作簿`);
                return {
                    ret: `${xlsxFileName} 文件中不存在任何表格工作簿`,
                    outputList: outputs
                };
            }
            return {
                ret: 'ok',
                outputList: outputs
            };
        }
        if (!sheet_name) {
            return {
                ret: 'ok',
                outputList: outputs
            };
        }
        let worksheet = workbook.Sheets[sheet_name];
        xlsxData.set_checked_xslx(sheet_name, workbook);
        let parseResult = Object.create(null);
        let ret = this.parse_xls(worksheet, parseResult, sheet_name);
        if (ret != "ok") {
            return {
                ret: ret,
                outputList: outputs
            };
        }
        //export now 
        let fileName = isMoreSheetsExport ? sheet_name : xlsxFileName;
        let pluginRet = null;
        for (let setting of settings) {
            if (setting.need) {
                let needColDict = this.get_need_col_list(parseResult, setting);
                let needColumns = needColDict['needColumns'];
                let needColumnsData = needColDict['needColumnsData'];
                if (needColumnsData.length > 0) {
                    parseResult['needColumnsData'] = needColumnsData;
                    pluginRet = this.requirePlugin(parseResult, fileName, worksheet, needColumns, setting);
                    if (pluginRet && pluginRet["ret"] != xlsxData.RET.OK) {
                        return {
                            ret: pluginRet["ret"],
                            outputList: outputs
                        };
                    }
                    let parseRes = pluginRet ? pluginRet['parseResult'] : parseResult;
                    needColDict = this.get_need_col_list(parseRes, setting);
                    needColumns = needColDict['needColumns'];
                    needColumnsData = needColDict['needColumnsData'];
                    this.exportSwitch(parseRes, needColumns, needColumnsData, fileName, setting, outputs);
                    if (!!pluginRet) {
                        // 这里是因为有可能插件处理完之后会有新的表，等于说再导出一个，如果没有新的就是覆盖了
                        let parseRes = pluginRet["parseResult"];
                        parseRes["extraDictName"] = pluginRet['extraDictName'];
                        parseRes["extraDict"] = JSON.stringify(pluginRet['extraDict'], null, 4);
                        if (parseRes["extraDict"]) {
                            parseRes["extraDict"] = parseRes["extraDict"].replace(/\n/g, "\n    ");
                        }
                        fileName = pluginRet["fileName"] ? pluginRet["fileName"] : fileName;
                        let needColDict = this.get_need_col_list(parseRes, setting);
                        needColumns = needColDict['needColumns'];
                        needColumnsData = needColDict['needColumnsData'];
                        if (parseRes['columns_lua'] && setting.text == 'lua') {
                            let needColDict = this.get_need_col_list(parseRes, setting);
                            this.exportSwitch(parseRes, needColDict['needColumns'], needColDict['needColumnsData'], fileName, setting, outputs);
                        }
                        else {
                            this.exportSwitch(parseRes, needColumns, needColumnsData, fileName, setting, outputs);
                        }
                    }
                }
            }
        }
        // 多sheets导出处理部分
        if (isMoreSheetsExport) {
            let retDict = this.export_xls(filePath, settings, sheetIdx + 1);
            if (retDict["ret"] != "ok") {
                ret = retDict["ret"];
            }
            outputs.push(...retDict['outputList']);
        }
        return {
            ret: ret,
            outputList: outputs
        };
    }
    // 插件脚本解析引入
    requirePlugin(parseResult, fileName, worksheet, needColumns, setting) {
        let PATH_NOW = path.resolve(__dirname, "../../plugin");
        let dirNameList = fs.readdirSync(PATH_NOW);
        let jsPluginList = [];
        let appId = xlsxData.get_project_cfg_by_key(xlsxData.PROJECT_UNIQUE.APP_ID);
        let dirName = "appId_" + appId;
        let isPluginForAll = false; // 为所有项目组做的通用插件
        if (!dirNameList.includes(dirName)) {
            dirName = 'appId_all';
            if (!dirNameList.includes(dirName)) {
                return null;
            }
            isPluginForAll = true;
        }
        let subDirPath = path.join(PATH_NOW, dirName);
        let pluginNameList = fs.readdirSync(subDirPath);
        let fileNum = pluginNameList.length;
        for (let index = fileNum - 1; index >= 0; index--) {
            let pluginName = pluginNameList[index];
            if (pluginName.includes("_for_all")) {
                let pluginPath = path.join(subDirPath, pluginName);
                let jsPlugin = require(pluginPath);
                jsPluginList.push(jsPlugin);
                let pluginForAllRet = jsPlugin.startPlugin(parseResult, fileName, worksheet, needColumns, setting);
                if (pluginForAllRet["ret"] != xlsxData.RET.OK) {
                    util_1.default.show_error_dialog(pluginForAllRet["ret"]);
                    return pluginForAllRet;
                }
                pluginNameList.splice(index, 1);
            }
            else if (isPluginForAll) {
                util_1.default.show_error_dialog("为所有项目写的插件名称中必须包含 _for_all");
                return null;
            }
        }
        fileNum = pluginNameList.length;
        for (let idx = 0; idx < fileNum; idx++) {
            let pluginName = pluginNameList[idx];
            let pluginJSName = pluginName.split(".")[0];
            // 当这个插件脚本是针对所有表的时候，就不需要判断脚本名字了
            if (!pluginName.includes("_for_all")) {
                if (!pluginName.includes(".js") || pluginJSName != fileName) {
                    continue;
                }
            }
            let pluginPath = path.join(subDirPath, pluginName);
            let jsPlugin = require(pluginPath);
            jsPluginList.push(jsPlugin);
            let pluginRet = jsPlugin.startPlugin(parseResult, fileName, worksheet, needColumns, setting);
            /**pluginRet
             * {
             *  ret: number,
             *  parseResult: parseResult,
             *  fileName: fileName,
             *  extraDictName: extraDictName,
             *  extraDict: extraDict
             *
             * }
             */
            if (pluginRet["ret"] === xlsxData.RET.OK) {
                return pluginRet;
            }
            else {
                util_1.default.show_error_dialog(pluginRet["ret"]);
                return null;
            }
        }
    }
    exportSwitch(parseResult, needColumns, needColumnsData, fileName, setting, outputs) {
        let output = "";
        switch (setting.text) {
            case "lua":
                output = exportToFile.export_to_lua(parseResult, needColumns, needColumnsData, fileName, setting);
                break;
            case "xml":
                output = exportToFile.export_to_xml(parseResult, needColumns, needColumnsData, fileName, setting);
                break;
            case "csv":
                output = exportToFile.export_to_csv(parseResult, needColumns, needColumnsData, fileName, setting);
                break;
            case "js":
                output = exportToFile.export_to_js(parseResult, needColumns, needColumnsData, fileName, setting);
                break;
            case "ts":
                // if(needColumns.length == 0) {
                //     break
                // }
                // push_col_blank(parseResult)
                // let needColDict = get_need_col_list(parseResult, setting)
                // needColumns = needColDict['needColumns']
                // needColumnsData = needColDict['needColumnsData']
                output = exportToFile.export_to_ts(parseResult, needColumns, needColumnsData, fileName, setting);
                break;
            case "c#":
                output = exportToFile.export_to_csharp(parseResult, needColumns, needColumnsData, fileName, setting);
                break;
            case "gm":
                output = exportToFile.export_to_xml(parseResult, needColumns, needColumnsData, fileName + ".gm", setting);
                break;
        }
        if (!outputs.includes(output)) {
            outputs.push(output);
        }
    }
    init_export(event, filePath, jobId) {
        if (!xlsxData.is_right_version()) {
            if (event) {
                event.sender.send('s2c_export_xls', jobId, "error", "版本不对，请更新");
            }
            return;
        }
        let settings = require("./settingService").getData();
        let found = filePath.match(/.*?([\w]+)\.xlsx$/);
        if (!found) {
            found = filePath.match(/.*?([\u4e00-\u9fa5]+)\.xlsx$/);
        }
        if (found == null) {
            if (event) {
                event.sender.send('s2c_export_xls', jobId, "error", "not a .xlsx file");
            }
            return;
        }
        for (let setting of settings) {
            if (setting.need) {
                if (!fs.existsSync(setting.dir)) {
                    if (event) {
                        event.sender.send('s2c_export_xls', jobId, "error", "输出目录不存在" + setting.dir);
                    }
                    console.error("输出目录不存在");
                    return;
                }
            }
        }
        let fileName = found[1];
        xlsxData.set_export_state_str("ok");
        xlsxData.set_cur_filePath(filePath);
        xlsxData.set_cur_xlsx_name(fileName);
        xlsxData.clear_errorMsgList();
        xlsxData.parse_project_cfg();
        let retDict = this.export_xls(filePath, settings);
        let ret = !!retDict ? retDict['ret'] : 'error';
        if (ret != "ok") {
            if (event) {
                event.sender.send('s2c_export_xls', jobId, "error", ret);
            }
            return;
        }
        let outputList = retDict['outputList'];
        if (event) {
            event.sender.send('s2c_export_xls', jobId, "ok", "", outputList);
        }
        return outputList;
    }
}
exports.default = XlsxService;
//# sourceMappingURL=xlsx-service.js.map