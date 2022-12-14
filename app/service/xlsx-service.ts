import { columnsInfoStruct, exportPathInfo, praseStruct } from "./jx-define";
import Util from "./util";

const path = require('path')
// const { ipcMain, dialog } = require('electron')
import { ipcMain } from "electron"
const XLSX = require("xlsx")
import * as fs from "fs"
import ElectronEventID from "./event-id";
// const nunjucks = require('nunjucks');
const CHECKMODULE = require('./check');
const exportToFile = require('./exportToFile');
const xlsxData = require('./xlsxData');
const NGameConst = require('./NGame/NGameConst');
// nunjucks.configure({ autoescape: false });

export default class XlsxService {
    private static _instance: XlsxService
    public static get instance(): XlsxService {
        if(!XlsxService._instance) {
            XlsxService._instance = new XlsxService()
        }
        return XlsxService._instance
    }

    public start() {
        ipcMain.on(ElectronEventID.c2s_open_plugin, (event: Electron.IpcMainEvent, status: boolean) => {
            xlsxData.update_plugin_open(status)
        })
        ipcMain.on(ElectronEventID.c2s_export_xls, (event: Electron.IpcMainEvent, filePath: string, jobId: number) => {
            this.init_export(event, filePath, jobId);
        })
    }

    public get_need_col_list(parseResult: praseStruct, setting: exportPathInfo) {
        let needColumns = []
        let needColumnsData = []
        let isLua = setting.text == 'lua'
        let columnList = parseResult['columns_lua'] && isLua ? parseResult['columns_lua'] : parseResult['columns']
        let columnsInfo = parseResult['columnsInfo_lua'] && isLua ? parseResult['columnsInfo_lua'] : parseResult.columnsInfo
        for (let index = 0, len = columnList.length; index < len; index++) {
            const col = columnList[index]
            let needExportStr = columnsInfo[col].export
            let re = new RegExp(setting.reg, "i");
            if (needExportStr.match(re)) {
                needColumns.push(col)
                needColumnsData.push({ column: col, desc: columnsInfo[col].desc, type: columnsInfo[col].type })
            }
        }
    
        return {
            needColumns: needColumns,
            needColumnsData: needColumnsData
        }
    }
    
