"use strict";
/*
 * @Author: 惊仙
 * @Date: 2021-03-10 18:10:47
 * @Last Modified by: 惊仙
 * @Last Modified time: 2022-11-08 20:49:52
 */
Object.defineProperty(exports, "__esModule", { value: true });
// 导出成各种其他格式文件的方法
const { dialog } = require('electron');
const nunjucks = require('nunjucks');
nunjucks.configure({ autoescape: false });
const path = require('path');
const fs = require('fs');
const util = require('./util');
const xlsxData = require('./xlsxData');
class ExportFileMgr {
    /**
     * 四舍五入取整函数
     */
    static rounded(f) {
        if (f == 0) {
            return 0;
        }
        //return parseInt(f);
        return Math.round(f);
    }
    static escape_array(str) {
        str = ExportFileMgr.escape_lua(str);
        let retStr = "";
        let strList = str.match(/\[(.+?)\]/g);
        if (strList) {
            for (let str of strList) {
                str = str.slice(1, -1);
                retStr += `"${str}",`;
            }
        }
        if (retStr == "") {
            retStr = str;
        }
        return retStr;
    }
    /**
    * lua 正则替换 xml 格式函数
    * @param {string} str
    */
    static escape_xml(str) {
        str = str.replace(/>/g, "&gt;");
        str = str.replace(/</g, "&lt;");
        str = str.replace(/"/g, "&quot;");
        return str;
    }
    /**
     * xml 正则替换 lua 函数
     * @param {string} str
     */
    static escape_lua(str) {
        str = str.replace(/&gt;/g, ">");
        str = str.replace(/&lt;/g, "<");
        // str = str.replace(/"(.*?)"/g, "“$1”")
        str = str.replace(/"(.*?)"/g, "\\\"$1\\\"");
        return str;
    }
    static escape_csv(str) {
        str = str.replace(/&gt;/g, ">");
        str = str.replace(/&lt;/g, "<");
        let has_quote = false;
        if (str.match(/\"|,/)) {
            has_quote = true;
        }
        str = str.replace(/"/g, '""');
        if (has_quote) {
            return '"' + str + '"';
        }
        return str;
    }
    static ts_enum_upper(filename, needColumnsData) {
        /* 这里有个问题没处理，无法判断是否是最上层的xlsx目录，
        当这里是配置表主目录时，配置表的名字中有和主目录文件夹的名字相同，也会把那一段删掉
        */
        let filePath = xlsxData.get_cur_filePath();
        let dirNameList = filePath.split('\\');
        let lastDir = dirNameList[dirNameList.length - 2];
        if (filename.includes(lastDir)) {
            filename = filename.replace(`_${lastDir}`, '');
        }
        let enumStrName = "ENUM_STRING_" + filename;
        let enumNumName = "ENUM_NUMER_" + filename;
        let enumStrList = [];
        let enumNumList = [];
        let idx = 0;
        for (const item of needColumnsData) {
            let upperName = item.column.toUpperCase();
            if (item.type === 'int') {
                enumNumList[idx] = upperName;
            }
            else if (item.type === 'string') {
                enumStrList[idx] = upperName;
            }
            idx++;
        }
        return [{
                name: enumStrName.toUpperCase(),
                list: enumStrList,
            }, {
                name: enumNumName.toUpperCase(),
                list: enumNumList,
            }];
    }
    /**---------------------export function------------------------------- */
    static export_to_lua(parseResult, needColumns, needColumnsData, filename, setting) {
        let source = fs.readFileSync(path.join(__dirname, '../tmpl/lua.tmpl'), 'utf8');
        let rowsData = [];
        for (let row of parseResult.rows) {
            let r = {};
            for (let col of needColumns) {
                let v = row[col];
                if (!parseResult.columnsInfo[col]) {
                    console.log("file = " + filename + " has error,col = " + col);
                    console.log(JSON.stringify(parseResult.columnsInfo));
                    console.log(JSON.stringify(needColumns));
                }
                let colType = parseResult.columnsInfo[col].type;
                if (colType == "int") {
                    if (isNaN(v)) {
                        util.show_error_dialog();
                        return;
                    }
                    v = ExportFileMgr.rounded(v);
                }
                else if (colType == "string") {
                    v = '"' + ExportFileMgr.escape_lua(v) + '"';
                }
                else if (colType.includes("array")) {
                    v = '{' + ExportFileMgr.escape_array(v) + '}';
                }
                r[col] = v;
            }
            rowsData.push(r);
        }
        if (parseResult.enums) {
            for (let item of parseResult.enums) {
                item.lua_units = [];
                let units = item.units;
                for (let i = 0, len = units.length; i < len; ++i) {
                    let unit = units[i];
                    item.lua_units[i] = unit.replace(":", "=").replace("//", "--");
                }
            }
        }
        let subClassDict = parseResult.sub_classes;
        for (const key in subClassDict) {
            let subClassList = subClassDict[key];
            let len = subClassList.length;
            for (let index = 0; index < len; index++) {
                let subClassValueList = subClassList[index]['value'];
                let len2 = subClassValueList.length;
                for (let j = 0; j < len2; j++) {
                    let subClassValue = subClassValueList[j];
                    if (typeof (subClassValue) != 'string') {
                        break;
                    }
                    subClassValue = subClassValue.replace("[", "{");
                    subClassValue = subClassValue.replace("]", "}");
                    subClassValueList[j] = subClassValue;
                }
            }
        }
        parseResult.sub_classes = subClassDict;
        let data = {
            record_name: "record_" + filename,
            class_name: filename,
            needColumnsData: needColumnsData,
            rowsData: rowsData,
            indexOfColumns: parseResult.indexOfColumns,
            indexData: parseResult.indexData,
            indexType: parseResult.indexType,
            enums: parseResult.enums,
            key_counts: parseResult.key_counts,
            sub_classes: parseResult.sub_classes,
            col_max_dict: parseResult.col_max_dict
        };
        var result = nunjucks.renderString(source, data);
        let output = path.join(setting.dir, filename + ".lua");
        fs.writeFileSync(output, result);
        return output;
    }
    static export_to_xml(parseResult, needColumns, needColumnsData, filename, setting) {
        let source = fs.readFileSync(path.join(__dirname, '../tmpl/xml.tmpl'), 'utf8');
        let rowsData = [];
        for (let row of parseResult.rows) {
            let r = {};
            for (let col of needColumns) {
                let v = row[col];
                if (parseResult.columnsInfo[col].type == "int") {
                    if (isNaN(v)) {
                        util.show_error_dialog(filename + ' 的 ' + col + ' 的 ' + v + " int和string搞错了");
                        return;
                    }
                    v = ExportFileMgr.rounded(v);
                }
                else if (parseResult.columnsInfo[col].type == "string") {
                    v = ExportFileMgr.escape_xml(v);
                }
                r[col] = v;
            }
            rowsData.push(r);
        }
        // needColumnsData = fixAliasOfColumnsData(needColumnsData, parseResult.columnsInfo)
        // rowsData = fixAliasOfRowsData(rowsData, parseResult.columnsInfo)
        var data = {
            needColumnsData: needColumnsData,
            rowsData: rowsData
        };
        var result = nunjucks.renderString(source, data);
        // console.log(result)
        let output = path.join(setting.dir, filename + ".xml");
        fs.writeFileSync(output, result);
        return output;
    }
    static export_to_csv(parseResult, needColumns, needColumnsData, filename, setting) {
        let source = fs.readFileSync(path.join(__dirname, '../tmpl/csv.tmpl'), 'utf8');
        let rowsData = [];
        for (let row of parseResult.rows) {
            let r = [];
            for (let col of needColumns) {
                let v = row[col];
                r.push(ExportFileMgr.escape_csv(v));
            }
            rowsData.push(r);
        }
        // needColumnsData = fixAliasOfColumnsData(needColumnsData, parseResult.columnsInfo)
        var data = {
            needColumnsData: needColumnsData,
            rowsData: rowsData
        };
        var result = nunjucks.renderString(source, data);
        // console.log(result)
        let output = path.join(setting.dir, filename + ".csv");
        fs.writeFileSync(output, result);
        return output;
    }
    static export_to_js(parseResult, needColumns, needColumnsData, filename, setting) {
        let source = fs.readFileSync(path.join(__dirname, '../tmpl/js.tmpl'), 'utf8');
        let rowsData = [];
        for (let row of parseResult.rows) {
            let r = {};
            for (let col of needColumns) {
                let v = row[col];
                let colType = parseResult.columnsInfo[col].type;
                if (colType == "int") {
                    if (isNaN(v)) {
                        util.show_error_dialog(filename + ' 的 ' + col + ' 的 ' + v + " int和string搞错了");
                        return;
                    }
                    v = ExportFileMgr.rounded(v);
                }
                else if (colType == "string") {
                    v = '"' + ExportFileMgr.escape_lua(v) + '"';
                }
                else if (colType.includes("array")) {
                    v = '[' + ExportFileMgr.escape_array(v) + ']';
                }
                r[col] = v;
            }
            rowsData.push(r);
        }
        // needColumnsData = fixAliasOfColumnsData(needColumnsData, parseResult.columnsInfo)
        // rowsData = fixAliasOfRowsData(rowsData, parseResult.columnsInfo)
        let [enumStrDict, enumNumDict] = ExportFileMgr.ts_enum_upper(filename, needColumnsData);
        var data = {
            record_name: "record_" + filename,
            class_name: filename,
            needColumnsData: needColumnsData,
            rowsData: rowsData,
            indexOfColumns: parseResult.indexOfColumns,
            indexData: parseResult.indexData,
            indexType: parseResult.indexType,
            enums: parseResult.enums,
            key_counts: parseResult.key_counts,
            sub_classes: parseResult.sub_classes,
            typeAndIndex: parseResult.typeAndIndex,
            enumStrDict: enumStrDict,
            enumNumDict: enumNumDict,
        };
        var result = nunjucks.renderString(source, data);
        let output = path.join(setting.dir, filename + ".js");
        fs.writeFileSync(output, result);
        return output;
    }
    static export_to_ts(parseResult, needColumns, needColumnsData, filename, setting) {
        let tsTmpl = '../tmpl/ts.tmpl';
        if (!!xlsxData.get_project_cfg_by_key(xlsxData.PROJECT_UNIQUE.OLD_EXPORT_FORMAT)) {
            tsTmpl = '../tmpl/ts_old.tmpl';
        }
        let source = fs.readFileSync(path.join(__dirname, tsTmpl), 'utf8');
        let rowsData = [];
        let defaultValueList = parseResult["defaultValueList"];
        let mainKeyList = parseResult.indexOfColumns;
        for (let row of parseResult.rows) {
            let r = [];
            let colCount = needColumns.length;
            let canOmit = true; // 可以省略
            for (let index = colCount - 1; index >= 0; index--) {
                let col = needColumns[index];
                let v = row[col];
                let compareV = v;
                let colType = parseResult.columnsInfo[col].type;
                if (!!defaultValueList) {
                    let defaultValue = defaultValueList[index];
                    let isSame = false;
                    if (colType == "int") {
                        compareV = Number(compareV);
                        defaultValue = Number(defaultValueList[index]);
                        isSame = compareV == defaultValue;
                    }
                    else if (colType == "string") {
                        isSame = (compareV.length == 0 && defaultValue == '""');
                    }
                    if (mainKeyList.indexOf(col) != -1 || !isSame) {
                        canOmit = false;
                    }
                    if (canOmit) {
                        continue;
                    }
                }
                if (colType == "int") {
                    if (isNaN(v)) {
                        util.show_error_dialog(filename + ' 的 ' + col + ' 的 ' + v + " int和string搞错了");
                        return;
                    }
                    v = ExportFileMgr.rounded(v);
                }
                else if (colType == "string") {
                    v = '"' + ExportFileMgr.escape_lua(v) + '"';
                }
                else if (colType.includes("array")) {
                    let str = ExportFileMgr.escape_array(v);
                    v = '[' + str + ']';
                }
                r[index] = v;
            }
            rowsData.push(r);
        }
        // needColumnsData = fixAliasOfColumnsData(needColumnsData, parseResult.columnsInfo)
        // rowsData = fixAliasOfRowsData(rowsData, parseResult.columnsInfo)
        let [enumStrDict, enumNumDict] = ExportFileMgr.ts_enum_upper(filename, needColumnsData);
        var data = {
            record_name: "record_" + filename,
            class_name: filename,
            needColumnsData: needColumnsData,
            rowsData: rowsData,
            indexOfColumns: parseResult.indexOfColumns,
            indexData: parseResult.indexData,
            indexType: parseResult.indexType,
            enums: parseResult.enums,
            key_counts: parseResult.key_counts,
            sub_classes: parseResult.sub_classes,
            typeAndIndex: parseResult.typeAndIndex,
            enumStrDict: enumStrDict,
            enumNumDict: enumNumDict,
            extraDictName: parseResult.extraDictName || "",
            extraDict: parseResult.extraDict || null,
            keyTypeList: parseResult['keyTypeList'],
            allKeyTypeList: parseResult["allKeyTypeList"],
            defaultValueList: parseResult["defaultValueList"],
        };
        var result = nunjucks.renderString(source, data);
        //console.log(result)
        let output = path.join(setting.dir, filename + ".ts");
        fs.writeFileSync(output, result);
        return output;
    }
    static export_to_csharp(parseResult, needColumns, needColumnsData, filename, setting) {
        let source = fs.readFileSync(path.join(__dirname, '../tmpl/csharp.tmpl'), 'utf8');
        let rowsData = [];
        for (let row of parseResult.rows) {
            let r = {};
            for (let col of needColumns) {
                let v = row[col];
                if (parseResult.columnsInfo[col].type == "int") {
                    if (isNaN(v)) {
                        util.show_error_dialog(filename + ' 的 ' + col + ' 的 ' + v + " int和string搞错了");
                        return;
                    }
                    v = ExportFileMgr.rounded(v);
                }
                else if (parseResult.columnsInfo[col].type == "string") {
                    v = '"' + ExportFileMgr.escape_lua(v) + '"';
                }
                r[col] = v;
            }
            rowsData.push(r);
        }
        if (parseResult.enums) {
            for (let item of parseResult.enums) {
                item.csharp_units = [];
                let units = item.units;
                for (let i = 0, len = units.length; i < len; ++i) {
                    let unit = units[i];
                    let str = unit.replace(/[,]/, "|");
                    str = str.replace(/[:]/, "|");
                    let strList = str.split("|");
                    item.csharp_units[i] = {
                        "key": strList[0],
                        "value": strList[1],
                        "des": strList[2] || ""
                    };
                }
            }
        }
        let mainKeyList = [];
        for (let col of parseResult.indexOfColumns) {
            mainKeyList.push({
                "type": parseResult.columnsInfo[col].type,
                "name": col,
            });
        }
        for (let item of needColumnsData) {
            item.column = item.column.slice(0, 1).toUpperCase() + item.column.slice(1);
        }
        var data = {
            record_name: "record_" + filename,
            class_name: filename,
            needColumnsData: needColumnsData,
            rowsData: rowsData,
            indexOfColumns: parseResult.indexOfColumns,
            indexData: parseResult.indexData,
            indexType: parseResult.indexType,
            enums: parseResult.enums,
            key_counts: parseResult.key_counts,
            sub_classes: parseResult.sub_classes,
            mainKeyList: mainKeyList,
        };
        var result = nunjucks.renderString(source, data);
        //console.log(result)
        let output = path.join(setting.dir, filename + ".cs");
        fs.writeFileSync(output, result);
        return output;
    }
}
exports.default = ExportFileMgr;
//# sourceMappingURL=export-file-mgr.js.map