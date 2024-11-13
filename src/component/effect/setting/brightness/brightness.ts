import { Component } from "@/component/core/decorators";
import BaseWidget from "@/component/earth/base-widget";
import Template from "./brightness.html?raw";
import { PostProcessStage } from "cesium";
import "./brightness.scss"

@Component({
    tagName: "czm-effect-brightness",
    className: "czm-effect-brightness",
    template: Template,
    hasConfig: false
})
export default class Brightness extends BaseWidget {
    constructor(BrightnessStage: PostProcessStage, config: any) {
        super();
        this.BrightnessStage = BrightnessStage;
        this.config = config;
    }

    public async onInit() {
        this.$data = {
            brightnessShow: this.config.brightnessShow,
            brightnessValue: this.config.brightnessValue,
        }
    }

    changeBrightnessShow(event: any) {
        const value = event.target.checked;
        console.log(value, event.target);
        this.$data.brightnessShow = value;
        this.BrightnessStage.enabled = value;
    }

    changeBrightnessValue(value: number) {
        this.$data.brightnessValue = Number(value);
        this.BrightnessStage.uniforms.brightness = Number(value);
    }

}