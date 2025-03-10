import { ScreenSpaceEventHandler, ScreenSpaceEventType, Viewer, Cartesian3, CallbackProperty, Color, Rectangle, Cartographic, Math as CesiumMath, RectangleGraphics, BoundingSphere } from "cesium";
import SSBaseObj from "./SSBaseObj";
import { transformCartesianArrayToWGS84Array } from "@/lib/cesium/measure";

class SSRectangle extends SSBaseObj {
    [x: string]: any;

    _defaultOptions: any = {
        fill: true,
        material: Color.AQUA.withAlpha(0.2),
        outline: false,
        outlineColor: Color.AQUA,
        outlineWidth: 3,
    }

    constructor(viewer: Viewer, options?: RectangleGraphics.ConstructorOptions) {
        super(viewer);
        if (!options) {
            this.options = this.defaultOptions;
        } else {
            this.options = Object.assign(this.defaultOptions, options);
        }
        console.log('SSRectangle constructor');
        this.viewer = viewer;
        this.positions = [];
        this.handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
        this.rectangle = null;
        this.outline = null;
        this.startPosition = null;
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

                if (self.startPosition) {
                    if (self.positions.length == 1) {
                        self.positions.push(cartesian);
                    } else {
                        self.positions[1] = cartesian;
                    }

                    if (!self.rectangle) {
                        self.rectangle = self.viewer.entities.add({
                            rectangle: {
                                coordinates: new CallbackProperty(() => {
                                    return Rectangle.fromCartesianArray(self.positions);
                                }, false),
                                ...this.options
                            },
                            polyline: {
                                positions: new CallbackProperty(() => {
                                    return self.outlinePositions;
                                }, false),
                                width: this.options.outlineWidth,
                                material: this.options.outlineColor,
                                clampToGround: true,
                            }
                        });
                    }
                }
            }
        }, ScreenSpaceEventType.MOUSE_MOVE);

        this.handler.setInputAction((movement: any) => {
            const cartesian = self.viewer.scene.pickPosition(movement.position);
            if (cartesian) {
                if (!self.startPosition) {
                    self.startPosition = cartesian;
                    self.positions.push(cartesian);
                } else {
                    self.positions[1] = cartesian;
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
        if (this.rectangle) {
            this.viewer.entities.remove(this.rectangle);
            this.rectangle = null;
        }
    }

    get outlinePositions() {
        if (this.positions.length < 2) {
            return [];
        }
        const rectangle = Rectangle.fromCartesianArray(this.positions);
        const nw = Cartographic.toCartesian(Rectangle.northwest(rectangle));
        const ne = Cartographic.toCartesian(Rectangle.northeast(rectangle));
        const sw = Cartographic.toCartesian(Rectangle.southwest(rectangle));
        const se = Cartographic.toCartesian(Rectangle.southeast(rectangle));
        return [nw, sw, se, ne, nw]
    }

    get nodePositions() {
        if (this.positions.length < 2) {
            return [];
        }
        const rectangle = Rectangle.fromCartesianArray(this.positions);
        const nw = Cartographic.toCartesian(Rectangle.northwest(rectangle));
        const ne = Cartographic.toCartesian(Rectangle.northeast(rectangle));
        const sw = Cartographic.toCartesian(Rectangle.southwest(rectangle));
        const se = Cartographic.toCartesian(Rectangle.southeast(rectangle));
        return [nw, ne, se, sw, nw].map(cartesian => {
            const cartographic = Cartographic.fromCartesian(cartesian);
            return [
                CesiumMath.toDegrees(cartographic.longitude),
                CesiumMath.toDegrees(cartographic.latitude),
                cartographic.height
            ];
        });

    }

    set show(show: boolean) {
        if (this.rectangle) {
            this.rectangle.show = show;
        }
    }

    get show() {
        if (this.rectangle) {
            return this.rectangle.show;
        }
        return false;
    }

    zoomTo() {
        if (this.nodePositions) {
            const cartesians = Cartesian3.fromDegreesArrayHeights(this.nodePositions.flat())
            const boundingSphere = BoundingSphere.fromPoints(cartesians);
            this.viewer.camera.flyToBoundingSphere(boundingSphere, {
                duration: 1
            });
        }
    }

    on(type: string, callback: any) {
        if (type === 'drawEnd') {
            this.drawEnd = callback;
        }
    }

    toJSON() {
        const positions = transformCartesianArrayToWGS84Array(this.viewer, this.positions)?.map((pos: any) => {
            return [pos.lon, pos.lat, pos.alt];
        })
        return {
            type: 'ssrectangle',
            positions: positions,
            material: this.rectangle.rectangle.material.color.getValue().toCssColorString(),
            outlineColor: this.rectangle.polyline.material.color.getValue().toCssColorString(),
            outlineWidth: this.rectangle.polyline.width.getValue(),
        }
    }

    createFromJson(json: any) {
        this.destroy();
        this.options.material = Color.fromCssColorString(json.material);
        this.options.outlineColor = Color.fromCssColorString(json.outlineColor);
        this.options.outlineWidth = json.outlineWidth;
        this.positions = json.positions.map((pos: any) => {
            return Cartesian3.fromDegrees(pos[0], pos[1], pos[2]);
        });
        this.rectangle = this.viewer.entities.add({
            rectangle: {
                coordinates: new CallbackProperty(() => {
                    return Rectangle.fromCartesianArray(this.positions);
                }, false),
                ...this.options
            },
            polyline: {
                positions: new CallbackProperty(() => {
                    return this.outlinePositions;
                }, false),
                width: this.options.outlineWidth,
                material: this.options.outlineColor,
                clampToGround: true,
            }
        });
    }
}





export default SSRectangle;