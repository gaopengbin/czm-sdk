import { Cartesian4, Color, PostProcessStage, PostProcessStageLibrary } from "cesium";
import { Component } from "../core/decorators";
import BaseWidget from "../earth/base-widget";
import Template from "./effect.html?raw";
import "./effect.scss"
import { Popover } from "bootstrap";
import { creatPanel, isWebGL2Supported } from "@/lib";
import Brightness from "./setting/brightness/brightness";
import BlackAndWhite from "./setting/blackAndWhite/blackAndWhite";
import DepthOfField from "./setting/depthOfField/depthOfField";
import { Cloud } from "@/lib/cesium/CustomPrimitive/Cloud";
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
        this.$data = {
            ...this.config,

            // "effects": [
            //     {
            //         "type": "Bloom",
            //         "name": "泛光",
            //         "icon": "bi-lightbulb",
            //         "open": false
            //     },
            //     {
            //         "type": "Silhouette",
            //         "name": "描边",
            //         "icon": "bi-houses",
            //         "open": false
            //     },
            //     {
            //         "type": "DepthOfField",
            //         "name": "景深",
            //         "icon": "bi-hypnotize",
            //         "open": false,
            //         "config": {
            //             "focalDistance": 90,
            //             "delta": 1,
            //             "sigma": 3.8,
            //             "stepSize": 2
            //         }
            //     },
            //     {
            //         "type": "HDR",
            //         "name": "HDR",
            //         "icon": "bi-badge-hd",
            //         "open": false
            //     },
            //     {
            //         "type": "FXAA",
            //         "name": "抗锯齿",
            //         "icon": "bi-gear-wide",
            //         "open": false
            //     },
            //     {
            //         "type": "Mosaic",
            //         "name": "马赛克",
            //         "icon": "bi-grid-3x3-gap",
            //         "open": false
            //     },
            //     {
            //         "type": "BlackAndWhite",
            //         "name": "黑白",
            //         "icon": "bi-circle-half",
            //         "open": false,
            //         "config": {
            //             "blackAndWhiteValue": 5
            //         }
            //     },
            //     {
            //         "type": "NightVision",
            //         "name": "夜视",
            //         "icon": "bi-binoculars",
            //         "open": false
            //     },
            //     {
            //         "type": "Brightness",
            //         "name": "亮度",
            //         "icon": "bi-brightness-alt-high",
            //         "open": true,
            //         "config": {
            //             "brightnessValue": 1.0
            //         }
            //     },
            //     {
            //         "type": "Cloud",
            //         "name": "云",
            //         "icon": "bi-cloud",
            //         "open": false
            //     },
            //     {
            //         "type": "Rain",
            //         "name": "雨",
            //         "icon": "bi-cloud-rain",
            //         "open": false
            //     },
            //     {
            //         "type": "Snow",
            //         "name": "雪",
            //         "icon": "bi-cloud-snow",
            //         "open": false
            //     },
            //     {
            //         "type": "Fog",
            //         "name": "雾",
            //         "icon": "bi-cloud-fog2",
            //         "open": false
            //     }
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
            this.setEffect(effect, open, null);
        });
    }


    handleChangeEffect = (effect: any, event: any) => {
        setTimeout(() => {
            if (effect.config) {
                const open = (this.querySelector('#' + effect.type) as HTMLInputElement).className.includes('active');
                this.setEffect(effect, open, event);
            } else {
                const open = (this.querySelector('.btn-check#' + effect.type) as HTMLInputElement).checked;
                this.setEffect(effect, open, event);
                effect.open = open;
            }
        }, 10);
    }

    setEffect = (effect: any, open: boolean, event: any) => {
        switch (effect.type) {
            case 'Bloom':
                this.setBloom(open);
                break;
            case 'Silhouette':
                this.setSilhouette(open);
                break
            case 'DepthOfField':
                this.setDepthOfField(effect, open, event);
                break;
            case 'HDR':
                this.setHDR(open);
                break;
            case 'FXAA':
                this.setFXAA(open);
                break;
            case 'Mosaic':
                this.setMosaic(open);
                break;
            case 'Fog':
                this.setFog(open);
                break;
            case 'BlackAndWhite':
                this.setBlackAndWhite(effect, open, event);
                break;
            case 'NightVision':
                this.setNightVision(open);
                break;
            case 'Brightness':
                this.setBrightness(effect, open, event);
                break;
            case 'Rain':
                this.setRain(open);
                break;
            case 'Snow':
                this.setSnow(open);
                break;
            case 'Cloud':
                this.setCloud(open);
                break;
            default:
                break;
        }
    }

    setBloom = (enabled: boolean) => {
        this.viewer.scene.postProcessStages.bloom.enabled = enabled;
    }

    setSilhouette = (enabled: boolean) => {
        if (!this.silhouette) {
            this.silhouette = this.viewer.scene.postProcessStages.add(PostProcessStageLibrary.createSilhouetteStage());
            this.silhouette.uniforms.color = Color.GREENYELLOW;
        }
        this.silhouette.enabled = enabled;
    }

    setDepthOfField = (effect: any, enabled: boolean, event: any) => {
        if (!this.depthOfField) {
            this.depthOfField = this.viewer.scene.postProcessStages.add(
                PostProcessStageLibrary.createDepthOfFieldStage(),
            );
            this.depthOfField.enabled = enabled;
            this.depthOfField.uniforms.focalDistance = effect.config.focalDistance;
            this.depthOfField.uniforms.delta = effect.config.delta;
            this.depthOfField.uniforms.sigma = effect.config.sigma;
            this.depthOfField.uniforms.stepSize = effect.config.stepSize;
        }
        if (event) {
            const postion = event.target.getBoundingClientRect()
            const panel = creatPanel({
                mapView: this.mapView,
                viewer: this.viewer,
                config: {
                    label: '景深',
                    icon: 'bi-hypnotize',
                    position: {
                        left: postion.left + postion.width + 20,
                        top: postion.top,
                        height: '320px'
                    }
                },
                globalConfig: this.globalConfig,
                widget: new DepthOfField(this.depthOfField, {
                    show: enabled,
                    focalDistance: this.depthOfField.uniforms.focalDistance,
                    delta: this.depthOfField.uniforms.delta,
                    sigma: this.depthOfField.uniforms.sigma,
                    stepSize: this.depthOfField.uniforms.stepSize,
                })
            })
            panel.onClose = () => {
                this.setBtnActive('DepthOfField', panel.widget.$data.show);
                effect.open = panel.widget.$data.show;
                effect.config.focalDistance = panel.widget.$data.focalDistance;
                effect.config.delta = panel.widget.$data.delta;
                effect.config.sigma = panel.widget.$data.sigma;
                effect.config.stepSize = panel.widget.$data.stepSize;
            }
        }
    }

    setHDR = (enabled: boolean) => {
        this.viewer.scene.highDynamicRange = enabled;
    }

    setFXAA = (enabled: boolean) => {
        this.viewer.scene.postProcessStages.fxaa.enabled = enabled;
    }

    setMosaic = (enabled: boolean) => {
        if (!this.mosaic) {
            const fragmentShaderSource = `
                uniform sampler2D colorTexture;
                in vec2 v_textureCoordinates;
                const int KERNEL_WIDTH = 16;
                void main(void)
                {
                    vec2 step = czm_pixelRatio / czm_viewport.zw;
                    vec2 integralPos = v_textureCoordinates - mod(v_textureCoordinates, 8.0 * step);
                    vec3 averageValue = vec3(0.0);
                    for (int i = 0; i < KERNEL_WIDTH; i++)
                    {
                        for (int j = 0; j < KERNEL_WIDTH; j++)
                        {
                            averageValue += texture(colorTexture, integralPos + step * vec2(i, j)).rgb;
                        }
                    }
                    averageValue /= float(KERNEL_WIDTH * KERNEL_WIDTH);
                    out_FragColor = vec4(averageValue, 1.0);
                }
                `;
            this.mosaic = this.viewer.scene.postProcessStages.add(
                new PostProcessStage({
                    fragmentShader: fragmentShaderSource,
                }),
            );
        }
        this.mosaic.enabled = enabled;
    }

    setFog = (enabled: boolean) => {
        if (!this.fog) {
            const fragmentShaderSource = `
            float getDistance(sampler2D depthTexture, vec2 texCoords)
            {
                float depth = czm_unpackDepth(texture(depthTexture, texCoords));
                if (depth == 0.0) {
                    return czm_infinity;
                }
                vec4 eyeCoordinate = czm_windowToEyeCoordinates(gl_FragCoord.xy, depth);
                return -eyeCoordinate.z / eyeCoordinate.w;
            }
            float interpolateByDistance(vec4 nearFarScalar, float distance)
            {
                float startDistance = nearFarScalar.x;
                float startValue = nearFarScalar.y;
                float endDistance = nearFarScalar.z;
                float endValue = nearFarScalar.w;
                float t = clamp((distance - startDistance) / (endDistance - startDistance), 0.0, 1.0);
                return mix(startValue, endValue, t);
            }
            vec4 alphaBlend(vec4 sourceColor, vec4 destinationColor)
            {
                return sourceColor * vec4(sourceColor.aaa, 1.0) + destinationColor * (1.0 - sourceColor.a);
            }
            uniform sampler2D colorTexture;
            uniform sampler2D depthTexture;
            uniform vec4 fogByDistance;
            uniform vec4 fogColor;
            in vec2 v_textureCoordinates;
            void main(void)
            {
                float distance = getDistance(depthTexture, v_textureCoordinates);
                vec4 sceneColor = texture(colorTexture, v_textureCoordinates);
                float blendAmount = interpolateByDistance(fogByDistance, distance);
                vec4 finalFogColor = vec4(fogColor.rgb, fogColor.a * blendAmount);
                out_FragColor = alphaBlend(finalFogColor, sceneColor);
            }
            `;
            this.fog = this.viewer.scene.postProcessStages.add(
                new PostProcessStage({
                    fragmentShader: fragmentShaderSource,
                    uniforms: {
                        fogByDistance: new Cartesian4(10, 0.0, 2000, 1.0),
                        fogColor: Color.WHITE,
                    }
                }),
            );
        }
        this.fog.enabled = enabled;
    }

    setBlackAndWhite = (effect: any, enabled: boolean, event: any) => {
        if (!this.blackAndWhite) {
            this.blackAndWhite = this.viewer.scene.postProcessStages.add(
                PostProcessStageLibrary.createBlackAndWhiteStage(),
            );
            this.blackAndWhite.enabled = enabled;
            this.blackAndWhite.uniforms.gradations = effect.config.blackAndWhiteValue;
        }
        if (event) {
            const postion = event.target.getBoundingClientRect()
            const panel = creatPanel({
                mapView: this.mapView,
                viewer: this.viewer,
                config: {
                    label: '黑白',
                    icon: 'bi-brightness-high',
                    position: {
                        left: postion.left + postion.width + 20,
                        top: postion.top,
                    }
                },
                globalConfig: this.globalConfig,
                widget: new BlackAndWhite(this.blackAndWhite, {
                    blackAndWhiteShow: enabled,
                    blackAndWhiteValue: this.blackAndWhite.uniforms.gradations,
                })
            })
            panel.onClose = () => {
                this.setBtnActive('BlackAndWhite', panel.widget.$data.blackAndWhiteShow);
                effect.open = panel.widget.$data.blackAndWhiteShow;
                effect.config.blackAndWhiteValue = panel.widget.$data.blackAndWhiteValue;
            }
        }

    }

    setNightVision = (enabled: boolean) => {
        if (!this.nightVision) {
            this.nightVision = this.viewer.scene.postProcessStages.add(
                PostProcessStageLibrary.createNightVisionStage(),
            );
        }
        this.nightVision.enabled = enabled;
    }

    setBrightness = (effect: any, enabled: boolean, event: any) => {
        if (!this.brightness) {
            this.brightness = this.viewer.scene.postProcessStages.add(
                PostProcessStageLibrary.createBrightnessStage(),
            );
            this.brightness.enabled = enabled;
            this.brightness.uniforms.brightness = effect.config.brightnessValue;
        }
        if (event) {
            const postion = event.target.getBoundingClientRect()
            const panel = creatPanel({
                mapView: this.mapView,
                viewer: this.viewer,
                config: {
                    label: '亮度',
                    icon: 'bi-brightness-high',
                    position: {
                        left: postion.left + postion.width + 20,
                        top: postion.top,
                    }
                },
                globalConfig: this.globalConfig,
                widget: new Brightness(this.brightness, {
                    brightnessShow: enabled,
                    brightnessValue: this.brightness.uniforms.brightness,
                })
            })
            panel.onClose = () => {
                this.setBtnActive('Brightness', panel.widget.$data.brightnessShow);
                effect.open = panel.widget.$data.brightnessShow;
                effect.config.brightnessValue = panel.widget.$data.brightnessValue;
            }
        }
    }

    setRain = (enabled: boolean) => {
        if (!this.rain) {
            const fs_webgl2 = `
            uniform sampler2D colorTexture;
                    in vec2 v_textureCoordinates;
                    uniform float tiltAngle;
                    uniform float rainSize;
                    uniform float rainWidth;
                    uniform float rainSpeed;
                    float hash(float x){
                        return fract(sin(x*233.3)*13.13);
                    }
                    out vec4 vFragColor;
                    void main(void){
                        float time = czm_frameNumber / rainSpeed;
                        vec2 resolution = czm_viewport.zw;
                        vec2 uv=(gl_FragCoord.xy*2.-resolution.xy)/min(resolution.x,resolution.y);
                        vec3 c=vec3(1.0,1.0,1.0);
                        float a= tiltAngle;
                        float si=sin(a),co=cos(a);
                        uv*=mat2(co,-si,si,co);
                        uv*=length(uv+vec2(0,4.9))*rainSize + 1.;
                        float v = 1.0 - abs(sin(hash(floor(uv.x * rainWidth)) * 2.0));
                        float b=clamp(abs(sin(20.*time*v+uv.y*(5./(2.+v))))-.95,0.,1.)*20.;
                        c*=v*b;
                        vFragColor = mix(texture(colorTexture, v_textureCoordinates), vec4(c,.3), .3);
                    }
            `;
            const fs_webgl1 = `
            uniform sampler2D colorTexture;
            varying vec2 v_textureCoordinates;
            uniform float tiltAngle;
            uniform float rainSize;
            uniform float rainWidth;
            uniform float rainSpeed;
            float hash(float x){
                return fract(sin(x*233.3)*13.13);
            }
            void main(void){
                float time = czm_frameNumber / rainSpeed;
                vec2 resolution = czm_viewport.zw;
                vec2 uv=(gl_FragCoord.xy*2.-resolution.xy)/min(resolution.x,resolution.y);
                vec3 c=vec3(1.0,1.0,1.0);
                float a= tiltAngle;
                float si=sin(a),co=cos(a);
                uv*=mat2(co,-si,si,co);
                uv*=length(uv+vec2(0,4.9))*rainSize + 1.;
                float v = 1.0 - abs(sin(hash(floor(uv.x * rainWidth)) * 2.0));
                float b=clamp(abs(sin(20.*time*v+uv.y*(5./(2.+v))))-.95,0.,1.)*20.;
                c*=v*b;
                gl_FragColor = mix(texture2D(colorTexture, v_textureCoordinates), vec4(c,.3), .3);
            }
            `;
            const fs = isWebGL2Supported() ? fs_webgl2 : fs_webgl1;
            this.rain = this.viewer.scene.postProcessStages.add(
                new PostProcessStage({
                    fragmentShader: fs,
                    uniforms: {
                        tiltAngle: 0.5, // 倾斜角度
                        rainSize: 0.6, // 雨大小
                        rainWidth: 20, //雨长度
                        rainSpeed: 90, //雨速
                    },
                }),
            );
        }
        this.rain.enabled = enabled;
    }

    setSnow = (enabled: boolean) => {
        if (!this.snow) {
            const fs_webgl2 = `uniform sampler2D colorTexture;
                        in vec2 v_textureCoordinates;
                        uniform float snowSpeed;
                        float snow(vec2 uv,float scale){
                            float time = czm_frameNumber / snowSpeed;
                            float w=smoothstep(1.,0.,-uv.y*(scale/10.));if(w<.1)return 0.;
                            uv+=time/scale;uv.y+=time*2./scale;uv.x+=sin(uv.y+time*.5)/scale;
                            uv*=scale;vec2 s=floor(uv),f=fract(uv),p;float k=3.,d;
                            p=.5+.35*sin(11.*fract(sin((s+p+scale)*mat2(7,3,6,5))*5.))-f;d=length(p);k=min(d,k);
                            k=smoothstep(0.,k,sin(f.x+f.y)*0.01);
                            return k*w;
                        }
                        out vec4 vFragColor;
                        void main(void){
                            vec2 resolution = czm_viewport.zw;
                            vec2 uv=(gl_FragCoord.xy*2.-resolution.xy)/min(resolution.x,resolution.y);
                            vec3 finalColor=vec3(0);
                            float c = 0.0;
                            c+=snow(uv,50.)*.0;
                            c+=snow(uv,30.)*.0;
                            c+=snow(uv,10.)*.0;
                            c+=snow(uv,5.);
                            c+=snow(uv,4.);
                            c+=snow(uv,3.);
                            c+=snow(uv,2.);
                            finalColor=(vec3(c));
                            vFragColor = mix(texture(colorTexture, v_textureCoordinates), vec4(finalColor,1), 0.3);
                        }
                    `;
            const fs_webgl1 = `
            uniform sampler2D colorTexture;
            varying vec2 v_textureCoordinates;
            uniform float snowSpeed;
            float snow(vec2 uv,float scale){
                float time = czm_frameNumber / snowSpeed;
                float w=smoothstep(1.,0.,-uv.y*(scale/10.));if(w<.1)return 0.;
                uv+=time/scale;uv.y+=time*2./scale;uv.x+=sin(uv.y+time*.5)/scale;
                uv*=scale;vec2 s=floor(uv),f=fract(uv),p;float k=3.,d;
                p=.5+.35*sin(11.*fract(sin((s+p+scale)*mat2(7,3,6,5))*5.))-f;d=length(p);k=min(d,k);
                k=smoothstep(0.,k,sin(f.x+f.y)*0.01);
                return k*w;
            }
            void main(void){
                vec2 resolution = czm_viewport.zw;
                vec2 uv=(gl_FragCoord.xy*2.-resolution.xy)/min(resolution.x,resolution.y);
                vec3 finalColor=vec3(0);
                float c = 0.0;
                c+=snow(uv,50.)*.0;
                c+=snow(uv,30.)*.0;
                c+=snow(uv,10.)*.0;
                c+=snow(uv,5.);
                c+=snow(uv,4.);
                c+=snow(uv,3.);
                c+=snow(uv,2.);
                finalColor=(vec3(c));
                gl_FragColor = mix(texture2D(colorTexture, v_textureCoordinates), vec4(finalColor,1), 0.3);
            }
            `;
            const fs = isWebGL2Supported() ? fs_webgl2 : fs_webgl1;
            this.snow = this.viewer.scene.postProcessStages.add(
                new PostProcessStage({
                    fragmentShader: fs,
                    uniforms: {
                        snowSpeed: 90, //雪速
                    },
                }),
            );
        }
        this.snow.enabled = enabled;
    }

    setCloud = (enabled: boolean) => {
        if (!this.cloud) {
            this.cloud = new Cloud(this.viewer);
        }
        this.cloud.enabled = enabled;
    }

    setBtnActive = (type: string, active: boolean) => {
        const btn = this.querySelector('#' + type) as HTMLInputElement;
        if (active) {
            btn.classList.contains('active') ? null : btn.classList.add('active');
        } else {
            btn.classList.contains('active') ? btn.classList.remove('active') : null;
        }

    }

    toJSON() {
        let widgetConfig = this.widgetConfig;
        widgetConfig.config = this.$data;
        return widgetConfig;
    }
}
