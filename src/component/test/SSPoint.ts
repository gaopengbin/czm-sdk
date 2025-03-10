import { ScreenSpaceEventHandler, ScreenSpaceEventType, Viewer, Cartesian3, CallbackProperty, Color, PointGraphics } from "cesium";
import SSBaseObj from "./SSBaseObj";
import { transformCartesianToWGS84 } from "@/lib/cesium/measure";

class SSPoint extends SSBaseObj {
    [x: string]: any;

    _defaultOptions: any = {
        pixelSize: 10,
        color: Color.AQUA,
        outlineColor: Color.BLACK,
        outlineWidth: 2,
        heightReference: 1,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
    }

    constructor(viewer: Viewer, options?: PointGraphics.ConstructorOptions) {
        super(viewer);
        if (!options) {
            this.options = this.defaultOptions;
        } else {
            this.options = Object.assign(this.defaultOptions, options);
        }
        console.log('SSPoint constructor');
        this.viewer = viewer;
        this.position = null;
        this.handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
        this.point = null;
        this.drawEnd = null;
    }

    startDrawing() {
        const self = this;
        self.viewer.scene.globe.depthTestAgainstTerrain = true;

        this.handler.setInputAction((movement: any) => {
            const cartesian = self.viewer.scene.pickPosition(movement.endPosition);
            if (cartesian) {
                if (!self.movePoint) {
                    self.movePoint = self.viewer.entities.add({
                        position: new CallbackProperty(() => cartesian, false),
                        point: {
                            ...this.options,
                            disableDepthTestDistance: 0
                        }
                    });
                } else {
                    self.movePoint.position = new CallbackProperty(() => cartesian, false);
                }
            }
        }, ScreenSpaceEventType.MOUSE_MOVE);

        this.handler.setInputAction((movement: any) => {
            const cartesian = self.viewer.scene.pickPosition(movement.position);
            if (cartesian) {
                self.position = cartesian;
                if (!self.point) {
                    self.point = self.viewer.entities.add({
                        position: new CallbackProperty(() => self.position, false),
                        point: {
                            ...this.options
                        },
                    });
                }
                self.stopDrawing();
                if (self.drawEnd) {
                    self.drawEnd(self);
                }
            }
        }, ScreenSpaceEventType.LEFT_CLICK);

        this.handler.setInputAction(() => {
            self.stopDrawing();
        }, ScreenSpaceEventType.RIGHT_CLICK);
    }

    stopDrawing() {
        if (this.movePoint) {
            this.viewer.entities.remove(this.movePoint);
            this.movePoint = null;
        }
        this.handler.removeInputAction(ScreenSpaceEventType.MOUSE_MOVE);
        this.handler.removeInputAction(ScreenSpaceEventType.LEFT_CLICK);
        this.handler.removeInputAction(ScreenSpaceEventType.RIGHT_CLICK);
    }

    destroy() {
        this.stopDrawing();
        if (this.point) {
            this.viewer.entities.remove(this.point);
            this.point = null;
        }
    }

    on(type: string, callback: any) {
        if (type === 'drawEnd') {
            this.drawEnd = callback;
        }
    }

    get nodePosition() {
        const pos = transformCartesianToWGS84(this.viewer, this.position)
        if (pos) {
            return [pos.lon, pos.lat, pos.alt];
        }else{
            return [];
        }
    }
}

export default SSPoint;
