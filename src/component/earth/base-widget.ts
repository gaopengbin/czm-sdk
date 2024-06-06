import { mergeUrl } from "@/lib/startup/loader";
import { SceneTree } from "src/lib";

export default abstract class BaseWidget extends HTMLElement {
    [x: string]: any;
    static #viewer: any;
    static #sceneTree: SceneTree;
    static #globalConfig: any;
    _config: any;
    constructor() {
        super();
    }

    public startup(args: { mapView?: any; map?: any; config: any; mapConfig?: any; viewer?: any; globalConfig?: any; }) {
        this.viewer = args.viewer;
        this.config = args.config;
        this.globalConfig = args.globalConfig;
    }

    public get manifest() {
        return this._manifest;
    }

    set globalConfig(value) {
        BaseWidget.#globalConfig = value;
    }

    get globalConfig() {
        return BaseWidget.#globalConfig;
    }

    get config() {
        return this._config;
    }

    set config(value) {
        this._config = value;
    }

    /**
     * 配置加载完成
     */
    public configLoaded() {

    }

    async loadConfig(configUrl: any) {
        if (!this.config && configUrl) {
            // this.loading = true;
            configUrl = mergeUrl(configUrl);
            // 禁用缓存
            const response = await fetch(configUrl, {
                method: 'GET',
                headers: {
                    'Cache-Control': 'no-cache'
                }
            });
            this.config = response && response.ok && await response.json() || {};
            console.log(this.config);
            this.configLoaded();
            // this.loading = false;
        }
    }

    get viewer() {
        return BaseWidget.#viewer;
    }

    set viewer(value) {
        if (!BaseWidget.#viewer && value) {
            BaseWidget.#viewer = value;
            this.earthReady();
        }
    }

    get sceneTree() {
        return BaseWidget.#sceneTree;
    }

    set sceneTree(value) {
        BaseWidget.#sceneTree = value;
    }

    public earthReady() { }

    async connectedCallback() {
        // 获取配置
        if (this._manifest.hasConfig) {
            console.log(this.getAttribute('configUrl'), this.getAttribute('config'));
            this.loadConfig(this.getAttribute('configUrl') || this.getAttribute('config'));
        }
        // 渲染模板
        if (this._manifest.template) {
            this.innerHTML = this._manifest.template;
        }
        await this.afterInit();
    }

    disconnectedCallback() {
        console.log("自定义元素从页面中移除。");
    }

    adoptedCallback() {
        console.log("自定义元素移动至新页面。");
    }

    attributeChangedCallback(name: any, oldValue: any, newValue: any) {
        console.log(`属性 ${name} 已变更。`);
    }

    /**
     * 初始化
     */
    public async afterInit() {
    }
}

const getViewer = () => {
    return BaseWidget.prototype.viewer;
}

const getSceneTree = () => {
    return BaseWidget.prototype.sceneTree;
}



export {
    getViewer,
    getSceneTree,
}