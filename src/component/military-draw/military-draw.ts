import { Modal, Popover } from "bootstrap";
import { Component } from "../core/decorators";
import BaseWidget from "../earth/base-widget";
import Template from "./military-draw.html?raw";
import "./military-draw.scss";
import * as Cesium from "cesium";
import MPlot from "@/lib/cesium/military-plot/index";
import '@/assets/font/iconfont.css'
import { Leaf } from "@/lib/cesium/sceneTree/types";
import { Group } from "@/lib/cesium/sceneTree";

@Component({
    tagName: "czm-military-draw",
    className: "czm-military-draw",
    template: Template,
})
export default class MilitaryDraw extends BaseWidget {
    constructor() {
        super();
    }

    public beforeInit() {
        this.$data = {
            // | StraightArrow          | 'line'    | 细直箭头         | ✔️       |
            // | CurvedArrow            | 'line'    | 曲线箭头         | ✔️       |
            // | FineArrow              | 'polygon' | 直箭头           | ✔️       |
            // | AttackArrow            | 'polygon' | 进攻方向箭头     | ✔️       |
            // | SwallowtailAttackArrow | 'polygon' | 燕尾进攻方向箭头 | ✔️       |
            // | SquadCombat            | 'polygon' | 分队战斗方向     | ✔️       |
            // | SwallowtailSquadCombat | 'polygon' | 燕尾分队战斗方向 | ✔️       |
            // | AssaultDirection       | 'polygon' | 突击方向         | ✔️       |
            // | DoubleArrow            | 'polygon' | 双箭头           | ✔️       |
            drawTools: [
                { name: '直线箭头', type: 'StraightArrow', icon: 'iconfont icon-arrow-up-copy' },
                { name: '曲线箭头', type: 'CurvedArrow', icon: 'iconfont icon-arrowm' },
                { name: '直箭头', type: 'FineArrow', icon: 'iconfont icon-arrowm' },
                { name: '进攻方向箭头', type: 'AttackArrow', icon: 'iconfont icon-singleArrow' },
                { name: '燕尾进攻方向箭头', type: 'SwallowtailAttackArrow', icon: 'iconfont icon-arrowm' },
                { name: '分队战斗方向', type: 'SquadCombat', icon: 'iconfont icon-arrowm' },
                { name: '燕尾分队战斗方向', type: 'SwallowtailSquadCombat', icon: 'iconfont icon-arrowm' },
                { name: '突击方向', type: 'AssaultDirection', icon: 'iconfont icon-arrowm' },
                { name: '双箭头', type: 'DoubleArrow', icon: 'iconfont icon-doubleArrow' },
                { name: '播放动态', type: 'Animation', icon: 'bi-play' },
            ],
            plotPic: [],
            marker: {
                name: '',
                width: 100,
                height: 100,
                scale: 1,
                sizeInMeters: false,
                rotation: 0,
                color: '#ffffff',
            }
        }
        this.plots = [];
        const pics = import.meta.glob(['../../assets/plot/*.png', '../../assets/plot/*.svg'])
        for (const path in pics) {
            pics[path]().then((pic: any) => {
                // console.log(pic)
                const name = path!.split('/')!.pop()!.split('.')[0]
                this.$data.plotPic.push({ name: name, url: pic.default })
            })
        }

        MPlot.EventListener.on('drawEnd', (e: any) => {
            console.log('drawEnd', e)
        })

        MPlot.EventListener.on('drawStart', (e: any) => {
            console.log('drawStart', e)
        })

        MPlot.EventListener.on('editStart', (e: any) => {
            console.log('editStart', e)
        })
        MPlot.EventListener.on('editEnd', (e: any) => {
            console.log('editEnd', e)
        })

    }

    async onInit() {
        // Cesium.PolygonGraphics.prototype.setDynamic = function (value: boolean) {
        //     this.isDynamic = value;
        // }
        // Cesium.PolylineGraphics.prototype.setDynamic = function (value: boolean) {
        //     this.isDynamic = value;
        // }
    }

    async afterInit() {
        const popoverTriggerList = this.querySelectorAll('[data-bs-toggle="popover"]');
        popoverTriggerList.forEach((element: any) => {
            new Popover(element);
        });
    }

    startDraw(type: string) {
        if (type === 'Animation') {
            this.plots.forEach((plot: any) => {
                plot.startGrowthAnimation()
            })
            return
        }
        const geometry = new MPlot[type](Cesium, this.viewer, {
            material: Cesium.Color.fromCssColorString('rgba(59, 178, 208, 0.5)'),
            outlineMaterial: Cesium.Color.fromCssColorString('rgba(59, 178, 208, 1)'),
            outlineWidth: 3,
        })
        this.geometry = geometry
        console.log(this.geometry)
        this.geometry.on('drawEnd', (e: any) => {
            this.plots.push(geometry)
        });
    }

    startDrawBillboard(item: any) {
        console.log(item)
        this.$data.marker.name = item.name
        let marker = new MPlot.Billbord(Cesium, this.viewer, {
            name: item.name,
            image: item.url,
            scale: 1,
            verticalOrigin: 0,
            heightReference: 0,
            disableDepthTestDistance: 0,
            distanceDisplayCondition: undefined,
        })
        this.marker = marker
        console.log(marker)
    }

    nameChange(val: string) {
        this.$data.marker.name = val
        if (this.marker)
            this.marker.name = val
    }

    scaleChange(val: number) {
        this.$data.marker.scale = val
        if (this.marker)
            this.marker.scale = val
    }

    rotationChange(val: number) {
        this.$data.marker.rotation = val
        if (this.marker)
            this.marker.rotation = val / 180 * Math.PI
    }

    sizeInMetersChange(val: boolean) {
        if (this.marker)
            this.marker.sizeInMeters = val
    }

    widthChange(val: number) {
        if (this.marker)
            this.marker.width = val
    }

    heightChange(val: number) {
        if (this.marker)
            this.marker.height = val
    }

    colorChange(val: string) {
        this.$data.marker.color = val
        if (this.marker)
            this.marker.color = Cesium.Color.fromCssColorString(val)
    }

    saveMarker() {
        const marker = this.marker
        const leaf: Leaf = {
            name: marker.name,
            setVisible: (visible: boolean) => {
                marker.show = visible;
            },
            zoomTo: () => {
                marker.zoomTo();
            },
            get show() {
                return marker._show;
            },
            set show(value: boolean) {
                marker._show = value;
            },
            zIndex: 0,
            _zIndex: 0,
            remove: () => {
                marker.remove();
            },
            destroy: () => {
                marker.remove();
            },
            toJSON: marker.toJSON
        }
        const selectedNode = this.treeView?.selectedNode
        if (selectedNode) {
            const guid = selectedNode.getAttribute('guid');
            if (!guid) return;
            const node = this.sceneTree.getLayerByGuid(guid);
            if (node instanceof Group) {
                node.addLayer(leaf);
                // this.sceneTree.updateSceneTree();
                return;
            } else {
                this.sceneTree.root.addLayer(leaf);
                // this.sceneTree.updateSceneTree();
            }
        } else {
            this.sceneTree.root.addLayer(leaf);
            // this.sceneTree.updateSceneTree();
        }
    }

    deleteMarker() {
        if (this.marker) {
            this.marker.destroy()
            this.marker = null
        }
    }

    cancel() {

    }

}