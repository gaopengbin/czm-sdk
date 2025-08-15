import { ScreenSpaceEventHandler, ScreenSpaceEventType, Viewer, Cartesian3, CallbackProperty, Color, LabelGraphics, LabelStyle, VerticalOrigin, Cartesian2 } from "cesium";
import SSBaseObj from "./SSBaseObj";
import { transformCartesianToWGS84 } from "@/lib/cesium/measure";
import { PositionEdit } from "../Edit/PositionEdit";

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
        heightReference: 0,
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
        this._isEditing = false;
        this.isDragging = false;
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
                        ssobject: self
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

    get isEditing() {
        return this._isEditing;
    }

    set isEditing(isEditing: boolean) {
        this._isEditing = isEditing;
        if (this.label) {
            if (isEditing) {
                this.startDragging();
            } else {
                this.stopDragging();
            }
        }
    }

    get positionEditing() {
        return this._positionEditing;
    }

    set positionEditing(positionEditing: boolean) {
        this._positionEditing = positionEditing;
        if (this.label) {
            if (positionEditing) {
                this.positionEdit()
            } else {
                this.stopPositionEdit();
            }
        }
    }

    startDragging() {
        const self = this;
        this.handler = new ScreenSpaceEventHandler(this.viewer.scene.canvas);

        this.handler.setInputAction((movement: any) => {
            this.viewer.scene.globe.depthTestAgainstTerrain = true;
            const pickedObject = this.viewer.scene.pick(movement.position);
            if (pickedObject && pickedObject.id === this.label) {
                this.viewer.scene.screenSpaceCameraController.enableRotate = false;
                this.isDragging = true;
            }
        }, ScreenSpaceEventType.LEFT_DOWN);

        this.handler.setInputAction((movement: any) => {
            if (this.isDragging) {
                const cartesian = this.viewer.scene.pickPosition(movement.endPosition);
                if (cartesian) {
                    this.position = cartesian;
                }
            }
        }, ScreenSpaceEventType.MOUSE_MOVE);

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

    get fillColor() {
        if (this.label) {
            return this.label.label.fillColor.getValue();
        } else {
            return this.options.fillColor;
        }
    }

    set fillColor(color: Color) {
        this.options.fillColor = color;
        if (this.label) {
            this.label.label.fillColor = color;
        }
    }

    set font(font: string) {
        this.options.font = font;
        if (this.label) {
            this.label.label.font = font;
        }
    }

    get font() {
        if (this.label) {
            return this.label.label.font.getValue();
        } else {
            return this.options.font;
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

    set outlineColor(color: Color) {
        this.options.outlineColor = color;
        if (this.label) {
            this.label.label.outlineColor = color;
        }
    }

    get outlineColor() {
        if (this.label) {
            return this.label.label.outlineColor.getValue();
        } else {
            return this.options.outlineColor;
        }
    }

    set outlineWidth(width: number) {
        this.options.outlineWidth = width;
        if (this.label) {
            this.label.label.outlineWidth = width;
        }
    }

    get outlineWidth() {
        if (this.label) {
            return this.label.label.outlineWidth.getValue();
        } else {
            return this.options.outlineWidth;
        }
    }

    set style(style: LabelStyle) {
        this.options.style = style;
        if (this.label) {
            this.label.label.style = style;
        }
    }

    get style() {
        if (this.label) {
            return this.label.label.style.getValue();
        } else {
            return this.options.style;
        }
    }

    set verticalOrigin(origin: VerticalOrigin) {
        this.options.verticalOrigin = origin;
        if (this.label) {
            this.label.label.verticalOrigin = origin;
        }
    }

    get verticalOrigin() {
        if (this.label) {
            return this.label.label.verticalOrigin.getValue();
        } else {
            return this.options.verticalOrigin;
        }
    }

    set pixelOffset(offset: Cartesian2) {
        this.options.pixelOffset = offset;
        if (this.label) {
            this.label.label.pixelOffset = offset;
        }
    }

    get pixelOffset() {
        if (this.label) {
            return this.label.label.pixelOffset.getValue();
        } else {
            return this.options.pixelOffset;
        }
    }

    zoomTo() {
        if (this.label) {
            this.viewer.flyTo(this.label, {
                duration: 1
            });
        }
    }

    destroy() {
        this.stopDrawing();
        this.stopDragging();
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
            type: 'SSLabel',
            guid: this.guid,
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
            ssobject: this,
        });

    }

    positionEdit() {
        if (this.label) {
            this.positionEditTool = new PositionEdit(this.viewer, this.label);
            return this.positionEditTool;
        }
        return null;
    }
    stopPositionEdit() {
        if (this.positionEditTool) {
            this.positionEditTool.destroy();
            this.positionEditTool = null;
        }
    }
}

export const SSLabelOptions = [
    {
        name: '标注文本',
        type: 'string',
        key: 'text',
        default: 'Label',
        description: 'Label text',
    },
    // {
    //     name: '字体',
    //     type: 'string',
    //     key: 'font',
    //     default: '24px sans-serif',
    //     description: 'Font style of the label',
    // },
    {
        name: '填充颜色',
        type: 'color',
        key: 'fillColor',
        default: Color.AQUA,
        description: 'Fill color of the label',
    },
    {
        name: '轮廓颜色',
        type: 'color',
        key: 'outlineColor',
        default: Color.BLACK,
        description: 'Outline color of the label',
    },
    {
        name: '轮廓宽度',
        type: 'number',
        key: 'outlineWidth',
        default: 2,
        description: 'Outline width of the label',
    },
    // {
    //     name: '样式',
    //     type: 'select',
    //     key: 'style',
    //     options: [LabelStyle.FILL, LabelStyle.OUTLINE, LabelStyle.FILL_AND_OUTLINE],
    //     default: LabelStyle.FILL_AND_OUTLINE,
    //     description: 'Label style (0=Fill, 1=Outline, 2=Fill and Outline)',
    // },
    // {
    //     name: '垂直对齐',
    //     type: 'select',
    //     key: 'verticalOrigin',
    //     options: [VerticalOrigin.BOTTOM, VerticalOrigin.CENTER, VerticalOrigin.TOP],
    //     default: VerticalOrigin.CENTER,
    //     description: 'Vertical origin of the label (0=Bottom, 1=Center, 2=Top)',
    // },
    {
        name: '像素偏移',
        type: 'object',
        key: 'pixelOffset',
        default: new Cartesian2(0, -10),
        description: 'Pixel offset of the label',
    },
    {
        name: '平移编辑',
        type: 'boolean',
        key: 'positionEditing',
        default: false,
        description: 'Enable positionEditing mode for the label.',
    },
    {
        name: '拖动编辑',
        type: 'boolean',
        key: 'isEditing',
        default: false,
        description: 'Enable editing mode for the label.',
    }
];

export default SSLabel;
