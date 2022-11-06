export class JX {
    public static DEBUG: boolean = false
    public static UMI_DEV: boolean = false
    public static NODE_DEV: boolean = false
    public static PROD: boolean = false
}

export interface praseEnumStruct {
    name: string,
    valList: string[], 
}

export interface columnsInfoStruct {
    type: string,
    desc: string,
    export: string,
}

export interface commonKV { 
    key: string
    value: string[]
}

export interface praseStruct {
    maxRow: number,
    maxColumn: string,
    columnContentRow: number,
    enums: praseEnumStruct[],
    columns: string[],
    columnsInfo: {[name: string]: columnsInfoStruct},
    indexOfColumns: string[],
    typeAndIndex: string[],
    keyTypeList: string[],
    rows: {[colName: string]: string}[],
    sub_classes: {[key: string]: commonKV[]},
    indexType: string,
    indexData: {[key: string]: number},
    key_counts: {name: string, value: number}[],
}

// 配置表输出设置定义
export interface exportPathInfo {
    id: number | string, // 主键
    dir: string, // 导出路径
    reg: string, // 检查正则 Server|Both|Xml|Client
    text: string, // 语言
    need: boolean, // 是否需要导出
}