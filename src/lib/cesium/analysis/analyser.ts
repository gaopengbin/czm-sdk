import { Viewer } from "cesium";
import * as Cesium from "cesium";

export default class analyser {
    _viewer: Viewer;
    BEYONANALYSER_STATE: { PREPARE: number; OPERATING: number; END: number; DESTROYED: number };
    handler: any;
    constructor(viewer: Viewer) {
        //初始化分析工具
        this._viewer = viewer;

        this.BEYONANALYSER_STATE = {
            PREPARE: 0,
            OPERATING: 1,
            END: 2,
            DESTROYED: 3,
        };

        //初始化
        this.init();
    }

    init() {
        //handler
        this.handler = new Cesium.ScreenSpaceEventHandler(this._viewer.scene.canvas);
    }

    /**
     * 提示框
     * @param {*} bShow 
     * @param {*} position 
     * @param {*} message 
     */
    showTip(label: any, bShow: boolean, position: Cesium.Cartesian3, message: string, effectOptions?: any) {
        label.show = bShow;
        if (bShow) {
            if (position)
                label.position = position;
            if (message)
                label.label.text = message;
            if (effectOptions) {
                for (let key in effectOptions) {
                    if (label.key) {
                        label.key = effectOptions[key];
                    }
                }
            }
        }
    }

    /**
     * 获取相交对象
     * @param {*} startPos 
     * @param {*} endPos 
     * @param {*} excludeArr 
     * @param {*} bDrillPick 
     */
    getIntersectObj(startPos: Cesium.Cartesian3, endPos: Cesium.Cartesian3, excludeArr = [], bDrillPick = false) {
        var viewer = this._viewer;
        var direction = Cesium.Cartesian3.normalize(Cesium.Cartesian3.subtract(endPos, startPos, new Cesium.Cartesian3()), new Cesium.Cartesian3());
        var ray = new Cesium.Ray(startPos, direction); //无限延长的射线

        var results = [];

        if (bDrillPick) {
            // @ts-ignore
            results = viewer.scene.drillPickFromRay(ray, 10, excludeArr);
        } else //只pick首个物体
        {
            // @ts-ignore
            var result = viewer.scene.pickFromRay(ray, excludeArr);
            if (Cesium.defined(result)) {
                results = [result];
            }
        }
        return results;
    }
}
