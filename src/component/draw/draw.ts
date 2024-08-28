import { Component } from "../core/decorators";
import BaseWidget from "../earth/base-widget";
import Template from "./draw.html?raw";
import "./draw.scss";
import { ScreenSpaceEventType } from "cesium";

@Component({
    tagName: "czm-draw",
    className: "czm-draw",
    template: Template,
})
export default class Draw extends BaseWidget {
    constructor() {
        super();
    }
    async onInit(): Promise<void> {
        // 禁止双击事件
        this.viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
        console.log(this.markerManager);
        console.log(this.graphicManager);
        let currentId = ''
        document.addEventListener("addEvent", function (e: any) {
            console.log('开始绘制', e);
            currentId = e.detail.mid
        })
        window.addEventListener("marker-add", (e: any) => {
            console.log('marker-add', e);
            this.sceneTree.root.addLayer(this.markerManager.get(e.detail.id))
        })
        window.addEventListener("marker-edit", (e) => {
            console.log('marker-edit', e);
            
        })
        document.addEventListener("stopEdit", () => {
            console.log('结束绘制', this.graphicManager.get(currentId));
            const graphic = this.graphicManager.get(currentId)
            this.sceneTree.root.addLayer(graphic)
            // this.graphicManager.get(currentId)
        })
    }
    draw(type: string) {
        switch (type) {
            case 'point':
                this.markerManager.pick('marker')
                break;
            case 'label':
                this.markerManager.pick('label')
                break;
            case 'polyline':
                this.graphicManager.createPolyline()
                break;
            case 'polygon':
                this.graphicManager.createPolygon()
                break;
            default:
                break;
        }
    }

    polyline() {

    }

    toJSON() {
        // let res: any = []
        // this.graphicManager.manager.forEach((item: any) => {
        //     console.log(item);
        //     res.push(this.graphicManager.toJSON(item.mid))
        // })
        // console.log(res);
        this.res = this.graphicManager.toJSON()
        console.log(this.res);
    }

    clear() {
        this.graphicManager.removeAll()
    }

    test() {
        this.res.forEach((item: any) => {
            this.graphicManager.jsonToGraphic({
                ...item,
                ...item.style
            })
        })
    }
}