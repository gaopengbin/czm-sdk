import { Cartesian3, Entity, ModelGraphics, ScreenSpaceEventHandler, ScreenSpaceEventType, Color, PolylineGraphics, CallbackProperty, Viewer, ColorMaterialProperty, PositionProperty, ConstantProperty, Cesium3DTileset, Matrix4, Transforms } from "cesium";

/**
 * PositionEdit enables visual translation (dragging) of an Entity or Model along X, Y, Z axes.
 */
export class PositionEdit {
    private viewer: Viewer;
    private target: Entity;
    private handlers: ScreenSpaceEventHandler[] = [];
    private axisEntities: Entity[] = [];
    private dragAxis: 'x' | 'y' | 'z' | null = null;
    private dragStartPosition: Cartesian3 | null = null;
    private dragStartMouse: Cartesian3 | null = null;
    private axisHighlightIndex: number | null = null;
    private tileset: Cesium3DTileset | null = null;
    private tilesetOrigin: Cartesian3 | null = null;
    private tilesetModelMatrix: Matrix4 | null = null;

    constructor(viewer: Viewer, target: Entity | Cesium3DTileset) {
        this.viewer = viewer;
        if ((target as any).root && (target as any).modelMatrix) {
            // tileset
            this.tileset = target as Cesium3DTileset;
            this.target = null as any;
            // 使用tileset.boundingSphere.center作为原点
            const center = (this.tileset.boundingSphere && this.tileset.boundingSphere.center)
                ? Cartesian3.clone(this.tileset.boundingSphere.center)
                : Matrix4.getTranslation(this.tileset.modelMatrix, new Cartesian3());
            this.tilesetOrigin = center;
            this.tilesetModelMatrix = Matrix4.clone(this.tileset.modelMatrix, new Matrix4());
        } else {
            this.target = target as Entity;
        }
        this.createAxisHelpers();
        this.setupHandlers();
    }

