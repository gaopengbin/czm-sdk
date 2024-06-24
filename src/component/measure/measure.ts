import { Component } from "../core/decorators";
import BaseWidget from "../earth/base-widget";

import "./measure.scss";
import template from "./measure.html?raw";
import { MeasureHandler } from "@/lib/cesium/measure";
import { Popover } from "bootstrap";

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

    async onInit() {
        this.$data = {
            measures: [
                {
                    name: "点位测量",
                    type: "point",
                    icon: "bi-geo-alt"
                },
                {
                    name: "距离测量",
                    type: "distance",
                    icon: "bi-bezier2"
                },
                {
                    name: "面积测量",
                    type: "area",
                    icon: "bi-bounding-box-circles"
                },
                {
                    name: "清除",
                    type: "clear",
                    icon: "bi-trash"
                }
            ]
        }

    }

    public async afterInit() {
        const popoverTriggerList = this.querySelectorAll('[data-bs-toggle="popover"]');
        popoverTriggerList.forEach((element: any) => {
            new Popover(element);
        });
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