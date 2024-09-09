import { Leaf, SSArcGisLayerOptions, SSImageryLayer, SSLayerOptions, SSTerrainLayerOptions, SSTilesetLayer, SSWMSLayerOptions, SSXYZLayerOptions } from "./types";
import uuid from "../../common/uuid";

import {
    Viewer,
    Rectangle,
    defined,
    defaultValue,
    EllipsoidTerrainProvider,
    Cartesian3,
    Math as CesiumMath,
} from "cesium";
import { createArcGisMapServer, createGeoJson, createSSMapServer, createTerrain, createTileset, createWMS, createWMTS, createXYZ } from "./creator";
import { getSceneTree } from "@/component";

export const SSMapServerLoader = async (viewer: Viewer, options: SSArcGisLayerOptions) => {
    const opt = JSON.parse(JSON.stringify(options));
    const esri = await createSSMapServer(options);
    let ssMapServerLayer: SSImageryLayer =
        viewer.imageryLayers.addImageryProvider(esri);

    Object.assign(ssMapServerLayer, {
        name: options.name,
        show: options.show,
        guid: options.guid ?? uuid(),
    });
    ssMapServerLayer.show = defaultValue(options.show, true);
    if (options.zoomTo) {
        viewer.zoomTo(ssMapServerLayer);
    }

    const leaf: Leaf = {
        name: options.name,
        index: ssMapServerLayer._layerIndex,
        guid: ssMapServerLayer.guid,
        customProps: options.customProps,
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
        },
        get rectangle() {
            const rectangle = ssMapServerLayer.imageryProvider.rectangle;
            return rectangle ? [
                CesiumMath.toDegrees(rectangle.west),
                CesiumMath.toDegrees(rectangle.south),
                CesiumMath.toDegrees(rectangle.east),
                CesiumMath.toDegrees(rectangle.north),
            ] : undefined;
        },
        toJSON: toJSON
    }
    function toJSON() {
        return {
            ...opt,
            type: "ssmapserver",
            name: leaf.name,
            show: leaf.show,
            guid: leaf.guid,
            url: (leaf._imageLayer?.imageryProvider as any).url,
            layers: (leaf._imageLayer?.imageryProvider as any).layers,
            zIndex: leaf.zIndex,
            rectangle: (() => {
                const rectangle = leaf._imageLayer?.imageryProvider.rectangle;
                return rectangle ? [
                    CesiumMath.toDegrees(rectangle.west),
                    CesiumMath.toDegrees(rectangle.south),
                    CesiumMath.toDegrees(rectangle.east),
                    CesiumMath.toDegrees(rectangle.north),
                ] : undefined;
            })(),
            zoomTo: false
        }
    }
    return leaf;
}
export const ArcGisMapServerLoader = async (viewer: Viewer, options: SSArcGisLayerOptions) => {
    const opt = JSON.parse(JSON.stringify(options));
    const esri = await createArcGisMapServer(options);

    let arcGisMapServerLayer: SSImageryLayer =
        viewer.imageryLayers.addImageryProvider(esri);

    Object.assign(arcGisMapServerLayer, {
        name: options.name,
        show: options.show,
        guid: options.guid ?? uuid(),
    });
    arcGisMapServerLayer.show = defaultValue(options.show, true);
    if (options.zoomTo) {
        viewer.zoomTo(arcGisMapServerLayer);
    }
    const leaf: Leaf = {
        name: options.name,
        index: arcGisMapServerLayer._layerIndex,
        guid: arcGisMapServerLayer.guid,
        customProps: options.customProps,
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
        },
        get rectangle() {
            const rectangle = arcGisMapServerLayer.imageryProvider.rectangle;
            return rectangle ? [
                CesiumMath.toDegrees(rectangle.west),
                CesiumMath.toDegrees(rectangle.south),
                CesiumMath.toDegrees(rectangle.east),
                CesiumMath.toDegrees(rectangle.north),
            ] : undefined;
        },
        toJSON: toJSON
    }
    function toJSON() {
        return {
            ...opt,
            type: "arcgismapserver",
            name: leaf.name,
            show: leaf.show,
            guid: leaf.guid,
            url: (leaf._imageLayer?.imageryProvider as any).url,
            layers: (leaf._imageLayer?.imageryProvider as any).layers,
            zIndex: leaf.zIndex,
            rectangle: (() => {
                const rectangle = leaf._imageLayer?.imageryProvider.rectangle;
                return rectangle ? [
                    CesiumMath.toDegrees(rectangle.west),
                    CesiumMath.toDegrees(rectangle.south),
                    CesiumMath.toDegrees(rectangle.east),
                    CesiumMath.toDegrees(rectangle.north),
                ] : undefined;
            })(),
            zoomTo: false
        }
    }
    return leaf;
}

