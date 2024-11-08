import { Component } from "../core/decorators";
import BaseWidget from "../earth/base-widget";
import Template from "./paint-board.html?raw";
import "./paint-board.scss"
import * as fa from "fabric";
const fabric: any = (fa as any).fabric;


@Component({
    tagName: "czm-paint-board",
    className: "czm-paint-board",
    template: Template,
})
export default class PaintBoard extends BaseWidget {
    constructor() {
        super();
    }

    async onInit() {
        console.log(fabric, fa)

        const canvas = new fabric.Canvas('c', {
            isDrawingMode: true
        }) // 这里传入的是canvas的id
        this.canvas = canvas
        this.updateBackgroundImage()
        console.log(canvas)
        // 创建一个长方形
        const rect = new fabric.Rect({
            top: 30, // 距离容器顶部 30px
            left: 30, // 距离容器左侧 30px
            width: 100, // 宽 100px
            height: 60, // 高 60px
            fill: 'red' // 填充 红色
        })

        // 在canvas画布中加入矩形（rect）。add是“添加”的意思
        canvas.add(rect)
    }

    updateBackgroundImage() {
        const img = this.sceneToImage()
        this.canvas.setBackgroundImage(img, this.canvas.renderAll.bind(this.canvas), {
            // scaleX: this.canvas.width / img.width, // 计算出图片要拉伸的宽度
            // scaleY: this.canvas.height / img.height // 计算出图片要拉伸的高度
        })
    }

    sceneToImage() {
        // 将canvas转为图片
        const canvas = this.viewer.scene.canvas;
        const img = canvas.toDataURL("image/png");
        const imgElement = document.createElement("img");
        imgElement.src = img;
        imgElement.style.width = "100%";
        imgElement.style.height = "100%";
        return img;
    }
}