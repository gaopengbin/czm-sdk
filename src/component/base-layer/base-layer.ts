
import { createProvider } from "@/lib/cesium/sceneTree/creator";
import { Component } from "../core/decorators";
import BaseWidget from "../earth/base-widget";
import "./base-layer.scss";
import { BaseLayerPicker, ProviderViewModel } from "cesium";

@Component({
    tagName: "base-layer",
    className: "base-layer",
    template: "<div id='base-layer'></div>",

})
export default class BaseLayer extends BaseWidget {
    _layerList: any = [];
    _baseLayerPicker: any;
    _selectedImageryIndex: number = 0;
    _selectedTerrainIndex: number = 0;
    _selectedImageryProviderViewModel: any;
    _selectedTerrainProviderViewModel: any;
    constructor() {
        super();
    }

    public async afterInit() {
        const layerlist = this.globalConfig?.earth?.baseLayers || [];
        this.layerList = JSON.parse(JSON.stringify(layerlist));
    }
    set layerList(value: any) {
        this._layerList = value;
        this.initLayerList();
    }

    get layerList() {
        return this._layerList;
    }

    get selectedImageryIndex() {
        const index = this._baseLayerPicker.viewModel.imageryProviderViewModels.indexOf(this._baseLayerPicker.viewModel.selectedImagery);
        return index;
    }

    get selectedTerrainIndex() {
        const index = this._baseLayerPicker.viewModel.terrainProviderViewModels.indexOf(this._baseLayerPicker.viewModel.selectedTerrain);
        return index;
    }

    async initLayerList() {
        if (this._baseLayerPicker) {
            this._baseLayerPicker.destroy();
        }
        const imageryViewModels: any = [];
        const terrainViewModels: any = [];

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
                if (layer.isDefault) {
                    this._selectedTerrainIndex = terrainViewModels.length - 1;
                    this._selectedTerrainProviderViewModel = terrainViewModels[terrainViewModels.length - 1];
                }
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
                if (layer.isDefault) {
                    this._selectedImageryIndex = terrainViewModels.length - 1;
                    this._selectedImageryProviderViewModel = imageryViewModels[imageryViewModels.length - 1];
                }
            }

        }

        this._baseLayerPicker = new BaseLayerPicker("base-layer", {
            globe: this.viewer.scene.globe,
            imageryProviderViewModels: imageryViewModels,
            terrainProviderViewModels: terrainViewModels,
            selectedImageryProviderViewModel: this._selectedImageryProviderViewModel ?? imageryViewModels[0],
            selectedTerrainProviderViewModel: this._selectedTerrainProviderViewModel ?? terrainViewModels[0]
        })
        if (this._baseLayerPicker) {
            let title: any = this.querySelector('.cesium-baseLayerPicker-sectionTitle');
            title.innerHTML = '底图切换';
        }
    }
}