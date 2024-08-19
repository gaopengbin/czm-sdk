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
    WebMapTileServiceImageryProvider,
    GeoJsonDataSource,
    Color,
    Model,
    PinBuilder,
} from "cesium";
import proj4 from "proj4";
import { SSArcGisLayerOptions, SSLayerOptions, SSTerrainLayerOptions, SSWMSLayerOptions, SSXYZLayerOptions } from "./types";
import { SceneTree } from ".";
import GCJ02TilingScheme from "../CustomImageryProvider/tilingScheme/GCJ02TilingScheme";
import BaiduImageryProvider from "../CustomImageryProvider/provider/BaiduImageryProvider";
import WMTSParser from "../parser/WMTSParser";
import SSMapServerProvider from "../CustomImageryProvider/provider/SSMapServerProvider";
import { getProjection } from "../CustomImageryProvider/projection/projection";

export async function createSSMapServer(options: SSArcGisLayerOptions) {
    let rectangle: any;
    const resource = new Resource({
        url: options.url,
    });
    // url后面加上斜杠
    // resource.appendForwardSlash();

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
            const iteminfoUrl = resource.url;
            const jsonResource = new Resource({
                url: iteminfoUrl,
                queryParameters: {
                    f: "json",
                },
            });
            const data = await jsonResource.fetchJson();
            if (data && data.fullExtent) {
                const wkid =
                    data.fullExtent.spatialReference &&
                        data.fullExtent.spatialReference.wkid
                        ? data.fullExtent.spatialReference.wkid
                        : 4326;
                if (wkid === 4326 || wkid === 4490) {
                    rectangle = Rectangle.fromDegrees(
                        data.fullExtent.xmin,
                        data.fullExtent.ymin,
                        data.fullExtent.xmax,
                        data.fullExtent.ymax
                    );
                } else {
                    if (proj4.defs(`EPSG:${wkid}`) === undefined && !getProjection(`EPSG:${wkid}`)) {
                        console.error('不支持的投影：', wkid)
                    } else {
                        if (proj4.defs(`EPSG:${wkid}`) === undefined) {
                            let projection = getProjection(`EPSG:${wkid}`);
                            if (projection) {
                                proj4.defs(`EPSG:${wkid}`, projection)
                            }
                        }
                        let min = proj4(`EPSG:${wkid}`, 'EPSG:4326', [data.fullExtent.xmin, data.fullExtent.ymin]);
                        let max = proj4(`EPSG:${wkid}`, 'EPSG:4326', [data.fullExtent.xmax, data.fullExtent.ymax]);
                        rectangle = Rectangle.fromDegrees(
                            min[0],
                            min[1],
                            max[0],
                            max[1]
                        );
                    }
                    rectangle = Rectangle.fromDegrees(
                        data.extent[0][0],
                        data.extent[0][1],
                        data.extent[1][0],
                        data.extent[1][1]
                    );
                }
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
    const esri = await SSMapServerProvider.fromUrl(options.url, {
        ...options as ArcGisMapServerImageryProvider.ConstructorOptions,
        rectangle: rectangle,
    });
    return esri;
}
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

export async function createGeoJson(options: any) {
    if (options.url) {
        if (typeof options.stroke === 'string') {
            options.stroke = Color.fromCssColorString(options.stroke)
        }
        if (typeof options.fill === 'string') {
            options.fill = Color.fromCssColorString(options.fill)
        }
        if (typeof options.markerColor === 'string') {
            options.markerColor = Color.fromCssColorString(options.markerColor)
        }
        let ds = await GeoJsonDataSource.load(options.url, options)
        ds.entities.values.forEach(async (entity: any) => {
            if (entity.polygon) {
                let positions = entity.polygon.hierarchy._value.positions.concat(entity.polygon.hierarchy._value.positions[0], entity.polygon.hierarchy._value.positions[1])
                entity.polyline = {
                    positions: positions,
                    width: options.strokeWidth || 2,
                    material: options.stroke || Color.RED,
                }
            }
            if (entity.polyline) {
                entity.polyline.width = options.strokeWidth || 2
                entity.polyline.material = options.stroke || Color.RED
            }
            if (entity.billboard) {
                entity.billboard.color = options.markerColor || Color.RED
                let image;
                const pinBuilder = new PinBuilder();
                if (options.showPopup) {
                    image = (await pinBuilder.fromUrl(options.markerImage, options.markerColor || Color.RED, options.markerSize)).toDataURL()
                } else {
                    image = options.markerImage
                    entity.billboard.width = options.width || 32
                    entity.billboard.height = options.height || 32
                }
                entity.billboard.image = image
            }

        })
        if (options.cluster) {
            let cluster = options.cluster
            let pixelRange = cluster.pixelRange || 20
            let minimumClusterSize = cluster.minimumClusterSize || 3
            let enabled = cluster.enabled || true
            if (typeof options.cluster.color === 'string') {
                options.cluster.color = Color.fromCssColorString(options.cluster.color)
            }
            ds.clustering.enabled = enabled
            ds.clustering.pixelRange = pixelRange
            ds.clustering.minimumClusterSize = minimumClusterSize
            ds.clustering.clusterEvent.addEventListener((clusteredEntities: any, cluster: any) => {
                cluster.label.show = false
                cluster.billboard.show = true;
                cluster.billboard.image = createCanvas(clusteredEntities.length.toLocaleString(), cluster.color || Color.BLUE.withAlpha(0.7).toCssColorString())
            })
        }
        return ds
    }
}

function createCanvas(text: string, color: string, width: number = 32, height: number = 32) {
    const canvas = document.createElement('canvas');
    const ctx: any = canvas.getContext('2d');
    width = text.length * 12 + 18;
    canvas.width = width;
    canvas.height = height;
    ctx.fillStyle = color;
    // ctx.fillRect(0, 0, canvas.width, canvas.height);
    // 绘制圆角矩形
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(width - 10, 0);
    ctx.quadraticCurveTo(width, 0, width, 10);
    ctx.lineTo(width, height - 10);
    ctx.quadraticCurveTo(width, height, width - 10, height);
    ctx.lineTo(10, height);
    ctx.quadraticCurveTo(0, height, 0, height - 10);
    ctx.lineTo(0, 10);
    ctx.quadraticCurveTo(0, 0, 10, 0);
    ctx.closePath();
    ctx.fill();
    ctx.font = '20px sans-serif';
    ctx.fillStyle = 'black';
    ctx.fillText(text, 9, height / 2 + 8);
    return canvas;
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
    if(!(options as Cesium3DTileset.ConstructorOptions).maximumCacheOverflowBytes){
        (options as Cesium3DTileset.ConstructorOptions).maximumCacheOverflowBytes = 5368709120;
    }
    const tileset = await Cesium3DTileset.fromUrl(
        options.url,
        options as Cesium3DTileset.ConstructorOptions
    );
    return tileset;
}

export async function createModel(options: SSLayerOptions) {
    const model = await Model.fromGltfAsync(options)
    return model;
}

const Objects: any = {
    "ssmapserver": createSSMapServer,
    "arcgismapserver": createArcGisMapServer,
    "tileset": createTileset,
    "wms": createWMS,
    "xyz": createXYZ,
    "terrain": createTerrain,
    "wmts": createWMTS,
    "geojson": createGeoJson,
    "model": createModel,
}

export const createProvider = async (options: any) => {
    const { type } = options;
    return await Objects[type](options);
}

const initObjects: any = {
    "ssmapserver": "createSSMapServerLayer",
    "arcgismapserver": "createArcGisMapServerLayer",
    "tileset": "addTilesetLayer",
    "wms": "createWMSLayer",
    "wmts": "createWMTSLayer",
    "xyz": "createXYZLayer",
    "terrain": "createTerrainLayer",
    "group": "createGroup",
    "geojson": "createGeoJsonLayer",
    "model": "createModelLayer",
}

export const initEarth = async (sceneTree: SceneTree, config: any) => {
    const { layers = [] } = config;
    layers.reverse();
    for (const layer of layers) {
        let node = await buildLayers(sceneTree, layer);
        sceneTree.root.addLayer(node);
    }
}

export const buildLayers = async (sceneTree: SceneTree, layer: any) => {
    let node = null;
    if (layer.children) {
        layer.children.reverse();
        layer.type = "group";
        let group = sceneTree.createGroup(layer.name);
        group.expand = layer.expand;
        for (const child of layer.children) {
            // let childLayer = await buildLayers(sceneTree, child);
            let childLayer = buildLayers(sceneTree, child);
            group.addLayer(childLayer, child);
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
                toJSON: () => {
                    return {
                        name: layer.name,
                        ...layer,
                        status: "error",
                    }
                }
            }
        }

    }
    return node;
}