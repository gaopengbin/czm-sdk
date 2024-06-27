import {
    ArcGisMapServerImageryProvider,
    Cesium3DTileset,
    Rectangle,
    Resource,
    UrlTemplateImageryProvider,
    WebMapServiceImageryProvider,
    defined,
    GeographicTilingScheme,
    WebMercatorTilingScheme,
    CesiumTerrainProvider,
    TileMapServiceImageryProvider,
    buildModuleUrl,
    Cartesian2,
    WebMapTileServiceImageryProvider,
} from "cesium";
import { SSArcGisLayerOptions, SSLayerOptions, SSTerrainLayerOptions, SSWMSLayerOptions, SSXYZLayerOptions } from "./types";
import { SceneTree } from ".";
import GCJ02TilingScheme from "../CustomImageryProvider/tilingScheme/GCJ02TilingScheme";
import BaiduImageryProvider from "../CustomImageryProvider/provider/BaiduImageryProvider";
import WMTSParser from "../parser/WMTSParser";

export async function createArcGisMapServer(options: SSArcGisLayerOptions) {
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

    // 获取地图范围
    if (options.rectangle && Array.isArray(options.rectangle)) {
        rectangle = Rectangle.fromDegrees(...options.rectangle);
    } else {
        try {
            const iteminfoUrl = resource.url + "/info/iteminfo";
            const jsonResource = new Resource({
                url: iteminfoUrl,
                queryParameters: {
                    f: "json",
                },
            });
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
    }
    if (options.tilingScheme) {
        if (typeof options.tilingScheme === 'string') {
            if (options.tilingScheme === 'geographic') {
                options.tilingScheme = new GeographicTilingScheme();
            } else if (options.tilingScheme === 'webMercator') {
                options.tilingScheme = new WebMercatorTilingScheme();
            } else if (options.tilingScheme === 'gcj02') {
                options.tilingScheme = new GCJ02TilingScheme();
            }
        }
    }
    const esri = await ArcGisMapServerImageryProvider.fromUrl(options.url, {
        ...options as ArcGisMapServerImageryProvider.ConstructorOptions,
        rectangle: rectangle,
    });
    return esri;
}

export async function createWMS(options: SSWMSLayerOptions) {
    if (Array.isArray(options.rectangle)) {
        options.rectangle = Rectangle.fromDegrees(...options.rectangle);
    }

    if (options.tilingScheme) {
        if (typeof options.tilingScheme === 'string') {
            if (options.tilingScheme === 'geographic') {
                options.tilingScheme = new GeographicTilingScheme();
            } else if (options.tilingScheme === 'webMercator') {
                options.tilingScheme = new WebMercatorTilingScheme();
            } else if (options.tilingScheme === 'gcj02') {
                options.tilingScheme = new GCJ02TilingScheme();
            }
        }
    }

    const wms = new WebMapServiceImageryProvider(options as WebMapServiceImageryProvider.ConstructorOptions);
    return wms;
}

export async function createWMTS(options: any) {
    let parser = new WMTSParser()
    options.style = options.style || ''
    options.format = options.format || 'image/png'
    try {
        let res: any = await parser.parser(parser.addUrlParam(options.url))
        let layer = res.find((item: any) => item.identifier === options.layer)
        if (layer) {
            options.url = layer.urls.find((item: any) => item.format === options.format).template
            options.tileMatrixSetID = options.tileMatrixSetID || layer.tileMatrixSets[0].tileMatrixSetID
            options.tileMatrixLabels = options.tileMatrixLabels || layer.tileMatrixSets[0].params.tileMatrixLabels
            options.tilingScheme = options.tilingScheme || layer.tileMatrixSets[0].params.tilingScheme
            options.rectangle = options.rectangle || layer.rectangle
            options.style = options.style || layer.styles.find((item: any) => item.default).id
            options.maximumLevel = options.maximumLevel || layer.tileMatrixSets[0].params.maximumLevel
            options.minimumLevel = options.minimumLevel || layer.tileMatrixSets[0].params.minimumLevel
        }

    } catch (error) {

    }

    if (options.rectangle && Array.isArray(options.rectangle)) {
        options.rectangle = Rectangle.fromDegrees(...options.rectangle);
    }
    if (options.tilingScheme) {
        if (typeof options.tilingScheme === 'string') {
            let tilingScheme = options.tilingScheme.toLowerCase()
            if (tilingScheme === 'geographic') {
                options.tilingScheme = new GeographicTilingScheme();
            } else if (tilingScheme === 'webmercator') {
                options.tilingScheme = new WebMercatorTilingScheme();
            } else if (tilingScheme === 'gcj02') {
                options.tilingScheme = new GCJ02TilingScheme();
            } else if (tilingScheme === 'bd09') {

            }
        }
    }
    const wmts = new WebMapTileServiceImageryProvider(options as WebMapTileServiceImageryProvider.ConstructorOptions);
    return wmts;
}

export async function createXYZ(options: SSXYZLayerOptions) {

    if (options.url === 'NaturalEarthII') {
        const xyz = await TileMapServiceImageryProvider.fromUrl(buildModuleUrl('Assets/Textures/NaturalEarthII'));
        return xyz;
    }

    if (options.rectangle && Array.isArray(options.rectangle)) {
        options.rectangle = Rectangle.fromDegrees(...options.rectangle);
    }
    if (options.tilingScheme) {
        if (typeof options.tilingScheme === 'string') {
            if (options.tilingScheme === 'geographic') {
                options.tilingScheme = new GeographicTilingScheme();
            } else if (options.tilingScheme === 'webMercator') {
                options.tilingScheme = new WebMercatorTilingScheme();
            } else if (options.tilingScheme === 'gcj02') {
                options.tilingScheme = new GCJ02TilingScheme();
            } else if (options.tilingScheme === 'bd09') {

            }
        }
    }
    if (options.tilingScheme === 'bd09') {
        const xyz = new BaiduImageryProvider(options);
        return xyz;
    }
    const xyz = new UrlTemplateImageryProvider(options as UrlTemplateImageryProvider.ConstructorOptions);

    return xyz;
}

export async function createTerrain(options: SSTerrainLayerOptions) {
    if (Array.isArray(options.rectangle)) {
        options.rectangle = Rectangle.fromDegrees(...options.rectangle);
    }

    const terrainProvider = await CesiumTerrainProvider.fromUrl(options.url, options as CesiumTerrainProvider.ConstructorOptions);
    return terrainProvider;
}

export async function createTileset(options: SSLayerOptions) {
    const tileset = await Cesium3DTileset.fromUrl(
        options.url
    );
    return tileset;
}

const Objects: any = {
    "arcgismapserver": createArcGisMapServer,
    "tileset": createTileset,
    "wms": createWMS,
    "xyz": createXYZ,
    "terrain": createTerrain,
    "wmts": createWMTS,
}

export const createProvider = async (options: any) => {
    const { type } = options;
    return await Objects[type](options);
}

const initObjects: any = {
    "arcgismapserver": "createArcGisMapServerLayer",
    "tileset": "addTilesetLayer",
    "wms": "createWMSLayer",
    "wmts": "createWMTSLayer",
    "xyz": "createXYZLayer",
    "terrain": "createTerrainLayer",
    "group": "createGroup",
}

export const initEarth = async (sceneTree: SceneTree, config: any) => {
    const { layers = [] } = config;
    for (const layer of layers) {
        let node = await buildLayers(sceneTree, layer);
        sceneTree.root.addLayer(node);
    }
}

export const buildLayers = async (sceneTree: SceneTree, layer: any) => {
    let node = null;
    if (layer.children) {
        layer.type = "group";
        let group = sceneTree.createGroup(layer.name);
        group.expand = layer.expand;
        for (const child of layer.children) {
            // let childLayer = await buildLayers(sceneTree, child);
            let childLayer = buildLayers(sceneTree, child);
            group.addLayer(childLayer,child);
        }
        node = group;
    } else {
        layer.type = layer.type.toLowerCase();
        try {
            // node = sceneTree[initObjects[layer.type]](layer);
            node = await sceneTree[initObjects[layer.type]](layer);
        } catch (error) {
            console.error(error);
            node = {
                name: layer.name,
                ...layer,
                status: "error",
            }
        }

    }
    return node;
}