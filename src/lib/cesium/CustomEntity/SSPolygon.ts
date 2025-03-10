import { ScreenSpaceEventHandler, ScreenSpaceEventType, Viewer, Cartesian3, CallbackProperty, Color, PolygonGraphics, PolygonHierarchy, BoundingSphere } from "cesium";
import SSBaseObj from "./SSBaseObj";
import { transformCartesianArrayToWGS84Array, transformWGS84ToCartesian } from "@/lib/cesium/measure";

class SSPolygon extends SSBaseObj {
    [x: string]: any;

    _defaultOptions: any = {
        name: 'Polygon',
        material: Color.AQUA.withAlpha(0.2),
        outline: false,
        outlineColor: Color.AQUA,
        outlineWidth: 3,
        clampToGround: true,
    }

    constructor(viewer: Viewer, options?: PolygonGraphics.ConstructorOptions) {
        super(viewer);
        if (!options) {
            this.options = this.defaultOptions;
        } else {
            this.options = Object.assign(this.defaultOptions, options);
        }
        console.log('SSPolygon constructor');
        this.viewer = viewer;
        this.positions = [];
        this.handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
        this.polygon = null;
        this.outline = null;
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
                    if (self.positions.length > 2) {
                        self.positions.pop();
                    }
                    self.positions.push(cartesian);
                }

                if (!self.polygon && self.positions.length > 2) {
                    self.polygon = self.viewer.entities.add({
                        polygon: {
                            hierarchy: new CallbackProperty(() => new PolygonHierarchy(self.positions), false),
                            height: 0,
                            ...this.options
                        },
                    });
                }

                if (!self.outline && self.positions.length > 0) {
                    self.outline = self.viewer.entities.add({
                        polyline: {
                            positions: new CallbackProperty(() => self.positions.concat(self.positions[0]), false),
                            width: this.options.outlineWidth,
                            material: this.options.outlineColor,
                            clampToGround: true
                        },
                    });
                }

            }
        }, ScreenSpaceEventType.MOUSE_MOVE);

        this.handler.setInputAction((movement: any) => {
            const cartesian = self.viewer.scene.pickPosition(movement.position);
            if (cartesian) {
                self.positions.push(cartesian);
                console.log(self.positions);

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
        if (this.polygon) {
            this.viewer.entities.remove(this.polygon);
            this.polygon = null;
        }
        if (this.outline) {
            this.viewer.entities.remove(this.outline);
            this.outline = null;
        }
    }

    on(type: string, callback: any) {
        if (type === 'drawEnd') {
            this.drawEnd = callback;
        }
    }

    get nodePositions() {
        let positions = transformCartesianArrayToWGS84Array(this.viewer, this.positions)?.map((pos: any) => {
            return [pos.lon, pos.lat, pos.alt];
        });
        if (positions) {
            positions.push(positions[0]);
        }
        return positions;
    }

    set show(show: boolean) {
        if (this.polygon) {
            this.polygon.show = show;
        }
        if (this.outline) {
            this.outline.show = show
        }
    }

    get show() {
        if (this.polygon) {
            return this.polygon.show;
        } else {
            return false;
        }
    }

    get name() {
        return this.options.name;
    }

    set name(name: string) {
        this.options.name = name;
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

    toGeoJson() {
        const positions = transformCartesianArrayToWGS84Array(this.viewer, this.positions)?.map((pos: any) => {
            return [pos.lon, pos.lat, pos.alt];
        })
        return {
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: [positions]
            },
            properties: this.toJSON()
        }
    }

    toJSON() {
        return {
            type: 'sspolygon',
            name: this.options.name,
            positions: this.nodePositions,
            material: this.polygon.polygon.material.color.getValue().toCssColorString(),
            outlineColor: this.outline.polyline.material.color.getValue().toCssColorString(),
            outlineWidth: this.outline.polyline.width.getValue(),
        }

    }

    createFromJson(json: any) {
        this.destroy();
        this.options.name = json.name;
        this.options.material = Color.fromCssColorString(json.material);
        this.options.outlineColor = Color.fromCssColorString(json.outlineColor);
        this.options.outlineWidth = json.outlineWidth;

        this.options = Object.assign(this.defaultOptions, this.options);

        const positions = json.positions.map((pos: any) => {
            return transformWGS84ToCartesian(this.viewer, { lon: pos[0], lat: pos[1], alt: pos[2] });
        });

        this.positions = positions;

        this.polygon = this.viewer.entities.add({
            polygon: {
                hierarchy: new CallbackProperty(() => new PolygonHierarchy(positions), false),
                ...this.options
            },
        });
        this.outline = this.viewer.entities.add({
            polyline: {
                positions: new CallbackProperty(() => positions, false),
                width: this.options.outlineWidth,
                material: this.options.outlineColor,
                clampToGround: true
            },
        });
    }
}

export default SSPolygon;
