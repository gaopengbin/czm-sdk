import * as Cesium from 'cesium';
import * as turf from '@turf/turf';

export class DrawTool {
    private viewer: any;
    private handler: any;
    private activeShape: any;
    private activeShapePoints: any[] = [];
    private onDrawEndCallback: (entity: any) => void;

    constructor(viewer: any, onDrawEndCallback?: (entity: any) => void) {
        this.viewer = viewer;
        this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);
        this.onDrawEndCallback = onDrawEndCallback || (() => { });
    }

    drawPoint(): any {
        let entity: any = null;
        this.handler.setInputAction((movement: any) => {
            const cartesian = this.viewer.camera.pickEllipsoid(movement.position, this.viewer.scene.globe.ellipsoid);
            if (cartesian) {
                const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
                const longitude = Cesium.Math.toDegrees(cartographic.longitude);
                const latitude = Cesium.Math.toDegrees(cartographic.latitude);
                entity = this.viewer.entities.add({
                    position: cartesian,
                    point: {
                        pixelSize: 10,
                        color: Cesium.Color.RED,
                    },
                });
                console.log('绘制点:', [longitude, latitude]);
                this.onDrawEndCallback(entity);
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        return entity;
    }

    drawLine(spacing: number): any {
        const positions: any[] = [];
        let entity: any = null;

        this.handler.setInputAction((movement: any) => {
            const cartesian = this.viewer.camera.pickEllipsoid(movement.endPosition, this.viewer.scene.globe.ellipsoid);
            if (cartesian) {
                if (positions.length === 0) {
                    positions.push(cartesian.clone());
                }
                positions.pop();
                positions.push(cartesian);
                if (!Cesium.defined(this.activeShape)) {
                    this.activeShape = this.createPolyline(positions);
                }
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        this.handler.setInputAction((movement: any) => {
            const cartesian = this.viewer.camera.pickEllipsoid(movement.position, this.viewer.scene.globe.ellipsoid);
            if (cartesian) {
                positions.push(cartesian);
                if (!entity) {
                    entity = this.viewer.entities.add({
                        polyline: {
                            positions: new Cesium.CallbackProperty(() => positions, false),
                            width: 2,
                            material: Cesium.Color.BLUE,
                        },
                    });
                } else {
                    entity.polyline.positions = new Cesium.CallbackProperty(() => positions, false);
                }
                console.log('绘制线:', positions);
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        this.handler.setInputAction(() => {
            this.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
            this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
            this.handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
            this.viewer.entities.remove(this.activeShape);
            this.activeShape = null;
            this.onDrawEndCallback(entity);
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

        return {
            entity,
            getSampledPoints: () => this.getSampledPointsForLineEntity(entity, spacing)
        };
    }

    drawPolygon(spacing: number): any {
        const positions: any[] = [];
        let entity: any = null;

        this.handler.setInputAction((movement: any) => {
            const cartesian = this.viewer.camera.pickEllipsoid(movement.endPosition, this.viewer.scene.globe.ellipsoid);
            if (cartesian) {
                if (positions.length === 0) {
                    positions.push(cartesian.clone());
                }
                positions.pop();
                positions.push(cartesian);
                if (!Cesium.defined(this.activeShape) && positions.length > 2) {
                    this.activeShape = this.createPolygon(positions);
                }
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        this.handler.setInputAction((movement: any) => {
            const cartesian = this.viewer.camera.pickEllipsoid(movement.position, this.viewer.scene.globe.ellipsoid);
            if (cartesian) {
                positions.push(cartesian);
                if (positions.length > 2) {
                    // Ensure the first and last positions are the same to close the polygon
                    positions.push(positions[0]);
                    if (!entity) {
                        entity = this.viewer.entities.add({
                            polygon: {
                                hierarchy: new Cesium.PolygonHierarchy(positions),
                                material: Cesium.Color.WHITE.withAlpha(0.1),
                            },
                        });
                    } else {
                        entity.polygon.hierarchy = new Cesium.PolygonHierarchy(positions);
                    }
                    console.log('绘制面:', positions);
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        this.handler.setInputAction(() => {
            this.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
            this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
            this.handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
            this.viewer.entities.remove(this.activeShape);
            this.activeShape = null;
            this.onDrawEndCallback(entity);
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

        return {
            entity,
            getSampledPoints: () => positions
        };
    }

    drawRectangle(): any {
        let startPosition: any = null;
        let entity: any = null;

        this.handler.setInputAction((movement: any) => {
            startPosition = this.viewer.camera.pickEllipsoid(movement.position, this.viewer.scene.globe.ellipsoid);
            if (startPosition) {
                if (!entity) {
                    entity = this.viewer.entities.add({
                        rectangle: {
                            coordinates: new Cesium.CallbackProperty(() => {
                                const endPosition = this.viewer.camera.pickEllipsoid(movement.endPosition, this.viewer.scene.globe.ellipsoid);
                                if (endPosition) {
                                    const rectangle = Cesium.Rectangle.fromCartesianArray([startPosition, endPosition]);
                                    return rectangle;
                                }
                                return null;
                            }, false),
                            material: Cesium.Color.WHITE.withAlpha(0.1),
                        },
                    });
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

        this.handler.setInputAction(() => {
            this.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
            this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
            this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);
            this.viewer.entities.remove(this.activeShape);
            this.activeShape = null;
            this.onDrawEndCallback(entity);
        }, Cesium.ScreenSpaceEventType.LEFT_UP);

        return entity;
    }

    selectModelsInRectangle(callback: any): any {
        let startPosition: any = null;
        let rectangle: any = null;
        let entity: any = null;

        this.handler.setInputAction((movement: any) => {
            // 禁止拖动地图
            this.viewer.scene.screenSpaceCameraController.enableRotate = false;

            startPosition = this.viewer.camera.pickEllipsoid(movement.position, this.viewer.scene.globe.ellipsoid);
            console.log('startPosition:', startPosition);
            // if (startPosition) {
            //     if (!entity) {
            //         entity = this.viewer.entities.add({
            //             rectangle: {
            //                 coordinates: new Cesium.CallbackProperty(() => {
            //                     const endPosition = this.viewer.camera.pickEllipsoid(movement.endPosition, this.viewer.scene.globe.ellipsoid);
            //                     if (endPosition) {
            //                         const rectangle = Cesium.Rectangle.fromCartesianArray([startPosition, endPosition]);
            //                         return rectangle;
            //                     }
            //                     return null;
            //                 }, false),
            //                 material: Cesium.Color.WHITE.withAlpha(0.1),
            //             },
            //         });
            //     }
            // }
        }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

        this.handler.setInputAction((movement: any) => {
            const endPosition = this.viewer.camera.pickEllipsoid(movement.endPosition, this.viewer.scene.globe.ellipsoid);
            console.log('endPosition:', endPosition);
            if (startPosition && endPosition) {
                rectangle = Cesium.Rectangle.fromCartesianArray([startPosition, endPosition]);
                console.log('Selected rectangle:', rectangle);
                if (!entity) {
                    entity = this.viewer.entities.add({
                        rectangle: {
                            coordinates: new Cesium.CallbackProperty(() => rectangle, false),
                            material: Cesium.Color.WHITE.withAlpha(0.1),
                        },
                    });
                }
                // 选中矩形范围内的模型
                const models = this.viewer.scene.primitives._primitives.filter((primitive: any) => {
                    if (primitive instanceof Cesium.Model) {
                        const modelPosition = primitive.boundingSphere.center;
                        const cartographic = Cesium.Cartographic.fromCartesian(modelPosition);
                        return Cesium.Rectangle.contains(rectangle, cartographic);
                    }
                    return false;
                });
                console.log('Selected models:', models);
                callback(models);
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        this.handler.setInputAction(() => {
            // 恢复拖动地图
            this.viewer.scene.screenSpaceCameraController.enableRotate = true;
            this.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
            this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
            this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);
            this.viewer.entities.remove(this.activeShape);
            this.activeShape = null;
            // this.onDrawEndCallback(entity);
        }, Cesium.ScreenSpaceEventType.LEFT_UP);

        return entity;
    }

    private createPolyline(positions: any[]): any {
        return this.viewer.entities.add({
            polyline: {
                positions: new Cesium.CallbackProperty(() => positions, false),
                width: 2,
                material: Cesium.Color.YELLOW,
            },
        });
    }

    private createPolygon(positions: any[]): any {
        return this.viewer.entities.add({
            polygon: {
                hierarchy: new Cesium.CallbackProperty(() => new Cesium.PolygonHierarchy(positions), false),
                material: Cesium.Color.YELLOW.withAlpha(0.5),
            },
        });
    }

    private getSampledPointsForLineEntity(entity: any, spacing: number): any[] {
        const positions = entity.polyline.positions.getValue(Cesium.JulianDate.now());
        const coordinates = positions.map((position: any) => {
            const cartographic = Cesium.Cartographic.fromCartesian(position);
            return [Cesium.Math.toDegrees(cartographic.longitude), Cesium.Math.toDegrees(cartographic.latitude)];
        });
        return this.getSampledPointsForLine(coordinates, spacing);
    }

    private getSampledPointsForPolygonEntity(entity: any, spacing: number): any[] {
        const positions = entity.polygon.hierarchy.getValue(Cesium.JulianDate.now()).positions;
        const coordinates = positions.map((position: any) => {
            const cartographic = Cesium.Cartographic.fromCartesian(position);
            return [Cesium.Math.toDegrees(cartographic.longitude), Cesium.Math.toDegrees(cartographic.latitude)];
        });
        return this.getSampledPointsForPolygon(coordinates, spacing);
    }

    private getSampledPointsForLine(coordinates: any[], spacing: number): any[] {
        // 使用 Turf.js 根据间距获取线的采样点的逻辑
        const line = turf.lineString(coordinates);
        const length = turf.length(line, { units: 'meters' });
        const sampledPoints = [];
        for (let i = 0; i <= length; i += spacing) {
            const point = turf.along(line, i, { units: 'meters' });
            const [longitude, latitude] = point.geometry.coordinates;
            sampledPoints.push(Cesium.Cartesian3.fromDegrees(longitude, latitude));
        }
        return sampledPoints;
    }

    private getSampledPointsForPolygon(coordinates: any[], spacing: number): any[] {
        // Ensure the first and last positions are the same to close the polygon
        if (coordinates.length > 2 && (coordinates[0][0] !== coordinates[coordinates.length - 1][0] || coordinates[0][1] !== coordinates[coordinates.length - 1][1])) {
            coordinates.push(coordinates[0]);
        }
        const polygon = turf.polygon([coordinates]);
        const sampledPoints = turf.pointGrid(turf.bbox(polygon), spacing, { units: 'meters' }).features
            .filter(feature => turf.booleanPointInPolygon(feature, polygon))
            .map(feature => {
                const [longitude, latitude] = feature.geometry.coordinates;
                return Cesium.Cartesian3.fromDegrees(longitude, latitude);
            });
        return sampledPoints;
    }
}