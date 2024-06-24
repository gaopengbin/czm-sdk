import { Cartesian3, Viewer, Math, Ion } from 'cesium'
const initScene = (container: string | Element, options?: Viewer.ConstructorOptions) => {
    const viewer = new Viewer(container, options)
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