import { Component } from '../core/decorators'
import { initScene, SceneTree, initViewer, getBrowserInfo, isWebGL2Supported } from '../../lib';
import BaseWidget from "./base-widget"
import { initEarth } from '@/lib/cesium/sceneTree/creator';
import './base-earth.scss'
import { Cartographic, Color, Ion, Math, Model, PostProcessStage, PostProcessStageLibrary, ScreenSpaceEventHandler, ScreenSpaceEventType } from 'cesium';
import GraphicManager from '@/lib/cesium/draw/core/GraphicManager';
import MarkerManager from '@/lib/cesium/draw/core/MarkerManager';
import WidgetIcon from '../widget-icon/widget-icon';
@Component({
    tagName: 'base-earth',
    className: 'base-earth',
    template: `<div id="earth"></div>`,
    hasConfig: true,
})

export default class BaseEarth extends BaseWidget {
    constructor() {
        super();
        // this.manifest.template = `<div id="s${this.id}"></div>`;
    }

    public configLoaded(): void {
        this.globalConfig = this.config;
        Ion.defaultAccessToken = this.config.earth.ionDefaultToken;
        this.Browser = getBrowserInfo();
        let options: any = {};
        if (this.config.earth.viewer) {
            options = this.config.earth.viewer.options;
        }

        this.initViewer(options);
        setTimeout(async () => {
            const { viewer } = this.config.earth;
            if (viewer) {
                initViewer(this.viewer, viewer);
            }
            await initEarth(this.sceneTree, this.config.earth);
        }, 500);

        const widgetManager = this.globalConfig?.widgetManager || 'czm-widget-manager';
        const widgetManagerEl = document.createElement(widgetManager) as BaseWidget;
        widgetManagerEl.startup({
            config: this.globalConfig.widgets,
            viewer: this.viewer,
            globalConfig: this.globalConfig,
            mapView: this
        });
        this.childNodes[0] ? this.insertBefore(widgetManagerEl, this.childNodes[0]) : this.appendChild(widgetManagerEl);

    }

    public async afterInit() {
        // this.initViewer();
    }

    public async earthReady() {

    }

    public isReady(): boolean {
        return true
    }

    initViewer(options?: any) {

        let opt = Object.assign({
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
            infoBox: false,
            selectionIndicator: false,
            msaaSamples: 4,
            shouldAnimate: true,
            contextOptions: {
                webgl: {
                    preserveDrawingBuffer: true
                },
                requestWebgl1: !isWebGL2Supported(),
                // requestWebgl1: true,
            }
        }, options);

        let viewer = initScene('earth', opt);

        this.viewer = viewer;
        this.graphicManager = new GraphicManager(viewer);
        this.markerManager = new MarkerManager(viewer);
        this.sceneTree = new SceneTree(viewer, this.graphicManager, this.markerManager);
        // window.viewer = viewer;
        // window.earth = this;
        // 模型拾取
        this.stages = this.viewer.scene.postProcessStages;
        // this.silhouette = this.stages.add(
        //     PostProcessStageLibrary.createSilhouetteStage()
        // );
        const fs_webgl2 = `
                    uniform sampler2D colorTexture;
                    in vec2 v_textureCoordinates;
                    uniform vec4 highlight;
                    void main() {
                        vec4 color = texture(colorTexture, v_textureCoordinates);
                        if (czm_selected()) {
                            vec3 highlighted = highlight.a * highlight.rgb + (1.0 - highlight.a) * color.rgb;
                            out_FragColor = vec4(highlighted, 1.0);
                        } else {
                            out_FragColor = color;
                        }
                    }`;
        const fs_webgl1 = `
                    uniform sampler2D colorTexture;
                    in vec2 v_textureCoordinates;
                    uniform vec4 highlight;
                    void main() {
                        vec4 color = texture2D(colorTexture, v_textureCoordinates);
                        if (czm_selected()) {
                            vec3 highlighted = highlight.a * highlight.rgb + (1.0 - highlight.a) * color.rgb;
                            gl_FragColor = vec4(highlighted, 1.0);
                        } else {
                            gl_FragColor = color;
                        }
                    }`;
        const fs = isWebGL2Supported() ? fs_webgl2 : fs_webgl1;
        const stage = this.stages.add(new PostProcessStage({
            fragmentShader: fs,
            uniforms: {
                highlight: function () {
                    return new Color(1.0, 1.0, 1.0, 0.5);
                }
            }
        }));
        this.silhouette = stage;
        // this.silhouette.uniforms.color = Color.AQUA.withAlpha(0.5);
        // this.silhouette.uniforms.length = 0.01;
        stage.selected = [];
        const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
        handler.setInputAction((movement: any) => {
            const identify = document.querySelector('czm-identify');
            if (identify && identify.parentNode?.parentNode?.parentNode?.parentElement?.classList?.contains('czm-widget-icon-open')) {
                // 正在拾取属性
                return
            }
            const modelList = document.querySelector('czm-model-list');
            if (modelList && modelList.parentNode?.parentNode?.parentNode?.parentElement?.classList?.contains('czm-widget-icon-open')) {
                // 正在拾取属性
                return
            }
            const pickedObject = viewer.scene.pick(movement.position);
            if (pickedObject) {
                const id = pickedObject.id;
                if (pickedObject.primitive && pickedObject.primitive instanceof Model) {
                    const model = pickedObject.primitive;
                    const cmodel = this.sceneTree.getLayerByGuid(id);
                    if (cmodel && cmodel.onclick) {
                        cmodel.onclick()
                    }
                }
            }
        }, ScreenSpaceEventType.LEFT_CLICK);
        // handler.setInputAction((movement: any) => {
        //     // return
        //     const identify = document.querySelector('czm-identify');
        //     if (identify && identify.parentNode?.parentNode?.parentNode?.parentElement?.classList?.contains('czm-widget-icon-open')) {
        //         // 正在拾取属性
        //         return
        //     }

        //     const pickedObject = viewer.scene.pick(movement.endPosition);
        //     if (pickedObject) {
        //         const id = pickedObject.id;
        //         if (pickedObject.primitive && pickedObject.primitive instanceof Model) {
        //             // 鼠标移动到模型上，样式变为pointer
        //             viewer.scene.canvas.style.cursor = 'pointer';
        //             this.silhouette.selected = [pickedObject.primitive];
        //         } else {
        //             viewer.scene.canvas.style.cursor = 'default';
        //             this.silhouette.selected = [];
        //         }
        //     } else {
        //         viewer.scene.canvas.style.cursor = 'default';
        //         this.silhouette.selected = [];
        //     }
        // }, ScreenSpaceEventType.MOUSE_MOVE);
    }

