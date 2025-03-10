import { ScreenSpaceEventHandler, ScreenSpaceEventType, Viewer, Cartesian3, CallbackProperty, Color, ArcType, PolylineGraphics } from "cesium";
import SSBaseObj from "./SSBaseObj";
import { transformCartesianArrayToWGS84Array } from "@/lib/cesium/measure";

class SSPolyline extends SSBaseObj {
    [x: string]: any;

    _defaultOptions: any = {
        width: 3,
        material: Color.AQUA,
        depthFailMaterial: Color.RED,
        arcType: ArcType.GEODESIC,
        clampToGround: true,
    }

    constructor(viewer: Viewer, options?: PolylineGraphics.ConstructorOptions) {
        super(viewer);
        if (!options) {
            this.options = this.defaultOptions;
        } else {
            this.options = Object.assign(this.defaultOptions, options);
        }
        console.log('SSPolyline constructor');
        this.viewer = viewer;
        this.positions = [];
        this.handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
        this.polyline = null;
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
                            pixelSize: 5,
                            color: Color.YELLOW,
                        }
                    });
                } else {
                    self.movePoint.position = new CallbackProperty(() => cartesian, false);
                }
                if (self.positions.length > 0) {
                    if (self.positions.length > 1) {
                        self.positions.pop();
                    }
                    self.positions.push(cartesian);
                }
            }
        }, ScreenSpaceEventType.MOUSE_MOVE);

        this.handler.setInputAction((movement: any) => {
            const cartesian = self.viewer.scene.pickPosition(movement.position);
            if (cartesian) {
                self.positions.push(cartesian);
                if (!self.polyline) {
                    self.polyline = self.viewer.entities.add({
                        polyline: {
                            positions: new CallbackProperty(() => self.positions, false),
                            ...this.options
                        },
                    });
                }
            }
        }, ScreenSpaceEventType.LEFT_CLICK);

        this.handler.setInputAction(() => {
            self.stopDrawing();
            if (self.drawEnd) {
                self.drawEnd(self);
            }
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
        if (this.polyline) {
            this.viewer.entities.remove(this.polyline);
            this.polyline = null;
        }
    }

    on(type: string, callback: any) {
        if (type === 'drawEnd') {
            this.drawEnd = callback;
        }
    }

    get nodePositions() {
        return transformCartesianArrayToWGS84Array(this.viewer, this.positions)?.map((pos: any) => {
            return [pos.lon, pos.lat, pos.alt];
        });
    }
}

export default SSPolyline;