import Global from "./global";

const {ccclass, property} = cc._decorator;

@ccclass
export default class LayerBase extends cc.Component {

    private static __MODEL_TOUCH_NAME__ = "__MODEL_TOUCH_NAME__"

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}
    public static show(parent: cc.Node = null, showCall: (layer: LayerBase, node: cc.Node)=>void = null) {
    }

    public static doShow(path: string, parent: cc.Node = null, showCall: (layer: LayerBase, node: cc.Node)=>void = null) {
        cc.resources.load(path, (error: Error, assets: cc.Asset)=>{
            if(error) {
                cc.error(error)
                return
            }
            let layerNode = cc.instantiate(assets as cc.Prefab)
            if(layerNode) {
                if(parent) {
                    layerNode.parent = parent
                } else {
                    let parentNode = Global.instance.winParent
                    layerNode.parent = parentNode
                }
                let layer = layerNode.getComponent(LayerBase)
                if(layer) {
                    layer._initBlockClickedOn()
                    layer.onInit()
                }
            }
        })
    }

    protected _initBlockClickedOn() {
        if(!this.node) {
            return
        }
        let blockClickNode = this.node.getChildByName(LayerBase.__MODEL_TOUCH_NAME__)
        if(!blockClickNode) {
            blockClickNode = new cc.Node(LayerBase.__MODEL_TOUCH_NAME__)
            blockClickNode.parent = this.node
            let winSize = cc.winSize
            blockClickNode.width = winSize.width
            blockClickNode.height = winSize.height
            blockClickNode.addComponent(cc.BlockInputEvents)
            blockClickNode.zIndex = -999
        }
    }

    protected onInit() {

    }

    start () {

    }

    public close() {
        this.node.destroy()
        this.destroy()
    }

    // update (dt) {}
}