    renderFromJson(config: any) {
        if (config) {
            const wm = this.querySelector('czm-widget-manager');
            wm?.remove();
            if (this.viewer) {
                this.viewer.destroy();
                this.viewer = null;
            }
            this.config = config;
            this.configLoaded();
        }
    }

    toJSON() {
        const layers = this.sceneTree.root.toJSON().children;
        let baseLayers = this.config.earth.baseLayers;
        const ionDefaultToken = this.config.earth.viewer.ionDefaultToken ?? '';
        const currentPositon = this.viewer.camera.position;
        // 转为经纬度
        const cartographic = Cartographic.fromCartesian(currentPositon);
        const position = [
            Math.toDegrees(cartographic.longitude),
            Math.toDegrees(cartographic.latitude),
            cartographic.height
        ];

        const heading = this.viewer.camera.heading;
        const pitch = this.viewer.camera.pitch;
        const roll = this.viewer.camera.roll;
        const hpr = [
            Math.toDegrees(heading),
            Math.toDegrees(pitch),
            Math.toDegrees(roll)
        ];

        const baseLayerWidget: any = this.querySelector('base-layer');
        if (baseLayerWidget) {
            const selectedImageryIndex = baseLayerWidget.selectedImageryIndex;
            const selectedTerrainIndex = baseLayerWidget.selectedTerrainIndex;
            let imageries = [], terrains = [];
            if (selectedImageryIndex > -1) {
                imageries = baseLayers.filter((layer: any) => layer.type !== 'terrain');
                imageries = imageries.map((layer: any, index: number) => {
                    layer.isDefault = index === selectedImageryIndex;
                    return layer;
                });
            }
            if (selectedTerrainIndex > -1) {
                terrains = baseLayers.filter((layer: any) => layer.type === 'terrain');
                terrains = terrains.map((layer: any, index: number) => {
                    layer.isDefault = index === selectedTerrainIndex;
                    return layer;
                });
            }
            baseLayers = [...imageries, ...terrains];
        }

        // const graphicManager = this.graphicManager.toJSON();
        const widgetManager = this.querySelector('czm-widget-manager') as BaseWidget;
        const widgets = widgetManager.widgets;
        const widgetConfigs: any = []
        widgets.forEach((widget: any) => {
            if (widget instanceof WidgetIcon) {
                if (widget.widget) {
                    let cfg = widget.widget.toJSON()
                    // let position = widget.getPanelPosition()
                    // cfg.position.width = position.w;
                    // cfg.position.height = position.h;
                    widgetConfigs.push(cfg)
                } else {
                    widgetConfigs.push(widget.toJSON())
                }
            } else {
                widgetConfigs.push(widget.toJSON())
            }
        })

        return {
            earth: {
                layers,
                baseLayers,
                // graphicManager,
                viewer: {
                    ionDefaultToken,
                    position,
                    hpr
                }
            },
            widgets: widgetConfigs
        }
    }
}
