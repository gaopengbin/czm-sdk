import { Cesium3DTileStyle, Color } from "cesium";
import { Component } from "../core/decorators";
import BaseWidget from "../earth/base-widget";
import Template from "./style-setting.html?raw";
import "./style-setting.scss"
import { defaultStyles } from "./defaultStyle";
@Component({
    tagName: "style-setting",
    className: "style-setting",
    template: Template,
})
export default class StyleSetting extends BaseWidget {
    constructor() {
        super();
    }
    public async beforeInit() {
        console.log('style-setting init', this.config)
        this.$data = {
            // Cesium3DTiles 参数
            cacheBytes: 0,
            maximumScreenSpaceError: 16,
            classificationType: 3,
            defaultStyles: defaultStyles,
            currentStyle: defaultStyles[0],
            type: 'tileset',
            // 影像参数
            alpha: 1.0,
            brightness: 1.0,
            contrast: 1.0,
            gamma: 1.0,
            hue: 0.0,
            saturation: 1.0,
            // 地形参数
            exaggeration: 1.0,
            relativeHeight: 0.0,
        }
        this.$data.type = this.config.layer.toJSON().type;
        if (this.$data.type === 'tileset') {
            const tileset = this.config.layer._tileset;
            this.$data.cacheBytes = tileset.cacheBytes / (1024 * 1024);
            this.$data.maximumScreenSpaceError = tileset.maximumScreenSpaceError;
            this.$data.classificationType = tileset.classificationType ?? 3;
        } else if (this.$data.type === 'terrain') {
            this.$data.exaggeration = this.viewer.scene.verticalExaggeration;
            this.$data.relativeHeight = this.viewer.scene.verticalExaggerationRelativeHeight;
        } else if (this.$data.type === 'model') {
            const model = this.config.layer._model.model;
            this.$data.scale = model.scale ?? 1.0;
            this.$data.silhouetteSize = model.silhouetteSize ?? 0.0;
            const silhouetteColor = model.silhouetteColor ?? Color.RED;
            this.$data.silhouetteColor = silhouetteColor.toCssColorString();

        } else {
            const imageryLayer = this.config.layer._imageLayer;
            this.$data.alpha = imageryLayer.alpha;
            this.$data.brightness = imageryLayer.brightness;
            this.$data.contrast = imageryLayer.contrast;
            this.$data.gamma = imageryLayer.gamma;
            this.$data.hue = imageryLayer.hue;
            this.$data.saturation = imageryLayer.saturation;
        }
    }

    public async onInit() {
    }
    // ----------Cesium3DTiles 参数 ------------//
    // Cesium3DTileStyle
    styleChange(index: number) {
        this.$data.currentStyle = defaultStyles[index];
        const styleTextarea = this.querySelector('#styleTextarea') as HTMLTextAreaElement;
        styleTextarea.value = JSON.stringify(this.$data.currentStyle.style, null, 4);
    }

    apply() {
        const styleTextarea = this.querySelector('#styleTextarea') as HTMLTextAreaElement;
        const style = JSON.parse(styleTextarea.value);
        console.log('style', style)
        const tileset = this.config.layer._tileset;
        tileset.style = new Cesium3DTileStyle(style);
    }
    //GPU Memory
    cacheBytesChange(val: number) {
        this.$data.cacheBytes = val;
        const tileset = this.config.layer._tileset;
        tileset.cacheBytes = Number(val) * 1024 * 1024;
    }
    //Maximum Screen Space Error
    maximumScreenSpaceErrorChange(val: number) {
        this.$data.maximumScreenSpaceError = val;
        const tileset = this.config.layer._tileset;
        tileset.maximumScreenSpaceError = Number(val);
    }
    //Classification Type
    classificationTypeChange(val: string) {
        this.$data.classificationType = val;
        const tileset = this.config.layer._tileset;
        tileset.classificationType = val;
    }

    // ----------影像参数 ------------//
    alphaChange(val: any) {
        this.$data.alpha = val;
        const imageryLayer = this.config.layer._imageLayer;
        imageryLayer.alpha = val;
    }

    brightnessChange(val: any) {
        this.$data.brightness = val;
        const imageryLayer = this.config.layer._imageLayer;
        imageryLayer.brightness = val;
    }

    contrastChange(val: any) {
        this.$data.contrast = val;
        const imageryLayer = this.config.layer._imageLayer;
        imageryLayer.contrast = val;
    }

    gammaChange(val: any) {
        this.$data.gamma = val;
        const imageryLayer = this.config.layer._imageLayer;
        imageryLayer.gamma = val;
    }

    hueChange(val: any) {
        this.$data.hue = val;
        const imageryLayer = this.config.layer._imageLayer;
        imageryLayer.hue = val;
    }

    saturationChange(val: any) {
        this.$data.saturation = val;
        const imageryLayer = this.config.layer._imageLayer;
        imageryLayer.saturation = val;
    }

    exaggerationChange(val: number) {
        this.$data.exaggeration = val;
        this.viewer.scene.verticalExaggeration = Number(val);
    }

    relativeHeightChange(val: any) {
        this.$data.relativeHeight = val;
        this.viewer.scene.verticalExaggerationRelativeHeight = Number(val);
    }

    scaleChange(val: any) {
        this.$data.scale = val;
        const model = this.config.layer._model.model;
        model.scale = Number(val);
    }

    silhouetteSizeChange(val: any) {
        this.$data.silhouetteSize = val;
        const model = this.config.layer._model.model;
        model.silhouetteSize = Number(val);
    }

    silhouetteColorChange(val: any) {
        this.$data.silhouetteColor = val;
        const model = this.config.layer._model.model;
        model.silhouetteColor = Color.fromCssColorString(val);
    }
}