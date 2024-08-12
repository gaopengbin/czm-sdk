import { CallbackProperty, Cartesian2, Cartesian3, Cartographic, Cesium3DTileFeature, Cesium3DTileset, Color, HorizontalOrigin, Model, ScreenSpaceEventHandler, ScreenSpaceEventType, VerticalOrigin, Viewer, Math as CMath, EllipsoidTerrainProvider, Ellipsoid, PolygonHierarchy, PolylineDashMaterialProperty, Ray, Scene, SceneMode } from "cesium";
import { Helper } from "../helper";
export class MeasureTool {
    viewer: Viewer;
    measureHandler: MeasureHandler;
    constructor(viewer: Viewer) {
        this.viewer = viewer;
        this.measureHandler = new MeasureHandler(viewer);
    }
    startMeasure(type: string) {
        this.measureHandler.startMeasure(type);
    }
    endMeasure() {
        this.measureHandler.endMeasure();
    }
    clearMeasure() {
        this.measureHandler.clearMeasure();
    }
}

export class MeasureHandler {
    viewer: Viewer;
    measureType: string;
    measure: Measure | null;
    constructor(viewer: Viewer) {
        this.viewer = viewer;
        this.measureType = "";
        this.measure = null;
    }
    startMeasure(type: string) {
        this.measureType = type;
        if (!this.measure) {
            this.measure = new Measure(this.viewer, type);
        }
        this.measure.type = type;
        this.measure.measure();
    }
    endMeasure() {
        this.measureType = "";
        // this.measure = null;
    }
    clearMeasure() {
        this.measureType = "";
        this.measure = null;
    }
}

