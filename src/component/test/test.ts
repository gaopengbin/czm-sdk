import { Component } from './decorators'
import Template from './test.html?raw';

@Component({
    tagName: 'basic-test',
    className: 'basic-test',
    template: Template,
})
export default class Test extends HTMLElement {
    constructor() {
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
