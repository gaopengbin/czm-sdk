// 为这个元素创建类
class MyCustomElement extends HTMLElement {
    static observedAttributes = ["color", "size"];

    constructor() {
        // 必须首先调用 super 方法
        super();
    }

    connectedCallback() {
        console.log("自定义元素添加至页面。");
    }

    disconnectedCallback() {
        console.log("自定义元素从页面中移除。");
    }

    adoptedCallback() {
        console.log("自定义元素移动至新页面。");
    }

    attributeChangedCallback(name, oldValue, newValue) {
        console.log(`属性 ${name} 已变更。`);
    }
}

export default customElements.define("basic-test", MyCustomElement);
