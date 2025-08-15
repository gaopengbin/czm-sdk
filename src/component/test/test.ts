import { Modal, Popover } from "bootstrap";
import { Component } from "../core/decorators";
import BaseWidget from "../earth/base-widget";
import Template from "./test.html?raw";
import "./test.scss";
import { Color, ScreenSpaceEventType } from "cesium";
import { SSRectangle, SSPolygon, SSCircle, SSLabel, SSPoint, SSPolyline } from "@/lib/cesium/CustomEntity";
import EntityEditor from "../entity-editor/entity-editor";
import Viewshed from "@/lib/cesium/analysis/viewshed";
import { createTileset } from "@/lib/cesium/sceneTree/creator";
import { PositionEdit } from "@/lib/cesium/Edit/PositionEdit";
import { RotationEdit } from "@/lib/cesium/Edit/RotationEdit";

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

        this.handler = this.viewer.cesiumWidget.screenSpaceEventHandler.setInputAction((movement: any) => {
            const pickedObject = this.viewer.scene.pick(movement.position);
            if (pickedObject && pickedObject.id && pickedObject.id.ssobject) {
                console.log(pickedObject.id.ssobject);
                // pickedObject.id.ssobject.positionEdit()
                this.editor.editEntity(pickedObject.id.ssobject);
            }
        }, ScreenSpaceEventType.LEFT_CLICK);

        this.moveHandler = this.viewer.cesiumWidget.screenSpaceEventHandler.setInputAction((movement: any) => {
            const pickedObject = this.viewer.scene.pick(movement.endPosition);
            if (pickedObject && pickedObject.id && pickedObject.id.ssobject) {
                document.body.style.cursor = 'pointer';
            } else {
                document.body.style.cursor = 'auto';
            }
        }, ScreenSpaceEventType.MOUSE_MOVE);
        this.viewer.scene.globe.depthTestAgainstTerrain = true
        let tileset: any = await this.sceneTree.addTilesetLayer({
            type: "tileset",
            name: "this.$data.name",
            url: "http://localhost/data/out/tileset.json",
            show: true,
            zoomTo: false,
        });
        this.sceneTree.root?.addLayer(tileset);
        tileset?.zoomTo();
        // tileset.positionEditing = true;
        console.log(tileset);
        // new RotationEdit(this.viewer, tileset._tileset)
        // new PositionEdit(this.viewer, tileset._tileset)

    }

    async afterInit() {
        const popoverTriggerList = this.querySelectorAll('[data-bs-toggle="popover"]');
        popoverTriggerList.forEach((element: any) => {
            new Popover(element);
        });
        this.editor = document.querySelector('czm-entity-editor') as EntityEditor;
        console.log(this.editor);
    }

    draw(type: number) {
        // this.clear();
        switch (type) {
            case 1:
                const viewshed = new Viewshed(this.viewer, {
                    qdOffset: 2,
                    zdOffset: 2
                });
                console.log(viewshed);
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