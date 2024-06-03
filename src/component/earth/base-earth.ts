import { Component } from '../core/decorators'
import Template from './test.html?raw';
import { initScene } from '../../lib';
import BaseWidget from "./base-widget"
// import './test.scss'
@Component({
    tagName: 'base-earth',
    className: 'base-earth',
    template: Template,
})

export default class BaseEarth extends BaseWidget {
    viewer: any;
    constructor() {
        super();
    }

    async afterInit() {
        console.log("afterInit", this);
        this.initEarth();
    }

    public async earthReady() { }

    initEarth() {
        let viewer = initScene("earth", {
            baseLayerPicker: false,
            baseLayer: false,
            projectionPicker: true,
            // infoBox: false,
        });
        this.viewer = viewer;
        this.earthReady();
    }
}