    private createAxisHelpers() {
        const pos = this.getPosition();
        if (!pos) return;

        let length = 50.0;
        if (this.tileset && this.tileset.boundingSphere) {
            length = this.tileset.boundingSphere.radius * 1.2; // 轴长度为包围球半径的1.2倍
        }
        const arrowLength = 10.0;
        const arrowWidth = 10.0;
        // 计算局部坐标轴的方向（东、北、上），保证轴始终与地表正交
        const ellipsoid = this.viewer.scene.globe.ellipsoid;
        const up = ellipsoid.geodeticSurfaceNormal(pos, new Cartesian3());
        const east = Cartesian3.cross(Cartesian3.UNIT_Z, up, new Cartesian3());
        Cartesian3.normalize(east, east);
        const north = Cartesian3.cross(up, east, new Cartesian3());
        Cartesian3.normalize(north, north);

        const axes = [
            { dir: east, color: Color.RED, axis: 'x' },
            { dir: north, color: Color.GREEN, axis: 'y' },
            { dir: up, color: Color.BLUE, axis: 'z' }
        ];

        axes.forEach(({ dir, color, axis }, idx) => { // Added idx here
            // 主轴线
            const entity = this.viewer.entities.add({
                polyline: {
                    positions: new CallbackProperty(() => {
                        const base = this.getPosition();
                        if (!base) return [Cartesian3.ZERO, Cartesian3.ZERO];
                        // 重新计算方向，保证拖动后方向依然正确
                        const currentUp = ellipsoid.geodeticSurfaceNormal(base, new Cartesian3());
                        const currentEast = Cartesian3.cross(Cartesian3.UNIT_Z, currentUp, new Cartesian3());
                        Cartesian3.normalize(currentEast, currentEast);
                        const currentNorth = Cartesian3.cross(currentUp, currentEast, new Cartesian3());
                        Cartesian3.normalize(currentNorth, currentNorth);
                        let dirVec: Cartesian3;
                        if (axis === 'x') dirVec = currentEast;
                        else if (axis === 'y') dirVec = currentNorth;
                        else dirVec = currentUp;
                        const start = Cartesian3.add(base, Cartesian3.multiplyByScalar(dirVec, -length, new Cartesian3()), new Cartesian3());
                        const end = Cartesian3.add(base, Cartesian3.multiplyByScalar(dirVec, length, new Cartesian3()), new Cartesian3());
                        return [start, end];
                    }, false),
                    width: new CallbackProperty(() => { // Dynamic width
                        return this.axisHighlightIndex === idx ? 8 : 5;
                    }, false),
                    material: new ColorMaterialProperty(
                        new CallbackProperty(() => { // Dynamic material
                            if (this.axisHighlightIndex === idx) {
                                return color.withAlpha(1.0);
                            }
                            return color.withAlpha(0.5);
                        }, false)
                    ),
                    clampToGround: false, // 禁止贴地
                    zIndex: 9999, // 保证在tileset之上
                },
                name: `Axis-${axis}`
            });
            this.axisEntities.push(entity);

            // 箭头（用polyline模拟箭头线段）
            const arrowEntity = this.viewer.entities.add({
                polyline: {
                    positions: new CallbackProperty(() => {
                        const base = this.getPosition();
                        if (!base) return [Cartesian3.ZERO, Cartesian3.ZERO];
                        // 重新计算方向
                        const currentUp = ellipsoid.geodeticSurfaceNormal(base, new Cartesian3());
                        const currentEast = Cartesian3.cross(Cartesian3.UNIT_Z, currentUp, new Cartesian3());
                        Cartesian3.normalize(currentEast, currentEast);
                        const currentNorth = Cartesian3.cross(currentUp, currentEast, new Cartesian3());
                        Cartesian3.normalize(currentNorth, currentNorth);
                        let dirVec: Cartesian3;
                        let ortho1: Cartesian3;
                        if (axis === 'x') {
                            dirVec = currentEast;
                            ortho1 = currentNorth;
                        } else if (axis === 'y') {
                            dirVec = currentNorth;
                            ortho1 = currentEast;
                        } else {
                            dirVec = currentUp;
                            ortho1 = currentEast;
                        }
                        // 箭头起点
                        const tip = Cartesian3.add(base, Cartesian3.multiplyByScalar(dirVec, length, new Cartesian3()), new Cartesian3());
                        // 箭头两侧
                        const left = Cartesian3.add(
                            tip,
                            Cartesian3.multiplyByScalar(
                                Cartesian3.add(
                                    Cartesian3.multiplyByScalar(ortho1, -arrowWidth / 2, new Cartesian3()),
                                    Cartesian3.multiplyByScalar(dirVec, -arrowLength, new Cartesian3()),
                                    new Cartesian3()
                                ),
                                1,
                                new Cartesian3()
                            ),
                            new Cartesian3()
                        );
                        const right = Cartesian3.add(
                            tip,
                            Cartesian3.multiplyByScalar(
                                Cartesian3.add(
                                    Cartesian3.multiplyByScalar(ortho1, arrowWidth / 2, new Cartesian3()),
                                    Cartesian3.multiplyByScalar(dirVec, -arrowLength, new Cartesian3()),
                                    new Cartesian3()
                                ),
                                1,
                                new Cartesian3()
                            ),
                            new Cartesian3()
                        );
                        // 箭头两条线
                        return [left, tip, right];
                    }, false),
                    width: new CallbackProperty(() => { // Dynamic width
                        return this.axisHighlightIndex === idx ? 12 : 8;
                    }, false),
                    material: new ColorMaterialProperty(
                        new CallbackProperty(() => { // Dynamic material
                            if (this.axisHighlightIndex === idx) {
                                return color.withAlpha(1.0);
                            }
                            return color.withAlpha(0.9);
                        }, false)
                    ),
                    clampToGround: false,
                    zIndex: 9999,
                },
                name: `AxisArrow-${axis}`
            });
            this.axisEntities.push(arrowEntity);
        });
    }