class Measure {
    viewer: Viewer;
    type: string;
    handler: any;
    labelStyle: {};
    endDrawing: any = [];
    disposer: any = [];
    helper: Helper;
    constructor(viewer: Viewer, type: string) {
        this.viewer = viewer;
        this.type = type;
        this.handler = null;
        this.labelStyle = {
            font: "14px sans-serif bold",
            horizontalOrigin: HorizontalOrigin.CENTER,
            verticalOrigin: VerticalOrigin.BOTTOM,
            fillColor: Color.WHITE.withAlpha(0.9),
            outlineColor: Color.WHITE,
            outlineWidth: 2,
            backgroundColor: Color.BLACK.withAlpha(0.5),
            showBackground: true,
            pixelOffset: new Cartesian2(0, -10),
            disableDepthTestDistance: 1000000,
        }
        this.helper = new Helper(viewer);
    }
    measure() {
        this.endMeasure();
        switch (this.type) {
            case "point":
                this.measurePoint();
                break
            case "distance":
                this.measureDistance();
                break;
            case "area":
                this.measureArea();
                break;
            case "clear":
                this.clear();
                break;
            default:
                break;
        }
    }
    //测量点位
    measurePoint() {
        this.handler = new ScreenSpaceEventHandler(this.viewer.scene.canvas);
        this.viewer.canvas.style.cursor = "crosshair";
        let labels: any[] = [];
        let labelPosition = new Cartesian3(0, 0, 0);
        let labelText = "点";
        let label = this.viewer.entities.add({
            position: new CallbackProperty(() => {
                return labelPosition;
            }, false) as any,
            point: {
                pixelSize: 5,
                color: Color.RED.withAlpha(0.9),
                disableDepthTestDistance: 1000000,
            },
            label: {
                text: new CallbackProperty(() => {
                    return labelText;
                }, false),
                ...this.labelStyle
            },
        });
        this.handler.setInputAction((click: any) => {
            let position = getCartesian3FromCartesian2(this.viewer, click.position);

            if (!position) {
                return;
            }
            let jwd = transformCartesianToWGS84(this.viewer, position);
            if (!jwd) return;
            // labelPosition = position;
            // labelText = `经度:${jwd.lon.toFixed(6)} \n纬度:${jwd.lat.toFixed(6)} \n高度:${jwd.alt.toFixed(2)}`;
            let point = this.viewer.entities.add({
                position: position,
                point: {
                    pixelSize: 5,
                    color: Color.RED.withAlpha(0.9),
                },
                label: {
                    text: labelText,
                    ...this.labelStyle
                },
            });
            labels.push(point);
        }, ScreenSpaceEventType.LEFT_CLICK);
        this.handler.setInputAction((move: any) => {
            // let position = getCartesian3FromCartesian2(this.viewer, move.endPosition);
            let position = PickPosition(this.viewer.scene, move.endPosition, new Cartesian3());
            if (!position) {
                return;
            }
            let jwd = transformCartesianToWGS84(this.viewer, position);
            if (!jwd) return;
            (label as any).point.show = false;
            labelPosition = position;
            labelText = `经度:${jwd.lon.toFixed(6)} \n纬度:${jwd.lat.toFixed(6)}\n 高度:${jwd.alt.toFixed(2)}`;
        }, ScreenSpaceEventType.MOUSE_MOVE);

        const endDrawing = () => {
            this.viewer.canvas.style.cursor = "default";
            this.handler.removeInputAction(ScreenSpaceEventType.LEFT_CLICK);
            this.handler.removeInputAction(ScreenSpaceEventType.MOUSE_MOVE);
            if (label) {
                this.viewer.entities.remove(label);
            }
            this.handler.removeInputAction(ScreenSpaceEventType.RIGHT_CLICK);
        }
        this.endDrawing.push(endDrawing);
        this.handler.setInputAction(() => {
            endDrawing();
        }, ScreenSpaceEventType.RIGHT_CLICK);

        const clear = () => {
            endDrawing();
            labels.forEach((label) => {
                this.viewer.entities.remove(label);
            });
        }
        this.disposer.push(clear);
    }
    //测量距离
    measureDistance() {
        this.helper.show("左键单击绘制，右键结束绘制");
        this.handler = new ScreenSpaceEventHandler(this.viewer.scene.canvas);
        let positions: any[] = [];
        let points: any[] = [];
        let labels: any[] = [];
        let movePosition: any = null;
        // 绘制测距线
        let polyline = this.viewer.entities.add({
            polyline: {
                positions: new CallbackProperty(() => {
                    if (movePosition) {
                        return positions.concat(movePosition);
                    } else {
                        return positions;
                    }
                }, false),
                width: 2,
                material: new PolylineDashMaterialProperty({
                    color: Color.CYAN,
                }),
            },
        });
        // 绘制移动点
        let movePoint = this.viewer.entities.add({
            position: new CallbackProperty(() => {
                if (movePosition) {
                    return movePosition;
                }
            }, false) as any,
            point: {
                pixelSize: 5,
                color: Color.RED,
            },
        });

        let totalDistance = 0;
        // 绘制总距离文字
        let text = this.viewer.entities.add({
            position: new CallbackProperty(() => {
                if (positions.length > 0) {
                    return positions[0];
                }
            }, false) as any,
            label: {
                text: new CallbackProperty(() => {
                    return `总长度${(totalDistance + moveDistance).toFixed(2)}m`;
                }, false),
                ...this.labelStyle
            },
        });
        //左键单击绘制
        this.handler.setInputAction((click: any) => {
            moveDistance = 0;
            // let position = this.viewer.camera.pickEllipsoid(click.position, this.viewer.scene.globe.ellipsoid);
            let position = getCartesian3FromCartesian2(this.viewer, click.position);
            if (!position) {
                return;
            }
            // 绘制线进行测距
            positions.push(position);
            let distance = 0;
            if (positions.length > 1) {
                distance = Cartesian3.distance(positions[positions.length - 2], position);
            }
            totalDistance += distance;

            // 绘制节点
            let _point = this.viewer.entities.add({
                position: position,
                point: {
                    pixelSize: 5,
                    color: Color.YELLOW,
                },
            });
            points.push(_point);
            //绘制文字 文字位置在两点之间
            if (positions.length > 1) {
                let textPosition = Cartesian3.midpoint(positions[positions.length - 2], position, new Cartesian3());
                let _text = this.viewer.entities.add({
                    position: textPosition,
                    label: {
                        text: '距离:' + distance.toFixed(2) + "m",
                        ...this.labelStyle
                    },
                });
                labels.push(_text);
            }

        }, ScreenSpaceEventType.LEFT_CLICK);

        //鼠标移动时的动态距离文字
        let moveDistance = 0;
        let moveText = this.viewer.entities.add({
            position: new CallbackProperty(() => {
                if (positions.length > 1 && movePosition) {
                    let moveTextPosition = Cartesian3.midpoint(positions[positions.length - 1], movePosition, new Cartesian3());
                    return moveTextPosition;
                }
            }, false) as any,
            label: {
                text: new CallbackProperty(() => {
                    return `距离:${moveDistance.toFixed(2)}m`;
                }, false),
                ...this.labelStyle
            },
        });
        //鼠标移动事件
        this.handler.setInputAction((move: any) => {
            let position = this.viewer.camera.pickEllipsoid(move.endPosition, this.viewer.scene.globe.ellipsoid);
            if (!position) {
                return;
            }
            movePosition = position;

            if (positions.length > 0) {
                moveDistance = Cartesian3.distance(positions[positions.length - 1], position);
            }

        }, ScreenSpaceEventType.MOUSE_MOVE);

        const endDrawing = () => {
            this.handler.removeInputAction(ScreenSpaceEventType.LEFT_CLICK);
            this.handler.removeInputAction(ScreenSpaceEventType.MOUSE_MOVE);
            this.viewer.entities.remove(movePoint);
            this.viewer.entities.remove(moveText);
            movePosition = null;
            moveDistance = 0;
            if (positions.length <= 1) {
                this.viewer.entities.remove(polyline);
                this.viewer.entities.remove(text);
                points.forEach((point) => {
                    this.viewer.entities.remove(point);
                });
                labels.forEach((label) => {
                    this.viewer.entities.remove(label);
                });
            }
            this.handler.removeInputAction(ScreenSpaceEventType.RIGHT_CLICK);
            this.helper.clear();
        }
        this.endDrawing.push(endDrawing);
        //右键结束绘制
        this.handler.setInputAction(() => {
            endDrawing();
        }, ScreenSpaceEventType.RIGHT_CLICK);

        const clear = () => {
            endDrawing();
            this.viewer.entities.remove(polyline);
            this.viewer.entities.remove(text);
            points.forEach((point) => {
                this.viewer.entities.remove(point);
            });
            labels.forEach((label) => {
                this.viewer.entities.remove(label);
            });
            if (moveText) {
                this.viewer.entities.remove(moveText);
            }
            if (polyline) {
                this.viewer.entities.remove(polyline);
            }
        }
        this.disposer.push(clear);
    }
    //测量平面面积
    measureArea() {
        this.helper.show("左键单击绘制，右键结束绘制");
        this.handler = new ScreenSpaceEventHandler(this.viewer.scene.canvas);
        let positions: any[] = [];
        let points: any[] = [];
        let labels: any[] = [];
        let movePosition: any = null;
        //绘制多边形
        let polygon = this.viewer.entities.add({
            polygon: {
                hierarchy: new CallbackProperty(() => {
                    if (positions.length >= 2) {
                        if (movePosition) {
                            return new PolygonHierarchy(positions.concat(movePosition));
                        } else if (positions.length > 2) {
                            return new PolygonHierarchy(positions);
                        }
                    }

                }, false),
                material: Color.AQUA.withAlpha(0.5),
            },
        });
        //绘制移动点
        let movePoint = this.viewer.entities.add({
            position: new CallbackProperty(() => {
                if (movePosition) {
                    return movePosition;
                }
            }, false) as any,
            point: {
                pixelSize: 5,
                color: Color.RED,
            },
        });
        let totalArea = 0;
        let moveArea = 0;
        //绘制总面积文字
        let text = this.viewer.entities.add({
            position: new CallbackProperty(() => {
                if (positions.length > 2) {
                    return getCenter(positions);
                } else if (positions.length >= 2 && movePosition) {
                    return getCenter(positions.concat(movePosition));
                }
            }, false) as any,
            label: {
                text: new CallbackProperty(() => {
                    return `总面积${(moveArea).toFixed(2)}m²`;
                }, false),
                ...this.labelStyle
            },
        });
        //左键单击绘制
        this.handler.setInputAction((click: any) => {
            let position = getCartesian3FromCartesian2(this.viewer, click.position);
            if (!position) {
                return;
            }
            positions.push(position);
            //绘制节点
            let _point = this.viewer.entities.add({
                position: position,
                point: {
                    pixelSize: 5,
                    color: Color.YELLOW,
                },
            });
            points.push(_point);
            // 计算面积
            if (positions.length > 2) {
                let area = getPositionsArea(transformCartesianArrayToWGS84Array(this.viewer, positions));
                totalArea = area;
            }

        }, ScreenSpaceEventType.LEFT_CLICK);
        //鼠标移动事件
        this.handler.setInputAction((move: any) => {
            let position = this.viewer.camera.pickEllipsoid(move.endPosition, this.viewer.scene.globe.ellipsoid);
            if (!position) {
                return;
            }
            if (positions.length >= 2) {
                let area = getPositionsArea(transformCartesianArrayToWGS84Array(this.viewer, positions.concat(position)));
                moveArea = area;
            }
            movePosition = position;
        }, ScreenSpaceEventType.MOUSE_MOVE);

        const endDrawing = () => {
            this.handler.removeInputAction(ScreenSpaceEventType.LEFT_CLICK);
            this.handler.removeInputAction(ScreenSpaceEventType.MOUSE_MOVE);
            this.viewer.entities.remove(movePoint);
            movePosition = null;
            if (positions.length <= 2) {
                this.viewer.entities.remove(polygon);
                points.forEach((point) => {
                    this.viewer.entities.remove(point);
                });
                labels.forEach((label) => {
                    this.viewer.entities.remove(label);
                });
            }
            moveArea = totalArea;
            this.handler.removeInputAction(ScreenSpaceEventType.RIGHT_CLICK);
            this.helper.clear();
        }
        this.endDrawing.push(endDrawing);
        //右键结束绘制
        this.handler.setInputAction(() => {
            endDrawing();
        }, ScreenSpaceEventType.RIGHT_CLICK);

        const clear = () => {
            endDrawing();
            this.viewer.entities.remove(polygon);
            points.forEach((point) => {
                this.viewer.entities.remove(point);
            });
            labels.forEach((label) => {
                this.viewer.entities.remove(label);
            });
            if (text) {
                this.viewer.entities.remove(text);
            }
            if (polygon) {
                this.viewer.entities.remove(polygon);
            }
        }
        this.disposer.push(clear);
    }
    //结束绘制
    endMeasure() {
        this.helper && this.helper.clear();
        this.endDrawing.forEach((endDrawing: any) => {
            endDrawing();
        });
    }
    //清除
    clear() {
        this.endMeasure();
        this.disposer.forEach((dispose: any) => {
            dispose();
        });
    }
}

