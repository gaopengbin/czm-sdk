import { Component } from "../core/decorators";
import BaseWidget from "../earth/base-widget";
import Template from "./status-bar.html?raw"
import "./status-bar.scss"
import { Math as CesiumMath, FrameRateMonitor, ScreenSpaceEventHandler, ScreenSpaceEventType } from "cesium";

@Component({
    tagName: "czm-status-bar",
    className: "czm-status-bar",
    template: Template,
})
export default class StatusBar extends BaseWidget {
    constructor() {
        super();
    }

    async onInit() {
        this.$data = {
            longitude: 0,
            latitude: 0,
            altitude: 0,
            fps: 0,
            heading: 0,
            pitch: 0,
            cameraHeight: 0,
        }

        this.getStatus();
    }

    getStatus() {
        const camera = this.viewer.camera;
        const frameRateMonitor = FrameRateMonitor.fromScene(this.viewer.scene);
        this.interval = setInterval(() => {
            const fps = frameRateMonitor.lastFramesPerSecond;
            if (fps) {
                this.$data.fps = fps.toFixed(0);
            }
            this.$data.cameraHeight = (camera.positionCartographic.height / 1000).toFixed(2);
            this.$data.heading = CesiumMath.toDegrees(camera.heading).toFixed(2);
            this.$data.pitch = CesiumMath.toDegrees(camera.pitch).toFixed(2);
        }, 100);

        this.handler = new ScreenSpaceEventHandler(this.viewer.scene.canvas);
        this.handler.setInputAction((e: any) => {
            if (!e.endPosition) return;
            const position = this.viewer.scene.globe.pick(this.viewer.camera.getPickRay(e.endPosition), this.viewer.scene);
            if (!position) return;
            const cartographic = this.viewer.scene.globe.ellipsoid.cartesianToCartographic(position);
            if (cartographic) {
                this.$data.longitude = CesiumMath.toDegrees(cartographic.longitude).toFixed(2);
                this.$data.latitude = CesiumMath.toDegrees(cartographic.latitude).toFixed(2);
                this.$data.altitude = (cartographic.height / 1000).toFixed(2);
            }
        }, ScreenSpaceEventType.MOUSE_MOVE);
    }

    clear() {
        this.interval && clearInterval(this.interval);
        this.handler && this.handler.destroy();
    }
}