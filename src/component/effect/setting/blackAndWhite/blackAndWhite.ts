import { Component } from "@/component/core/decorators";
import BaseWidget from "@/component/earth/base-widget";
import Template from "./blackAndWhite.html?raw";
import { PostProcessStage } from "cesium";
import "./blackAndWhite.scss"

@Component({
    tagName: "czm-effect-blackandwhite",
    className: "czm-effect-blackandwhite",
    template: Template,
    hasConfig: false
})
export default class BlackAndWhite extends BaseWidget {
    constructor(blackAndWhiteStage: PostProcessStage, config: any) {
        super();
        this.blackAndWhiteStage = blackAndWhiteStage;
        this.config = config;
    }

    public async onInit() {
        this.$data = {
            blackAndWhiteShow: this.config.blackAndWhiteShow,
            blackAndWhiteValue: this.config.blackAndWhiteValue,
        }
    }

    changeblackAndWhiteShow(event: any) {
        const value = event.target.checked;
        this.$data.blackAndWhiteShow = value;
        this.blackAndWhiteStage.enabled = value;
    }

    changeblackAndWhiteValue(value: number) {
        this.$data.blackAndWhiteValue = Number(value);
        this.blackAndWhiteStage.uniforms.gradations = Number(value);
    }

}