const getCartesian3FromCartesian2 = (viewer: Viewer, px: Cartesian2) => {
    if (viewer && px) {
        var picks = viewer.scene.drillPick(px)
        var cartesian = null;
        var isOn3dtiles = false, isOnTerrain = false;
        // drillPick
        for (let i in picks) {
            let pick = picks[i]

            if (pick &&
                pick.primitive instanceof Cesium3DTileFeature
                || pick && pick.primitive instanceof Cesium3DTileset
                || pick && pick.primitive instanceof Model) { //模型上拾取
                isOn3dtiles = true;
            }
            // 3dtilset
            if (isOn3dtiles) {
                viewer.scene.pick(px) // pick
                cartesian = viewer.scene.pickPosition(px);
                if (cartesian) {
                    let cartographic = Cartographic.fromCartesian(cartesian);
                    if (cartographic.height < 0) cartographic.height = 0;
                    let lon = CMath.toDegrees(cartographic.longitude)
                        , lat = CMath.toDegrees(cartographic.latitude)
                        , height = cartographic.height;
                    cartesian = transformWGS84ToCartesian(viewer, { lon: lon, lat: lat, alt: height })

                }
            }
        }
        // 地形
        let boolTerrain = viewer.terrainProvider instanceof EllipsoidTerrainProvider;
        // Terrain
        if (!isOn3dtiles && !boolTerrain) {
            var ray = viewer.scene.camera.getPickRay(px);
            if (!ray) return null;
            cartesian = viewer.scene.globe.pick(ray, viewer.scene);
            isOnTerrain = true
        }
        // 地球
        if (!isOn3dtiles && !isOnTerrain && boolTerrain) {

            cartesian = viewer.scene.camera.pickEllipsoid(px, viewer.scene.globe.ellipsoid);
        }
        if (cartesian) {
            let position = transformCartesianToWGS84(viewer, cartesian)
            if (position && position.alt < 0) {
                cartesian = transformWGS84ToCartesian(viewer, position, 0.1)
            }
            return cartesian;
        }
        return false;
    }
}

