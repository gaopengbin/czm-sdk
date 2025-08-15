import { Cartesian3, Entity, ScreenSpaceEventHandler, ScreenSpaceEventType, Color, PolylineGraphics, CallbackProperty, Viewer, ColorMaterialProperty, Cesium3DTileset, Matrix4, Transforms, Quaternion, HeadingPitchRoll, Math as CesiumMath, Matrix3 } from "cesium";

/**
 * RotationEdit enables visual rotation of an Entity or Tileset around local X/Y/Z axes.
 */
export class RotationEdit {
    private viewer: Viewer;
    private target: Entity | null = null;
    private tileset: Cesium3DTileset | null = null;
    private handlers: ScreenSpaceEventHandler[] = [];
    private ringEntities: Entity[] = [];
    private dragAxis: 'x' | 'y' | 'z' | null = null;
    private dragStartAngle: number | null = null;
    private dragStartMouse: any = null;
    private axisHighlightIndex: number | null = null;
    private tilesetOrigin: Cartesian3 | null = null;
    private tilesetModelMatrix: Matrix4 | null = null;
    private lastMouseScreen: { x: number, y: number } | null = null;

    constructor(viewer: Viewer, target: Entity | Cesium3DTileset) {
        this.viewer = viewer;
        if ((target as any).root && (target as any).modelMatrix) {
            // tileset
            this.tileset = target as Cesium3DTileset;
            // 使用tileset.boundingSphere.center作为原点
            const center = (this.tileset.boundingSphere && this.tileset.boundingSphere.center)
                ? Cartesian3.clone(this.tileset.boundingSphere.center)
                : Matrix4.getTranslation(this.tileset.modelMatrix, new Cartesian3());
            this.tilesetOrigin = center;
            this.tilesetModelMatrix = Matrix4.clone(this.tileset.modelMatrix, new Matrix4());
        } else {
            this.target = target as Entity;
        }
        this.createAxisRings();
        this.setupHandlers();
    }

    private createAxisRings() {
        const pos = this.getPosition();
        if (!pos) return;

        let radius = 50.0;
        if (this.tileset && this.tileset.boundingSphere) {
            radius = this.tileset.boundingSphere.radius * 1.2;
        }
        const widthNormal = 5, widthHighlight = 8;
        const colors = [Color.RED, Color.GREEN, Color.BLUE];
        const axes: Array<'x' | 'y' | 'z'> = ['x', 'y', 'z'];

        axes.forEach((axis, idx) => {
            // 生成圆环上的点
            const positionsProp = new CallbackProperty(() => {
                const base = this.getPosition();
                if (!base) return [];
                // 计算局部坐标轴
                const ellipsoid = this.viewer.scene.globe.ellipsoid;
                const up = ellipsoid.geodeticSurfaceNormal(base, new Cartesian3());
                const east = Cartesian3.cross(Cartesian3.UNIT_Z, up, new Cartesian3());
                Cartesian3.normalize(east, east);
                const north = Cartesian3.cross(up, east, new Cartesian3());
                Cartesian3.normalize(north, north);
                let normal: Cartesian3, xAxis: Cartesian3, yAxis: Cartesian3;
                if (axis === 'x') {
                    normal = east;
                    xAxis = north;
                    yAxis = up;
                } else if (axis === 'y') {
                    normal = north;
                    xAxis = up;
                    yAxis = east;
                } else {
                    normal = up;
                    xAxis = east;
                    yAxis = north;
                }
                // 生成圆环点
                const points: Cartesian3[] = [];
                const segments = 128;
                for (let i = 0; i <= segments; ++i) {
                    const theta = 2 * Math.PI * (i / segments);
                    const dir = Cartesian3.add(
                        Cartesian3.multiplyByScalar(xAxis, Math.cos(theta) * radius, new Cartesian3()),
                        Cartesian3.multiplyByScalar(yAxis, Math.sin(theta) * radius, new Cartesian3()),
                        new Cartesian3()
                    );
                    points.push(Cartesian3.add(base, dir, new Cartesian3()));
                }
                return points;
            }, false);

            const entity = this.viewer.entities.add({
                polyline: {
                    positions: positionsProp,
                    width: new CallbackProperty(() => this.axisHighlightIndex === idx ? widthHighlight : widthNormal, false),
                    material: new ColorMaterialProperty(
                        new CallbackProperty(() => {
                            if (this.axisHighlightIndex === idx) {
                                return colors[idx].withAlpha(1.0);
                            }
                            return colors[idx].withAlpha(0.5);
                        }, false)
                    ),
                    clampToGround: false,
                    zIndex: 9999,
                },
                name: `RotationRing-${axis}`
            });
            this.ringEntities.push(entity);
        });
    }

