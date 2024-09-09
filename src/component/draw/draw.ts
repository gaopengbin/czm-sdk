import { Modal } from "bootstrap";
import { Component } from "../core/decorators";
import BaseWidget from "../earth/base-widget";
import Template from "./draw.html?raw";
import "./draw.scss";
import { Color, ScreenSpaceEventType } from "cesium";

@Component({
    tagName: "czm-draw",
    className: "czm-draw",
    template: Template,
})
export default class Draw extends BaseWidget {
    constructor() {
        super();
    }

    public beforeInit() {
        this.$data = {
            markerOptions: {
                name: '未命名Marker',
                text: '标注文本',
            },
            labelOptions: {
                name: '未命名Label',
                text: '标注文本',
            },
            polylineOptions: {
                name: '未命名Polyline',
                color: '#ff0000',
                width: 3,
            },
            polygonOptions: {
                name: '未命名Polygon',
                outlineColor: '#ff0000',
                fillColor: '#ff0000',
                outlineWidth: 3,
            },
            name: '未命名标绘',
            text: '标注文本',
            color: '#ff0000',
            width: 3,
            drawTools: [
                { name: '点', type: 'poi', icon: 'bi-geo-alt' },
                { name: '标签', type: 'label', icon: 'bi-type-h1' },
                { name: '线', type: 'polyline', icon: 'bi-bezier2' },
                { name: '面', type: 'polygon', icon: 'bi-bounding-box-circles' },
            ]
        }
    }

    async onInit(): Promise<void> {
        // 禁止双击事件
        this.viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
        let currentId = ''
        document.addEventListener("addEvent", function (e: any) {
            currentId = e.detail.mid
        })
        window.addEventListener("marker-add", (e: any) => {
            this.marker = this.markerManager.get(e.detail.id)
            if (this.marker.type === 'MARKER') {
                const modal = new Modal(document.getElementById('markerModal') as Element, {
                    focus: true,
                    backdrop: 'static'
                })
                modal.show()
            }
            if (this.marker.type === 'LABEL') {
                const modal = new Modal(document.getElementById('labelModal') as Element, {
                    focus: true,
                    backdrop: 'static'
                })
                modal.show()
            }
        })
        window.addEventListener("marker-edit", (e) => {
            console.log('marker-edit', e);
        })
        document.addEventListener("stopEdit", () => {
            const graphic = this.graphicManager.get(currentId)
            this.graphic = graphic
            if (graphic.type === 'POLYLINE') {
                const modal = new Modal(document.getElementById('polylineModal') as Element, {
                    focus: true,
                    backdrop: 'static'
                })
                modal.show()
            }
            if (graphic.type === 'POLYGON') {
                const modal = new Modal(document.getElementById('polygonModal') as Element, {
                    focus: true,
                    backdrop: 'static'
                })
                modal.show()
            }
        })

        // const colorPicker = new window['iro'].ColorPicker("#fillColor", {
        //     width: 200,
        //     color: "#ff0000",
        //     borderWidth: 1,
        //     borderColor: "#fff",
        //     layout:[
        //         {
        //             component: window['iro'].ui.Box,
        //             options: {}
        //         },
        //         {
        //             component: window['iro'].ui.Slider,
        //             options: {
        //                 sliderType: 'hue'
        //             }
        //         },
        //         {
        //             component: window['iro'].ui.Slider,
        //             options: {
        //                 sliderType: 'alpha'
        //             }
        //         },
        //     ]
        // });
    }

    startDraw(type: string) {
        switch (type) {
            case 'poi':
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

    setMarkerStyle() {
        if (this.marker) {
            if (this.marker.type === 'MARKER') {
                this.marker.name = this.$data.markerOptions.name
                this.marker.text = this.$data.markerOptions.text
            }
            if (this.marker.type === 'LABEL') {
                this.marker.name = this.$date.labelOptions.name
                this.marker.text = this.$data.labelOptions.text
            }
            this.sceneTree.root.addLayer(this.marker)
        }
    }

    setGraphicStyle() {
        if (this.graphic) {
            if (this.graphic.type === 'POLYLINE') {
                this.graphic.name = this.$data.polylineOptions.name
                this.graphic.setMaterial(
                    Color.fromCssColorString(this.$data.polylineOptions.color)
                )
                this.graphic.width = this.$data.polylineOptions.width
            }
            if (this.graphic.type === 'POLYGON') {
                this.graphic.name = this.$data.polygonOptions.name
                this.graphic.setMaterial(
                    Color.fromCssColorString(this.$data.polygonOptions.fillColor)
                )
                this.graphic.outlineStyle = {
                    outlineWidth: this.$data.polygonOptions.outlineWidth,
                    outlineColor: Color.fromCssColorString(this.$data.polygonOptions.outlineColor)
                }
            }
            // this.graphic.text = this.$data.text
            this.sceneTree.root.addLayer(this.graphic)
        }
    }

    cancel() {
        if (this.marker) {
            this.marker.destroy()
            this.marker = null
        }
        if (this.graphic) {
            this.graphic.destroy()
            this.graphic = null
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
        this.res = this.marker.toJSON()
        console.log(this.res);
    }

    clear() {
        this.graphicManager.removeAll()
    }

    test() {
        let mk = this.markerManager.jsonToMarker(this.res)
        this.sceneTree.root.addLayer(mk)
        console.log(mk);
    }
}