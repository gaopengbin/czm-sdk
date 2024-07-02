import { Color } from "cesium";
import { Component } from "../core/decorators";
import BaseWidget from "../earth/base-widget";
import Template from "./loader-ui.html?raw";
import "./loader-ui.scss";
@Component({
    tagName: "czm-loader-ui",
    className: "czm-loader-ui",
    template: Template,
})
export default class LoaderUI extends BaseWidget {
    constructor() {
        super();
    }
    async onInit() {
        this.$data = {
            active: 1,
            url: '',
            layers: ''
        }
    }

    clickTab(e: any, index: number) {
        this.querySelectorAll('.nav-link').forEach((element: any) => {
            element.classList.remove('active');
        })
        e.target.classList.add('active');
        this.$data.active = index;
    }

    async loadGeoJson() {
        let geojson = await this.sceneTree.createGeoJsonLayer({
            type: "geojson",
            name: "geojson",
            url: this.$data.url,
            show: true,
            zoomTo: false,
            stroke: Color.RED,
            strokeWidth: 5,
            fill: Color.BLUE.withAlpha(0.5),
        } as any);
        this.sceneTree.root?.addLayer(geojson);
        geojson?.zoomTo();
    }

    async loadArcGis() {
        let arcgis = await this.sceneTree.createArcGisMapServerLayer({
            type: "arcgis",
            name: "arcgis",
            url: this.$data.url,
            show: true,
            zoomTo: false
        });
        this.sceneTree.root?.addLayer(arcgis);
        arcgis?.zoomTo();
    }

    async loadSSMapServer() {
        let ssmapserver = await this.sceneTree.createSSMapServerLayer({
            type: "ssmapserver",
            name: "TWWW",
            url: this.$data.url,
            show: true,
            zoomTo: false,
        });
        this.sceneTree.root?.addLayer(ssmapserver);
        ssmapserver?.zoomTo();
    }

    async loadTileset() {
        let tileset = await this.sceneTree.addTilesetLayer({
            type: "tileset",
            name: "tileset",
            url: this.$data.url,
            show: true,
            zoomTo: false,
        });
        this.sceneTree.root?.addLayer(tileset);
        tileset?.zoomTo();
    }

    handleKeyDown(e: any) {
        if (e.keyCode === 13) {
            this.parserWMS(this.$data.url);
        }
    }

    parserWMS(url: string) {
        console.log(url);
    }

    async loadWMS() {
        let wms = await this.sceneTree.createWMSLayer({
            type: "wms",
            name: "wms",
            url: this.$data.url,
            show: true,
            zoomTo: false,
            layers: this.$data.layers,
        });
        this.sceneTree.root?.addLayer(wms);
        wms?.zoomTo();
    }

}