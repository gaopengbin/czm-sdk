import { Viewer } from '@cesium/widgets'
// import { Viewer } from 'cesium'
const initScene = (container: string | Element, options?: Viewer.ConstructorOptions) => {
    const viewer = new Viewer(container, options)
    return viewer
}

export { initScene }
export { SceneTree } from './sceneTree'