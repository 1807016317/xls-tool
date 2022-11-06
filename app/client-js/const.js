"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    N_CHECK_CONST: {
        RES_TYPE: 'resources_type',
        RES_VALUE: 'resources_value',
        DEFAULT_TYPE: "type",
        DEFAULT_VALUE: "value",
    },
    /** 相邻的两个字段配置的为 resources_type 与 resources_value 对应表的固定查询字段*/
    N_CHECK_TABLE_KEY: 'id',
    N_CHECK_TYPE_ID: {
        ITEM: 3,
        EQUIPMENT: 5,
        KNIGHT: 6,
        THRONE: 7,
        FRAGMENT: 8,
        PRACTICE_EVENT: 17,
        FASHION: 18,
        DROP: 10000,
    },
    N_CHECK_VALUE_TABLE: {
        3: "item_info",
        5: "equipment_info",
        6: "knight_info",
        7: "throne_info",
        8: "fragment_info",
        17: "practice_event_info",
        18: "fashion_info",
        10000: "drop_info",
    },
    N_ITEM_CHECK_VALUE_TABLE: {
        1: { 4: 'pill_make_info' },
        2: { 1: 'equipment_make_info' },
        3: { 1: "buff_info" },
        5: { 1: "pill_make_info" },
        7: { 1: "pill_info" },
        8: { 1: "world_weather_info" },
        10: { 1: "world_treasure map_info" },
        11: { 1: "world_chapter_info", 2: 'world_chapter_random_info' },
        12: { 1: "world_chapter_info", 2: 'world_chapter_random_info' },
        14: { 1: "faction_info" },
        16: { 1: "skill_book_info" },
        17: { 1: "drop_info" },
        18: { 1: "item_box_info" },
        19: { 1: "practice_buff_info" },
        20: { 2: "call_random_info" },
        29: { 2: "drop_info", 3: "pill_make_info" },
    },
    N_CHECK_RELATION_TYPE: {
        DEFAULT: 0,
        RESOURCE: 1,
        OTHER: 2, // 暂不使用
    },
    TYPE_CONST: {
        INT: 0,
        STRING: 1,
        OTHER: 2,
    },
};
//# sourceMappingURL=const.js.map