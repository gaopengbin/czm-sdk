import { Component } from "../core/decorators";
import BaseWidget from "../earth/base-widget";
import Template from "./white-model.html?raw";
import "./white-model.scss";
@Component({
    tagName: "czm-white-model",
    className: "czm-white-model",
    template: Template,
})
export default class WhiteModel extends BaseWidget {
    constructor() {
        super();
    }
    async onInit(): Promise<void> {
        this.$data = {
            
        }
    }
}