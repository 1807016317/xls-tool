const util = require("../../app/server/util")

// 处理SSR的第六列的批注使用判断
module.exports = {
    startPlugin(parseResult, fileName, worksheet) {
        let colWord = 'A'
        let maxColumn = parseResult["maxColumn"]
        let columnTypeRow = 2 // 数据类型
        let maxCommmentList = []
        while (true) {
            let cellType = worksheet[colWord + columnTypeRow.toString()]
            let typeCommentList = this.get_cell_c(cellType) // 获取var数据类型行的批注
            if (typeCommentList) {
                maxCommmentList.push(...typeCommentList)
            }
            if (colWord == maxColumn) {
                break
            }
            colWord = util.get_nextAZ(colWord)
        }
        
        let colMaxDict = Object.create(null)
        
        let keyNum = maxCommmentList.length
        let rowList = parseResult["rows"]
        let rowNum = rowList.length
        let relationColMaxDict = Object.create(null)
        for (let index = 0; index < keyNum; index++) {
            let keyColInfo = maxCommmentList[index]
            let colName = keyColInfo['colName']
            let maxName = keyColInfo['name']
            let maxColName = maxName.replace(/_max/, "")
            for (let j = 0; j < rowNum; j++) {
                const rowData = rowList[j]
                let rowColVal = Number(rowData[colName])
                if (maxName.includes(colName)) {
                    if (typeof (colMaxDict[maxName]) != "number"
                        || (rowColVal > colMaxDict[maxName])) {
                        colMaxDict[maxName] = rowColVal
                    }
                } else {
                    if(!relationColMaxDict[maxName]) {
                        relationColMaxDict[maxName] = {}
                    }
                    let maxNum = Number(rowData[maxColName])
                    if(!relationColMaxDict[maxName][rowColVal] ||
                        (maxNum > relationColMaxDict[maxName][rowColVal])) {
                            relationColMaxDict[maxName][rowColVal] = maxNum
                    }
                }
            }
            if (maxName.includes(colName)) {
                if (!parseResult["key_counts"]) {
                    parseResult["key_counts"] = []
                }
                parseResult["key_counts"].push({
                    name: keyColInfo['name'],
                    value: colMaxDict[maxName]
                })
            } else {
                if (!parseResult["col_max_dict"]) {
                    parseResult["col_max_dict"] = []
                }
                parseResult["col_max_dict"].push({
                    name: `${maxColName}_${colName}_max`,
                    valueDict: relationColMaxDict[maxName]
                })
            }
        }

        return {
            ret: 1,
            parseResult: parseResult,
            fileName: fileName,
            extraDictName: "",
            extraDict: null
        }
    },

    /**
     * 获取单元格解析内容中的批注，h
     * @param {*} cell 
     */
    get_cell_c(cell) {
        if (cell == null) {
            return null
        }
        if (cell.c && cell.c.length > 0 && cell.c[0].h) {
            let comment = cell.c[0].h.toString().trim() //批注
            comment = comment.replace(/<br\/>/g, "\n")
            comment = comment.replace(/<.*?>/g, "")
            //wps
            comment = comment.replace(/&#10;/g, "\n")
            comment = comment.replace('作者:\n', '')
            let splitArr = comment.split("\n")
            let enumLen = splitArr.length
            if(enumLen > 2) {
                return null
            }
            let retList = []
            let match1 = /([\d_\w]+)(.*)/  //    1=a 数字=字母
            let match2 = /^([\d_\w]+).*?[=:]+.*?([\d_\w]+)(.*)/  //    a=1 字母=数字

            for (let i = 0; i < enumLen; i++) {
                let str = splitArr[i]
                let results = str.match(match1)
                if (results) {
                    results[2] = results[2].toLowerCase()
                    results[2] = results[2].replace(/:/, "")
                    if (results[3]) {
                        results[3] = results[3].replace(/[,;#]/, "")
                        str = results[1] + " --" + results[3]
                    } else {
                        str = results[1]
                    }
                    if(!str.includes("_max"||"_MAX")) {
                        continue
                    }
                    str = str.toLowerCase()
                    retList.push({
                        name: str,
                        colName: results[2] ? results[2].replace(/_max/, "") : str.replace(/_max/, ""),
                    })
                }
            }
            return retList
        }
        return null
    },
}