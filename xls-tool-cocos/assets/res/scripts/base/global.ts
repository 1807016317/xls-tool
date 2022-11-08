export default class Global {
    private static _instance: Global = null
    public static get instance(): Global {
        if(!Global._instance) {
            Global._instance = new Global()
        }
        return Global._instance
    }

    private _electron = null
    public get electron(): any {
        if(!this._electron) {
            this._electron = window['electron']
        }
        return this._electron
    }

    private _winParent: cc.Node = null
    public get winParent(): cc.Node {
        if(!this._winParent) {
            let scene = cc.director.getScene()
            let canvasNode = scene.getChildByName("Canvas")
            this._winParent = canvasNode.getChildByName("winParent")
        }
        return this._winParent
    }

    private _nodeFs: any = null
    public get nodeFs(): any {
        if(!this._nodeFs) {
            this._nodeFs = window['fs']
        }
        return this._nodeFs
    }
}

/**
   "build": {  // 这里是electron-builder的配置
        "productName":"xxxx",//项目名 这也是生成的exe文件的前缀名
        "appId": "com.xxx.xxxxx",//包名  
        "copyright":"xxxx",//版权  信息
        "directories": { // 输出文件夹
          "output": "build"
        }, 
        // windows相关的配置
        "win": {  
          "icon": "xxx/icon.ico"//图标路径 
        }  
      }
 */