// 配置表输出设置定义
export interface exportPathInfo {
    id: number | string, // 主键
    dir?: string, // 导出路径
    reg?: string, // 检查正则 Server|Both|Xml|Client
    text?: string, // 语言
    need?: boolean, // 是否需要导出
}

export interface exportPathConfigInfo {
    setKey: string
    setName: string
    setDesc: string
    settingList: exportPathInfo[]
}


// 解析的拖入配置表结构
export interface inputJobInfo {
    filename: string,
    path: string,
    status: string,
    jobId: number,
    outputs: [],
    error: string,
}

export interface exportPathSetPopupEnter {
    index: number,
    setKey: string,
}
