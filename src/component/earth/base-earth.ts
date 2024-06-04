import { Component } from '../core/decorators'
import { initScene, SceneTree } from '../../lib';
import BaseWidget from "./base-widget"
import './base-earth.scss'
@Component({
    tagName: 'base-earth',
    className: 'base-earth',
    template: `<div id="earth"></div>`,
})

export default class BaseEarth extends BaseWidget {
    constructor() {
        super();
    }

    public async afterInit() {
        this.initEarth();
    }

    public async earthReady() {
        // console.log("earthReady", this.viewer);
    }

    initEarth() {
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
