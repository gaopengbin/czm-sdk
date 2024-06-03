import { Component } from './decorators'
import Template from './test.html?raw';

import BaseEarth from "../earth/base-earth"
import './test.scss'
@Component({
    tagName: 'basic-test',
    className: 'basic-test',
    template: Template,
})

export default class Test extends BaseEarth {
    // viewer: any;
    constructor() {
        super();
    }
    async earthReady(): Promise<void> {
        console.log("earthReady", this.viewer);
    }
}
