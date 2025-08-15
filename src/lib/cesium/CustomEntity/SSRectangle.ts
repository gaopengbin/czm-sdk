import { ScreenSpaceEventHandler, ScreenSpaceEventType, Viewer, Cartesian3, CallbackProperty, Color, Rectangle, Cartographic, Math as CesiumMath, RectangleGraphics, BoundingSphere, LabelStyle, VerticalOrigin, Cartesian2 } from "cesium";
import SSBaseObj from "./SSBaseObj";
import { transformCartesianArrayToWGS84Array } from "@/lib/cesium/measure";

class SSRectangle extends SSBaseObj {
    [x: string]: any;

    _defaultOptions: any = {
        name: 'Rectangle',
        fill: true,
        material: Color.AQUA.withAlpha(0.2),
        outline: false,
        outlineColor: Color.AQUA,
        outlineWidth: 3,
    }

    _tooltipEntity: any = null; // 添加气泡提示实体属性
    _cornerEditPoints: any[] = []; // 存储四个角点编辑控制点
    _centerEditPoint: any = null;  // 添加中心点编辑控制点
    _editingPoint: number | string | null = null; // 标记当前正在编辑的点索引或'center'

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
                self._updateTooltip(cartesian, self.startPosition ? '右键点击完成绘制' : '点击选择起点');

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
                            },
                            ssobject: self,
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
                    // 更新气泡提示
                    self._updateTooltip(cartesian, '移动鼠标绘制矩形，右键完成');
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

    destroy() {
        this.stopDrawing();
        this.stopDragging();
        if (this.rectangle) {
            this.viewer.entities.remove(this.rectangle);
            this.rectangle = null;
        }
        // 确保气泡提示被移除
        if (this._tooltipEntity) {
            this.viewer.entities.remove(this._tooltipEntity);
            this._tooltipEntity = null;
        }
    }

    // 添加更新气泡提示的方法
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

    get name() {
        return this.options.name;
    }

    set name(name: string) {
        this.options.name = name;
    }

    get material() {
        if (this.rectangle) {
            return this.rectangle.rectangle.material.color.getValue();
        }
        return this.options.material;
    }

    set material(value: Color) {
        if (this.rectangle) {
            this.rectangle.rectangle.material = value;
        }
    }

    get outlineColor() {
        if (this.rectangle) {
            return this.rectangle.polyline.material.color.getValue();
        }
        return this.options.outlineColor;
    }

    set outlineColor(value: Color) {
        if (this.rectangle) {
            this.rectangle.polyline.material = value;
        }
    }

    get outlineWidth() {
        if (this.rectangle) {
            return this.rectangle.polyline.width.getValue();
        }
        return this.options.outlineWidth;
    }

    set outlineWidth(value: number) {
        if (this.rectangle) {
            this.rectangle.polyline.width = value;
        }
    }

    get isEditing() {
        return this._isEditing;
    }

    set isEditing(isEditing: boolean) {
        this._isEditing = isEditing;
        if (this.rectangle) {
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

        // 创建四个角点和中心点编辑控制点
        this._createEditPoints();

        // 拖动开始事件
        this.handler.setInputAction((movement: any) => {
            this.viewer.scene.globe.depthTestAgainstTerrain = true;
            const pickedObject = this.viewer.scene.pick(movement.position);
            if (pickedObject) {
                // 检查是否点击了中心点编辑控制点
                if (pickedObject.id === this._centerEditPoint) {
                    this.isDragging = true;
                    this._editingPoint = 'center';
                    this.viewer.scene.screenSpaceCameraController.enableRotate = false;
                } else {
                    // 检查是否点击了角点编辑控制点
                    for (let i = 0; i < this._cornerEditPoints.length; i++) {
                        if (pickedObject.id === this._cornerEditPoints[i]) {
                            this.isDragging = true;
                            this._editingPoint = i;
                            this.viewer.scene.screenSpaceCameraController.enableRotate = false;
                            break;
                        }
                    }
                }
            }
        }, ScreenSpaceEventType.LEFT_DOWN);

        // 拖动过程事件
        this.handler.setInputAction((movement: any) => {
            if (this.isDragging) {
                const cartesian = this.viewer.scene.pickPosition(movement.endPosition);
                if (cartesian) {
                    if (this._editingPoint === 'center') {
                        // 中心点拖动 - 移动整个矩形
                        this._moveRectangle(cartesian);
                    } else if (typeof this._editingPoint === 'number') {
                        // 角点拖动 - 调整矩形形状
                        // 获取当前矩形的四个角点
                        const corners = this._getRectangleCorners();
                        
                        // 更新被拖动的角点位置
                        corners[this._editingPoint] = cartesian;
                        
                        // 根据角点索引和新位置更新矩形
                        this._updateRectangleFromDraggedCorner(this._editingPoint, cartesian);
                    }
                    
                    // 更新编辑点位置
                    this._updateEditPointPositions();
                }
            }
        }, ScreenSpaceEventType.MOUSE_MOVE);

        // 拖动结束事件
        this.handler.setInputAction(() => {
            this.viewer.scene.screenSpaceCameraController.enableRotate = true;
            this.viewer.scene.globe.depthTestAgainstTerrain = false;
            this.isDragging = false;
            this._editingPoint = null;
        }, ScreenSpaceEventType.LEFT_UP);
    }

    // 移动整个矩形
    _moveRectangle(newCenterPosition: Cartesian3) {
        // 获取当前矩形中心
        const rectangle = Rectangle.fromCartesianArray(this.positions);
        const center = Cartographic.toCartesian(Rectangle.center(rectangle));
        
        // 计算偏移量
        const offset = Cartesian3.subtract(newCenterPosition, center, new Cartesian3());
        
        // 获取当前角点
        const corners = this._getRectangleCorners();
        
        // 移动所有角点
        const newCorners = corners.map(corner => {
            return Cartesian3.add(corner, offset, new Cartesian3());
        });
        
        // 更新矩形
        this._updateRectangleFromCorners(newCorners);
    }

    // 获取矩形的四个角点坐标
    _getRectangleCorners() {
        const rectangle = Rectangle.fromCartesianArray(this.positions);
        const nw = Cartographic.toCartesian(Rectangle.northwest(rectangle));
        const ne = Cartographic.toCartesian(Rectangle.northeast(rectangle));
        const se = Cartographic.toCartesian(Rectangle.southeast(rectangle));
        const sw = Cartographic.toCartesian(Rectangle.southwest(rectangle));
        return [nw, ne, se, sw];
    }

    // 根据角点位置更新矩形
    _updateRectangleFromCorners(corners: Cartesian3[]) {
        // 从角点计算新的经纬度边界
        const cartographics = corners.map(corner => Cartographic.fromCartesian(corner));
        
        let west = Number.POSITIVE_INFINITY;
        let east = Number.NEGATIVE_INFINITY;
        let south = Number.POSITIVE_INFINITY;
        let north = Number.NEGATIVE_INFINITY;
        
        cartographics.forEach(carto => {
            west = Math.min(west, carto.longitude);
            east = Math.max(east, carto.longitude);
            south = Math.min(south, carto.latitude);
            north = Math.max(north, carto.latitude);
        });
        
        // 创建新的矩形边界
        const newRectangle = new Rectangle(west, south, east, north);
        
        // 更新positions以反映新的矩形
        const nw = Cartographic.toCartesian(Rectangle.northwest(newRectangle));
        const se = Cartographic.toCartesian(Rectangle.southeast(newRectangle));
        
        this.positions = [nw, se];
    }

    // 根据拖动的角点更新矩形
    _updateRectangleFromDraggedCorner(cornerIndex: number, newPosition: Cartesian3) {
        // 获取当前矩形
        const currentRectangle = Rectangle.fromCartesianArray(this.positions);
        
        // 将新位置转换为地理坐标
        const cartographic = Cartographic.fromCartesian(newPosition);
        const lon = cartographic.longitude;
        const lat = cartographic.latitude;
        
        let west = currentRectangle.west;
        let east = currentRectangle.east;
        let south = currentRectangle.south;
        let north = currentRectangle.north;
        
        // 根据拖动的角点更新相应的边界
        switch(cornerIndex) {
            case 0: // 西北角 (NW)
                west = lon;
                north = lat;
                break;
            case 1: // 东北角 (NE)
                east = lon;
                north = lat;
                break;
            case 2: // 东南角 (SE)
                east = lon;
                south = lat;
                break;
            case 3: // 西南角 (SW)
                west = lon;
                south = lat;
                break;
        }
        
        // 调整经度范围确保 west <= east
        if (west > east) {
            // 处理经度跨越180度的情况
            if (Math.abs(west - east) > Math.PI) {
                // 如果跨越180度线，调整east或west
                if (west > 0) east += CesiumMath.TWO_PI;
                else west -= CesiumMath.TWO_PI;
            } else {
                // 如果是正常情况，交换west和east
                const temp = west;
                west = east;
                east = temp;
                
                // 当经纬度交换时，可能需要调整角点的顺序
                if (cornerIndex === 0) cornerIndex = 1;
                else if (cornerIndex === 1) cornerIndex = 0;
                else if (cornerIndex === 2) cornerIndex = 3;
                else if (cornerIndex === 3) cornerIndex = 2;
                
                this._editingPoint = cornerIndex;
            }
        }
        
        // 调整纬度范围确保 south <= north
        if (south > north) {
            const temp = south;
            south = north;
            north = temp;
            
            // 当经纬度交换时，可能需要调整角点的顺序
            if (cornerIndex === 0) cornerIndex = 3;
            else if (cornerIndex === 1) cornerIndex = 2;
            else if (cornerIndex === 2) cornerIndex = 1;
            else if (cornerIndex === 3) cornerIndex = 0;
            
            this._editingPoint = cornerIndex;
        }
        
        // 创建新的矩形
        const newRectangle = new Rectangle(west, south, east, north);
        
        // 更新positions以反映新的矩形
        const nw = Cartographic.toCartesian(Rectangle.northwest(newRectangle));
        const se = Cartographic.toCartesian(Rectangle.southeast(newRectangle));
        
        this.positions = [nw, se];
    }

    // 创建四个角点编辑控制点和中心点
    _createEditPoints() {
        this._removeEditPoints();
        
        // 创建角点编辑控制点
        const corners = this._getRectangleCorners();
        const colors = [Color.BLUE, Color.RED, Color.GREEN, Color.YELLOW]; // 四个角点不同颜色
        
        for (let i = 0; i < corners.length; i++) {
            const cornerPoint = this.viewer.entities.add({
                position: new CallbackProperty(() => {
                    return this._getRectangleCorners()[i];
                }, false),
                point: {
                    pixelSize: 10,
                    color: colors[i],
                    outlineColor: Color.BLACK,
                    outlineWidth: 2,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY
                }
            });
            this._cornerEditPoints.push(cornerPoint);
        }
        
        // 创建中心点编辑控制点
        const rectangle = Rectangle.fromCartesianArray(this.positions);
        this._centerEditPoint = this.viewer.entities.add({
            position: new CallbackProperty(() => {
                const rect = Rectangle.fromCartesianArray(this.positions);
                return Cartographic.toCartesian(Rectangle.center(rect));
            }, false),
            point: {
                pixelSize: 12,
                color: Color.WHITE,
                outlineColor: Color.BLACK,
                outlineWidth: 2,
                disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
        });
    }

    // 更新编辑点位置
    _updateEditPointPositions() {
        if (this._cornerEditPoints.length === 4) {
            const corners = this._getRectangleCorners();
            for (let i = 0; i < corners.length; i++) {
                this._cornerEditPoints[i].position = new CallbackProperty(() => {
                    return this._getRectangleCorners()[i];
                }, false);
            }
        }
        
        // 更新中心点位置
        if (this._centerEditPoint) {
            this._centerEditPoint.position = new CallbackProperty(() => {
                const rect = Rectangle.fromCartesianArray(this.positions);
                return Cartographic.toCartesian(Rectangle.center(rect));
            }, false);
        }
    }

    // 移除编辑点
    _removeEditPoints() {
        for (const point of this._cornerEditPoints) {
            this.viewer.entities.remove(point);
        }
        this._cornerEditPoints = [];
        
        if (this._centerEditPoint) {
            this.viewer.entities.remove(this._centerEditPoint);
            this._centerEditPoint = null;
        }
    }

    // 停止拖动编辑
    stopDragging() {
        if (this.handler) {
            this.handler.removeInputAction(ScreenSpaceEventType.LEFT_DOWN);
            this.handler.removeInputAction(ScreenSpaceEventType.MOUSE_MOVE);
            this.handler.removeInputAction(ScreenSpaceEventType.LEFT_UP);
            this.isDragging = false;
            this._editingPoint = null;
        }
        
        // 移除编辑点
        this._removeEditPoints();
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
        const positions = transformCartesianArrayToWGS84Array(this.viewer, this.positions)?.map((pos: any) => {
            return [pos.lon, pos.lat, pos.alt];
        })
        return {
            type: 'ssrectangle',
            name: this.name,
            guid: this.guid,
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
            },
            ssobject: this,
        });
    }
}

export const SSRectangleOptions = [
    {
        name: '名称',
        type: 'string',
        key: 'name',
        default: 'Rectangle',
        description: 'Rectangle name',
    },
    {
        name: '填充颜色',
        type: 'color',
        key: 'material',
        default: Color.AQUA.withAlpha(0.2),
        description: 'Fill color of the rectangle',
    },
    {
        name: '边框颜色',
        type: 'color',
        key: 'outlineColor',
        default: Color.AQUA,
        description: 'Outline color of the rectangle',
    },
    {
        name: '边框宽度',
        type: 'number',
        key: 'outlineWidth',
        default: 3,
        description: 'Outline width of the rectangle',
    },
    {
        name: '编辑',
        type: 'boolean',
        key: 'isEditing',
        default: false,
        description: 'Enable editing mode for the rectangle.',
    }
]

export default SSRectangle;