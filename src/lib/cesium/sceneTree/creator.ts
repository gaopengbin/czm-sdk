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
} from "cesium";
import { SSLayerOptions, SSTerrainLayerOptions, SSWMSLayerOptions, SSXYZLayerOptions } from "./types";
import { SceneTree } from ".";
import GCJ02TilingScheme from "../tilingScheme/GCJ02TilingScheme";
import BD09TilingScheme from "../tilingScheme/BD09TilingScheme";

export async function createArcGisMapServer(options: SSLayerOptions) {
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

    const esri = await ArcGisMapServerImageryProvider.fromUrl(options.url, {
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
            }
        }
    }

    const wms = new WebMapServiceImageryProvider(options as WebMapServiceImageryProvider.ConstructorOptions);
    return wms;
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
                let resolutions = []
                let maxResolution = options.maximumLevel ? options.maximumLevel : 19
                for (let i = 0; i < maxResolution; i++) {
                    resolutions[i] = 256 * Math.pow(2, maxResolution - 1 - i)
                }
                options.tilingScheme = new BD09TilingScheme({
                    resolutions: resolutions,
                    rectangleSouthwestInMeters: new Cartesian2(-20037726.37, -12474104.17),
                    rectangleNortheastInMeters: new Cartesian2(20037726.37, 12474104.17),
                });

                // options.requestImage(x, y, level) {
                //     let xTiles = options.tilingScheme.getNumberOfXTilesAtLevel(level)
                //     let yTiles = options.tilingScheme.getNumberOfYTilesAtLevel(level)
                //     let url = this._url
                //         .replace('{z}', level)
                //         .replace('{s}', String(1))
                //         .replace('{style}', this._style)
                //     if (this._crs === 'WGS84') {
                //         url = url.replace('{x}', String(x)).replace('{y}', String(-y))
                //     } else {
                //         url = url
                //             .replace('{x}', String(x - xTiles / 2))
                //             .replace('{y}', String(yTiles / 2 - y - 1))
                //     }
                //     return ImageryProvider.loadImage(this, url)
                // }

            }
        }
    }
    const xyz = new UrlTemplateImageryProvider(options as UrlTemplateImageryProvider.ConstructorOptions);
    if(options.tilingScheme === 'bd09'){
        // xyz.requestImage = (x, y, level) => {
        //     let xTiles = options.tilingScheme.getNumberOfXTilesAtLevel(level)
        //     let yTiles = options.tilingScheme.getNumberOfYTilesAtLevel(level)
        //     let url = options.url
        //         .replace('{z}', level)
        //         .replace('{s}', String(1))
        //         .replace('{style}', options.style)
        //     if (options.crs === 'WGS84') {
        //         url = url.replace('{x}', String(x)).replace('{y}', String(-y))
        //     } else {
        //         url = url
        //             .replace('{x}', String(x - xTiles / 2))
        //             .replace('{y}', String(yTiles / 2 - y - 1))
        //     }
        //     return xyz.loadImage(url)
        // }
    }
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
}

export const createProvider = async (options: any) => {
    const { type } = options;
    return await Objects[type](options);
}

const initObjects: any = {
    "arcgismapserver": "createArcGisMapServerLayer",
    "tileset": "addTilesetLayer",
    "wms": "createWMSLayer",
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
            let childLayer = await buildLayers(sceneTree, child);
            console.log(childLayer);
            group.addLayer(childLayer);
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
        // console.log(node);

    }
    return node;
}