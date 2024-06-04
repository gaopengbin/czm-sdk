import { Leaf, SSImageryLayer, SSLayerOptions, SSTilesetLayer } from "./types";
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
    // const jsonResource = resource.getDerivedResource({
    //     queryParameters: {
    //         f: "json",
    //     },
    // });
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
    let tilesetLayer = viewer.scene.primitives.add(tileset);
    viewer.zoomTo(tilesetLayer);

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