import { CallbackProperty, Cartesian2, Cartesian3, Color, HorizontalOrigin, ScreenSpaceEventHandler, ScreenSpaceEventType, VerticalOrigin, Viewer } from "cesium";

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
    measure: any;
    constructor(viewer: Viewer) {
        this.viewer = viewer;
        this.measureType = "";
        this.measure = null;
    }
    startMeasure(type: string) {
        this.measureType = type;
        this.measure = new Measure(this.viewer, type);
        if (this.measure) {
            this.measure.measure();
        }
    }
    endMeasure() {
        this.measureType = "";
        this.measure = null;
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
    constructor(viewer: Viewer, type: string) {
        this.viewer = viewer;
        this.type = type;
        this.handler = null;
        this.labelStyle = {
            font: "14px sans-serif bold",
            horizontalOrigin: HorizontalOrigin.CENTER,
            verticalOrigin: VerticalOrigin.BOTTOM,
            fillColor: Color.WHITE,
            outlineColor: Color.WHITE,
            outlineWidth: 2,
            backgroundColor: Color.BLACK.withAlpha(0.5),
            showBackground: true,
            pixelOffset: new Cartesian3(0, 0, -20),
            eyeOffset: new Cartesian3(0, 0, -1000),
        }
    }
    measure() {
        console.log("measure", this.type);
        switch (this.type) {
            case "distance":
                this.measureDistance();
                break;
            case "area":
                // this.measureArea();
                break;
            default:
                break;
        }
    }
    measureDistance() {
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
                material: Color.AQUA,
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
            let position = this.viewer.camera.pickEllipsoid(click.position, this.viewer.scene.globe.ellipsoid);
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
        //右键结束绘制
        this.handler.setInputAction(() => {
            this.handler.removeInputAction(ScreenSpaceEventType.LEFT_CLICK);
            this.handler.removeInputAction(ScreenSpaceEventType.MOUSE_MOVE);
            this.viewer.entities.remove(movePoint);
            this.viewer.entities.remove(moveText);
            movePosition = null;
            moveDistance = 0;
            console.log("positions", positions);
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
        }, ScreenSpaceEventType.RIGHT_CLICK);
    }
}