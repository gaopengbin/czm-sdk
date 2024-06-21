import { Component } from "../core/decorators";
import BaseWidget from "../earth/base-widget";

import "./measure.scss";
import template from "./measure.html?raw";
import { MeasureHandler } from "@/lib/cesium/measure";

@Component({
    tagName: "czm-measure",
    className: "czm-measure",
    template: template,
})
export default class Measure extends BaseWidget {
    measureType: string = "";
    measureHandler: MeasureHandler | null = null;
    constructor() {
        super();
    }

    public async afterInit() {
        this.measureHandler = new MeasureHandler(this.viewer);
    }

    startMeasure(type: string) {
        this.measureHandler?.startMeasure(type);
    }

    endMeasure() {
        this.measureHandler?.endMeasure();
    }

    clearMeasure() {
        this.measureHandler?.clearMeasure();
    }
}