    private setupHandlers() {
        const handler = new ScreenSpaceEventHandler(this.viewer.scene.canvas);



        handler.setInputAction((movement: any) => {
            let picked: any = null;
            try {
                picked = this.viewer.scene.pick(movement.position);
            } catch (e) {
                // console.error("Error picking on left down:", e);
                picked = null;
            }

            if (picked && picked.id && typeof picked.id === 'object' && this.axisEntities.includes(picked.id)) {
                let axisIdx = Math.floor(this.axisEntities.indexOf(picked.id) / 2);
                if (picked.id.name === 'Axis-x' || picked.id.name === 'AxisArrow-x') this.dragAxis = 'x';
                else if (picked.id.name === 'Axis-y' || picked.id.name === 'AxisArrow-y') this.dragAxis = 'y';
                else if (picked.id.name === 'Axis-z' || picked.id.name === 'AxisArrow-z') this.dragAxis = 'z';

                this.axisHighlightIndex = axisIdx; // Highlight the dragged axis
                this.viewer.scene.requestRender(); // Update style immediately

                this.dragStartPosition = this.getPosition();
                this.dragStartMouse = this.getMousePositionOnAxis(movement.position, this.dragAxis!);
                // 记录初始鼠标屏幕坐标
                (this as any)._dragScreenStart = movement.position;
                // 禁止地图拖动
                const controller = this.viewer.scene.screenSpaceCameraController;
                controller.enableRotate = false;
                controller.enableTranslate = false;
                controller.enableTilt = false;
                controller.enableZoom = false;
                //@ts-ignore
                this.viewer.container.style.cursor = "grabbing"; // Or "move" or keep "pointer"
            }
        }, ScreenSpaceEventType.LEFT_DOWN);

        handler.setInputAction((movement: any) => {
            let picked: any = null;
            try {
                picked = this.viewer.scene.pick(movement.endPosition);
            } catch (e) {
                picked = null;
            }
            let highlightIdx: number | null = null;
            if (picked && picked.id && typeof picked.id === 'object') {
                const idx = this.axisEntities.indexOf(picked.id);
                if (idx !== -1) {
                    highlightIdx = Math.floor(idx / 2); // 每个轴有2个entity
                }
            }

            // 只要悬浮在轴上就立即改变状态
            if (this.axisHighlightIndex !== highlightIdx) {
                this.axisHighlightIndex = highlightIdx;
                this.viewer.scene.requestRender();
            }

            if (highlightIdx !== null && !this.dragAxis) {
                //@ts-ignore
                this.viewer.container.style.cursor = "pointer";
            } else if (!this.dragAxis) {
                //@ts-ignore
                this.viewer.container.style.cursor = "";
            }
            if (!this.dragAxis || !this.dragStartPosition || !this.dragStartMouse) return;
            // 计算屏幕像素的移动距离
            const dragScreenStart = (this as any)._dragScreenStart;
            const dx = movement.endPosition.x - dragScreenStart.x;
            const dy = movement.endPosition.y - dragScreenStart.y;
            // 计算轴方向的单位向量
            const base = this.getPosition();
            if (!base) return;
            const ellipsoid = this.viewer.scene.globe.ellipsoid;
            const up = ellipsoid.geodeticSurfaceNormal(base, new Cartesian3());
            const east = Cartesian3.cross(Cartesian3.UNIT_Z, up, new Cartesian3());
            Cartesian3.normalize(east, east);
            const north = Cartesian3.cross(up, east, new Cartesian3());
            Cartesian3.normalize(north, north);
            let axisDir: Cartesian3;
            if (this.dragAxis === 'x') axisDir = east;
            else if (this.dragAxis === 'y') axisDir = north;
            else axisDir = up;

            // 计算屏幕像素到世界坐标的缩放比例
            const scene = this.viewer.scene;
            const p0 = base;
            const p1 = Cartesian3.add(base, Cartesian3.multiplyByScalar(axisDir, 1, new Cartesian3()), new Cartesian3());
            const win0 = scene.cartesianToCanvasCoordinates(p0, new Cartesian3());
            const win1 = scene.cartesianToCanvasCoordinates(p1, new Cartesian3());
            if (!win0 || !win1) return;
            const pixelPerMeter = Math.sqrt(Math.pow(win1.x - win0.x, 2) + Math.pow(win1.y - win0.y, 2));
            if (pixelPerMeter === 0) return;

            // 计算鼠标在轴方向上的移动距离（米）
            // 通过相机视角判断拖动方向是否需要反转
            let screenDelta: number;
            if (this.dragAxis === 'x' || this.dragAxis === 'y') {
                // 计算屏幕x轴与世界轴的夹角，决定是否反向
                const camera = this.viewer.camera;
                // 世界轴在屏幕上的投影向量
                const axisWorldEnd = Cartesian3.add(base, Cartesian3.multiplyByScalar(axisDir, 10, new Cartesian3()), new Cartesian3());
                const winAxis0 = scene.cartesianToCanvasCoordinates(base, new Cartesian3());
                const winAxis1 = scene.cartesianToCanvasCoordinates(axisWorldEnd, new Cartesian3());
                if (!winAxis0 || !winAxis1) return;
                const axisScreenVec = { x: winAxis1.x - winAxis0.x, y: winAxis1.y - winAxis0.y };
                // 鼠标拖动向量
                const dragVec = { x: dx, y: dy };
                // 计算投影（以x轴为主，y轴为辅）
                const axisScreenNorm = Math.sqrt(axisScreenVec.x * axisScreenVec.x + axisScreenVec.y * axisScreenVec.y);
                if (axisScreenNorm === 0) return;
                const axisScreenUnit = { x: axisScreenVec.x / axisScreenNorm, y: axisScreenVec.y / axisScreenNorm };
                // 鼠标拖动在轴投影方向上的分量
                screenDelta = dragVec.x * axisScreenUnit.x + dragVec.y * axisScreenUnit.y;
            } else {
                // z轴方向，取y方向反向
                screenDelta = -dy;
            }
            const moveMeters = screenDelta / pixelPerMeter;

            // 新位置 = 起始位置 + 轴方向 * 移动距离
            const newPos = Cartesian3.add(this.dragStartPosition, Cartesian3.multiplyByScalar(axisDir, moveMeters, new Cartesian3()), new Cartesian3());
            this.setPosition(newPos);
        }, ScreenSpaceEventType.MOUSE_MOVE);

        handler.setInputAction(() => {
            this.dragAxis = null;
            this.dragStartPosition = null;
            this.dragStartMouse = null;
            (this as any)._dragScreenStart = null;
            this.axisHighlightIndex = null; // Reset highlight
            this.viewer.scene.requestRender(); // Update style
            // 恢复地图拖动
            const controller = this.viewer.scene.screenSpaceCameraController;
            controller.enableRotate = true;
            controller.enableTranslate = true;
            controller.enableTilt = true;
            controller.enableZoom = true;
            //@ts-ignore
            this.viewer.container.style.cursor = ""; // Reset cursor
        }, ScreenSpaceEventType.LEFT_UP);

        this.handlers.push(handler);
    }

