import { ScreenSpaceEventHandler, ScreenSpaceEventType, Viewer, Cartesian3, CallbackProperty, Color, LabelGraphics, LabelStyle, VerticalOrigin, Cartesian2 } from "cesium";
import SSBaseObj from "./SSBaseObj";
import { transformCartesianToWGS84 } from "@/lib/cesium/measure";

class SSLabel extends SSBaseObj {
    [x: string]: any;

    _defaultOptions: any = {
        name: 'Label',
        text: 'Label',
        font: '24px sans-serif',
        fillColor: Color.AQUA,
        outlineColor: Color.BLACK,
        outlineWidth: 2,
        style: LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: VerticalOrigin.CENTER,
        pixelOffset: new Cartesian2(0, -10),
        heightReference: 1,
    }

    constructor(viewer: Viewer, options?: LabelGraphics.ConstructorOptions) {
        super(viewer);
        if (!options) {
            this.options = this.defaultOptions;
        } else {
            this.options = Object.assign(this.defaultOptions, options);
        }
        console.log('SSLabel constructor');
        this.viewer = viewer;
        this.position = null;
        this.handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
        this.label = null;
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
                        },
                        label: {
                            ...this.options
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
                if (!self.label) {
                    self.label = self.viewer.entities.add({
                        position: new CallbackProperty(() => self.position, false),
                        label: {
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

    set text(text: string) {
        this.options.text = text;
        if (this.label) {
            this.label.label.text = text;
        }
    }

    get text() {
        if (this.label) {
            return this.label.label.text.getValue();
        } else {
            return this.options.text;
        }
    }

    set show(show: boolean) {
        if (this.label) {
            this.label.show = show;
        }
    }

    get show() {
        if (this.label) {
            return this.label.show;
        } else {
            return false;
        }
    }

    get name() {
        return this.options.name;
    }

    set name(name: string) {
        this.options.name = name;
        if (this.label) {
            this.label.name = name;
        }
    }

    zoomTo() {
        if (this.label) {
            this.viewer.zoomTo(this.label);
        }
    }

    destroy() {
        this.stopDrawing();
        if (this.label) {
            this.viewer.entities.remove(this.label);
            this.label = null;
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
        } else {
            return [];
        }
    }

    toJSON() {
        return {
            type: 'label',
            position: this.nodePosition,
            text: this.text,
            font: this.options.font,
            fillColor: this.label.label.fillColor.getValue().toCssColorString(),
            outlineColor: this.label.label.outlineColor.getValue().toCssColorString(),
            outlineWidth: this.label.label.outlineWidth.getValue(),
            style: this.label.label.style.getValue(),
            verticalOrigin: this.label.label.verticalOrigin.getValue(),
            pixelOffset: this.label.label.pixelOffset.getValue(),
        }
    }

    createFromJson(json: any) {
        this.text = json.text;
        this.options.font = json.font;
        this.options.fillColor = Color.fromCssColorString(json.fillColor);
        this.options.outlineColor = Color.fromCssColorString(json.outlineColor);
        this.options.outlineWidth = json.outlineWidth;
        this.options.style = json.style;
        this.options.verticalOrigin = json.verticalOrigin;
        this.options.pixelOffset = new Cartesian2(json.pixelOffset.x, json.pixelOffset.y);
        this.position = Cartesian3.fromDegrees(json.position[0], json.position[1], json.position[2]);

        this.label = this.viewer.entities.add({
            position: new CallbackProperty(() => this.position, false),
            label: {
                ...this.options
            },
        });

    }
}

export default SSLabel;
