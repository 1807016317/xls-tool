// 每个内容单元格的公式, 字符串列字符串的格式检查

const CHECKMODULE = require("../../app/server/check")
const util = require("../../app/server/util")


module.exports = {
    __repeatList: [], // 重复字段检查
    __xlsxFileName: "", // 表名
    __continuityDict: {},
    __parseResult: null,

    getCheckFunc(key) {
        switch (key) {
            case 'repeat':
                return this.checkOneColRepeat
            case 'continuity':
                return this.checkContinuity
            case 'array':
                return null
            case 'greater':
                return this.checkGreater
        }
    },

    // 格式化全局参数
    initGlobalVar(fileName, parseResult) {
        __repeatList = []
        __xlsxFileName = fileName
        __continuityDict = Object.create(null)
        __parseResult = parseResult
    },

    startPlugin(parseResult, fileName, worksheet) {
        let ret = '1'
        ret = this.checkRowData(parseResult)
        if(ret != '1') {
            return {
                ret: ret == '1' ? 1 : ret,
                parseResult: parseResult,
                fileName: fileName,
                extraDictName: "",
                extraDict: null
            }
        }
        let maxRow = Number(parseResult["maxRow"])
        let maxCol = parseResult["maxColumn"]
        let curCol = "A"
        let curRow = parseResult["columnContentRow"]
        let columnTypeRow = 2
        let validTagContent = 4// 代表此列是否有效的标记行
        let colNameRow = 6 // cellName
        let tagContent = worksheet[curCol + validTagContent]

        // 各种检查规则，C1 格内容是检查关键字
        let ruleCellC1 = worksheet['C1']
        let checkRuleC1 = ruleCellC1 ? ruleCellC1['v'].toString().trim() : ''
        this.initGlobalVar(fileName, parseResult)
        // D1 格特殊检查规则
        let ruleCellD1 = worksheet['D1']
        let checkRuleD1 = ruleCellD1 ? ruleCellD1['v'].toString().trim() : ''
        if(!!checkRuleD1) {
            ret = this.checkRelationCol(checkRuleD1)
        }

        while (true && ret == '1') {
            if(tagContent == undefined) {
                break
            }
            let tag = tagContent['v'].toString().trim()
            if (tag.toLowerCase() != 'exclude') {
                let cellType = worksheet[curCol + columnTypeRow.toString()]['v'].toString()
                let cellContent = worksheet[curCol + curRow]
                if (!!cellContent) {
                    // 公式检查
                    let formula = cellContent['f']
                    if (!!formula) {
                        ret = `${fileName} 的 ${curCol}${curRow}存在公式，错误码：id_1_1`
                        return ret
                    }
                    if(cellType == 'string') {
                        // 换行检查
                        let contentValueR = ""
                        if(cellContent['r']) {
                            contentValueR = cellContent['r'].toString().trim()
                        }
                        let contentValueV = ""
                        if(cellContent['v']) {
                            contentValueV = cellContent['v'].toString().trim()
                        }
                        let resV = contentValueV.search(/&/i)
                        let res = contentValueR.search(/&#10;/i)
                        if((resV > -1 || res > -1) && contentValueR[0] != '{' && contentValueR[contentValueR.length] != '}') {
                            ret = `${fileName}的${curCol}${curRow} 错误码：id_1_2（请查询文档）`
                            break
                        }
                    }
                    let cellName = worksheet[curCol + colNameRow]['v'].toString()
                    // 其他规则检查
                    if(!!checkRuleC1) {
                        ret = this.doCheckFunc(checkRuleC1, curRow - 7, cellName)
                        if(ret != '1') {
                            break
                        }
                    }
                }
            }
            if (curRow >= maxRow) {
                curRow = parseResult["columnContentRow"]
                if (curCol === maxCol) {
                    break
                }
                curCol = util.get_nextAZ(curCol)
                tagContent = worksheet[curCol + validTagContent]
                continue
            }
            curRow++
        }
        return {
            ret: ret == '1' ? 1 : ret,
            parseResult: parseResult,
            fileName: fileName,
            extraDictName: "",
            extraDict: null
        }
    },

    doCheckFunc(ruleContent, curRow, cellName) {
        let ruleStrList = ruleContent.split(/\|/g)
        ruleStrList = ruleStrList ? ruleStrList : [ruleContent]
        let ruleLen = ruleStrList.length
        let ret = '1'
        for (let index = 0; index < ruleLen; index++) {
            const ruleStr = ruleStrList[index]
            let resValueList = ruleStr.match(/\（\w.+\）|\(\w.+\)/g)
            if(!resValueList || resValueList.length == 0) {
                continue
            }
            let ruleGroup = ruleStr.replace(resValueList[0], '')
            colName = resValueList[0].slice(1, resValueList[0].length - 1)
            if(!!this.getCheckFunc(ruleGroup)) {
                let func = this.getCheckFunc(ruleGroup)
                ret = func && func(colName, cellName, curRow)
                if(ret != '1') {
                    break
                }
            }
        }
        return ret
    },

    // 检查单列是否有值重复
    checkOneColRepeat(colName, cellName, curRow) {
        if(colName != cellName) {
            return '1'
        }
        let rowList = this.__parseResult['rows']
        let value = rowList[curRow][cellName]
        if(__repeatList.includes(value)) {
            return `${__xlsxFileName} 的 ${cellName} 列，有值 ${value} 重复`
        }
        __repeatList.push(value)
        return '1'
    },

    // 检查连续字段, 一定是数字
    checkContinuity(colName, cellName, curRow) {
        let colNameList = colName.split(/,|，/)
        if(!colNameList || colNameList.length != 2) {
            return `${__xlsxFileName} 的 continuity 规则字段配置错误`
        }
        let subCol = colNameList[1]
        if (subCol == cellName) {
            let mainCol = colNameList[0]
            let rowList = this.__parseResult['rows']
            let mainVal = rowList[curRow][mainCol]
            let mainKey = mainCol + mainVal
            let subVal = Number(rowList[curRow][subCol])
            if (!this.__continuityDict[mainKey]) {
                this.__continuityDict[mainKey] = []
            } else {
                let lastVal = this.__continuityDict[mainKey].pop()
                if((lastVal + 1) != subVal) {
                    return `${__xlsxFileName} 的 ${cellName} 列的 ${curRow + 7} 行值不连续`
                }
            }
            this.__continuityDict[mainKey].push(subVal)
        }
        return '1'
    },

    // 数组检查, 策划不知道这个规则什么场景用了, 先不需要
    checkArray() {
        return '1'
    },

    // 检查大小
    checkGreater(colName, cellName, curRow) {
        let colNameList = colName.split(/,|，/)
        if(!colNameList || colNameList.length != 2) {
            return `${__xlsxFileName} 的 greater 规则字段配置错误`
        }
        let smallCol = colNameList[1]
        if(cellName != smallCol) {
            return '1'
        }
        let bigCol = colNameList[0]
        let rowList = this.__parseResult['rows']
        let bigVal = Number(rowList[curRow][bigCol])
        let smallVal = Number(rowList[curRow][smallCol])
        if(!bigVal && !smallVal) {
            return '1'
        }
        if(bigVal <= smallVal) {
            return `${__xlsxFileName} 的 ${cellName} 的 ${curRow + 7} 大小不对`
        }
        return '1'
    },

    // D1 格规则检查，检查其他表的关联字段
    checkRelationCol(ruleContent) {
        ruleContent = ruleContent.replace(/[;；]/g, '\|')
        ruleContent = ruleContent.replace(/[\（]/g, '\(')
        ruleContent = ruleContent.replace(/[\）]/g, '\)')
        if(!ruleContent.includes('(')) {
            return __xlsxFileName + "错误码：id_1_11"
        }
        let list = ruleContent.split('|')
        let len = list.length
        let ret = '1'
        for (let i = 0; i < len; i++) {
            let ruleStr = list[i]
            let colList = ruleStr.match(/(?<=\()(.+?)(?=\))/g)
            if (colList.length < 2) {
                ret = __xlsxFileName + "错误码：id_1_9"
                break
            }
            let curTableColList = colList[0].split(',')
            let relationTableColList = colList[1].split(',')
            if (curTableColList.length != relationTableColList.length) {
                ret = __xlsxFileName + "错误码：id_1_10"
                break
            }
            let relationTabName = ruleStr.replace(colList[0], "")
            relationTabName = relationTabName.replace(colList[1], "")
            relationTabName = relationTabName.replace(/\(\)/g, "")
            ret = this.checkOneRelationCol(relationTabName, curTableColList, relationTableColList)
            if(ret != '1') {
                break
            }
        }
        return ret
    },

    checkOneRelationCol(relationTabName, curTableColList, relationTableColList) {
        let curMainCol = curTableColList[0]
        let relaMainCol = relationTableColList[0]
        let [workSheet, columnNameList, maxRow] = CHECKMODULE.get_col_name_list(relationTabName)
        let idxMain = columnNameList.indexOf(relaMainCol)
        let mainColChar = util.get_AZ_by_idx(idxMain)
        let relaColLen = relationTableColList.length
        let dict_relation = {}
        for (let j = 7; j <= maxRow; j++) {
            let relaMainVal = workSheet[mainColChar + j]
            relaMainVal = relaMainVal ? relaMainVal['v'] : 0
            if(!relaMainVal) {
                continue
            }
            if(!dict_relation[relaMainVal]) {
                dict_relation[relaMainVal] = [relaMainVal]
            }
            for (let i = 1; i < relaColLen; i++) {
                const relaCol = relationTableColList[i]
                let idx = columnNameList.indexOf(relaCol)
                let colChar = util.get_AZ_by_idx(idx)
                let relaVal = workSheet[colChar + j]
                relaVal = relaVal ? relaVal['v'] : 0
                dict_relation[relaMainVal].push(relaVal)
            }
        }

        let rowList = __parseResult['rows']
        let rowNum = rowList.length
        for (let k = 0; k < rowNum; k++) {
            let rowData = rowList[k]
            let curMainVal = rowData[curMainCol]
            if(!curMainVal || !Number(curMainVal)) {
                continue
            }
            if(dict_relation[curMainVal]) {
                for (let t = 1; t < relaColLen; t++) {
                    let val = rowData[curTableColList[t]]
                    if(val && dict_relation[curMainVal][t] != val) {
                        return `${__xlsxFileName}的${curTableColList[t]}列的[${val}]在关联表不存在`
                    }
                }
            } else {
                return `${__xlsxFileName}的${curMainCol}列的[${curMainVal}]在关联表不存在`
            }
        }
        return 1
    },

    checkRowData(parseResult) {
        let rowList = parseResult['rows']
        let len = rowList.length
        for (let i = 0; i < len; i++) {
            const rowData = rowList[i]
            let checkInfo = CHECKMODULE.check_existent_in_enum(rowData, parseResult["enums"])
            if(checkInfo.notExistent) {
                return `${xlsxFileName} id：${checkInfo.rowId} 列：${checkInfo.checkColName} 的值超出枚举范围`
            }
        }
        return '1'
    }
}