    private setupHandlers() {
        const handler = new ScreenSpaceEventHandler(this.viewer.scene.canvas);

        handler.setInputAction((movement: any) => {
            let picked: any = null;
            try {
                picked = this.viewer.scene.pick(movement.position);
            } catch (e) {
                picked = null;
            }
            if (picked && picked.id && typeof picked.id === 'object' && this.ringEntities.includes(picked.id)) {
                let axisIdx = this.ringEntities.indexOf(picked.id);
                this.dragAxis = ['x', 'y', 'z'][axisIdx] as 'x' | 'y' | 'z';
                this.axisHighlightIndex = axisIdx;
                this.viewer.scene.requestRender();
                this.dragStartAngle = this.getMouseAngleOnRing(movement.position, this.dragAxis!);
                this.dragStartMouse = movement.position;
                this.lastMouseScreen = { x: movement.position.x, y: movement.position.y };
                // 禁止地图拖动
                const controller = this.viewer.scene.screenSpaceCameraController;
                controller.enableRotate = false;
                controller.enableTranslate = false;
                controller.enableTilt = false;
                controller.enableZoom = false;
                //@ts-ignore
                this.viewer.container.style.cursor = "grabbing";
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
                const idx = this.ringEntities.indexOf(picked.id);
                if (idx !== -1) {
                    highlightIdx = idx;
                }
            }
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
            if (!this.dragAxis || this.dragStartAngle === null) return;

            // 拖动时动态计算局部坐标轴方向，保证轴始终与地表正交
            const base = this.getPosition();
            let axisVec: Cartesian3 | undefined;
            if (base) {
                const ellipsoid = this.viewer.scene.globe.ellipsoid;
                const up = ellipsoid.geodeticSurfaceNormal(base, new Cartesian3());
                const east = Cartesian3.cross(Cartesian3.UNIT_Z, up, new Cartesian3());
                Cartesian3.normalize(east, east);
                const north = Cartesian3.cross(up, east, new Cartesian3());
                Cartesian3.normalize(north, north);
                if (this.dragAxis === 'x') axisVec = east;
                else if (this.dragAxis === 'y') axisVec = north;
                else axisVec = up;
            }

            // 计算屏幕圆心和鼠标向量
            let delta = 0;
            if (base && axisVec) {
                const scene = this.viewer.scene;
                const centerWin = scene.cartesianToCanvasCoordinates(base, new Cartesian3());
                if (centerWin) {
                    const prev = this.lastMouseScreen || movement.endPosition;
                    const curr = movement.endPosition;
                    // 以圆心为原点，计算上一次和当前鼠标向量
                    const v0 = { x: prev.x - centerWin.x, y: prev.y - centerWin.y };
                    const v1 = { x: curr.x - centerWin.x, y: curr.y - centerWin.y };
                    // 计算两向量的夹角，符号由z分量决定
                    const len0 = Math.sqrt(v0.x * v0.x + v0.y * v0.y);
                    const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
                    if (len0 > 0 && len1 > 0) {
                        const dot = (v0.x * v1.x + v0.y * v1.y) / (len0 * len1);
                        // 防止数值溢出
                        const clampedDot = Math.max(-1, Math.min(1, dot));
                        let angle = Math.acos(clampedDot);
                        // 叉乘z分量决定正负
                        const cross = v0.x * v1.y - v0.y * v1.x;
                        if (cross < 0) angle = -angle;
                        delta = angle;
                    }
                    this.lastMouseScreen = { x: curr.x, y: curr.y };
                }
            }

            this.applyRotation(this.dragAxis, delta);
        }, ScreenSpaceEventType.MOUSE_MOVE);

        handler.setInputAction(() => {
            this.dragAxis = null;
            this.dragStartAngle = null;
            this.dragStartMouse = null;
            this.axisHighlightIndex = null;
            this.lastMouseScreen = null;
            this.viewer.scene.requestRender();
            // 恢复地图拖动
            const controller = this.viewer.scene.screenSpaceCameraController;
            controller.enableRotate = true;
            controller.enableTranslate = true;
            controller.enableTilt = true;
            controller.enableZoom = true;
            //@ts-ignore
            this.viewer.container.style.cursor = "";
        }, ScreenSpaceEventType.LEFT_UP);

        this.handlers.push(handler);
    }

