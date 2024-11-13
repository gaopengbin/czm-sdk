import { Component } from "@/component/core/decorators";
import BaseWidget from "@/component/earth/base-widget";
import Template from "./depthOfField.html?raw";
import { PostProcessStage } from "cesium";
import "./depthOfField.scss"

@Component({
    tagName: "czm-effect-depthoffield",
    className: "czm-effect-depthoffield",
    template: Template,
    hasConfig: false
})
export default class DepthOfField extends BaseWidget {
    constructor(DepthOfFieldStage: PostProcessStage, config: any) {
        super();
        this.DepthOfFieldStage = DepthOfFieldStage;
        this.config = config;
    }

    public async onInit() {
        this.$data = this.config;
    }

    changeDepthOfFieldShow(event: any) {
        const value = event.target.checked;
        this.$data.show = value;
        this.DepthOfFieldStage.enabled = value;
    }

    changeFocalDistance(value: number) {
        this.$data.focalDistance = Number(value);
        this.DepthOfFieldStage.uniforms.focalDistance = Number(value);
    }

    changeDelta(value: number) {
        this.$data.delta = Number(value);
        this.DepthOfFieldStage.uniforms.delta = Number(value);
    }

    changeSigma(value: number) {
        this.$data.sigma = Number(value);
        this.DepthOfFieldStage.uniforms.sigma = Number(value);
    }

    changeStepSize(value: number) {
        this.$data.stepSize = Number(value);
        this.DepthOfFieldStage.uniforms.stepSize = Number(value);
    }

}