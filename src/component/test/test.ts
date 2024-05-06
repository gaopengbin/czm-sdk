import { Component } from './decorators'
import Template from './test.html?raw';

@Component({
    tagName: 'basic-test',
    className: 'basic-test',
    template: Template,
})
export default class Test  extends HTMLElement{
    constructor() {
        super();
    }
}
