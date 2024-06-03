
export default class BaseWidget extends HTMLElement {
    [x: string]: any;

    constructor() {
        super();
    }

    public get manifest() {
        return this._manifest;
    }

    connectedCallback() {
        console.log("自定义元素添加至页面。",this);
        // 渲染模板
        if (this._manifest.template) {
            this.innerHTML = this._manifest.template;
        }
        this.afterInit();
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

    public async afterInit() { }
}
