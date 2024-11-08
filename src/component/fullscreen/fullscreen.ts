import { Component } from "../core/decorators";
import BaseWidget from "../earth/base-widget";
import Template from "./fullscreen.html?raw";
import "./fullscreen.scss";

@Component({
    tagName: "czm-fullscreen",
    className: "czm-fullscreen",
    template: Template,
})
export default class Fullscreen extends BaseWidget {
    constructor() {
        super();
    }

    async onInit() {
        this.$data = {
            isFullscreen: false,
        };
    }

    toggleFullscreen() {
        if (this.$data.isFullscreen) {
            this.exitFullscreen();
        } else {
            this.enterFullscreen();
        }
        this.updateIcon();
    }

    enterFullscreen() {
        const elem: any = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.mozRequestFullScreen) { // Firefox
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) { // Chrome, Safari and Opera
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) { // IE/Edge
            elem.msRequestFullscreen();
        }
        this.$data.isFullscreen = true;
        // this.forceRefresh();
    }

    exitFullscreen() {
        const dom: any = document;
        if (dom.exitFullscreen) {
            dom.exitFullscreen();
        } else if (dom.mozCancelFullScreen) { // Firefox
            dom.mozCancelFullScreen();
        } else if (dom.webkitExitFullscreen) { // Chrome, Safari and Opera
            dom.webkitExitFullscreen();
        } else if (dom.msExitFullscreen) { // IE/Edge
            dom.msExitFullscreen();
        }
        this.$data.isFullscreen = false;
        // this.forceRefresh();
    }

    updateIcon() {
        const enterIcon: any = this.querySelector('.bi-arrows-fullscreen');
        const exitIcon: any = this.querySelector('.bi-fullscreen-exit');
        if (this.$data.isFullscreen) {
            enterIcon.style.display = 'none';
            exitIcon.style.display = 'inline';
        } else {
            enterIcon.style.display = 'inline';
            exitIcon.style.display = 'none';
        }
    }
}
