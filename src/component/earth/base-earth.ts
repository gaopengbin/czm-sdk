import { Component } from '../core/decorators'
import { initScene, SceneTree, initViewer } from '../../lib';
import BaseWidget from "./base-widget"
import { initEarth } from '@/lib/cesium/sceneTree/creator';
import './base-earth.scss'
import { Cartographic, Ion, Math } from 'cesium';
@Component({
    tagName: 'base-earth',
    className: 'base-earth',
    template: `<div id="earth"></div>`,
    hasConfig: true,
})

export default class BaseEarth extends BaseWidget {
    constructor() {
        super();
    }

    public configLoaded(): void {
        this.globalConfig = this.config;
        Ion.defaultAccessToken = this.config.earth.ionDefaultToken;
        this.initViewer();
        setTimeout(async () => {
            const { viewer } = this.config.earth;
            if (viewer) {
                initViewer(this.viewer, viewer);
            }
            await initEarth(this.sceneTree, this.config.earth);
        }, 500);

        const widgetManager = this.globalConfig?.widgetManager || 'webgis-widget-manager';
        const widgetManagerEl = document.createElement(widgetManager) as BaseWidget;
        widgetManagerEl.startup({
            config: this.globalConfig.widgets,
            viewer: this.viewer,
            globalConfig: this.globalConfig
        });
        this.childNodes[0] ? this.insertBefore(widgetManagerEl, this.childNodes[0]) : this.appendChild(widgetManagerEl);

    }

    public async afterInit() {
        // this.initViewer();
    }

    public async earthReady() {

    }

    public isReady(): boolean {
        return true
    }

    initViewer() {
        let viewer = initScene("earth", {
            baseLayerPicker: false,
            baseLayer: false,
            projectionPicker: false,
            geocoder: false,
            homeButton: false,
            sceneModePicker: false,
            navigationHelpButton: false,
            animation: false,
            timeline: false,
            fullscreenButton: false,
            infoBox: false,
            selectionIndicator: false,
            msaaSamples: 8,
            shouldAnimate: true,
        });
        this.sceneTree = new SceneTree(viewer);
        this.viewer = viewer;
        // window.viewer = viewer;
        // window.earth = this;
    }

    renderFromJson(config: any) {
        if (config) {
            const wm = this.querySelector('webgis-widget-manager');
            wm?.remove();
            if (this.viewer) {
                this.viewer.destroy();
                this.viewer = null;
            }
            this.config = config;
            this.configLoaded();
        }
    }

    toJSON() {
        const layers = this.sceneTree.root.toJSON().children;
        let baseLayers = this.config.earth.baseLayers;
        const ionDefaultToken = this.config.earth.viewer.ionDefaultToken;
        const currentPositon = this.viewer.camera.position;
        // 转为经纬度
        const cartographic = Cartographic.fromCartesian(currentPositon);
        const position = [
            Math.toDegrees(cartographic.longitude),
            Math.toDegrees(cartographic.latitude),
            cartographic.height
        ];

        const heading = this.viewer.camera.heading;
        const pitch = this.viewer.camera.pitch;
        const roll = this.viewer.camera.roll;
        const hpr = [
            Math.toDegrees(heading),
            Math.toDegrees(pitch),
            Math.toDegrees(roll)
        ];

        const baseLayerWidget: any = this.querySelector('base-layer');
        if (baseLayerWidget) {
            const selectedImageryIndex = baseLayerWidget.selectedImageryIndex;
            const selectedTerrainIndex = baseLayerWidget.selectedTerrainIndex;
            let imageries = [], terrains = [];
            if (selectedImageryIndex > -1) {
                imageries = baseLayers.filter((layer: any) => layer.type !== 'terrain');
                imageries = imageries.map((layer: any, index: number) => {
                    layer.isDefault = index === selectedImageryIndex;
                    return layer;
                });
            }
            if (selectedTerrainIndex > -1) {
                terrains = baseLayers.filter((layer: any) => layer.type === 'terrain');
                terrains = terrains.map((layer: any, index: number) => {
                    layer.isDefault = index === selectedTerrainIndex;
                    return layer;
                });
            }
            baseLayers = [...imageries, ...terrains];
        }

        return {
            earth: {
                layers,
                baseLayers,
                viewer: {
                    ionDefaultToken,
                    position,
                    hpr
                }
            },
            widgets: this.globalConfig.widgets
        }
    }
}
