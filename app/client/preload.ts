/*
 * @Author: 惊仙 
 * @Date: 2022-10-21 10:24:55 
 * @Last Modified by: 惊仙
 * @Last Modified time: 2022-10-23 20:01:45
 * 渲染进程与主进程的沟通文件
 */
import {ipcRenderer, contextBridge, shell} from 'electron'
import {ElectronChannel, electronApi} from "./ipc"

const api: IElectionApi = {
    openDialog: () => {
        return ipcRenderer.invoke(ElectronChannel.openDialog)
    },
    startDrag: (fileName) => {
        ipcRenderer.invoke(ElectronChannel.onDragStart, fileName)
    }
}

export class preDefine {
    declare JX_DEBUG: boolean
    declare JX_UMI_DEV: boolean
    declare JX_NODE_DEV: boolean
    declare JX_PROD: boolean
}

contextBridge.exposeInMainWorld(electronApi, api)