    //??????xls, ???????????????????????????????????????
    public parse_xls(worksheet: any, parseResult: praseStruct, sheetName: string) {
    
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
        let xlsxFileName = sheetName
        xlsxData.set_cur_sheet_name(sheetName)
        let range = worksheet["!ref"]
        if(!range) {
            return `no data in the xlsx file: ${xlsxFileName}`
        }
        let re = /\:([A-Z]+)(\d+)/;
        let found = range.match(re);
        let maxColumn = "A"
        let maxRow = 1
        if (found && found[1] != null && found[2] != null) {
            maxColumn = found[1]
            maxRow = found[2]
        } else {
            return `no data in the xlsx file: ${xlsxFileName}`
        }
        parseResult.maxRow = maxRow;
        parseResult.maxColumn = maxColumn;
        if (maxRow < 5) {
            return `${xlsxFileName} ??????????????????`
        }
    
        //columns
        let startColumn = 'A'
    
        let columnTypeRow = 2 // ????????????
        let columnDescRow = 3 // ??????
        let columnExportRow = 4 // ?????????????????????/?????????
        let columnNameRow = 6 // ????????????
        let columnRelationRow = 5 // ???????????????
        let columnContentRow = 7 // ????????????
        let columns = []
        let columnsInfo: {[name: string]: columnsInfoStruct} = Object.create(null)
        /**
         * {???????????????{
         * ???????????????
         * ???????????????
         * }}
         */
        /**
         * ????????????????????? - relationColValueDict
         * {???????????????{???????????????[?????????????????????]}}
         */
        let relationColValueDict = {}
    
        /* --------------------------??????????????????????????????????????????start---------------------- */
        let indexString = Util.get_cell_v(worksheet["A1"])
        indexString = indexString.split(',')[0]
        while (true) {
            let fiveCellValue = worksheet[startColumn + columnRelationRow.toString()]
            fiveCellValue = Util.get_cell_v(fiveCellValue)
            if(fiveCellValue === indexString) {
                columnNameRow = 5
                columnContentRow = 6
                break
            }
            if (startColumn == maxColumn) {
                break
            }
            startColumn = Util.get_nextAZ(startColumn)
        }
        startColumn = 'A'
        /* --------------------------??????????????????????????????????????????end---------------------- */
        parseResult.columnContentRow = columnContentRow
        //??????
        indexString = Util.get_cell_v(worksheet["A1"])
        indexString = indexString.replace(/\s/, "")
        let indexOfColumns = indexString.split(",")
        parseResult.indexOfColumns = indexOfColumns
    
        while (true) {
            let cellType = worksheet[startColumn + columnTypeRow.toString()]
            let cellDesc = worksheet[startColumn + columnDescRow.toString()]
            let cellExport = worksheet[startColumn + columnExportRow.toString()]
            let cellName = worksheet[startColumn + columnNameRow.toString()]
            let cellRelation = worksheet[startColumn + columnRelationRow.toString()]
            if (cellName == null || cellDesc == null || cellExport == null) {
                break
            }
    
            let columnName = Util.get_cell_v(cellName)
            let isError = CHECKMODULE.check_column_name(columnName)
            if(!isError) {
                return
            }
    
            let relationStr = Util.get_cell_v(cellRelation)
            let relationInfoDict = CHECKMODULE.get_relation_value_dict(relationStr, columnName)
            if(!!relationInfoDict) {
                relationColValueDict[columnName] = relationInfoDict
            }
    
            let comment = Util.get_cell_c(cellName) // ???????????????????????????
            if (comment) {
                let isRepeat = CHECKMODULE.check_enum_repeat(comment.valList)
                if(!isRepeat) {
                    Util.show_error_dialog(`${xlsxFileName} ??? ${columnName} ???????????????`)
                    return
                }
                if (!parseResult.enums) {
                    parseResult.enums = []
                }
                parseResult.enums.push(comment)
            }
    
            columns.push(columnName)
            cellType = Util.get_cell_v(cellType)
            if(cellType != 'int' && cellType != 'string' && !cellType.includes('array')) {
                Util.show_error_dialog(`${xlsxFileName} ????????????????????? ${cellType} ??????`)
                return
            }
            columnsInfo[columnName] = {
                type: cellType,
                desc: Util.get_cell_v(cellDesc),
                export: Util.get_cell_v(cellExport),
            }
            if (startColumn == maxColumn) {
                break
            }
            startColumn = Util.get_nextAZ(startColumn)
        }
    
        parseResult.columnsInfo = columnsInfo
    
        //check columns duplicated name
        let checkColumnName = {}
        for (let j = 0; j < columns.length; j++) {
            let columnName = columns[j]
            if (columnName != "" && checkColumnName[columnName]) {
                return `${xlsxFileName} ?????????????????????: ${columnName}`
            }
            checkColumnName[columnName] = 1;
        }
    
        let typeAndIndex = []
        let keyTypeList = []
        for (let col of indexOfColumns) {
            if (columnsInfo[col] == null) {
                return `${xlsxFileName} index of ${col} is not exists`
            }else if(!(columnsInfo[col].type)) {
                return `${xlsxFileName} index of ${col} type is error!`
            } else if(columnsInfo[col].type === "int") {
                keyTypeList.push('number')
                typeAndIndex.push([col] + ": number")
            } else {
                keyTypeList.push(columnsInfo[col].type)
                typeAndIndex.push([col] + ": " + columnsInfo[col].type)
            }
        }
        parseResult.typeAndIndex = typeAndIndex
        parseResult.keyTypeList = keyTypeList
    
        //rows
        let rows: {[colName: string]: string}[] = []
        // let regRef = new RegExp('\#([\w\_]+)\#', 'g')
        for (let i = columnContentRow; i <= maxRow; i++) {
            startColumn = 'A'
            let rowData: {[colNameL: string]: string} = {}
            let isEmptyRow = true
            for (let j = 0; j < columns.length; j++) {
                let cell = worksheet[startColumn + i.toString()]
                let columnName = columns[j]
                let columnInfo = columnsInfo[columnName]
                let cellVal: string | number = Util.get_cell_v(cell)
                if(indexOfColumns.includes(columnName) && !cell) {
                    maxRow = i
                }
        
                if(cell && indexOfColumns.includes(columnName) && cellVal === "") {
                    return `${xlsxFileName}??????????????????????????????${i}???`
                }
                if (columnInfo != null) {
                    if (cellVal != "") {
                        isEmptyRow = false
                    } else if (cellVal == "" && columnInfo.type === 'int') {
                        cellVal = 0
                    }
                    rowData[columnName] = cellVal.toString().trim()
                    let relationValueDict = relationColValueDict[columnName]
                    CHECKMODULE.check_relation_in_cur_default(relationValueDict, rowData, columnName)
                }
                startColumn = Util.get_nextAZ(startColumn)
            }
            if (!isEmptyRow) {
                //?????????????????????#xxxx#???????????? ???????????????????????????????????????
                // ????????????????????????????????????????????? $(.+?)$??? ?????????????????????????????????????????????????????????????????????
                for (let columnName in rowData) {
                    let val = rowData[columnName]
                    let regRef = new RegExp('$(.+?)$', 'g');
                    let result = null
                    let results = []
                    while ((result = regRef.exec(val)) != null) {
                        results.push(result[1])
                    }
    
                    if (results && results.length > 0) {
                        for (let r of results) {
                            if (rowData[r] != null) {
                                val = val.replace("$" + r + "$", rowData[r])
                            }
                        }
                        rowData[columnName] = val
                    }
                }
                // let checkInfo = checkModule.check_existent_in_enum(rowData, parseResult["enums"])
                // if(checkInfo.notExistent) {
                //     util.show_error_dialog(`${xlsxFileName} id???${checkInfo.rowId} ??????${checkInfo.checkColName} ????????????????????????`)
                //     return 
                // }
                rows.push(rowData)
            }
            CHECKMODULE.check_relation_in_cur_res(rowData)
        }
        parseResult.maxRow = maxRow
        parseResult.rows = rows
        parseResult.columns = columns
    
        let subclassValue = Util.get_cell_v(worksheet["B1"])
        if (subclassValue) {
            let subclassArr = subclassValue.split(",")
            let idIndex = columns.indexOf("id")
            parseResult.sub_classes = Object.create(null)
            if (subclassArr.length > 0 && idIndex >= 0) {
                
                for (let subclassString of subclassArr) {
                    parseResult.sub_classes[subclassString] = []
                    let classes: {[cl: string]: string[]} = {}
                    for (let row of rows) {
                        let cl = row[subclassString] ? row[subclassString] : '0'
                        if (!classes[cl]) {
                            classes[cl] = []
                        }
                        let mainKeyList: string | string[] = []
                        for (let col of indexOfColumns) {
                            mainKeyList.push(row[col])
                        }
                        if(mainKeyList.length > 1) {
                            mainKeyList = `[${mainKeyList}]`
                            classes[cl].push(mainKeyList)
                        } else {
                            classes[cl].push(mainKeyList[0])
                        }
                    }
                    for (let key in classes) {
                        let val = classes[key]
                        parseResult.sub_classes[subclassString].push({
                            key: key,
                            value: val
                        })
                    }
                }
            }
        }
        
        
        //????????????
        let indexType = "int";
        let mainKeyCount = indexOfColumns.length // ???????????????
        if (mainKeyCount > 1) {
            indexType = "string";
        } else if (mainKeyCount == 1) {
            let column = indexOfColumns[0]
            if (columnsInfo[column].type == "string") {
                indexType = "string";
            }
        }
        parseResult.indexType = indexType;
    
        //??????????????????
        let indexData: {[key: string]: number} = {}
        for (let i = 0; i < rows.length; i++) {
            let r = rows[i]
            let indexValues = []
            let notNulCount = mainKeyCount // ?????????key???
            for (let col of indexOfColumns) {
                if (r[col] != "") {
                    indexValues.push(r[col])
                    continue
                }
                notNulCount--
            }
            if(notNulCount === 0) {
                return `${xlsxFileName}??????????????????????????????${i}???`
            }
            let key = indexValues.join("_")
            if (indexData[key] != null || indexData[key] != undefined) {
                return `${xlsxFileName}???????????????, id ???: ${key}`
            }
            indexData[key] = i
        }
        parseResult.indexData = indexData;
    
        //??????key??????????????????type_1,type_2
        let namesHash: {[colName: string]: number} = {}
        for (let j = 0; j < columns.length; j++) {
            let columnName = columns[j]
            if (!namesHash[columnName]) {
                namesHash[columnName] = 1
            }
        }
        let cellNames = Object.keys(namesHash)
        let resultHash = this.get_resemble_keys(cellNames)
    
        let keyCountList: {name: string, value: number}[] = []
        for (let name in resultHash) {
            //type.value.size????????????????????????????????????
            let hasType = name.indexOf("type") != -1
            let hasValue = name.indexOf("value") != -1
            let hasSize = name.indexOf("size") != -1
            if(hasType || hasValue || hasSize) {
                let str = ""
                if(hasType) {
                    str = "type"
                } else if(hasValue) {
                    str = "value"
                } else if(hasSize) {
                    str = "size"
                }
            }
            let count = resultHash[name]
            if (count > 1) {
                let key = ""
                if (name.endsWith("_")) {
                    key = name + "count"
                } else {
                    key = name + "_count"
                }
                keyCountList.push({
                    name: key,
                    value: count
                })
            }
        }
        if (keyCountList && keyCountList.length > 0) {
            parseResult.key_counts = keyCountList
        }
    
        let stateStr = xlsxData.get_export_state_str()
    
        return stateStr
    }
    