export const TilesetLoader = async (viewer: Viewer, options: SSLayerOptions) => {
    const opt = JSON.parse(JSON.stringify(options));
    const tileset: SSTilesetLayer = await createTileset(options);
    viewer.scene.primitives.add(tileset);

    tileset.name = options.name;
    tileset.show = defaultValue(options.show, true);
    if (options.zoomTo) {
        viewer.zoomTo(tileset);
    }
    const leaf: Leaf = {
        name: options.name,
        guid: options.guid ?? uuid(),
        customProps: options.customProps,
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
        },
        get zIndex() {
            return leaf._zIndex;
        },
        toJSON: toJSON
    }
    function toJSON() {
        return {
            ...opt,
            type: "tileset",
            name: leaf.name,
            show: leaf.show,
            guid: leaf.guid,
            url: leaf?._tileset?.resource?.url,
            zIndex: leaf.zIndex,
            zoomTo: false
        }
    }
    return leaf;
}

export const WMSLoader = async (viewer: Viewer, options: SSWMSLayerOptions) => {
    const opt = JSON.parse(JSON.stringify(options));
    const wms = await createWMS(options);
    let wmsLayer: SSImageryLayer = viewer.imageryLayers.addImageryProvider(wms);
    wmsLayer.name = options.name;
    wmsLayer.show = defaultValue(options.show, true);
    if (options.zoomTo) {
        viewer.zoomTo(wmsLayer);
    }
    const leaf: Leaf = {
        name: options.name,
        guid: options.guid ?? uuid(),
        customProps: options.customProps,
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
        },
        get rectangle() {
            const rectangle = wmsLayer.imageryProvider.rectangle;
            return rectangle ? [
                CesiumMath.toDegrees(rectangle.west),
                CesiumMath.toDegrees(rectangle.south),
                CesiumMath.toDegrees(rectangle.east),
                CesiumMath.toDegrees(rectangle.north),
            ] : undefined;
        },
        toJSON: toJSON
    }
    function toJSON() {
        return {
            ...opt,
            type: "wms",
            name: leaf.name,
            show: leaf.show,
            guid: leaf.guid,
            url: (leaf._imageLayer?.imageryProvider as any).url,
            layers: (leaf._imageLayer?.imageryProvider as any).layers,
            zIndex: leaf.zIndex,
            rectangle: (() => {
                const rectangle = leaf._imageLayer?.imageryProvider.rectangle;
                return rectangle ? [
                    CesiumMath.toDegrees(rectangle.west),
                    CesiumMath.toDegrees(rectangle.south),
                    CesiumMath.toDegrees(rectangle.east),
                    CesiumMath.toDegrees(rectangle.north),
                ] : undefined;
            })(),
            zoomTo: false
        }
    }
    return leaf;
}

export const WMTSLoader = async (viewer: Viewer, options: SSLayerOptions) => {
    const opt = JSON.parse(JSON.stringify(options));
    const wmts = await createWMTS(options);
    let wmtsLayer: SSImageryLayer = viewer.imageryLayers.addImageryProvider(wmts);
    wmtsLayer.name = options.name;
    wmtsLayer.show = defaultValue(options.show, true);
    if (options.zoomTo) {
        viewer.zoomTo(wmtsLayer);
    }
    const leaf: Leaf = {
        name: options.name,
        guid: options.guid ?? uuid(),
        customProps: options.customProps,
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
        },
        get rectangle() {
            const rectangle = wmtsLayer.imageryProvider.rectangle;
            return rectangle ? [
                CesiumMath.toDegrees(rectangle.west),
                CesiumMath.toDegrees(rectangle.south),
                CesiumMath.toDegrees(rectangle.east),
                CesiumMath.toDegrees(rectangle.north),
            ] : undefined;
        },
        toJSON: toJSON
    }
    function toJSON() {
        return {
            ...opt,
            type: "wmts",
            name: leaf.name,
            show: leaf.show,
            guid: leaf.guid,
            url: opt.url,
            layers: (leaf._imageLayer?.imageryProvider as any).layers,
            zIndex: leaf.zIndex,
            rectangle: (() => {
                const rectangle = leaf._imageLayer?.imageryProvider.rectangle;
                return rectangle ? [
                    CesiumMath.toDegrees(rectangle.west),
                    CesiumMath.toDegrees(rectangle.south),
                    CesiumMath.toDegrees(rectangle.east),
                    CesiumMath.toDegrees(rectangle.north),
                ] : undefined;
            })(),
            zoomTo: false
        }
    }
    return leaf;
}

