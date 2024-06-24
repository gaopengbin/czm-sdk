import { Component } from '../core/decorators'
import { initScene, SceneTree, initViewer } from '../../lib';
import BaseWidget from "./base-widget"
import { initEarth } from '@/lib/cesium/sceneTree/creator';
import './base-earth.scss'
import { setLayersZIndex } from '@/lib/cesium/sceneTree/loader';
import { Ion } from 'cesium';
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

            setLayersZIndex(this.viewer);
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
            msaaSamples: 4,
        });
        this.sceneTree = new SceneTree(viewer);
        this.viewer = viewer;
    }
}
