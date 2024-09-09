import { Cartesian3, JulianDate, SampledPositionProperty, Math as CesiumMath, TimeInterval, TimeIntervalCollection, VelocityOrientationProperty, CatmullRomSpline, Viewer, HeadingPitchRange, Cartographic, ColorMaterialProperty, Color, ClockRange, ClockStep, HermitePolynomialApproximation, LagrangePolynomialApproximation, Matrix4 } from "cesium";
import { Component } from "../core/decorators";
import BaseWidget from "../earth/base-widget";
import Template from "./path-fly.html?raw";
import "./path-fly.scss";
import { paths } from "./paths";

@Component({
    tagName: "czm-path-fly",
    className: "czm-path-fly",
    template: Template,
})
export default class PathFly extends BaseWidget {
    constructor() {
        super();
    }

    public beforeInit() {
        this.$data = {
            paths: paths,
            currentPath: paths[0],
            temps: [
            ]
        }
    }

    record() {
        const currentPosition = this.viewer.camera.position;
        const pos = this.cartesian3ToWGS84(currentPosition);
        this.$data.temps.push({
            lon: pos.longitude,
            lat: pos.latitude,
            height: pos.height
        });
    }
    clear() {
        this.$data.temps = [];
    }
    pathChange(index: any) {
        this.$data.currentPath = paths[index];
    }
    go() {
        // this.startFly(this.$data.temps);
        this.startFly(this.$data.currentPath.path);
    }

    public async onInit() {
        this.$data.currentPath = paths[0];
    }

    focusModel() {
        const position = this.$data.currentPath.initPosition;
        this.viewer.camera.flyTo({
            destination: Cartesian3.fromDegrees(position.lon, position.lat, position.height),
            orientation: {
                heading: CesiumMath.toRadians(position.heading),
                pitch: CesiumMath.toRadians(position.pitch),
                roll: CesiumMath.toRadians(position.roll),
            },
        });
    }

    outModel() {
        const position = this.$data.currentPath.outPosition;
        this.viewer.camera.flyTo({
            destination: Cartesian3.fromDegrees(position.lon, position.lat, position.height),
            orientation: {
                heading: CesiumMath.toRadians(position.heading),
                pitch: CesiumMath.toRadians(position.pitch),
                roll: CesiumMath.toRadians(position.roll),
            },
        });
    }

    startFly(positions: any) {
        let viewer: Viewer = this.viewer;
        let property = this.computeRoamingLineProperty(positions, 40);

        property.setInterpolationOptions({
            interpolationDegree: 5,
            interpolationAlgorithm: LagrangePolynomialApproximation,
        })
        // return
        const entity = viewer.entities.add({
            // availability: new TimeIntervalCollection([
            //     new TimeInterval({
            //         start: JulianDate.now(),
            //         stop: JulianDate.addSeconds(
            //             JulianDate.now(),
            //             positions.length * 2,
            //             new JulianDate()
            //         ),
            //     }),
            // ]),
            position: property,
            orientation: new VelocityOrientationProperty(property),
            model: this.$data.currentPath.model,
            // path: {
            //     resolution: 1,
            //     material: new ColorMaterialProperty(
            //         Color.RED.withAlpha(0.7)
            //     ),
            //     width: 5,
            //     leadTime: 0,
            //     trailTime: 60,
            // },
        });

        this.entity = entity;

        this.handler = viewer.scene.preRender.addEventListener((scene: any, time: any) => {
            if (entity) {
                const position = entity.position?.getValue(time);
                if (position) {
                    this.position2 = this.cartesian3ToWGS84(position);
                    let heading = 0;
                    // 前一个位置点位
                    if (this.position1) {
                        // 计算前一个点位与第二个点位的偏航角
                        heading = this.bearing(this.position1.latitude, this.position1.longitude,
                            this.position2.latitude, this.position2.longitude);
                        // 计算俯仰角

                    }
                    this.position1 = this.cartesian3ToWGS84(position);
                    if (position && this.viewer.clock.multiplier !== 0) {
                        const dynamicHeading = CesiumMath.toRadians(heading);
                        const pitch = CesiumMath.toRadians(this.$data.currentPath.pitch);
                        const range = 1.0;
                        this.viewer.camera.lookAt(position, new HeadingPitchRange(dynamicHeading, pitch, range));
                    }
                }
            }
        });

        // viewer.trackedEntity = entity;
    }

