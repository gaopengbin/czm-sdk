import { Color } from "cesium";
import { Component } from "../core/decorators";
import BaseWidget from "../earth/base-widget";
import Template from "./loader-ui.html?raw";
import "./loader-ui.scss";
import WMTSParser from "@/lib/cesium/parser/WMTSParser";
import WMSParser from "@/lib/cesium/parser/WMSParser";
import * as Cesium from "cesium";
import { getCartesian3FromCartesian2, transformCartesianToWGS84 } from "@/lib/cesium/measure";
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
            name: '',
            url: '',
            IonAssetId: 0,
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
            },
            wmsParams: {
                name: '',
                url: '',
                layers: '',
                rectangle: [],
                tilingScheme: '',
                parameters: {
                    transparent: true,
                    format: 'image/png',
                }
            },
            lon: 0,
            lat: 0,
            height: 0,
        }
    }

    clickTab(e: any, index: number) {
        this.querySelectorAll('.nav-link').forEach((element: any) => {
            element.classList.remove('active');
        })
        e.target.classList.add('active');
        this.$data.active = index;
        this.$data.name = '';
        this.$data.url = '';
    }

    async loadGeoJson() {
        let geojson = await this.sceneTree.createGeoJsonLayer({
            type: "geojson",
            name: this.$data.name,
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
            name: this.$data.name,
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
            name: this.$data.name,
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
            name: this.$data.name,
            url: this.$data.url,
            ionAssetId: this.$data.IonAssetId,
            show: true,
            zoomTo: false,
        });
        this.sceneTree.root?.addLayer(tileset);
        tileset?.zoomTo();
    }
    async loadIonTileset() {
        let tileset = await this.sceneTree.createIonTilesetLayer({
            type: "iontileset",
            name: this.$data.name,
            ionAssetId: this.$data.IonAssetId,
            show: true,
            zoomTo: false,
        } as any);
        this.sceneTree.root?.addLayer(tileset);
        tileset?.zoomTo();
    }

    async loadXYZ() {
        let xyz = await this.sceneTree.createXYZLayer({
            type: "xyz",
            name: this.$data.name,
            url: this.$data.url,
            ionAssetId: this.$data.IonAssetId,
            show: true,
            zoomTo: false,
        });
        this.sceneTree.root?.addLayer(xyz);
        xyz?.zoomTo();
    }

    async loadTerrain() {
        let terrain = await this.sceneTree.createTerrainLayer({
            type: "terrain",
            name: this.$data.name,
            url: this.$data.url,
            ionAssetId: this.$data.IonAssetId,
            show: true,
            zoomTo: false,
        });
        this.sceneTree.root?.addLayer(terrain);
        terrain?.zoomTo();
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
        this.loading = true;
        const parser = new WMSParser();
        parser.parser(parser.addUrlParam(url)).then((res) => {
            this.loading = false;
            this.$data.wmtsParserLayers = res;
        });
    }

    async loadWMS() {
        let wms = await this.sceneTree.createWMSLayer({
            type: "wms",
            zoomTo: true,
            ...this.$data.wmsParams,
            name: this.$data.name,
        });
        this.sceneTree.root?.addLayer(wms);
        // wms?.zoomTo();
    }

    parserWMTS(url: string) {
        this.loading = true;
        const parser = new WMTSParser();
        parser.parser(parser.addUrlParam(url)).then((res) => {
            this.loading = false;
            this.$data.wmtsParserLayers = res;
        });
    }

    async loadWMTS() {
        let wmts = await this.sceneTree.createWMTSLayer({
            type: "wmts",
            ...this.$data.wmtsParams,
            name: this.$data.name,
            url: this.$data.url,
        } as any);
        this.sceneTree.root?.addLayer(wmts);
        wmts?.zoomTo();
    }

    layerSelect(index: any) {
        const layer = this.$data.wmtsParserLayers[index];
        this.$data.wmtsParams.name = layer.title;
        this.$data.wmtsParams.url = layer.urls[0].template;
        this.$data.wmtsParams.layer = layer.identifier;
        this.$data.wmtsParams.style = layer.styles[0].id;
        this.$data.wmtsParams.format = layer.urls[0].format;
        this.$data.wmtsParams.tileMatrixSetID = layer.tileMatrixSets[0].title;
        this.$data.wmtsParams.rectangle = layer.rectangle;
        this.$data.selectedLayer = this.$data.wmtsParserLayers[index];
    }

    layerSelectWMS(index: any) {
        const layer = this.$data.wmtsParserLayers[index];
        this.$data.wmsParams.name = layer.title;
        this.$data.wmsParams.url = layer.urls;
        this.$data.wmsParams.layers = layer.name;
        this.$data.wmsParams.rectangle = layer.rectangle;
        this.$data.wmsParams.tilingScheme = "geographic";
        this.$data.wmsParams.parameters.format = layer.format[0];

    }

    formatSelect(index: any) {
        this.$data.wmtsParams.format = this.$data.selectedLayer.urls[index].format;
        this.$data.wmtsParams.url = this.$data.selectedLayer.urls[index].template;
    }

    async loadModel() {
        this.loading = true;
        try {
            const model = await this.sceneTree.createModelLayer({
                type: "model",
                name: this.$data.name,
                url: this.$data.url,
                position: [this.$data.lon, this.$data.lat, this.$data.height],
                show: true,
                zoomTo: false,
            } as any);
            this.loading = false;
            this.sceneTree.root?.addLayer(model);
            model?.zoomTo();
        } catch (error) {
            this.loading = false;
            console.error(error);
        }

    }

    pickPosition() {
        // 鼠标样式设置为十字
        this.viewer.container.style.cursor = "crosshair";

        this.viewer.cesiumWidget.screenSpaceEventHandler.setInputAction((click: any) => {
            let position = getCartesian3FromCartesian2(this.viewer, click.position);
            if (!position) {
                return;
            }
            let jwd = transformCartesianToWGS84(this.viewer, position);
            if (!jwd) return;
            this.$data.lon = jwd?.lon;
            this.$data.lat = jwd?.lat;
            this.$data.height = jwd?.alt > 0 ? jwd?.alt : 0;
            this.viewer.container.style.cursor = "default";
            this.viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }

    // public toJSON() {
    //     return {
    //         test: 'test'
    //     }
    // }
}