    private getMousePositionOnAxis(screenPos: any, axis: 'x' | 'y' | 'z'): Cartesian3 | null {
        // 拖动时动态计算局部坐标轴方向，保证与轴一致
        const ray = this.viewer.camera.getPickRay(screenPos);
        if (!ray) return null;
        const globePos = this.viewer.scene.globe.pick(ray, this.viewer.scene);
        if (!globePos) return null;
        const base = this.getPosition();
        if (!base) return null;

        // 动态计算局部坐标轴
        const ellipsoid = this.viewer.scene.globe.ellipsoid;
        const up = ellipsoid.geodeticSurfaceNormal(base, new Cartesian3());
        const east = Cartesian3.cross(Cartesian3.UNIT_Z, up, new Cartesian3());
        Cartesian3.normalize(east, east);
        const north = Cartesian3.cross(up, east, new Cartesian3());
        Cartesian3.normalize(north, north);

        let axisDir: Cartesian3;
        if (axis === 'x') axisDir = east;
        else if (axis === 'y') axisDir = north;
        else axisDir = up;

        // Project globePos onto axis
        const v = Cartesian3.subtract(globePos, base, new Cartesian3());
        let projLen = Cartesian3.dot(v, axisDir);

        // 修正z轴方向与鼠标相反的问题
        if (axis === 'z') projLen = -projLen;

        return Cartesian3.add(base, Cartesian3.multiplyByScalar(axisDir, projLen, new Cartesian3()), new Cartesian3());
    }

    private getPosition(): Cartesian3 | null {
        if (this.tileset) {
            // tileset
            return this.tilesetOrigin;
        }
        if (this.target && this.target.position) {
            if (typeof this.target.position.getValue === 'function') {
                return this.target.position.getValue(this.viewer.clock.currentTime) ?? null;
            }
            return this.target.position as unknown as Cartesian3;
        }
        return null;
    }

    private setPosition(pos: Cartesian3) {
        if (this.tileset && this.tilesetModelMatrix) {
            // tileset 拖动时，直接用平移矩阵作用于原始modelMatrix
            if (!this.tilesetOrigin) {
                this.tilesetOrigin = Cartesian3.clone(this.tileset.boundingSphere.center);
            }
            if (!this.tilesetModelMatrix) {
                this.tilesetModelMatrix = Matrix4.clone(this.tileset.modelMatrix, new Matrix4());
            }
            // 计算平移向量
            const offset = Cartesian3.subtract(pos, this.tilesetOrigin, new Cartesian3());
            // 构造平移矩阵
            const translation = Matrix4.fromTranslation(offset, new Matrix4());
            // 应用平移到原始modelMatrix
            const newMatrix = Matrix4.multiply(translation, this.tilesetModelMatrix, new Matrix4());
            this.tileset.modelMatrix = newMatrix;
            // 更新this.tilesetOrigin/tilesetModelMatrix
            this.tilesetOrigin = pos;
            this.tilesetModelMatrix = newMatrix;
        } else if (this.target) {
            //@ts-ignore
            this.target.position = pos;
        }
    }

    destroy() {
        this.axisEntities.forEach(e => this.viewer.entities.remove(e));
        this.handlers.forEach(h => h.destroy());
        this.axisEntities = [];
        this.handlers = [];
    }
}