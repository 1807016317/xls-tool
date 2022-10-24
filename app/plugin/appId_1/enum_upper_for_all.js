// 处理 ts 格式表的 变量枚举

const xlsxData = require("../../app/server/xlsxData")

module.exports = {
    startPlugin(parseResult, fileName, worksheet) {
        //let [enumStrDict, enumNumDict] = this.ts_enum_upper(fileName, parseResult['needColumnsData'])
        //parseResult['enumStrDict'] = enumStrDict
        //parseResult['enumNumDict'] = enumNumDict
        return {
            ret: 1,
            parseResult: parseResult,
            fileName: fileName,
            extraDictName: "",
            extraDict: null
        }
    },

    ts_enum_upper(filename, needColumnsData) {
        /* 这里有个问题没处理，无法判断是否是最上层的xlsx目录，
        当这里是配置表主目录时，配置表的名字中有和主目录文件夹的名字相同，也会把那一段删掉
        */
        let filePath = xlsxData.get_cur_filePath()
        let dirNameList = filePath.split('\\')
        let lastDir = dirNameList[dirNameList.length - 2]
        if(filename.includes(lastDir)) {
            filename = filename.replace(`_${lastDir}`, '')
        }
        let enumStrName = "ENUM_STRING_" + filename
        let enumNumName = "ENUM_NUMER_" + filename
        let enumStrList = []
        let enumNumList = []
        let idx = 0
        for (const item of needColumnsData) {
            let upperName = item.column.toUpperCase()
            if(item.type === 'int') {
                enumNumList[idx] = upperName
            } else if(item.type === 'string') {
                enumStrList[idx] = upperName
            }
            idx++
        }
        return [{
            name: enumStrName.toUpperCase(),
            list: enumStrList,
        },{
            name: enumNumName.toUpperCase(),
            list: enumNumList,
        }]
    }
}

