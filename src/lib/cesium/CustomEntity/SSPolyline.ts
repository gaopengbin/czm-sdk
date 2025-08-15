import { ScreenSpaceEventHandler, ScreenSpaceEventType, Viewer, Cartesian3, CallbackProperty, Color, ArcType, PolylineGraphics, BoundingSphere } from "cesium";
import SSBaseObj from "./SSBaseObj";
import { transformCartesianArrayToWGS84Array } from "@/lib/cesium/measure";

class SSPolyline extends SSBaseObj {
    [x: string]: any;

    _defaultOptions: any = {
        name: 'Polyline',
        width: 3,
        material: Color.AQUA,
        depthFailMaterial: Color.RED,
        arcType: ArcType.GEODESIC,
        clampToGround: true,
    }

    _vertexEditPoints: any[] = []; // 添加顶点编辑控制点
    _centerEditPoint: any = null;  // 添加中心点编辑控制点
    _editingPoint: number | string | null = null; // 标记当前正在编辑的点索引或'center'

    constructor(viewer: Viewer, options?: PolylineGraphics.ConstructorOptions) {
        super(viewer);
        if (!options) {
            this.options = this.defaultOptions;
        } else {
            this.options = Object.assign(this.defaultOptions, options);
        }
        this.type = 'SSPolyline';
        console.log('SSPolyline constructor');
        this.viewer = viewer;
        this.positions = [];
        this.handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
        this.polyline = null;
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
                        ssobject: self,
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
        this.stopDragging();
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

    get show() {
        if (this.polyline) {
            return this.polyline.show;
        } else {
            return false;
        }
    }

    set show(value: boolean) {
        if (this.polyline) {
            this.polyline.show = value;
        }
    }

    get width() {
        if (this.polyline) {
            return this.polyline.polyline.width.getValue();
        }
        return this.options.width;
    }

    set width(value: number) {
        if (this.polyline) {
            this.polyline.polyline.width = value;
        }
    }

    get material() {
        if (this.polyline) {
            return this.polyline.polyline.material.color.getValue();
        }
        return this.options.material;
    }

    set material(value: Color) {
        if (this.polyline) {
            this.polyline.polyline.material = value;
        }
    }

    get name() {
        return this.options.name;
    }

    set name(value: string) {
        this.options.name = value;
    }

    get depthFailMaterial() {
        if (this.polyline) {
            return this.polyline.polyline.depthFailMaterial.color.getValue();
        }
        return this.options.depthFailMaterial;
    }

    set depthFailMaterial(value: Color) {
        if (this.polyline) {
            this.polyline.polyline.depthFailMaterial = value;
        }
    }

    get arcType() {
        if (this.polyline) {
            return this.polyline.polyline.arcType.getValue();
        }
        return this.options.arcType;
    }

    set arcType(value: ArcType) {
        this.options.arcType = value;
        if (this.polyline) {
            this.polyline.polyline.arcType = value;
        }
    }

    get clampToGround() {
        if (this.polyline) {
            return this.polyline.polyline.clampToGround.getValue();
        }
        return this.options.clampToGround;
    }

    set clampToGround(value: boolean) {
        if (this.polyline) {
            this.polyline.polyline.clampToGround = value;
        }
    }

    get isEditing() {
        return this._isEditing;
    }

    set isEditing(isEditing: boolean) {
        this._isEditing = isEditing;
        if (this.polyline) {
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

        // 创建所有顶点和中心点编辑控制点
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
                    // 检查是否点击了顶点编辑控制点
                    for (let i = 0; i < this._vertexEditPoints.length; i++) {
                        if (pickedObject.id === this._vertexEditPoints[i]) {
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
                        // 中心点拖动 - 移动整条线
                        this._movePolyline(cartesian);
                    } else if (typeof this._editingPoint === 'number') {
                        // 顶点拖动 - 调整单个顶点位置
                        this.positions[this._editingPoint] = cartesian;
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

    // 移动整条线
    _movePolyline(newCenterPosition: Cartesian3) {
        // 计算当前线的中心点
        const center = this._getPolylineCenter();
        
        // 计算偏移量
        const offset = Cartesian3.subtract(newCenterPosition, center, new Cartesian3());
        
        // 应用偏移量到每个顶点
        for (let i = 0; i < this.positions.length; i++) {
            this.positions[i] = Cartesian3.add(this.positions[i], offset, new Cartesian3());
        }
    }

    // 计算线的中心点
    _getPolylineCenter(): Cartesian3 {
        if (this.positions.length === 0) {
            return new Cartesian3();
        }
        
        // 计算所有点的平均位置
        const center = new Cartesian3();
        for (let i = 0; i < this.positions.length; i++) {
            Cartesian3.add(center, this.positions[i], center);
        }
        
        Cartesian3.divideByScalar(center, this.positions.length, center);
        return center;
    }

    // 创建编辑控制点
    _createEditPoints() {
        this._removeEditPoints();
        
        // 创建每个顶点的编辑控制点
        for (let i = 0; i < this.positions.length; i++) {
            const vertexPoint = this.viewer.entities.add({
                position: new CallbackProperty(() => this.positions[i], false),
                point: {
                    pixelSize: 10,
                    color: Color.WHITE,
                    outlineColor: Color.BLACK,
                    outlineWidth: 2,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY
                }
            });
            this._vertexEditPoints.push(vertexPoint);
        }
        
        // 创建中心点编辑控制点
        this._centerEditPoint = this.viewer.entities.add({
            position: new CallbackProperty(() => this._getPolylineCenter(), false),
            point: {
                pixelSize: 12,
                color: Color.YELLOW,
                outlineColor: Color.BLACK,
                outlineWidth: 2,
                disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
        });
    }

    // 更新编辑点位置
    _updateEditPointPositions() {
        // 更新顶点编辑点位置
        for (let i = 0; i < this._vertexEditPoints.length; i++) {
            if (i < this.positions.length) {
                this._vertexEditPoints[i].position = new CallbackProperty(() => this.positions[i], false);
            }
        }
        
        // 更新中心点位置
        if (this._centerEditPoint) {
            this._centerEditPoint.position = new CallbackProperty(() => this._getPolylineCenter(), false);
        }
    }

    // 移除编辑点
    _removeEditPoints() {
        for (const point of this._vertexEditPoints) {
            this.viewer.entities.remove(point);
        }
        this._vertexEditPoints = [];
        
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
        if (this.polyline && this.nodePositions) {
            // const cartesians = Cartesian3.fromDegreesArrayHeights(this.nodePositions.flat())
            const boundingSphere = BoundingSphere.fromPoints(this.positions);
            this.viewer.camera.flyToBoundingSphere(boundingSphere, {
                duration: 1
            });
        }
    }

    toJSON() {
        return {
            type: 'SSPolyline',
            guid: this.guid,
            name: this.name,
            positions: this.nodePositions,
            show: this.show,
            width: this.polyline?.polyline?.width.getValue(),
            material: this.polyline?.polyline?.material.color.getValue().toCssColorString(),
        };
    }

    createFromJson(json: any) {
        this.destroy();
        this.options.name = json.name;
        this.options.width = json.width;
        this.options.material = Color.fromCssColorString(json.material);
        this.options.show = json.show;
        this.options.positions = json.positions;
        const positions = json.positions.map((pos: any) => {
            return Cartesian3.fromDegrees(pos[0], pos[1], pos[2]);
        });
        console.log(positions);
        this.positions = positions;
        this.polyline = this.viewer.entities.add({
            polyline: {
                ...this.options,
                positions: new CallbackProperty(() => positions, false),
            },
            ssobject: this,
        });
        this.polyline.show = this.options.show;
        console.log(this.polyline);
    }
}

export const SSPolylineOptions = [
    {
        name: '名称',
        type: 'string',
        key: 'name',
        default: 'Polyline',
        description: 'Polyline name',
    },
    {
        name: '宽度',
        type: 'number',
        key: 'width',
        default: 3,
        description: 'Width of the polyline',
    },
    {
        name: '颜色',
        type: 'color',
        key: 'material',
        default: Color.AQUA,
        description: 'Color of the polyline',
    },
    {
        name: '深度测试颜色',
        type: 'color',
        key: 'depthFailMaterial',
        default: Color.RED,
        description: 'Depth test color of the polyline',
    },
    // {
    //     name: '弧类型',
    //     type: 'select',
    //     key: 'arcType',
    //     options: [
    //         {
    //             name: 'GEODESIC',
    //             value: ArcType.GEODESIC,
    //         },
    //         {
    //             name: 'NONE',
    //             value: ArcType.NONE,
    //         },
    //         {
    //             name: 'RHUMB',
    //             value: ArcType.RHUMB,
    //         }
    //     ],
    // },
    {
        name: '地面贴合',
        type: 'boolean',
        key: 'clampToGround',
        default: true,
        description: 'Clamp to ground or not',
    },
    {
        name: '编辑',
        type: 'boolean',
        key: 'isEditing',
        default: false,
        description: 'Enable editing mode for the polyline.',
    }
]

export default SSPolyline;