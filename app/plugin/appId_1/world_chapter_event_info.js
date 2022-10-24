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
      let result = {}
      for (let row of parseResult.rows) {
          let chapter_id = parseInt(row.chapter_id)
          let type = parseInt(row.type)
          let group = parseInt(row.value1)
          let id = parseInt(row.id)
          if (type === 29 || type === 32) {
            // OF_CHAIN_BUTTON  OF_CHAIN_SWITCH
            if (!result[chapter_id]) {
              result[chapter_id] = {}
            }
            if (!result[chapter_id][type]) {
              result[chapter_id][type] = {}
            }
            if (!result[chapter_id][type][group]) {
              result[chapter_id][type][group] = []
            }
            if (result[chapter_id][type][group].indexOf(id) === -1) {
              result[chapter_id][type][group].push(id)
            }
          }
      }
      let name = "chapter_type_group"
      return {
          ret: 1, // 返回值 1 代表执行成功，其他返回值代表错误
          parseResult: parseResult, // 将处理过的数据重新返回用于导出
          fileName: "world_chapter_event_info",
          extraDictName: name,
          extraDict: result
      }
    }
}