    private getMouseAngleOnRing(screenPos: any, axis: 'x' | 'y' | 'z'): number | null {
        // 计算鼠标在圆环平面上的角度
        const ray = this.viewer.camera.getPickRay(screenPos);
        if (!ray) return null;
        const base = this.getPosition();
        if (!base) return null;
        // 计算局部坐标轴
        const ellipsoid = this.viewer.scene.globe.ellipsoid;
        const up = ellipsoid.geodeticSurfaceNormal(base, new Cartesian3());
        const east = Cartesian3.cross(Cartesian3.UNIT_Z, up, new Cartesian3());
        Cartesian3.normalize(east, east);
        const north = Cartesian3.cross(up, east, new Cartesian3());
        Cartesian3.normalize(north, north);
        let normal: Cartesian3, xAxis: Cartesian3, yAxis: Cartesian3;
        if (axis === 'x') {
            normal = east;
            xAxis = north;
            yAxis = up;
        } else if (axis === 'y') {
            normal = north;
            xAxis = up;
            yAxis = east;
        } else {
            normal = up;
            xAxis = east;
            yAxis = north;
        }
        // 求射线与平面交点
        const planeOrigin = base;
        const planeNormal = normal;
        const denom = Cartesian3.dot(ray.direction, planeNormal);
        if (Math.abs(denom) < 1e-6) return null;
        const t = Cartesian3.dot(Cartesian3.subtract(planeOrigin, ray.origin, new Cartesian3()), planeNormal) / denom;
        if (t < 0) return null;
        const hit = Cartesian3.add(ray.origin, Cartesian3.multiplyByScalar(ray.direction, t, new Cartesian3()), new Cartesian3());
        // 计算base->hit在xAxis/yAxis上的投影
        const v = Cartesian3.subtract(hit, base, new Cartesian3());
        const x = Cartesian3.dot(v, xAxis);
        const y = Cartesian3.dot(v, yAxis);
        return Math.atan2(y, x);
    }

    private getPosition(): Cartesian3 | null {
        if (this.tileset) {
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

    private applyRotation(axis: 'x' | 'y' | 'z', deltaRad: number) {
        if (this.tileset && this.tilesetModelMatrix && this.tilesetOrigin) {
            const t0 = Matrix4.fromTranslation(Cartesian3.negate(this.tilesetOrigin, new Cartesian3()));
            const t1 = Matrix4.fromTranslation(this.tilesetOrigin);

            // 计算当前位置的局部坐标轴
            const base = this.tilesetOrigin;
            const ellipsoid = this.viewer.scene.globe.ellipsoid;
            const up = ellipsoid.geodeticSurfaceNormal(base, new Cartesian3());
            const east = Cartesian3.cross(Cartesian3.UNIT_Z, up, new Cartesian3());
            Cartesian3.normalize(east, east);
            const north = Cartesian3.cross(up, east, new Cartesian3());
            Cartesian3.normalize(north, north);

            let axisVec: Cartesian3;
            if (axis === 'x') axisVec = east;
            else if (axis === 'y') axisVec = north;
            else axisVec = up;

            const rotQ = Quaternion.fromAxisAngle(axisVec, deltaRad);
            const rotMat3 = Matrix3.fromQuaternion(rotQ);
            const rotationMatrix = Matrix4.fromRotationTranslation(rotMat3);

            const newMatrix = Matrix4.multiply(
                Matrix4.multiply(
                    Matrix4.multiply(t1, rotationMatrix, new Matrix4()),
                    t0,
                    new Matrix4()
                ),
                this.tilesetModelMatrix,
                new Matrix4()
            );
            this.tileset.modelMatrix = newMatrix;
            this.tilesetModelMatrix = newMatrix;
        } else if (this.target) {
            const pos = this.getPosition();
            if (!pos) return;
            const ellipsoid = this.viewer.scene.globe.ellipsoid;
            const up = ellipsoid.geodeticSurfaceNormal(pos, new Cartesian3());
            const east = Cartesian3.cross(Cartesian3.UNIT_Z, up, new Cartesian3());
            Cartesian3.normalize(east, east);
            const north = Cartesian3.cross(up, east, new Cartesian3());
            Cartesian3.normalize(north, north);

            let axisVec: Cartesian3;
            if (axis === 'x') axisVec = east;
            else if (axis === 'y') axisVec = north;
            else axisVec = up;

            let q0: Quaternion;
            if (this.target.orientation && typeof this.target.orientation.getValue === 'function') {
                q0 = this.target.orientation.getValue(this.viewer.clock.currentTime);
            } else {
                q0 = Quaternion.IDENTITY;
            }
            const rotQ = Quaternion.fromAxisAngle(axisVec, deltaRad);
            const qNew = Quaternion.multiply(rotQ, q0, new Quaternion());
            //@ts-ignore
            this.target.orientation = qNew;
        }
    }

    destroy() {
        this.ringEntities.forEach(e => this.viewer.entities.remove(e));
        this.handlers.forEach(h => h.destroy());
        this.ringEntities = [];
        this.handlers = [];
    }
}
