/*
world_dungeons_monster_info {
  maxRow: '16',
  maxColumn: 'Y',
  enums: [ { name: 'ENUM_MONSTER_TYPE', units: [Array] } ],
  columns: [
    'id',           'group',
    'order',        'monster_team',
    'monster_type', 'add_type1',
    'add_value1',   'add_size1',
    'add_type2',    'add_value2',
    'add_size2',    'add_pro',
    'auto_rank',    'award_type1',
    'award_value1', 'award_size1',
    'award_type2',  'award_value2',
    'award_size2',  'award_type3',
    'award_value3', 'award_size3',
    'award_type4',  'award_value4',
    'award_size4'
  ],
  columnsInfo: {
    id: { type: 'int', desc: '系统id', export: 'both' },
    group: { type: 'int', desc: '组', export: 'both' },
    order: { type: 'int', desc: '战斗顺序', export: 'both' },
    monster_team: { type: 'int', desc: '怪物ID', export: 'both' },
    monster_type: { type: 'int', desc: '怪物类型', export: 'client' },
    add_type1: { type: 'int', desc: '神游提升组1类型', export: 'both' },
    add_value1: { type: 'int', desc: '神游提升组1参数', export: 'both' },
    add_size1: { type: 'int', desc: '神游提升组1数值', export: 'both' },
    add_type2: { type: 'int', desc: '神游提升组2类型', export: 'both' },
    add_value2: { type: 'int', desc: '神游提升组2参数', export: 'both' },
    add_size2: { type: 'int', desc: '神游提升组2数值', export: 'both' },
    add_pro: { type: 'int', desc: '是否提升概率奖励', export: 'both' },
    auto_rank: { type: 'int', desc: '自动挑战战力', export: 'client' },
    award_type1: { type: 'int', desc: '奖励1', export: 'both' },
    award_value1: { type: 'int', desc: '奖励1', export: 'both' },
    award_size1: { type: 'int', desc: '奖励1', export: 'both' },
    award_type2: { type: 'int', desc: '奖励2', export: 'both' },
    award_value2: { type: 'int', desc: '奖励2', export: 'both' },
    award_size2: { type: 'int', desc: '奖励2', export: 'both' },
    award_type3: { type: 'int', desc: '奖励3', export: 'both' },
    award_value3: { type: 'int', desc: '奖励3', export: 'both' },
    award_size3: { type: 'int', desc: '奖励3', export: 'both' },
    award_type4: { type: 'int', desc: '奖励4', export: 'both' },
    award_value4: { type: 'int', desc: '奖励4', export: 'both' },
    award_size4: { type: 'int', desc: '奖励4', export: 'both' }
  },
  rows: [
    {
      id: '1',
      group: '1',
      order: '1',
      monster_team: '1001001',
      monster_type: '1',
      add_type1: '2',
      add_value1: '0',
      add_size1: '1',
      add_type2: '1',
      add_value2: '0',
      add_size2: '1',
      add_pro: '0',
      auto_rank: '0',
      award_type1: '2',
      award_value1: '0',
      award_size1: '100',
      award_type2: '1',
      award_value2: '0',
      award_size2: '100',
      award_type3: '0',
      award_value3: '0',
      award_size3: '0',
      award_type4: '0',
      award_value4: '0',
      award_size4: '0'
    }
  ],
  indexOfColumns: [ 'id' ],
  typeAndIndex: [ 'id: number' ],
  sub_classes: { group: [ [Object], [Object] ] },
  indexType: 'int',
  indexData: {
    '1': 0,
    '2': 1,
    '3': 2,
    '4': 3,
    '5': 4,
    '6': 5,
    '7': 6,
    '8': 7,
    '9': 8,
    '10': 9
  },
  key_counts: [
    { name: 'add_type_count', value: 2 },
    { name: 'award_type_count', value: 4 }
  ]
}
*/
module.exports = {
    /* 
    * 启动函数
    * @parseResult 解析好的数据信息
    * @fileName 表的文件名
    * return 
    ret 返回值 1 代表执行成功，其他返回值代表错误
    parseResult 将处理过的数据重新返回用于导出
    */
    startPlugin(parseResult, fileName) {
        // console.log(fileName, parseResult)
        let retDict = {
          maxRow: '16',
          maxColumn: 'Q',
          enums: [],
          columns: [
            'group','order','award_type1','award_value1','award_size1','award_type2','award_value2','award_size2'
            ,'award_type3','award_value3','award_size3','award_type4','award_value4','award_size4','award_type5','award_value5','award_size5'
          ],
          columnsInfo: {
            group: { type: 'int', desc: '组', export: 'both' },
            order: { type: 'int', desc: '战斗顺序', export: 'both' },
            award_type1: { type: 'int', desc: '奖励1', export: 'both' },
            award_value1: { type: 'int', desc: '奖励1', export: 'both' },
            award_size1: { type: 'int', desc: '奖励1', export: 'both' },
            award_type2: { type: 'int', desc: '奖励2', export: 'both' },
            award_value2: { type: 'int', desc: '奖励2', export: 'both' },
            award_size2: { type: 'int', desc: '奖励2', export: 'both' },
            award_type3: { type: 'int', desc: '奖励3', export: 'both' },
            award_value3: { type: 'int', desc: '奖励3', export: 'both' },
            award_size3: { type: 'int', desc: '奖励3', export: 'both' },
            award_type4: { type: 'int', desc: '奖励4', export: 'both' },
            award_value4: { type: 'int', desc: '奖励4', export: 'both' },
            award_size4: { type: 'int', desc: '奖励4', export: 'both' },
            award_type5: { type: 'int', desc: '奖励4', export: 'both' },
            award_value5: { type: 'int', desc: '奖励4', export: 'both' },
            award_size5: { type: 'int', desc: '奖励4', export: 'both' }
          },
          rows: [
            // {
            //   group: '1',
            //   order: '1',
            //   award_type1: '2',
            //   award_value1: '0',
            //   award_size1: '100',
            //   award_type2: '1',
            //   award_value2: '0',
            //   award_size2: '100',
            //   award_type3: '0',
            //   award_value3: '0',
            //   award_size3: '0',
            //   award_type4: '0',
            //   award_value4: '0',
            //   award_size4: '0'
            //   award_type5: '0',
            //   award_value5: '0',
            //   award_size5: '0'
            // }
          ],
          indexOfColumns: [ 'group', 'order' ],
          typeAndIndex: [ 'group: number',  'order: number'],
          sub_classes: {},
          indexType: 'string',
          indexData: {
            // '1': 0,
          },
          key_counts: [
            { name: 'award_type_count', value: 5 }
          ]
        }
        //
        let rows = retDict.rows
        let indexData = retDict.indexData
        // 初始化数据,先组装成字典
        let infoDict = {}
        let groupMaxOrderDict = {}
        for (let row of parseResult.rows) {
            let group = row.group
            let order = parseInt(row.order)
            if (!infoDict[group]) {
                infoDict[group] = {}
                groupMaxOrderDict[group] = 0
            }
            infoDict[group][order] = row
            if (order > groupMaxOrderDict[group]) {
                groupMaxOrderDict[group] = order
            }
        }
        let infoList = []
        let mergeAwards = function(list, info) {
            for (let i = 1, len = 2; i <= 2; i++) {
                let type = parseInt(info["add_type" + i])
                let value = parseInt(info["add_value" + i])
                let size = parseInt(info["add_size" + i])
                if (type) {
                    let add = false
                    for (let item of list) {
                        if (item.type == type && item.value == value) {
                            item.size += size
                            add = true
                            break
                        }
                    }
                    if (!add) {
                        list.push({
                            type: type,
                            value: value,
                            size: size
                        })
                    }
                }
            }
            let result = {
              group: '0',
              order: '0',
              award_type1: '0',
              award_value1: '0',
              award_size1: '0',
              award_type2: '0',
              award_value2: '0',
              award_size2: '0',
              award_type3: '0',
              award_value3: '0',
              award_size3: '0',
              award_type4: '0',
              award_value4: '0',
              award_size4: '0',
              award_type5: '0',
              award_value5: '0',
              award_size5: '0'
            }
            for (let i = 0, len = list.length; i<len; i ++) {
                let item = list[i]
                let index = i + 1
                result["award_type" + index] = item.type + ""
                result["award_value" + index] = item.value + ""
                result["award_size" + index] = item.size + ""
            }
            return result
        }
        for (let group in groupMaxOrderDict) {
            let maxOrder = groupMaxOrderDict[group]
            let awardList = [] // {type:xxx, value: size}
            for (let i = 1; i <= maxOrder; i++) {
                let xxx = mergeAwards(awardList, infoDict[group][i])
                xxx.group = group
                xxx.order = i + ""
                infoList.push(xxx)
            }
        }
        rows.push(...infoList)
        for (let i = 0, len = infoList.length; i< len ;i ++) {
            let info = infoList[i]
            indexData[info.group + "_" + info.order] = i
        }
        retDict.maxRow = infoList.length
        console.log(retDict)
        return {
            ret: 1, // 返回值 1 代表执行成功，其他返回值代表错误
            parseResult: retDict, // 将处理过的数据重新返回用于导出
            fileName: "world_dungeons_fixed"
        }
    }
}