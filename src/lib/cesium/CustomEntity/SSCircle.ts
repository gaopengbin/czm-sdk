import { ScreenSpaceEventHandler, ScreenSpaceEventType, Viewer, Cartesian3, CallbackProperty, Color, EllipseGraphics, Matrix4, Transforms, HeadingPitchRoll, Cartographic, LabelStyle, VerticalOrigin, Cartesian2, Math as CMath, HeadingPitchRange, BoundingSphere } from "cesium";
import SSBaseObj from "./SSBaseObj";
import { transformCartesianArrayToWGS84Array, transformCartesianToWGS84 } from "@/lib/cesium/measure";

class SSCircle extends SSBaseObj {
    [x: string]: any;

    _defaultOptions: any = {
        name: 'Circle',
        material: Color.AQUA.withAlpha(0.2),
        outline: true,
        outlineColor: Color.AQUA,
        outlineWidth: 3,
        clampToGround: true,
        granularity: 0.02
    }

    _tooltipEntity: any = null; // 添加气泡提示实体属性
    centerCartesian: Cartesian3 | null = null; // 明确定义属性
    _centerEditPoint: any = null; // 添加圆心编辑点
    _radiusEditPoint: any = null; // 添加半径编辑点
    _editingPoint: string | null = null; // 标记当前正在编辑的点

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
                        }
                    });
                } else {
                    self.movePoint.position = new CallbackProperty(() => cartesian, false);
                }

                // 更新气泡提示
                let tipMessage = '点击选择圆心';
                if (self.positions.length === 1) {
                    tipMessage = '移动鼠标确定半径，单击或右键完成绘制';
                } else if (self.positions.length > 1) {
                    tipMessage = '右键点击完成绘制';
                }
                self._updateTooltip(cartesian, tipMessage);

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
                        },
                        ssobject: this,
                    });
                }
            }
        }, ScreenSpaceEventType.MOUSE_MOVE);

        this.handler.setInputAction((movement: any) => {
            const cartesian = self.viewer.scene.pickPosition(movement.position);
            if (cartesian) {
                if (self.positions.length === 0) {
                    self.positions.push(cartesian);
                    // 更新气泡提示
                    self._updateTooltip(cartesian, '移动鼠标确定半径，单击或右键完成绘制');
                } else if (self.positions.length === 1) {
                    self.positions.push(cartesian);
                    // 选择半径后立即完成绘制
                    self.stopDrawing();
                    if (self.drawEnd) {
                        self.drawEnd(self);
                    }
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
        // 移除气泡提示
        if (this._tooltipEntity) {
            this.viewer.entities.remove(this._tooltipEntity);
            this._tooltipEntity = null;
        }
        this.handler.removeInputAction(ScreenSpaceEventType.MOUSE_MOVE);
        this.handler.removeInputAction(ScreenSpaceEventType.LEFT_CLICK);
        this.handler.removeInputAction(ScreenSpaceEventType.RIGHT_CLICK);
    }

    getRadius() {
        if (this.positions.length < 2) {
            // 如果positions不可用，则使用保存的radius值
            return this._radius || 0;
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
        // 计算最后一个点，确保闭合
        positions.push(positions[0]);
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
        Cartesian3.fromElements(cos(-a) * r, sin(-a) * r, 0, cartesian);//heading

        let enu = new Matrix4();
        const centerPoint = this.positions[0] || this.centerCartesian;
        if (!centerPoint) return new Cartesian3(); // 防止空引用

        enu = Transforms.headingPitchRollToFixedFrame(centerPoint, new HeadingPitchRoll(0, 0, 0), undefined, undefined, enu);
        Matrix4.multiplyByPoint(enu, cartesian, cartesian);
        const carto = Cartographic.fromCartesian(cartesian, undefined, new Cartographic());
        return Cartographic.toCartesian(carto);
    }

    destroy() {
        this.stopDrawing();
        this.stopDragging();
        if (this.circle) {
            this.viewer.entities.remove(this.circle);
            this.circle = null;
        }
        if (this._tooltipEntity) {
            this.viewer.entities.remove(this._tooltipEntity);
            this._tooltipEntity = null;
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

    get center() {
        if (this.positions.length > 0) {
            const position = transformCartesianToWGS84(this.viewer, this.positions[0]);
            if (position) {
                return [position.lon, position.lat, position.alt];
            }
        }
        return null;
    }

    set show(value: boolean) {
        if (this.circle) {
            this.circle.show = value;
        }
    }

    get show() {
        if (this.circle) {
            return this.circle.show;
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

    get material() {
        if (this.circle) {
            return this.circle.ellipse.material.color.getValue();
        }
        return this.options.material;
    }

    set material(color: Color) {
        this.options.material = color;
        if (this.circle) {
            this.circle.ellipse.material.color = color;
        }
    }

    get outlineColor() {
        if (this.circle) {
            return this.circle.polyline.material.color.getValue();
        }
        return this.options.outlineColor;
    }

    set outlineColor(color: Color) {
        this.options.outlineColor = color;
        if (this.circle) {
            this.circle.polyline.material.color = color;
        }
    }

    get outlineWidth() {
        if (this.circle) {
            return this.circle.polyline.width.getValue();
        }
        return this.options.outlineWidth;
    }

    set outlineWidth(width: number) {
        this.options.outlineWidth = width;
        if (this.circle) {
            this.circle.polyline.width = width;
        }
    }

    get clampToGround() {
        if (this.circle) {
            return this.circle.polyline.clampToGround.getValue();
        }
        return this.options.clampToGround;
    }

    set clampToGround(value: boolean) {
        this.options.clampToGround = value;
        if (this.circle) {
            this.circle.polyline.clampToGround = value;
        }
    }

    get granularity() {
        return this.options.granularity;
    }

    set granularity(value: number) {
        if (value <= 0) {
            console.warn('Granularity must be greater than 0. Setting to default value of 0.02.');
            value = 0.02;
        }
        this.options.granularity = value;
    }

    get isEditing() {
        return this._isEditing;
    }

    set isEditing(isEditing: boolean) {
        this._isEditing = isEditing;
        if (this.circle) {
            if (isEditing) {
                this.startDragging();
            } else {
                this.stopDragging();
            }
        }
    }
    zoomTo() {
        if (this.circle) {
            const center = this.circle.position.getValue();
            const radius = this.getRadius();
            const boundingSphere = new BoundingSphere(center, radius);
            if (boundingSphere) {
                this.viewer.camera.flyToBoundingSphere(boundingSphere, {
                    duration: 1,
                    offset: new HeadingPitchRange(0, -Math.PI / 4, radius * 2)
                });
            }
        }
    }

    startDragging() {
        const self = this;
        this.handler = new ScreenSpaceEventHandler(this.viewer.scene.canvas);

        this._createEditPoints();

        this.handler.setInputAction((movement: any) => {
            this.viewer.scene.globe.depthTestAgainstTerrain = true;
            const pickedObject = this.viewer.scene.pick(movement.position);
            if (pickedObject) {
                if (pickedObject.id === this._centerEditPoint) {
                    this.isDragging = true;
                    this._editingPoint = 'center';
                    this.viewer.scene.screenSpaceCameraController.enableRotate = false;
                } else if (pickedObject.id === this._radiusEditPoint) {
                    this.isDragging = true;
                    this._editingPoint = 'radius';
                    this.viewer.scene.screenSpaceCameraController.enableRotate = false;
                }
            }
        }, ScreenSpaceEventType.LEFT_DOWN);

        this.handler.setInputAction((movement: any) => {
            if (this.isDragging) {
                const cartesian = this.viewer.scene.pickPosition(movement.endPosition);
                if (cartesian) {
                    if (this._editingPoint === 'center') {
                        const oldCenter = this.positions[0];
                        const radiusPoint = this.positions[1];
                        const radiusVector = Cartesian3.subtract(radiusPoint, oldCenter, new Cartesian3());
                        this.positions[0] = cartesian;
                        if (this.centerCartesian) {
                            this.centerCartesian = cartesian;
                        }
                        this.positions[1] = Cartesian3.add(cartesian, radiusVector, new Cartesian3());
                        this._updateEditPointPositions();
                    } else if (this._editingPoint === 'radius') {
                        this.positions[1] = cartesian;
                        this._radiusEditPoint.position = new CallbackProperty(() => this.positions[1], false);
                    }
                }
            }
        }, ScreenSpaceEventType.MOUSE_MOVE);

        this.handler.setInputAction(() => {
            this.viewer.scene.screenSpaceCameraController.enableRotate = true;
            this.viewer.scene.globe.depthTestAgainstTerrain = false;
            this.isDragging = false;
            this._editingPoint = null;
        }, ScreenSpaceEventType.LEFT_UP);
    }

    _createEditPoints() {
        this._removeEditPoints();

        this._centerEditPoint = this.viewer.entities.add({
            position: new CallbackProperty(() => this.positions[0], false),
            point: {
                pixelSize: 10,
                color: Color.YELLOW,
                outlineColor: Color.BLACK,
                outlineWidth: 2,
                disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
        });

        this._radiusEditPoint = this.viewer.entities.add({
            position: new CallbackProperty(() => this.positions[1], false),
            point: {
                pixelSize: 10,
                color: Color.GREEN,
                outlineColor: Color.BLACK,
                outlineWidth: 2,
                disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
        });
    }

    _updateEditPointPositions() {
        if (this._centerEditPoint && this.positions.length > 0) {
            this._centerEditPoint.position = new CallbackProperty(() => this.positions[0], false);
        }
        if (this._radiusEditPoint && this.positions.length > 1) {
            this._radiusEditPoint.position = new CallbackProperty(() => this.positions[1], false);
        }
    }

    _removeEditPoints() {
        if (this._centerEditPoint) {
            this.viewer.entities.remove(this._centerEditPoint);
            this._centerEditPoint = null;
        }
        if (this._radiusEditPoint) {
            this.viewer.entities.remove(this._radiusEditPoint);
            this._radiusEditPoint = null;
        }
    }

    stopDragging() {
        if (this.handler) {
            this.handler.removeInputAction(ScreenSpaceEventType.LEFT_DOWN);
            this.handler.removeInputAction(ScreenSpaceEventType.MOUSE_MOVE);
            this.handler.removeInputAction(ScreenSpaceEventType.LEFT_UP);
            this.isDragging = false;
            this._editingPoint = null;
        }
        this._removeEditPoints();
    }

    toJSON() {
        return {
            type: 'sscircle',
            guid: this.guid,
            radius: this.getRadius(),
            center: this.center,
            name: this.options.name,
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

        this.centerCartesian = Cartesian3.fromDegrees(json.center[0], json.center[1], json.center[2]);
        const radius = json.radius;
        this._radius = radius;

        this.positions = [this.centerCartesian];

        const cartographic = Cartographic.fromCartesian(this.centerCartesian);
        const lon = CMath.toRadians(CMath.toDegrees(cartographic.longitude) + 0.001);
        const secondPoint = Cartographic.toCartesian(new Cartographic(lon, cartographic.latitude, cartographic.height));

        const direction = Cartesian3.subtract(secondPoint, this.centerCartesian, new Cartesian3());
        Cartesian3.normalize(direction, direction);

        const pointOnCircle = Cartesian3.add(
            this.centerCartesian,
            Cartesian3.multiplyByScalar(direction, radius, new Cartesian3()),
            new Cartesian3()
        );
        this.positions.push(pointOnCircle);

        this.circle = this.viewer.entities.add({
            position: new CallbackProperty(() => this.centerCartesian!, false),
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
            },
            ssobject: this,
        });
    }

    _updateTooltip(position: Cartesian3, message: string) {
        if (!this._tooltipEntity) {
            this._tooltipEntity = this.viewer.entities.add({
                position: position,
                label: {
                    text: message,
                    font: '14px sans-serif',
                    fillColor: Color.WHITE,
                    style: LabelStyle.FILL_AND_OUTLINE,
                    outlineWidth: 2,
                    outlineColor: Color.BLACK,
                    verticalOrigin: VerticalOrigin.BOTTOM,
                    pixelOffset: new Cartesian2(0, -10),
                    backgroundColor: new Color(0.165, 0.165, 0.165, 0.8),
                    showBackground: true,
                    backgroundPadding: new Cartesian2(7, 5),
                    disableDepthTestDistance: Number.POSITIVE_INFINITY
                }
            });
        } else {
            this._tooltipEntity.position = position;
            this._tooltipEntity.label.text = message;
        }
    }
}

export const SSCircleOptions = [
    {
        name: '填充颜色',
        type: 'color',
        key: 'material',
        default: Color.AQUA.withAlpha(0.2),
        description: 'Fill color of the circle',
    },
    {
        name: '边框颜色',
        type: 'color',
        key: 'outlineColor',
        default: Color.AQUA,
        description: 'Outline color of the circle',
    },
    {
        name: '边框宽度',
        type: 'number',
        key: 'outlineWidth',
        default: 3,
        description: 'Outline width of the circle',
    },
    {
        name: '是否贴地',
        type: 'boolean',
        key: 'clampToGround',
        default: true,
        description: 'Whether the circle is clamped to ground'
    },
    {
        name: '粒度',
        type: 'number',
        key: 'granularity',
        default: 0.02,
        description: 'Granularity of the circle outline'
    },
    {
        name: '编辑',
        type: 'boolean',
        key: 'isEditing',
        default: false,
        description: 'Enable editing mode for the circle.',
    }
]

export default SSCircle;
