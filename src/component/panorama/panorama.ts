import { Component } from "../core/decorators";
import BaseWidget from "../earth/base-widget";
import Template from "./panorama.html?raw";
import "./panorama.scss";
import { Viewer } from "@photo-sphere-viewer/core";
import { GalleryPlugin } from "@photo-sphere-viewer/gallery-plugin";
import "@photo-sphere-viewer/core/index.css"
import "@photo-sphere-viewer/gallery-plugin/index.css"

@Component({
    tagName: "czm-panorama",
    className: "czm-panorama",
    template: Template,
})
export default class Panorama extends BaseWidget {
    constructor() {
        super();
    }

    async onInit() {
        let url = this.config.url;
        let urls = this.config.urls;
        console.log(url);
        if (urls) {
            this.pviewer = new Viewer({
                container: '#panoramaDiv',
                panorama: urls[0].panorama,
                plugins: [
                    [GalleryPlugin, {
                        items: urls,
                        visibleOnLoad: true
                    }],
                ]
            });
        } else if (url) {
            this.pviewer = new Viewer({
                container: '#panoramaDiv',
                panorama: url,
            });
        }

        console.log(this.pviewer);
    }

    onClose() {
        console.log("destroy panorama", this.parentNode?.parentNode?.parentElement?.parentNode);
        // this.parentNode?.parentNode?.parentElement?.parentNode?.destroy();
    }


}