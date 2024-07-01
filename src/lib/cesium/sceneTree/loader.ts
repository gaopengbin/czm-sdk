import { Leaf, SSArcGisLayerOptions, SSImageryLayer, SSLayerOptions, SSTerrainLayerOptions, SSTilesetLayer, SSWMSLayerOptions, SSXYZLayerOptions } from "./types";
import uuid from "../../common/uuid";

import {
    Viewer,
    Rectangle,
    defined,
    defaultValue,
    EllipsoidTerrainProvider,
    Cartesian3,
} from "cesium";
import { createArcGisMapServer, createGeoJson, createModel, createSSMapServer, createTerrain, createTileset, createWMS, createWMTS, createXYZ } from "./creator";
import { getSceneTree } from "@/component";

export const SSMapServerLoader = async (viewer: Viewer, options: SSArcGisLayerOptions) => {
    const esri = await createSSMapServer(options);
    let ssMapServerLayer: SSImageryLayer =
        viewer.imageryLayers.addImageryProvider(esri);

    Object.assign(ssMapServerLayer, {
        name: options.name,
        show: options.show,
        guid: uuid(),
    });
    ssMapServerLayer.show = defaultValue(options.show, true);
    if (options.zoomTo) {
        viewer.zoomTo(ssMapServerLayer);
    }

    // 绘制范围
    // console.log(esri);
    // if (esri.rectangle instanceof Rectangle) {
    //     const { rectangle } = esri;

    //     const extentEntity = new Entity({
    //         rectangle: {
    //             coordinates: rectangle,
    //             material: Color.RED.withAlpha(0.5),
    //             outline: true,
    //             outlineColor: Color.BLACK,
    //         },
    //     });
    //     viewer.entities.add(extentEntity);
    // }

    const leaf: Leaf = {
        name: options.name,
        index: ssMapServerLayer._layerIndex,
        guid: ssMapServerLayer.guid,
        _zIndex: defaultValue(options.zIndex, 0),
        setVisible: (visible: boolean) => {
            ssMapServerLayer.show = visible;
        },
        zoomTo: () => {
            viewer.zoomTo(ssMapServerLayer);
        },
        get show() {
            return ssMapServerLayer.show;
        },
        set show(value: boolean) {
            ssMapServerLayer.show = value;
        },
        _imageLayer: ssMapServerLayer,
        set zIndex(value: number) {
            leaf._zIndex = value;
            setLayersZIndex(viewer);
        },
        get zIndex() {
            return leaf._zIndex;
        }
    }
    return leaf;
}
export const ArcGisMapServerLoader = async (viewer: Viewer, options: SSArcGisLayerOptions) => {
    const esri = await createArcGisMapServer(options);

    let arcGisMapServerLayer: SSImageryLayer =
        viewer.imageryLayers.addImageryProvider(esri);

    Object.assign(arcGisMapServerLayer, {
        name: options.name,
        show: options.show,
        guid: uuid(),
    });
    arcGisMapServerLayer.show = defaultValue(options.show, true);
    if (options.zoomTo) {
        viewer.zoomTo(arcGisMapServerLayer);
    }
    const leaf: Leaf = {
        name: options.name,
        index: arcGisMapServerLayer._layerIndex,
        guid: arcGisMapServerLayer.guid,
        _zIndex: defaultValue(options.zIndex, 0),
        setVisible: (visible: boolean) => {
            arcGisMapServerLayer.show = visible;
        },
        zoomTo: () => {
            viewer.zoomTo(arcGisMapServerLayer);
        },
        get show() {
            return arcGisMapServerLayer.show;
        },
        set show(value: boolean) {
            arcGisMapServerLayer.show = value;
        },
        _imageLayer: arcGisMapServerLayer,
        set zIndex(value: number) {
            leaf._zIndex = value;
            setLayersZIndex(viewer);
        },
        get zIndex() {
            return leaf._zIndex;
        }
    }
    return leaf;
}

