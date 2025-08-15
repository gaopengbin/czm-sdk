import { ScreenSpaceEventHandler, ScreenSpaceEventType, Viewer, Cartesian3, CallbackProperty, Color, PointGraphics, HeightReference } from "cesium";
import SSBaseObj from "./SSBaseObj";
import { transformCartesianToWGS84 } from "@/lib/cesium/measure";
import { PositionEdit } from "../Edit/PositionEdit";

class SSPoint extends SSBaseObj {
    [x: string]: any;

    _defaultOptions: any = {
        pixelSize: 10,
        color: Color.AQUA,
        outlineColor: Color.BLACK,
        outlineWidth: 2,
        heightReference: HeightReference.NONE,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        name: 'Point'
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

    set pixelSize(size: number) {
        this.options.pixelSize = size;
        if (this.point) {
            this.point.point.pixelSize = size;
        }
    }

    get pixelSize() {
        return this.options.pixelSize;
    }

    set color(color: Color) {
        this.options.color = color;
        if (this.point) {
            this.point.point.color = color;
        }
    }

    get color() {
        return this.options.color;
    }

    set name(name: string) {
        this.options.name = name;
        if (this.point) {
            this.point.name = name;
        }
    }

    get name() {
        return this.options.name;
    }

    set outlineColor(color: Color) {
        this.options.outlineColor = color;
        if (this.point) {
            this.point.point.outlineColor = color;
        }
    }

    get outlineColor() {
        return this.options.outlineColor;
    }

    set outlineWidth(width: number) {
        this.options.outlineWidth = width;
        if (this.point) {
            this.point.point.outlineWidth = width;
        }
    }

    get outlineWidth() {
        return this.options.outlineWidth;
    }

    set heightReference(ref: number) {
        this.options.heightReference = ref;
        if (this.point) {
            this.point.point.heightReference = ref;
        }
    }

    get heightReference() {
        return this.options.heightReference;
    }

    set show(show: boolean) {
        if (this.point) {
            this.point.show = show;
        }
    }

    get show() {
        if (this.point) {
            return this.point.show;
        } else {
            return false;
        }
    }

    get isEditing() {
        return this._isEditing
    }

    set isEditing(isEditing: boolean) {
        this._isEditing = isEditing
        if (this.point) {
            // 当启用编辑模式时，保持点实体可见并启用拖动功能
            if (isEditing) {
                this.startDragging();
            } else {
                this.stopDragging();
            }
        }
    }

    startDragging() {
        const self = this;
        this.handler = new ScreenSpaceEventHandler(this.viewer.scene.canvas);

        // 拖动开始事件
        this.handler.setInputAction((movement: any) => {
            this.viewer.scene.globe.depthTestAgainstTerrain = true;
            const pickedObject = this.viewer.scene.pick(movement.position);
            if (pickedObject && pickedObject.id === this.point) {
                this.viewer.scene.screenSpaceCameraController.enableRotate = false;
                this.isDragging = true;
            }
        }, ScreenSpaceEventType.LEFT_DOWN);

        // 拖动过程事件
        this.handler.setInputAction((movement: any) => {
            if (this.isDragging) {
                const cartesian = this.viewer.scene.pickPosition(movement.endPosition);
                if (cartesian) {
                    this.position = cartesian;
                }
            }
        }, ScreenSpaceEventType.MOUSE_MOVE);

        // 拖动结束事件
        this.handler.setInputAction(() => {
            this.viewer.scene.screenSpaceCameraController.enableRotate = true;
            this.viewer.scene.globe.depthTestAgainstTerrain = false;
            this.isDragging = false;
        }, ScreenSpaceEventType.LEFT_UP);
    }

    stopDragging() {
        if (this.handler) {
            this.handler.removeInputAction(ScreenSpaceEventType.LEFT_DOWN);
            this.handler.removeInputAction(ScreenSpaceEventType.MOUSE_MOVE);
            this.handler.removeInputAction(ScreenSpaceEventType.LEFT_UP);
            this.isDragging = false;
        }
    }

    zoomTo() {
        if (this.point) {
            this.viewer.flyTo(this.point, {
                duration: 1
            });
        }
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
                        },
                        ssobject: self,
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
                            ...this.options,
                            disableDepthTestDistance: 0
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
        } else {
            return [];
        }
    }

    toJSON() {
        return {
            type: 'SSPoint',
            guid: this.guid,
            position: this.nodePosition,
            pixelSize: this.options.pixelSize,
            color: this.options.color.toCssColorString(),
            outlineColor: this.options.outlineColor.toCssColorString(),
            outlineWidth: this.options.outlineWidth,
            heightReference: this.options.heightReference,
            disableDepthTestDistance: this.options.disableDepthTestDistance,
            name: this.options.name,
        };
    }

    createFromJson(json: any) {
        this.options.pixelSize = json.pixelSize;
        this.options.color = Color.fromCssColorString(json.color);
        this.options.outlineColor = Color.fromCssColorString(json.outlineColor);
        this.options.outlineWidth = json.outlineWidth;
        this.options.heightReference = json.heightReference;
        this.options.disableDepthTestDistance = json.disableDepthTestDistance;
        this.options.name = json.name;
        this.position = Cartesian3.fromDegrees(json.position[0], json.position[1], json.position[2]);

        this.point = this.viewer.entities.add({
            position: new CallbackProperty(() => this.position, false),
            point: {
                ...this.options,
                eyeOffset: new Cartesian3(0, 0, 0),
            },
            ssobject: this,
        });
    }

    positionEdit() {
        if (this.point) {
            return new PositionEdit(this.viewer, this.point);
        }
        return null;
    }
}

export const SSPointOptions = [
    {
        name: '名称',
        type: 'string',
        key: 'name',
        default: 'Point',
        description: 'Point name',
    },
    {
        name: '像素大小',
        type: 'number',
        key: 'pixelSize',
        default: 10,
        description: 'Pixel size of the point',
    },
    {
        name: '颜色',
        type: 'color',
        key: 'color',
        default: Color.AQUA,
        description: 'Color of the point',
    },
    {
        name: '轮廓颜色',
        type: 'color',
        key: 'outlineColor',
        default: Color.BLACK,
        description: 'Outline color of the point',
    },
    {
        name: '轮廓宽度',
        type: 'number',
        key: 'outlineWidth',
        default: 2,
        description: 'Outline width of the point',
    },
    {
        name: '高度参考',
        type: 'number',
        key: 'heightReference',
        default: 0,
        description: 'Height reference of the point',
    },
    {
        name: '编辑',
        type: 'boolean',
        key: 'isEditing',
        default: false,
        description: 'Enable editing mode for the point.',
    }
]

export default SSPoint;
