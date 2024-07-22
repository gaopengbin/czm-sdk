import uuid from "@/lib/common/uuid";
import { Component } from "../core/decorators";
import BaseWidget from "../earth/base-widget";
import Template from "./scene-saver.html?raw";
import "./scene-saver.scss";
@Component({
    tagName: "czm-scene-saver",
    className: "czm-scene-saver",
    template: Template,
})
export default class SceneSaver extends BaseWidget {
    constructor() {
        super();
    }
    async onInit() {
        console.log("scene-saver init");
        this.$data = {
            sceneList: [],
        }

        if (localStorage.getItem('sceneList')) {
            this.$data.sceneList = JSON.parse(localStorage.getItem('sceneList') || '[]');
        }
    }

    saveScene() {
        const earth: any = this.mapView;
        const content = earth?.toJSON();
        const guid = uuid();
        this.$data.sceneList.push({
            guid: guid,
            name: '场景' + (this.$data.sceneList.length + 1),
            content: content,
        })
        // localStorage.setItem(guid, JSON.stringify(content));
        localStorage.setItem('sceneList', JSON.stringify(this.$data.sceneList));

    }

    removeScene(guid: string) {
        const index = this.$data.sceneList.findIndex((item: any) => item.guid === guid);
        if (index > -1) {
            this.$data.sceneList.splice(index, 1);
            localStorage.setItem('sceneList', JSON.stringify(this.$data.sceneList));
        }

    }

    loadScene(scene: any) {
        const earth: any = this.mapView;
        earth?.renderFromJson(scene);
    }
}