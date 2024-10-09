import { PostProcessStageLibrary } from "cesium";
import { Component } from "../core/decorators";
import BaseWidget from "../earth/base-widget";
import Template from "./effect.html?raw";
import "./effect.scss"
import { Popover } from "bootstrap";
@Component({
    tagName: "czm-effect",
    className: "czm-effect",
    template: Template,
    hasConfig: true
})
export default class Effect extends BaseWidget {
    constructor() {
        super();
    }

    public async onInit() {
        console.log(this.config)
        this.$data = {
            ...this.config,
            // effects: [
            //     {
            //         type: 'Bloom',
            //         name: '泛光',
            //         icon: 'bi-lightbulb',
            //         open: true,
            //     },
            //     {
            //         type: 'DepthOfField',
            //         name: '景深',
            //         icon: 'bi-hypnotize',
            //         open: false,
            //     },
            //     {
            //         type: 'HDR',
            //         name: 'HDR',
            //         icon: 'bi-badge-hd',
            //         open: false,
            //     },
            //     {
            //         type: 'FXAA',
            //         name: '抗锯齿',
            //         icon: 'bi-gear-wide',
            //         open: false,
            //     },
            // ]
        }
    }

    public afterInit(): Promise<void> {
        const popoverTriggerList = this.querySelectorAll('[data-bs-toggle="popover"]');
        popoverTriggerList.forEach((element: any) => {
            new Popover(element);
        });
        this.initEffect();
        return Promise.resolve();
    }

    initEffect = () => {
        this.$data.effects.forEach((effect: any) => {
            const open = effect.open;
            this.setEffect(effect, open);
        });
    }


    handleChangeEffect = (effect: any) => {
        setTimeout(() => {
            const open = (this.querySelector('.btn-check#' + effect.type) as HTMLInputElement).checked;
            this.setEffect(effect, open);
            effect.open = open;
        }, 10);
    }

    setEffect = (effect: any, open: boolean) => {
        switch (effect.type) {
            case 'Bloom':
                this.setBloom(open);
                break;
            case 'DepthOfField':
                this.setDepthOfField(open);
                break;
            case 'HDR':
                this.setHDR(open);
                break;
            case 'FXAA':
                this.setFXAA(open);
                break;
            default:
                break;
        }
    }

    setBloom = (enabled: boolean) => {
        this.viewer.scene.postProcessStages.bloom.enabled = enabled;
    }

    setDepthOfField = (enabled: boolean) => {
        if (!this.depthOfField) {
            this.depthOfField = this.viewer.scene.postProcessStages.add(
                PostProcessStageLibrary.createDepthOfFieldStage(),
            );
        }
        this.depthOfField.enabled = enabled;
    }

    setHDR = (enabled: boolean) => {
        this.viewer.scene.highDynamicRange = enabled;
    }

    setFXAA = (enabled: boolean) => {
        this.viewer.scene.postProcessStages.fxaa.enabled = enabled;
    }

    toJSON() {
        let widgetConfig = this.widgetConfig;
        widgetConfig.config = this.$data;
        return widgetConfig;
    }
}