export const GeoJsonLoader = async (viewer: Viewer, options: any) => {
    const opt = JSON.parse(JSON.stringify(options));
    const geoJson: any = await createGeoJson(options);
    let geoJsonLayer: any = await viewer.dataSources.add(geoJson);
    geoJsonLayer.name = options.name;
    geoJsonLayer.show = defaultValue(options.show, true);
    if (options.zoomTo) {
        viewer.zoomTo(geoJsonLayer);
    }
    const leaf: Leaf = {
        name: options.name,
        guid: options.guid ?? uuid(),
        customProps: options.customProps,
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
        },
        toJSON: toJSON
    }
    function toJSON() {
        return {
            ...opt,
            type: "geojson",
            name: leaf.name,
            show: leaf.show,
            guid: leaf.guid,
            url: options.url,
            stroke: options.stroke?.toCssColorString(),
            fill: options.fill?.toCssColorString(),
            strokeWidth: options.strokeWidth,
            markerSymbol: options.markerSymbol,
            markerSize: options.markerSize,
            markerColor: options.markerColor?.toCssColorString(),
            clampToGround: options.clampToGround,
            cluster: options.cluster,
            zIndex: leaf.zIndex,
            zoomTo: false
        }
    }
    return leaf;
}

export const XYZLoader = async (viewer: Viewer, options: SSXYZLayerOptions) => {
    const opt = JSON.parse(JSON.stringify(options));
    let xyz = await createXYZ(options);
    let xyzLayer: SSImageryLayer = viewer.imageryLayers.addImageryProvider(xyz);
    xyzLayer.name = options.name;
    xyzLayer.show = defaultValue(options.show, true);

    if (options.zoomTo) {
        viewer.zoomTo(xyzLayer);
    }
    const leaf: Leaf = {
        name: options.name,
        guid: options.guid ?? uuid(),
        customProps: options.customProps,
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
        },
        rectangle: () => {
            const rectangle = xyzLayer.rectangle;
            return rectangle ? [
                CesiumMath.toDegrees(rectangle.west),
                CesiumMath.toDegrees(rectangle.south),
                CesiumMath.toDegrees(rectangle.east),
                CesiumMath.toDegrees(rectangle.north),
            ] : undefined;
        },
        toJSON: toJSON
    }
    function toJSON() {
        return {
            ...opt,
            type: "xyz",
            name: leaf.name,
            show: leaf.show,
            guid: leaf.guid,
            url: (leaf._imageLayer?.imageryProvider as any).url,
            zIndex: leaf.zIndex,
            rectangle: (() => {
                const rectangle = leaf._imageLayer?.imageryProvider.rectangle;
                return rectangle ? [
                    CesiumMath.toDegrees(rectangle.west),
                    CesiumMath.toDegrees(rectangle.south),
                    CesiumMath.toDegrees(rectangle.east),
                    CesiumMath.toDegrees(rectangle.north),
                ] : undefined;
            })(),
            zoomTo: false
        }
    }
    return leaf;
}

export const TerrainLoader = async (viewer: Viewer, options: SSTerrainLayerOptions) => {
    const opt = JSON.parse(JSON.stringify(options));
    let terrainProvider = await createTerrain(options);
    viewer.scene.terrainProvider = terrainProvider;
    const nullTerrain = new EllipsoidTerrainProvider({})
    if (options.zoomTo) {
        viewer.camera.flyTo({
            destination: options.rectangle as Rectangle,
        })
    }
    const leaf: Leaf = {
        name: options.name,
        guid: options.guid ?? uuid(),
        customProps: options.customProps,
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
        },
        toJSON: toJSON
    }
    function toJSON() {
        return {
            ...opt,
            type: "terrain",
            name: leaf.name,
            show: leaf.show,
            guid: leaf.guid,
            url: options.url,
            rectangle: options.rectangle,
            zoomTo: false
        }
    }
    return leaf;
}

export const ModelLoader = async (viewer: Viewer, options: any) => {
    const opt = JSON.parse(JSON.stringify(options));
    options.position = options.position ?? [116.39, 39.91, 0];
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
        customProps: options.customProps,
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
        },
        toJSON: toJSON
    }
    function toJSON() {
        return {
            ...opt,
            type: "model",
            name: leaf.name,
            show: leaf.show,
            guid: leaf.guid,
            url: options.url,
            position: options.position,
            zoomTo: false
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