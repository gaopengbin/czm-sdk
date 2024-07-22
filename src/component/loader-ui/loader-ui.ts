import { Color } from "cesium";
import { Component } from "../core/decorators";
import BaseWidget from "../earth/base-widget";
import Template from "./loader-ui.html?raw";
import "./loader-ui.scss";
import WMTSParser from "@/lib/cesium/parser/WMTSParser";
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
            layers: '', // wms
            layer: '', //wmts
            wmtsParserLayers: [],
            selectedLayer: {},
            wmtsParams: {
                name: '',
                url: '',
                layer: '',
                style: '',
                format: '',
                tileMatrixSetID: '',
            }
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
            zoomTo: true,
        });
        this.sceneTree.root?.addLayer(ssmapserver);
        // ssmapserver?.zoomTo();
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
            if (this.$data.active === 5) {
                this.parserWMS(this.$data.url);
            } else if (this.$data.active === 6) {
                this.parserWMTS(this.$data.url);
            }
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

    parserWMTS(url: string) {
        this.loading = true;
        const parser = new WMTSParser();
        parser.parser(parser.addUrlParam(url)).then((res) => {
            this.loading = false;
            console.log(res);
            this.$data.wmtsParserLayers = res;
        });
    }

    async loadWMTS() {
        console.log(this.$data.wmtsParams);
        let wmts = await this.sceneTree.createWMTSLayer({
            type: "wmts",
            ...this.$data.wmtsParams,
        } as any);
        this.sceneTree.root?.addLayer(wmts);
        wmts?.zoomTo();
    }

    layerSelect(index: any) {
        console.log(index, this.$data.wmtsParserLayers[index]);
        const layer = this.$data.wmtsParserLayers[index];
        this.$data.wmtsParams.name = layer.title;
        this.$data.wmtsParams.url = layer.urls[0].template;
        this.$data.wmtsParams.layer = layer.identifier;
        this.$data.wmtsParams.style = layer.styles[0].id;
        this.$data.wmtsParams.format = layer.urls[0].format;
        this.$data.wmtsParams.tileMatrixSetID = layer.tileMatrixSets[0].title;
        this.$data.selectedLayer = this.$data.wmtsParserLayers[index];
    }

    formatSelect(index: any) {
        this.$data.wmtsParams.format = this.$data.selectedLayer.urls[index].format;
        this.$data.wmtsParams.url = this.$data.selectedLayer.urls[index].template;
    }

}