    public get_resemble_keys(keys: string[]): {[key: string]: number} {
        let keyHash: {[key: string]: number} = {}
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i]
            key = key.replace(/\d+/, "")  //?????????key.replace(/\d+/g, "")????????????
            if (keyHash[key]) {
                keyHash[key]++
            } else {
                keyHash[key] = 1
            }
        }
        return keyHash
    }
    
    public export_xls(filePath: string, settings: exportPathInfo[], sheetIdx: number = 0): {
        ret: string,
        outputList: any[],
    } {
        let workbook = XLSX.readFile(filePath)
        let isMoreSheetsExport = !!xlsxData.get_project_cfg_by_key(xlsxData.PROJECT_UNIQUE.XLSX_MORE_SHEETS)
        let xlsxFileNameList = filePath.match(/.*?([\w]+)\.xlsx$/)
        if(!xlsxFileNameList || !xlsxFileNameList[0]) {
            xlsxFileNameList = filePath.match(/.*?([\u4e00-\u9fa5]+)\.xlsx$/)
        }
    
        if (workbook == null || xlsxFileNameList == null) {
            Util.show_error_dialog(`can't read as xlsx file: ${xlsxFileNameList}`)
            return {
                ret: `can't read as xlsx file: ${xlsxFileNameList}`,
                outputList: []
            } 
        }
        let xlsxFileName = xlsxFileNameList[1]
        let outputs: any[] = []
    
        // ?????????xlsx?????????????????????????????????
        let sheet_name = workbook.SheetNames[sheetIdx]
        if(isMoreSheetsExport && !!sheet_name && !sheet_name.includes('_info')) {
            if(sheetIdx === 0) {
                Util.show_error_dialog(`${xlsxFileName} ???????????????????????????????????????`)
                return {
                    ret: `${xlsxFileName} ???????????????????????????????????????`,
                    outputList: outputs
                }
            }
            return {
                ret: 'ok',
                outputList: outputs
            }
        }
        if(!sheet_name) {
            return {
                ret: 'ok',
                outputList: outputs
            }
        }
        let worksheet = workbook.Sheets[sheet_name]
        xlsxData.set_checked_xslx(sheet_name, workbook)
        
        let parseResult: praseStruct = Object.create(null)
        let ret = this.parse_xls(worksheet, parseResult, sheet_name)
        if (ret != "ok") {
            return {
                ret: ret,
                outputList: outputs
            }
        }
        //export now 
        let fileName = isMoreSheetsExport ? sheet_name : xlsxFileName
        let pluginRet = null
        for (let setting of settings) {
            if (setting.need) {
                let needColDict = this.get_need_col_list(parseResult, setting)
                let needColumns = needColDict['needColumns']
                let needColumnsData = needColDict['needColumnsData']
                if (needColumnsData.length > 0) {
                    parseResult['needColumnsData'] = needColumnsData
                    pluginRet = this.requirePlugin(parseResult, fileName, worksheet, needColumns, setting)
                    if (pluginRet && pluginRet["ret"] != xlsxData.RET.OK) {
                        return {
                            ret: pluginRet["ret"],
                            outputList: outputs
                        }
                    }
                    let parseRes = pluginRet ? pluginRet['parseResult'] : parseResult
                    needColDict = this.get_need_col_list(parseRes, setting)
                    needColumns = needColDict['needColumns']
                    needColumnsData = needColDict['needColumnsData']
                    this.exportSwitch(parseRes, needColumns, needColumnsData, fileName, setting, outputs)
                    if (!!pluginRet) {
                        // ???????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
                        let parseRes = pluginRet["parseResult"]
                        parseRes["extraDictName"] = pluginRet['extraDictName']
                        parseRes["extraDict"] = JSON.stringify(pluginRet['extraDict'], null, 4)
                        if(parseRes["extraDict"]) {
                            parseRes["extraDict"] = parseRes["extraDict"].replace(/\n/g, "\n    ")
                        }
                        fileName = pluginRet["fileName"] ? pluginRet["fileName"] : fileName
                        let needColDict = this.get_need_col_list(parseRes, setting)
                        needColumns = needColDict['needColumns']
                        needColumnsData = needColDict['needColumnsData']
                        if(parseRes['columns_lua'] && setting.text == 'lua') {
                            let needColDict = this.get_need_col_list(parseRes, setting)
                            this.exportSwitch(parseRes, needColDict['needColumns'], needColDict['needColumnsData'], fileName, setting, outputs)
                        } else {
                            this.exportSwitch(parseRes, needColumns, needColumnsData, fileName, setting, outputs)
                        }
                    }
    
                }
    
            }
        }
        // ???sheets??????????????????
        if(isMoreSheetsExport) {
            let retDict = this.export_xls(filePath, settings, sheetIdx + 1)
            if(retDict["ret"] != "ok") {
                ret = retDict["ret"]
            }
            outputs.push(...retDict['outputList'])
        }
        return {
            ret: ret,
            outputList: outputs
        }
    }
    
    // ????????????????????????
    public requirePlugin(parseResult: praseStruct, fileName: string, worksheet: any, needColumns: any, setting: any) {
        let PATH_NOW = path.resolve(__dirname, "../../plugin")
        let dirNameList = fs.readdirSync(PATH_NOW)
        let jsPluginList = []
        let appId = xlsxData.get_project_cfg_by_key(xlsxData.PROJECT_UNIQUE.APP_ID)
        let dirName = "appId_" + appId
        let isPluginForAll = false // ????????????????????????????????????
        if(!dirNameList.includes(dirName)) {
            dirName = 'appId_all'
            if(!dirNameList.includes(dirName)) {
                return null
            }
            isPluginForAll = true
        }
    
        let subDirPath = path.join(PATH_NOW, dirName)
        let pluginNameList = fs.readdirSync(subDirPath)
        let fileNum = pluginNameList.length
        for (let index = fileNum - 1; index >= 0; index--) {
            let pluginName = pluginNameList[index]
            if (pluginName.includes("_for_all")) {
                let pluginPath = path.join(subDirPath, pluginName)
                let jsPlugin = require(pluginPath)
                jsPluginList.push(jsPlugin)
                let pluginForAllRet = jsPlugin.startPlugin(parseResult, fileName, worksheet, needColumns, setting)
                if (pluginForAllRet["ret"] != xlsxData.RET.OK) {
                    Util.show_error_dialog(pluginForAllRet["ret"])
                    return pluginForAllRet
                }
                pluginNameList.splice(index, 1)
            } else if(isPluginForAll) {
                Util.show_error_dialog("???????????????????????????????????????????????? _for_all")
                return null
            }
            
        }
        fileNum = pluginNameList.length
        for (let idx = 0; idx < fileNum; idx++) {
            let pluginName = pluginNameList[idx]
            let pluginJSName = pluginName.split(".")[0]
            // ????????????????????????????????????????????????????????????????????????????????????
            if(!pluginName.includes("_for_all")) {
                if(!pluginName.includes(".js") || pluginJSName != fileName) {
                    continue
                }
            }
            let pluginPath = path.join(subDirPath, pluginName)
            let jsPlugin = require(pluginPath)
            jsPluginList.push(jsPlugin)
            let pluginRet = jsPlugin.startPlugin(parseResult, fileName, worksheet, needColumns, setting)
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
            if(pluginRet["ret"] === xlsxData.RET.OK) {
                return pluginRet
            } else {
                Util.show_error_dialog(pluginRet["ret"])
                return null
            }
        }
    }
    
    public exportSwitch(parseResult: praseStruct, needColumns: any, needColumnsData: any, fileName: string, setting: any, outputs: any) {
        let output = ""
        switch (setting.text) {
            case "lua":
                output = exportToFile.export_to_lua(parseResult, needColumns, needColumnsData, fileName, setting)
                break
            case "xml":
                output = exportToFile.export_to_xml(parseResult, needColumns, needColumnsData, fileName, setting)
                break
            case "csv":
                output = exportToFile.export_to_csv(parseResult, needColumns, needColumnsData, fileName, setting)
                break
            case "js":
                output = exportToFile.export_to_js(parseResult, needColumns, needColumnsData, fileName, setting)
                break
            case "ts":
                // if(needColumns.length == 0) {
                //     break
                // }
                // push_col_blank(parseResult)
                // let needColDict = get_need_col_list(parseResult, setting)
                // needColumns = needColDict['needColumns']
                // needColumnsData = needColDict['needColumnsData']
                output = exportToFile.export_to_ts(parseResult, needColumns, needColumnsData, fileName, setting)
                break
            case "c#":
                output = exportToFile.export_to_csharp(parseResult, needColumns, needColumnsData, fileName, setting)
                break
            case "gm":
                output = exportToFile.export_to_xml(parseResult, needColumns, needColumnsData, fileName+".gm", setting)
                break
        }
        if(!outputs.includes(output)) {
            outputs.push(output)
        }
    }
    
    public init_export(event: Electron.IpcMainEvent, filePath: string, jobId: number) {
        if(!xlsxData.is_right_version()) {
            if(event) {
                event.sender.send('s2c_export_xls', jobId, "error", "????????????????????????");
            }
            return
        }
        let settings = require("./settingService").getData()
    
        let found = filePath.match(/.*?([\w]+)\.xlsx$/)
        if(!found) {
            found = filePath.match(/.*?([\u4e00-\u9fa5]+)\.xlsx$/)
        }
        if (found == null) {
            if(event) {
                event.sender.send('s2c_export_xls', jobId, "error", "not a .xlsx file");
            }
            return
        }
    
        for (let setting of settings) {
            if (setting.need) {
                if (!fs.existsSync(setting.dir)) {
                    if(event) {
                        event.sender.send('s2c_export_xls', jobId, "error", "?????????????????????" + setting.dir);
                    }
                    console.error("?????????????????????")
                    return
                }
    
            }
        }
        let fileName = found[1]
    
        xlsxData.set_export_state_str("ok")
        xlsxData.set_cur_filePath(filePath)
        xlsxData.set_cur_xlsx_name(fileName)
        xlsxData.clear_errorMsgList()
        xlsxData.parse_project_cfg()
    
        let retDict = this.export_xls(filePath, settings)
        let ret = !!retDict ? retDict['ret'] : 'error'
        if (ret != "ok") {
            if(event) {
                event.sender.send('s2c_export_xls', jobId, "error", ret);
            }
            return
        }
        let outputList = retDict['outputList']
    
        if(event) {
            event.sender.send('s2c_export_xls', jobId, "ok", "", outputList);
        }
        
        return outputList
    }

}