import { Component } from '../core/decorators'
import { initScene, SceneTree } from '../../lib';
import BaseWidget from "./base-widget"
import { initEarth } from '@/lib/cesium/sceneTree/creator';
import './base-earth.scss'
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
        this.globalConfig = this.config
        initEarth(this.sceneTree, this.config.earth);
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
        this.initViewer();
    }

    public async earthReady() {
        // console.log("earthReady", this.viewer);
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
            // infoBox: false,
        });
        this.viewer = viewer;

        this.sceneTree = new SceneTree(viewer);
    }
}
