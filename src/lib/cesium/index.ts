import { Viewer } from '@cesium/widgets'

const initScene = (container: HTMLDivElement) => {
    const viewer = new Viewer(container)
    return viewer
}

export { initScene }