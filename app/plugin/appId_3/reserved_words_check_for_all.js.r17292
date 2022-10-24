// lua 保留字检查


module.exports = {
    // lua 保留字数组
    __reserved_word_list: ['and', 'or', 'not', 'function', 'table', 'nil', 'for', 'while', 'do', 'break', 'in', 'return', 'until', 'goto', 'repeat', 'true', 'false', 'if', 'then', 'else', 'elseif', 'local'],

    startPlugin(parseResult, fileName, worksheet, needColumns) {
        let columnList = parseResult['columns']
        if(!columnList) {
            return {
                ret: 1,
                parseResult: parseResult,
                fileName: fileName,
                extraDictName: "",
                extraDict: null
            }
        }
        // columns, columnsInfo, indexOfColumns, needColumnsData, rows
        let ret = 1
        let len = columnList.length
        for (let index = 0; index < len; index++) {
            const columnName = columnList[index]
            if(this.__reserved_word_list.includes(columnName)) {
                columnList[index] = columnName + "_lua"
                //ret = `列名中含有 lua 的保留字${columnName}`
                this.reserved_word_change_col_name(parseResult, worksheet, columnName)
            }
        }

        for(let ii = 0; ii<needColumns.length; ii++) {
            let tStrName = needColumns[ii]
            if(this.__reserved_word_list.includes(tStrName)) {
                needColumns[ii] = tStrName + "_lua"
            }
        }

        return {
            ret: ret,
            parseResult: parseResult,
            fileName: fileName,
            extraDictName: "",
            extraDict: null
        }
    },

    // 检查到有保留字，就自动把那个列名加一个 _lua 后缀
    reserved_word_change_col_name(parseResult, worksheet, colName) {
        let columnsInfoDict = parseResult['columnsInfo']
        let newName = colName + '_lua'
        for (const name in columnsInfoDict) {
            if(name == colName) {
                columnsInfoDict[newName] = columnsInfoDict[name]
                delete columnsInfoDict[name]
                break
            }
        }
        parseResult['columnsInfo'] = columnsInfoDict
        let needColumnsDataList = parseResult['needColumnsData']
        let len = needColumnsDataList.length
        for (let index = 0; index < len; index++) {
            let needColumnsData = needColumnsDataList[index]
            if(needColumnsData.column && needColumnsData.column == colName) {
                needColumnsData.column = newName
                break
            }
        }
        parseResult['needColumnsData'] = needColumnsDataList
        let subClassDict = parseResult['sub_classes']
        if(subClassDict) {
            for (const key in subClassDict) {
                if(key == colName) {
                    subClassDict[newName] = subClassDict[key]
                    delete subClassDict[key]
                }
            }
        }
        parseResult['sub_classes'] = subClassDict
        let rowList = parseResult['rows']
        let rowNum = rowList.length
        for (let index = 0; index < rowNum; index++) {
            let rowData = rowList[index]
            if(rowData[colName]) {
                rowData[newName] = rowData[colName]
                delete rowData[colName]
            }
        }
        parseResult['rows'] = rowList
    }
}