const transformWGS84ToCartesian = (viewer: Viewer, position: { lon: number, lat: number, alt?: number }, alt?: number) => {
    if (viewer) {
        return position
            ? Cartesian3.fromDegrees(
                position.lon,
                position.lat,
                position.alt = alt || position.alt,
                Ellipsoid.WGS84
            )
            : Cartesian3.ZERO
    }
}

const transformCartesianToWGS84 = (viewer: Viewer, cartesian: Cartesian3) => {
    if (viewer && cartesian) {
        let cartographic = Cartographic.fromCartesian(cartesian);
        let lon = CMath.toDegrees(cartographic.longitude)
            , lat = CMath.toDegrees(cartographic.latitude)
            , alt = cartographic.height;
        return { lon, lat, alt }
    }
}

const transformWGS84ToCartographic = (position: { lon: number; lat: number; alt: number | undefined; }) => {
    return position
        ? Cartographic.fromDegrees(
            position.lon,
            position.lat,
            position.alt
        )
        : Cartographic.ZERO
}

const transformCartesianArrayToWGS84Array = (viewer: Viewer, cartesianArr: Cartesian3[]) => {
    if (viewer) {
        return cartesianArr
            ? cartesianArr.map(function (item) { return transformCartesianToWGS84(viewer, item) })
            : []
    }
}

