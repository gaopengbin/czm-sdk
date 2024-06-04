import { SceneTree } from "src/lib";

export default abstract class BaseWidget extends HTMLElement {
    [x: string]: any;
    static #viewer: any;
    static #sceneTree: SceneTree;
    constructor() {
        super();
    }

    public get manifest() {
        return this._manifest;
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