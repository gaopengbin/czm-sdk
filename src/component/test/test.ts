import { Modal, Popover } from "bootstrap";
import { Component } from "../core/decorators";
import BaseWidget from "../earth/base-widget";
import Template from "./test.html?raw";
import "./test.scss";
import { Color, ScreenSpaceEventType } from "cesium";
import SSPolyline from "./SSPolyline";
import SSRectangle from "./SSRectangle";
import SSCircle from "./SSCircle";
import SSPolygon from "./SSPolygon";
import SSPoint from "./SSPoint";
import SSLabel from "./SSLabel";

@Component({
    tagName: "czm-test",
    className: "czm-test",
    template: Template,
})
export default class Test extends BaseWidget {
    constructor() {
        super();
    }

    public beforeInit() {
        this.$data = {

        }
    }

    async onInit(): Promise<void> {
        // 禁止双击事件
        this.viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

    }

    async afterInit() {
        const popoverTriggerList = this.querySelectorAll('[data-bs-toggle="popover"]');
        popoverTriggerList.forEach((element: any) => {
            new Popover(element);
        });
    }

    draw(type: number) {
        this.clear();
        switch (type) {
            case 1:
                const polyline = new SSPolyline(this.viewer);
                this.polyline = polyline;
                polyline.on('drawEnd', (self: any) => {
                    console.log(self);
                });
                polyline.startDrawing();
                break;
            case 2:
                const rectangle = new SSRectangle(this.viewer, {
                    material: Color.AQUA.withAlpha(0.1),
                    outlineColor: Color.AQUA,
                    outlineWidth: 4
                });
                this.rectangle = rectangle;
                rectangle.on('drawEnd', (self: any) => {
                    console.log(self);
                    this.nodePositions = self.nodePositions;
                });
                rectangle.startDrawing();
                break;
            case 3:
                const circle = new SSCircle(this.viewer, {
                    material: Color.AQUA.withAlpha(0.2),
                    outlineColor: Color.AQUA,
                    outlineWidth: 3,
                });
                this.circle = circle;
                circle.on('drawEnd', (self: any) => {
                    console.log(self);
                });
                circle.startDrawing();
                break;
            case 4:
                const polygon = new SSPolygon(this.viewer, {
                    material: Color.AQUA.withAlpha(0.2),
                    outlineColor: Color.AQUA,
                    outlineWidth: 3,
                });
                this.polygon = polygon;
                polygon.on('drawEnd', (self: any) => {
                    console.log(self);
                    this.nodePositions = self.nodePositions;
                });
                polygon.startDrawing();
                break;
            case 5:
                const point = new SSPoint(this.viewer, {
                    pixelSize: 10,
                    color: Color.AQUA,
                    outlineColor: Color.BLACK,
                    outlineWidth: 2,
                    heightReference: 1,
                });
                this.point = point;
                point.on('drawEnd', (self: any) => {
                    console.log(self);
                });
                point.startDrawing();
                break;
            case 6:
                const label = new SSLabel(this.viewer, {
                    text: '测试文字',
                    fillColor: Color.AQUA,
                    outlineColor: Color.BLACK,
                    outlineWidth: 2,
                    style: 2,
                    verticalOrigin: 1,
                    heightReference: 1,
                });
                this.label = label;
                label.on('drawEnd', (self: any) => {
                    console.log(self);
                });
                label.startDrawing();
                break;
        }
    }

    clear() {
        if (this.polyline) {
            this.polyline.destroy();
            this.polyline = null;
        }
        if (this.rectangle) {
            this.rectangle.destroy();
            this.rectangle = null;
        }
    }

    outputFile() {
        const url = 'http://localhost:16080/CommonDatabase/data-output'

        const pos = this.nodePositions;
        let wktGeometry = '';
        console.log(pos);
        if (pos) {
            // wktGeometry = `POLYGON((${pos[0].lon} ${pos[0].lat},${pos[1].lon} ${pos[1].lat},${pos[2].lon} ${pos[2].lat},${pos[3].lon} ${pos[3].lat},${pos[0].lon} ${pos[0].lat}))`;
            for (let i = 0; i < pos.length; i++) {
                if (i == pos.length - 1) {
                    wktGeometry += `${pos[i][0]} ${pos[i][1]}`;
                } else {
                    wktGeometry += `${pos[i][0]} ${pos[i][1]},`;
                }
            }
        }
        wktGeometry = `POLYGON((${wktGeometry}))`;

        const params = {
            "dbname": 'demo',
            "extentGeometryWkt": wktGeometry,
            "customExtentSrs": "EPSG:4326",
            "host": "jojo1986.cn",
            "layers": ["河流"],
            "outputpath": "D:\\000jojo\\",
            "password": "demo",
            "port": 5432,
            "user": "demo"
        }

        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        })
            .then(response => response.json())
            .then(data => {
                console.log(data);
            })
    }
}