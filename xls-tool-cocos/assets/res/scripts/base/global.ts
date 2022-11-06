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