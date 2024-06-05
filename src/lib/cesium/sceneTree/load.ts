import { Leaf, SSImageryLayer, SSLayerOptions, SSTerrainLayerOptions, SSTilesetLayer, SSWMSLayerOptions, SSXYZLayerOptions } from "./types";
import uuid from "../../common/uuid";

import {
    Viewer,
    ArcGisMapServerImageryProvider,
    Cesium3DTileset,
    HeadingPitchRange,
    ImageryLayer,
    Rectangle,
    Resource,
    UrlTemplateImageryProvider,
    WebMapServiceImageryProvider,
    defined,
    Event,
    defaultValue,
    TilingScheme,
    GeographicTilingScheme,
    WebMercatorTilingScheme,
    CesiumTerrainProvider,
    Terrain,
    BoundingSphere,
    EllipsoidTerrainProvider,
} from "cesium";

export const ArcGisMapServerLoader = async (viewer: Viewer, options: SSLayerOptions) => {
    let rectangle: any;
    const resource = new Resource({
        url: options.url,
    });
    // url后面加上斜杠
    resource.appendForwardSlash();

    if (defined(options.token)) {
        resource.setQueryParameters({
            token: options.token,
        });
    }

    const iteminfoUrl = resource.url + "/info/iteminfo";
    const jsonResource = new Resource({
        url: iteminfoUrl,
        queryParameters: {
            f: "json",
        },
    });

    // 获取地图范围
    try {
        const data = await jsonResource.fetchJson();
        if (data && data.extent) {
            rectangle = Rectangle.fromDegrees(
                data.extent[0][0],
                data.extent[0][1],
                data.extent[1][0],
                data.extent[1][1]
            );
        }
    } catch (error) { }
    const esri = await ArcGisMapServerImageryProvider.fromUrl(options.url, {
        rectangle: rectangle,
    });

    let arcGisMapServerLayer: SSImageryLayer =
        viewer.imageryLayers.addImageryProvider(esri);

    Object.assign(arcGisMapServerLayer, {
        name: options.name,
        show: options.show,
        guid: uuid(),
    });

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
    const tileset: SSTilesetLayer = await Cesium3DTileset.fromUrl(
        options.url
    );
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

    if (Array.isArray(options.rectangle)) {
        options.rectangle = Rectangle.fromDegrees(...options.rectangle);
    }

    if (options.tilingScheme) {
        if (typeof options.tilingScheme === 'string') {
            if (options.tilingScheme === 'geographic') {
                options.tilingScheme = new GeographicTilingScheme();
            } else if (options.tilingScheme === 'webMercator') {
                options.tilingScheme = new WebMercatorTilingScheme();
            }
        }
    }

    const wms = new WebMapServiceImageryProvider(options as WebMapServiceImageryProvider.ConstructorOptions);
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
    console.log(leaf);
    return leaf;
}

export const XYZLoader = async (viewer: Viewer, options: SSXYZLayerOptions) => {
    if (Array.isArray(options.rectangle)) {
        options.rectangle = Rectangle.fromDegrees(...options.rectangle);
    }

    if (options.tilingScheme) {
        if (typeof options.tilingScheme === 'string') {
            if (options.tilingScheme === 'geographic') {
                options.tilingScheme = new GeographicTilingScheme();
            } else if (options.tilingScheme === 'webMercator') {
                options.tilingScheme = new WebMercatorTilingScheme();
            }
        }
    }
    let xyzLayer: SSImageryLayer = viewer.imageryLayers.addImageryProvider(
        new UrlTemplateImageryProvider(options as UrlTemplateImageryProvider.ConstructorOptions)
    );
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
    if (Array.isArray(options.rectangle)) {
        options.rectangle = Rectangle.fromDegrees(...options.rectangle);
    }

    const terrainProvider = CesiumTerrainProvider.fromUrl(options.url, options as CesiumTerrainProvider.ConstructorOptions);
    let terrain = new Terrain(terrainProvider)

    viewer.scene.setTerrain(terrain);
    const nullTerrain =
        new EllipsoidTerrainProvider({})

    const leaf: Leaf = {
        name: options.name,
        guid: uuid(),
        _show: true,
        setVisible: (visible: boolean) => {
            // leaf.show = visible;
            if (visible) {
                viewer.scene.setTerrain(terrain);
            } else {
                console.log("nullTerrain", nullTerrain);
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