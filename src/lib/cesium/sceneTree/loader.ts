import { Leaf, SSImageryLayer, SSLayerOptions, SSTerrainLayerOptions, SSTilesetLayer, SSWMSLayerOptions, SSXYZLayerOptions } from "./types";
import uuid from "../../common/uuid";

import {
    Viewer,
    Rectangle,
    defined,
    defaultValue,
    EllipsoidTerrainProvider,
} from "cesium";
import { createArcGisMapServer, createTerrain, createTileset, createWMS, createXYZ } from "./creator";

export const ArcGisMapServerLoader = async (viewer: Viewer, options: SSLayerOptions) => {
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
    }
    return leaf;
}

export const TerrainLoader = async (viewer: Viewer, options: SSTerrainLayerOptions) => {

    let terrainProvider = await createTerrain(options);

    viewer.scene.terrainProvider = terrainProvider;
    const nullTerrain =
        new EllipsoidTerrainProvider({})

    const leaf: Leaf = {
        name: options.name,
        guid: uuid(),
        _show: true,
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
    }
    return leaf;
}
