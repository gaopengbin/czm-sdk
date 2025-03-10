import { ScreenSpaceEventHandler, ScreenSpaceEventType, Viewer, Cartesian3, CallbackProperty, Color, EllipseGraphics, Matrix4, Transforms, HeadingPitchRoll, Cartographic } from "cesium";
import SSBaseObj from "./SSBaseObj";
import { transformCartesianArrayToWGS84Array } from "@/lib/cesium/measure";

class SSCircle extends SSBaseObj {
    [x: string]: any;

    _defaultOptions: any = {
        name: 'Circle',
        material: Color.AQUA.withAlpha(0.2),
        outline: true,
        outlineColor: Color.AQUA,
        outlineWidth: 3,
        clampToGround: true,
        // height: 0,
        granularity: 0.02
    }

    constructor(viewer: Viewer, options?: EllipseGraphics.ConstructorOptions) {
        super(viewer);
        if (!options) {
            this.options = this.defaultOptions;
        } else {
            this.options = Object.assign(this.defaultOptions, options);
        }
        console.log('SSCircle constructor');
        this.viewer = viewer;
        this.positions = [];
        this.handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
        this.circle = null;
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

                if (self.positions.length === 1) {
                    self.positions.push(cartesian);
                } else if (self.positions.length > 1) {
                    self.positions[1] = cartesian;
                }

                if (!self.circle && self.positions.length > 1) {
                    self.circle = self.viewer.entities.add({
                        position: new CallbackProperty(() => self.positions[0], false),
                        ellipse: {
                            semiMajorAxis: new CallbackProperty(() => self.getRadius(), false),
                            semiMinorAxis: new CallbackProperty(() => self.getRadius(), false),
                            ...this.options
                        },
                        polyline: {
                            positions: new CallbackProperty(() => self.outlinePositions, false),
                            width: this.options.outlineWidth,
                            material: this.options.outlineColor,
                            clampToGround: true
                        }
                    });
                }
            }
        }, ScreenSpaceEventType.MOUSE_MOVE);

        this.handler.setInputAction((movement: any) => {
            const cartesian = self.viewer.scene.pickPosition(movement.position);
            if (cartesian) {
                if (self.positions.length === 0) {
                    self.positions.push(cartesian);
                } else if (self.positions.length === 1) {
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

    getRadius() {
        if (this.positions.length < 2) {
            return 0;
        }
        return Cartesian3.distance(this.positions[0], this.positions[1]);
    }

    get outlinePositions() {
        const range = [0, Math.PI * 2]
        const start = range[0] % Math.PI * 2;
        const ends = range[1] % Math.PI * 2;
        const end = ends <= start ? (ends + Math.PI * 2) : ends;
        let positions = [];
        for (let a = start; a < end; a += this.options.granularity) {
            positions.push(this.computePosition(a));
        }
        return positions;
    }

    get nodePositions() {
        let positions = transformCartesianArrayToWGS84Array(this.viewer, this.outlinePositions)?.map((pos: any) => {
            return [pos.lon, pos.lat, pos.alt];
        });
        if (positions) {
            positions.push(positions[0]);
        }
        return positions;
    }

    computePosition(angle: number) {
        const a = angle;
        const r = this.getRadius();
        const cos = Math.cos;
        const sin = Math.sin;
        const cartesian = new Cartesian3();
        // Cartesian3.fromElements(cos(a) * r, 0, sin(a) * r, cartesian);//pitch
        Cartesian3.fromElements(cos(-a) * r, sin(-a) * r, 0, cartesian);//heading
        // Cartesian3.fromElements(0, cos(a) * r, sin(a) * r, cartesian);//roll


        let enu = new Matrix4();
        enu = Transforms.headingPitchRollToFixedFrame(this.positions[0], new HeadingPitchRoll(0, 0, 0), undefined, undefined, enu);
        Matrix4.multiplyByPoint(enu, cartesian, cartesian);
        const carto = Cartographic.fromCartesian(cartesian, undefined, new Cartographic());
        return Cartographic.toCartesian(carto);
    }

    destroy() {
        this.stopDrawing();
        if (this.circle) {
            this.viewer.entities.remove(this.circle);
            this.circle = null;
        }
    }

    on(type: string, callback: any) {
        if (type === 'drawEnd') {
            this.drawEnd = callback;
        }
    }

    toGeoJson() {
        return {
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: [this.nodePositions]
            },
            properties: this.toJSON()
        }
    }

    toJSON() {
        return {
            type: 'sscircle',
            positions: this.nodePositions,
            material: this.circle.ellipse.material.color.getValue().toCssColorString(),
            outlineColor: this.circle.polyline.material.color.getValue().toCssColorString(),
            outlineWidth: this.circle.polyline.width.getValue(),
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
        this.circle = this.viewer.entities.add({
            position: new CallbackProperty(() => this.positions[0], false),
            ellipse: {
                semiMajorAxis: new CallbackProperty(() => this.getRadius(), false),
                semiMinorAxis: new CallbackProperty(() => this.getRadius(), false),
                ...this.options
            },
            polyline: {
                positions: new CallbackProperty(() => this.outlinePositions, false),
                width: this.options.outlineWidth,
                material: this.options.outlineColor,
                clampToGround: true
            }
        });
    }
}

export default SSCircle;