const getPositionsArea = (positions: any) => {
    let result: number = 0
    if (positions) {
        let h = 0
        let ellipsoid = Ellipsoid.WGS84
        positions.push(positions[0])
        for (let i = 1; i < positions.length; i++) {
            let oel = ellipsoid.cartographicToCartesian(
                transformWGS84ToCartographic(positions[i - 1])
            )
            let el = ellipsoid.cartographicToCartesian(
                transformWGS84ToCartographic(positions[i])
            )
            h += oel.x * el.y - el.x * oel.y
        }
        result = Number(Math.abs(h).toFixed(2))
    }
    return result
}

const getCenter = (positions: any) => {
    if (positions) {
        let x = 0, y = 0, z = 0
        for (let i = 0; i < positions.length; i++) {
            let cart = positions[i]
            x += cart.x
            y += cart.y
            z += cart.z
        }
        return new Cartesian3(x / positions.length, y / positions.length, z / positions.length)
    }
    return null
}

export {
    getCartesian3FromCartesian2,
    transformWGS84ToCartesian,
    transformCartesianToWGS84,
    transformWGS84ToCartographic,
    transformCartesianArrayToWGS84Array,
    getPositionsArea,
    getCenter
}

let tempRay = new Ray();
function PickPosition(scene: Scene, windowPosition: Cartesian2, result: any) {
    let cartesian = undefined;

    if (scene.mode !== SceneMode.MORPHING) {
        if (scene.pickPositionSupported) {
            cartesian = scene.pickPosition(windowPosition, result);
        }

        let carto: any;
        cartesian && (carto = Cartographic.fromCartesian(cartesian));
        if (!carto || carto.height < -3000) {
            if (scene.terrainProvider instanceof EllipsoidTerrainProvider) {
                cartesian = scene.camera.pickEllipsoid(windowPosition, scene.globe.ellipsoid, result);
            } else {
                let ray: any = scene.camera.getPickRay(windowPosition, tempRay);
                cartesian = scene.globe.pick(ray, scene, result);
            }
        }
    }
    return cartesian;
}