export const TilesetLoader = async (viewer: Viewer, options: SSLayerOptions) => {
    const tileset: SSTilesetLayer = await createTileset(options);
    viewer.scene.primitives.add(tileset);

    tileset.name = options.name;
    tileset.show = defaultValue(options.show, true);
    if (options.zoomTo) {
        viewer.zoomTo(tileset);
    }
    const leaf: Leaf = {
        name: options.name,
        guid: uuid(),
        _zIndex: defaultValue(options.zIndex, 0),
        setVisible: (visible: boolean) => {
            tileset.show = visible;
        },
        zoomTo: () => {
            viewer.zoomTo(tileset);
        },
        get show() {
            return tileset.show;
        },
        set show(value: boolean) {
            tileset.show = value;
        },
        _tileset: tileset,
        set zIndex(value: number) {
            leaf._zIndex = value;
            // setLayersZIndex(viewer);
        },
        get zIndex() {
            return leaf._zIndex;
        }
    }
    return leaf;
}

export const WMSLoader = async (viewer: Viewer, options: SSWMSLayerOptions) => {
    const wms = await createWMS(options);
    let wmsLayer: SSImageryLayer = viewer.imageryLayers.addImageryProvider(wms);
    wmsLayer.name = options.name;
    wmsLayer.show = defaultValue(options.show, true);
    if (options.zoomTo) {
        viewer.zoomTo(wmsLayer);
    }
    const leaf: Leaf = {
        name: options.name,
        guid: uuid(),
        _zIndex: defaultValue(options.zIndex, 0),
        setVisible: (visible: boolean) => {
            wmsLayer.show = visible;
        },
        zoomTo: () => {
            viewer.zoomTo(wmsLayer);
        },
        get show() {
            return wmsLayer.show;
        },
        set show(value: boolean) {
            wmsLayer.show = value;
        },
        _imageLayer: wmsLayer,
        set zIndex(value: number) {
            leaf._zIndex = value;
            setLayersZIndex(viewer);
        },
        get zIndex() {
            return leaf._zIndex;
        }
    }
    return leaf;
}

export const WMTSLoader = async (viewer: Viewer, options: SSLayerOptions) => {
    const wmts = await createWMTS(options);
    let wmtsLayer: SSImageryLayer = viewer.imageryLayers.addImageryProvider(wmts);
    wmtsLayer.name = options.name;
    wmtsLayer.show = defaultValue(options.show, true);
    if (options.zoomTo) {
        viewer.zoomTo(wmtsLayer);
    }
    const leaf: Leaf = {
        name: options.name,
        guid: uuid(),
        _zIndex: defaultValue(options.zIndex, 0),
        setVisible: (visible: boolean) => {
            wmtsLayer.show = visible;
        },
        zoomTo: () => {
            viewer.zoomTo(wmtsLayer);
        },
        get show() {
            return wmtsLayer.show;
        },
        set show(value: boolean) {
            wmtsLayer.show = value;
        },
        _imageLayer: wmtsLayer,
        set zIndex(value: number) {
            leaf._zIndex = value;
            setLayersZIndex(viewer);
        },
        get zIndex() {
            return leaf._zIndex;
        }
    }
    return leaf;
}

export const GeoJsonLoader = async (viewer: Viewer, options: SSLayerOptions) => {
    const geoJson: any = await createGeoJson(options);
    let geoJsonLayer: any = await viewer.dataSources.add(geoJson);
    geoJsonLayer.name = options.name;
    geoJsonLayer.show = defaultValue(options.show, true);
    if (options.zoomTo) {
        viewer.zoomTo(geoJsonLayer);
    }
    const leaf: Leaf = {
        name: options.name,
        guid: uuid(),
        _zIndex: defaultValue(options.zIndex, 0),
        setVisible: (visible: boolean) => {
            geoJsonLayer.show = visible;
        },
        zoomTo: () => {
            viewer.zoomTo(geoJsonLayer);
        },
        get show() {
            return geoJsonLayer.show;
        },
        set show(value: boolean) {
            geoJsonLayer.show = value;
        },
        _dataSource: geoJsonLayer,
        set zIndex(value: number) {
            leaf._zIndex = value;
            setLayersZIndex(viewer);
        },
        get zIndex() {
            return leaf._zIndex;
        }
    }
    return leaf;
}