    pauseOrcontinue() {
        if (this.viewer.clock.multiplier !== 0) {
            this.viewer.clock.multiplier = 0;
            this.viewer.camera.lookAtTransform(Matrix4.IDENTITY);
        } else {
            this.viewer.clock.multiplier = this.multiplier;
        }
    }

    // 路径插值
    spline(positions: any[]) {
        let times: any = []
        const controls = positions.map((position: any, index: number) => {
            times.push(index / positions.length);
            return Cartesian3.fromDegrees(position.lon, position.lat, position.height);
        });

        let spline = new CatmullRomSpline({
            times: times,
            points: controls,
        });
        const pos = [];
        for (let i = 0; i < 50; i++) {
            const time = i / 50;
            const point = spline.evaluate(time);
            pos.push(point);
        }
        const polyline = this.viewer.entities.add({
            polyline: {
                positions: pos,
                width: 2,
                material: Color.RED,
            },
        });
        this.viewer.zoomTo(polyline);

        return pos;
    }

    /**
   * 创建位置集合
   * @param {cartesian3} coordinates 点集合
   * @param {*} time 漫游时间
   * @returns
   */
    computeRoamingLineProperty(coordinates: any[], time: number) {
        // coordinates = this.spline(coordinates);
        const property = new SampledPositionProperty();
        const coordinatesLength = coordinates.length;
        const tempTime = time - (time % coordinatesLength);
        const increment = tempTime / coordinatesLength;
        const start = JulianDate.now();
        const stop = JulianDate.addSeconds(start, tempTime, new JulianDate());
        this.start = start;
        this.stop = stop;
        this.multiplier = 0.5;
        this.setClockTime(start, stop, this.multiplier);
        for (let i = 0; i < coordinatesLength; i += 1) {
            const time1 = JulianDate.addSeconds(start, i * increment, new JulianDate());
            // const position = coordinates[i];
            let position = Cartesian3.fromDegrees(
                coordinates[i].lon,
                coordinates[i].lat,
                coordinates[i].height
            );
            property.addSample(time1, position);
        }
        return property;
    }

    /**
       * 设置漫游事件系统
       * @param {*} start
       * @param {*} stop
       * @param {*} multiplier
       * @memberof Roaming
       */
    setClockTime(start: { clone: () => any; }, stop: { clone: () => any; }, multiplier: any) {
        // 将当前日期转为JulianDate
        this.viewer.clock.startTime = start.clone();
        this.viewer.clock.stopTime = stop.clone();
        this.viewer.clock.currentTime = start.clone();
        this.viewer.clock.multiplier = multiplier;
        // 默认循环漫游
        this.viewer.clock.clockRange = ClockRange.LOOP_STOP;
        // 时钟在此模式下前进的间隔当前间隔乘以某个系数
        this.viewer.clock.clockStep = ClockStep.SYSTEM_CLOCK_MULTIPLIER;
    }
    cartesian3ToWGS84(point: any) {
        const cartographic = Cartographic.fromCartesian(point);
        const lat = CesiumMath.toDegrees(cartographic.latitude);
        const lng = CesiumMath.toDegrees(cartographic.longitude);
        const alt = cartographic.height;
        return {
            longitude: lng,
            latitude: lat,
            height: alt,
        };
    }
    /**
     * @name bearing 计算两点的角度 heading
     * @param startLat 初始点的latitude
     * @param startLng 初始点的longitude
     * @param destLat 第二个点的latitude
     * @param destLng 第二个点的latitude
     * @return {number} heading值
     */
    bearing(startLat: number, startLng: number, destLat: number, destLng: number) {
        startLat = CesiumMath.toRadians(startLat);
        startLng = CesiumMath.toRadians(startLng);
        destLat = CesiumMath.toRadians(destLat);
        destLng = CesiumMath.toRadians(destLng);
        const y = Math.sin(destLng - startLng) * Math.cos(destLat);
        const x = Math.cos(startLat) * Math.sin(destLat) - Math.sin(startLat) * Math.cos(destLat) * Math.cos(destLng - startLng);
        const brng = Math.atan2(y, x);
        const brngDgr = CesiumMath.toDegrees(brng);
        return (brngDgr + 360) % 360;
    }

    stopFly() {
        this.viewer.clock.multiplier = 0;
        if (this.entity) {
            this.viewer.entities.remove(this.entity);
        }
        if (this.handler) {
            this.handler();
            this.handlder = null;
        }
        this.viewer.camera.lookAtTransform(Matrix4.IDENTITY);
    }

    public onClose(): void {
        this.stopFly();
    }

}