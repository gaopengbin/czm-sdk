import { Cartesian3, Viewer, Math, Ion, Rectangle } from 'cesium'
import CesiumNavigation from 'cesium-navigation-es6'
import './fixed/imageryLayer'
const initScene = (container: string | Element, options?: Viewer.ConstructorOptions) => {
    const viewer = new Viewer(container, options)
    viewer.scene.postProcessStages.fxaa.enabled = true;

    const option: any = {};
    // 用于在使用重置导航重置地图视图时设置默认视图控制。接受的值是Cesium.Cartographic 和 Cesium.Rectangle.
    option.defaultResetView = Rectangle.fromDegrees(80, 22, 130, 50);
    // 用于启用或禁用罗盘。true是启用罗盘，false是禁用罗盘。默认值为true。如果将选项设置为false，则罗盘将不会添加到地图中。
    option.enableCompass = true;
    // 用于启用或禁用缩放控件。true是启用，false是禁用。默认值为true。如果将选项设置为false，则缩放控件将不会添加到地图中。
    option.enableZoomControls = true;
    // 用于启用或禁用距离图例。true是启用，false是禁用。默认值为true。如果将选项设置为false，距离图例将不会添加到地图中。
    option.enableDistanceLegend = true;
    // 用于启用或禁用指南针外环。true是启用，false是禁用。默认值为true。如果将选项设置为false，则该环将可见但无效。
    option.enableCompassOuterRing = true;

    //修改重置视图的tooltip
    option.resetTooltip = "重置视图";
    //修改放大按钮的tooltip
    option.zoomInTooltip = "放大";
    //修改缩小按钮的tooltip
    option.zoomOutTooltip = "缩小";

    //如需自定义罗盘控件，请看下面的自定义罗盘控件
    let navigation = new CesiumNavigation(viewer, option);
    // console.log(navigation)
    return viewer
}
const initViewer = (viewer: Viewer, options: { position: number[], hpr: number[], ionDefaultToken: string }): void => {
    const { position, hpr, ionDefaultToken } = options;
    if (ionDefaultToken) {
        Ion.defaultAccessToken = ionDefaultToken;
    }
    const HPR = hpr || [0, -90, 0];
    if (position) {
        viewer.camera.setView({
            destination: Cartesian3.fromDegrees(position[0], position[1], position[2]),
            orientation: {
                heading: Math.toRadians(HPR[0]),
                pitch: Math.toRadians(HPR[1]),
                roll: Math.toRadians(HPR[2])
            }
        });
    }
}

export { initScene, initViewer }
export { SceneTree } from './sceneTree'
export {
    WMSParser,
    WMTSParser,
    esri2geo
} from './parser'