export const XYZLoader = async (viewer: Viewer, options: SSXYZLayerOptions) => {
    let xyz = await createXYZ(options);
    let xyzLayer: SSImageryLayer = viewer.imageryLayers.addImageryProvider(xyz);
    xyzLayer.name = options.name;
    xyzLayer.show = defaultValue(options.show, true);

    if (options.zoomTo) {
        viewer.zoomTo(xyzLayer);
    }
    const leaf: Leaf = {
        name: options.name,
        guid: uuid(),
        _zIndex: defaultValue(options.zIndex, 0),
        setVisible: (visible: boolean) => {
            xyzLayer.show = visible;
        },
        zoomTo: () => {
            viewer.zoomTo(xyzLayer);
        },
        get show() {
            return xyzLayer.show;
        },
        set show(value: boolean) {
            xyzLayer.show = value;
        },
        _imageLayer: xyzLayer,
        set zIndex(value: number) {
            leaf._zIndex = value;
            setLayersZIndex(viewer);
        },
        get zIndex() {
            return leaf._zIndex;
        }
    }
    return leaf;
}

export const TerrainLoader = async (viewer: Viewer, options: SSTerrainLayerOptions) => {
    let terrainProvider = await createTerrain(options);
    viewer.scene.terrainProvider = terrainProvider;
    const nullTerrain = new EllipsoidTerrainProvider({})
    const leaf: Leaf = {
        name: options.name,
        guid: uuid(),
        _show: true,
        _zIndex: defaultValue(options.zIndex, 0),
        setVisible: (visible: boolean) => {
            if (visible) {
                viewer.scene.terrainProvider = terrainProvider;
            } else {
                viewer.scene.terrainProvider = nullTerrain;
            }
        },
        zoomTo: () => {
            if (defined(options.rectangle)) {
                viewer.camera.flyTo({
                    destination: options.rectangle as Rectangle,
                })
            }
        },
        get show() {
            return leaf._show ? true : false;
        },
        set show(value: boolean) {
            leaf._show = value;
            this.setVisible(value);
        },
        set zIndex(value: number) {
            leaf._zIndex = value;
            setLayersZIndex(viewer);
        },
        get zIndex() {
            return leaf._zIndex;
        }
    }
    return leaf;
}

export const ModelLoader = async (viewer: Viewer, options: any) => {
    const model = await createModel(options);
    let position = Cartesian3.fromDegrees(options.position[0], options.position[1], options.position[2]);
    const modelEntity = viewer.entities.add({
        position: position,
        model: {
            uri: options.url,
        }

    });
    modelEntity.name = options.name;
    modelEntity.show = defaultValue(options.show, true);
    if (options.zoomTo) {
        viewer.zoomTo(modelEntity);
    }
    const leaf: Leaf = {
        name: options.name,
        guid: uuid(),
        _zIndex: defaultValue(options.zIndex, 0),
        setVisible: (visible: boolean) => {
            modelEntity.show = visible;
        },
        zoomTo: () => {
            viewer.zoomTo(modelEntity);
        },
        get show() {
            return modelEntity.show;
        },
        set show(value: boolean) {
            modelEntity.show = value;
        },
        _model: modelEntity,
        set zIndex(value: number) {
            leaf._zIndex = value;
            setLayersZIndex(viewer);
        },
        get zIndex() {
            return leaf._zIndex;
        }
    }
    return leaf;
}

// 根据图层的zIndex属性大小顺序设置图层的顺序
export const setLayersZIndex = (viewer: Viewer) => {
    // return
    let sceneTree = getSceneTree();
    if (!sceneTree) {
        return;
    }

    let imageryLayers = []
    let l = sceneTree._imageryCollection.length;
    for (let i = 0; i < l; ++i) {
        imageryLayers.push(sceneTree._imageryCollection[i]);
    }

    imageryLayers.sort((a: any, b: any) => {
        if (a.zIndex === undefined) {
            a.zIndex = 0;
        }
        if (b.zIndex === undefined) {
            b.zIndex = 0;
        }
        return a.zIndex - b.zIndex;
    });
    // return
    imageryLayers.forEach((layer: any) => {
        viewer.scene.imageryLayers.raiseToTop(layer._imageLayer);
    })
}