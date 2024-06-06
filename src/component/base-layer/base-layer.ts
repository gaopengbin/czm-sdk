
import { createProvider } from "@/lib/cesium/sceneTree/creator";
import { Component } from "../core/decorators";
import BaseWidget from "../earth/base-widget";
import "./base-layer.scss";
import { BaseLayerPicker, ProviderViewModel, UrlTemplateImageryProvider, buildModuleUrl } from "cesium";

@Component({
    tagName: "base-layer",
    className: "base-layer",
    template: "<div id='base-layer'></div>",
})
export default class BaseLayer extends BaseWidget {
    _layerList: any = [];
    _baseLayerPicker: any;
    constructor() {
        super();
    }

    public async afterInit() {
        this.initLayerList();
    }

    set layerList(value: any) {
        this._layerList = value;
        this.initLayerList();
    }

    get layerList() {
        return this._layerList;
    }

    async initLayerList() {
        if (this._baseLayerPicker) {
            this._baseLayerPicker.destroy();
        }
        const imageryViewModels: any = [];
        const terrainViewModels: any = [];

        this._layerList = [
            {
                type: 'xyz',
                name: '高德地图',
                iconUrl: '/vite.svg',
                tooltip: '高德地图',
                url: 'http://webst01.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
                maximumLevel: 18,
            },
            {
                type: 'xyz',
                name: 'Natural Earth II',
                iconUrl: buildModuleUrl('Widgets/Images/ImageryProviders/naturalEarthII.png'),
                url: 'NaturalEarthII',
            },
            {
                type: 'terrain',
                name: '超图Terrain',
                iconUrl: buildModuleUrl('Widgets/Images/TerrainProviders/CesiumWorldTerrain.png'),
                url: 'http://www.supermapol.com/realspace/services/3D-stk_terrain/rest/realspace/datas/info/data/path',
            }
        ]



        for (let i = 0; i < this.layerList.length; i++) {
            const layer = this.layerList[i];
            if (layer.type === 'terrain') {
                let provider = await createProvider(layer);
                terrainViewModels.push(
                    new ProviderViewModel({
                        name: layer.name,
                        iconUrl: layer.iconUrl,
                        tooltip: layer.tooltip,
                        creationFunction: () => {
                            return provider;
                        }
                    })
                );
            } else {
                let provider = await createProvider(layer);
                imageryViewModels.push(
                    new ProviderViewModel({
                        name: layer.name,
                        iconUrl: layer.iconUrl,
                        tooltip: layer.tooltip,
                        creationFunction: () => {
                            return provider;
                        }
                    })
                );
            }

        }

        this._baseLayerPicker = new BaseLayerPicker("base-layer", {
            globe: this.viewer.scene.globe,
            imageryProviderViewModels: imageryViewModels,
            terrainProviderViewModels: terrainViewModels,
        })
    }
}