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
    ImageryLayer,
    Cesium3DTileStyle,
    JulianDate,
    Color,
    Model,
    HeadingPitchRoll,
    Transforms,
    Ellipsoid,
    ModelAnimationLoop,
    LabelGraphics,
    LabelStyle,
    VerticalOrigin,
    CallbackProperty,
} from "cesium";
import { createArcGisMapServer, createGeoJson, createIonTileset, createSSMapServer, createTerrain, createTileset, createWMS, createWMTS, createXYZ } from "./creator";
import SSTileset from "../CustomEntity/SSTileset";
import { BaseWidget, getSceneTree } from "@/component";
import { SSCircle, SSLabel, SSPoint, SSPolygon, SSPolyline, SSRectangle } from "../CustomEntity";

export const SSMapServerLoader = async (viewer: Viewer, options: SSArcGisLayerOptions) => {
    try {
        const opt = JSON.parse(JSON.stringify(options));
        const esri = await createSSMapServer(options);
        console.log(options)
        const rectangle = options.rectangle instanceof Rectangle ? options.rectangle : undefined;
        console.log('rectangle', rectangle);
        const constructorOptions = {
            ...opt,
            rectangle: null
        }
        let ssMapServerLayer: SSImageryLayer = new ImageryLayer(esri, constructorOptions as any);
        viewer.imageryLayers.add(ssMapServerLayer);

        Object.assign(ssMapServerLayer, {
            name: options.name,
            show: options.show,
            guid: options.guid ?? uuid(),
        });
        ssMapServerLayer.show = defaultValue(options.show, true);


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
                // viewer.zoomTo(ssMapServerLayer);
                if (rectangle) {
                    viewer.camera.flyTo({
                        destination: rectangle,
                        duration: 0,
                    })
                } else {
                    viewer.zoomTo(ssMapServerLayer);
                }
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
        if (options.zoomTo) {
            leaf.zoomTo();
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
                zoomTo: false,
                alpha: leaf._imageLayer?.alpha,
                brightness: leaf._imageLayer?.brightness,
                contrast: leaf._imageLayer?.contrast,
                gamma: leaf._imageLayer?.gamma,
                hue: leaf._imageLayer?.hue,
                saturation: leaf._imageLayer?.saturation,
            }
        }
        console.log('leaf', leaf);
        return leaf;
    } catch (error) {
        let leaf: Leaf = {
            name: options.name,
            guid: options.guid ?? uuid(),
            customProps: options.customProps,
            _zIndex: defaultValue(options.zIndex, 0),
            setVisible: (visible: boolean) => {
                console.log('visible', visible);
            },
            zoomTo: () => {
                console.log('zoomTo');
            },
            get show() {
                return true;
            },
            set show(value: boolean) {
                console.log('show', value);
            },
            set zIndex(value: number) {
                console.log('zIndex', value);
            },
            get zIndex() {
                return 0;
            },
            status: 'error',
        }
        return leaf;
    }

}
export const ArcGisMapServerLoader = async (viewer: Viewer, options: SSArcGisLayerOptions) => {
    const opt = JSON.parse(JSON.stringify(options));
    const esri = await createArcGisMapServer(options);
    const constructorOptions = {
        ...opt,
        rectangle: options.rectangle ? Rectangle.fromDegrees(...opt.rectangle) : undefined,
    }
    let arcGisMapServerLayer: SSImageryLayer = new ImageryLayer(esri, constructorOptions);
    viewer.imageryLayers.add(arcGisMapServerLayer);

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
            zoomTo: false,
            alpha: leaf._imageLayer?.alpha,
            brightness: leaf._imageLayer?.brightness,
            contrast: leaf._imageLayer?.contrast,
            gamma: leaf._imageLayer?.gamma,
            hue: leaf._imageLayer?.hue,
            saturation: leaf._imageLayer?.saturation,
        }
    }
    return leaf;
}

export const TilesetLoader = async (viewer: Viewer, options: SSLayerOptions) => {
    const opt = JSON.parse(JSON.stringify(options));
    // const tileset: SSTilesetLayer | undefined = await createTileset(options);
    const t = new SSTileset(viewer, options);
    await t.createTileset(options);
    return t;
    // const tileset: SSTilesetLayer | undefined = await t.createTileset(options);
    // if (!tileset) return;
    // viewer.scene.primitives.add(tileset);
    // if (opt.style) {
    //     tileset.style = new Cesium3DTileStyle(opt.style);
    // }

    // tileset.name = options.name;
    // tileset.show = defaultValue(options.show, true);
    // if (options.zoomTo) {
    //     viewer.zoomTo(tileset);
    // }
    // const leaf: Leaf = {
    //     name: options.name,
    //     guid: options.guid ?? uuid(),
    //     customProps: options.customProps,
    //     _zIndex: defaultValue(options.zIndex, 0),
    //     setVisible: (visible: boolean) => {
    //         tileset.show = visible;
    //     },
    //     zoomTo: () => {
    //         viewer.zoomTo(tileset);
    //     },
    //     get show() {
    //         return tileset.show;
    //     },
    //     set show(value: boolean) {
    //         tileset.show = value;
    //     },
    //     _tileset: tileset,
    //     set zIndex(value: number) {
    //         leaf._zIndex = value;
    //     },
    //     get zIndex() {
    //         return leaf._zIndex;
    //     },
    //     toJSON: toJSON
    // }
    // function toJSON() {
    //     return {
    //         ...opt,
    //         type: "tileset",
    //         name: leaf.name,
    //         show: leaf.show,
    //         guid: leaf.guid,
    //         url: leaf?._tileset?.resource?.url,
    //         ionAssetId: options.ionAssetId,
    //         zIndex: leaf.zIndex,
    //         zoomTo: false,
    //         style: leaf?._tileset?.style?.style,
    //     }
    // }
    // return leaf;
}

export const IonTilesetLoader = async (viewer: Viewer, options: SSLayerOptions) => {
    const opt = JSON.parse(JSON.stringify(options));
    const tileset: SSTilesetLayer = await createIonTileset(options);
    viewer.scene.primitives.add(tileset);
    tileset.style = new Cesium3DTileStyle(opt.style);
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
            type: "iontileset",
            name: leaf.name,
            show: leaf.show,
            guid: leaf.guid,
            url: leaf?._tileset?.resource?.url,
            ionAssetId: options.ionAssetId,
            zIndex: leaf.zIndex,
            zoomTo: false,
            style: leaf?._tileset?.style?.style,
        }
    }
    return leaf;
}

export const WMSLoader = async (viewer: Viewer, options: SSWMSLayerOptions) => {
    const opt = JSON.parse(JSON.stringify(options));
    const wms = await createWMS(options);
    const constructorOptions = {
        ...opt,
        rectangle: options.rectangle ? Rectangle.fromDegrees(...opt.rectangle) : undefined,
    }
    let wmsLayer: SSImageryLayer = new ImageryLayer(wms, constructorOptions);
    viewer.imageryLayers.add(wmsLayer);
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
            zoomTo: false,
            alpha: leaf._imageLayer?.alpha,
            brightness: leaf._imageLayer?.brightness,
            contrast: leaf._imageLayer?.contrast,
            gamma: leaf._imageLayer?.gamma,
            hue: leaf._imageLayer?.hue,
            saturation: leaf._imageLayer?.saturation,
        }
    }
    return leaf;
}

export const WMTSLoader = async (viewer: Viewer, options: SSLayerOptions) => {
    const opt = JSON.parse(JSON.stringify(options));
    const wmts = await createWMTS(options);
    const constructorOptions = {
        ...opt,
        rectangle: options.rectangle ? Rectangle.fromDegrees(...opt.rectangle) : undefined,
    }
    let wmtsLayer: SSImageryLayer = new ImageryLayer(wmts, constructorOptions);
    viewer.imageryLayers.add(wmtsLayer);
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
            zoomTo: false,
            alpha: leaf._imageLayer?.alpha,
            brightness: leaf._imageLayer?.brightness,
            contrast: leaf._imageLayer?.contrast,
            gamma: leaf._imageLayer?.gamma,
            hue: leaf._imageLayer?.hue,
            saturation: leaf._imageLayer?.saturation,
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
    const constructorOptions = {
        ...opt,
        rectangle: options.rectangle ? Rectangle.fromDegrees(...opt.rectangle) : undefined,
    }
    let xyzLayer: SSImageryLayer = new ImageryLayer(xyz, constructorOptions);
    viewer.imageryLayers.add(xyzLayer);
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
            if (opt.rectangle) {
                viewer.camera.flyTo({
                    destination: Rectangle.fromDegrees(...opt.rectangle),
                    duration: 0,
                })
            }
            // viewer.zoomTo(xyzLayer);
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
            ionAssetId: options.ionAssetId,
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
            zoomTo: false,
            alpha: leaf._imageLayer?.alpha,
            brightness: leaf._imageLayer?.brightness,
            contrast: leaf._imageLayer?.contrast,
            gamma: leaf._imageLayer?.gamma,
            hue: leaf._imageLayer?.hue,
            saturation: leaf._imageLayer?.saturation,
        }
    }
    return leaf;
}

export const TerrainLoader = async (viewer: Viewer, options: SSTerrainLayerOptions) => {
    const opt = JSON.parse(JSON.stringify(options));
    let terrainProvider = await createTerrain(options);
    if (!terrainProvider) return;
    viewer.scene.terrainProvider = terrainProvider;
    viewer.scene.verticalExaggeration = opt.exaggeration ?? 1.0;
    viewer.scene.verticalExaggerationRelativeHeight = opt.relativeHeight ?? 0.0;
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
            ionAssetId: options.ionAssetId,
            rectangle: options.rectangle,
            zoomTo: false,
            exaggeration: viewer.scene.verticalExaggeration,
            relativeHeight: viewer.scene.verticalExaggerationRelativeHeight,
        }
    }
    return leaf;
}

export const ModelLoader = async (viewer: Viewer, options: any) => {
    const opt = JSON.parse(JSON.stringify(options));
    options.position = options.position ?? [116.39, 39.91, 0];
    let position = Cartesian3.fromDegrees(options.position[0], options.position[1], options.position[2]);
    const hpr = options.hpr ?? [0, 0, 0];
    const headingPositionRoll = new HeadingPitchRoll(
        CesiumMath.toRadians(hpr[0]),
        CesiumMath.toRadians(hpr[1]),
        CesiumMath.toRadians(hpr[2])
    );
    const fixedFrameTransform = Transforms.localFrameToFixedFrameGenerator(
        "east",
        "north"
    );
    const model = await Model.fromGltfAsync({
        ...opt,
        url: options.url,
        modelMatrix: Transforms.headingPitchRollToFixedFrame(
            position,
            headingPositionRoll,
            Ellipsoid.WGS84,
            fixedFrameTransform
        ),
        silhouetteColor: Color.fromCssColorString(options.silhouetteColor ?? Color.AQUA.toCssColorString()),
        // allowPicking: opt.allowPicking,
    });
    (model as any).originModelMatrix = model.modelMatrix.clone();
    viewer.scene.primitives.add(model);
    const labelGraphic = new LabelGraphics({
        text: options.name,
        font: '14px sans-serif',
        style: LabelStyle.FILL_AND_OUTLINE,
        fillColor: Color.WHITE,
        outlineColor: Color.BLACK,
        outlineWidth: 2,
        verticalOrigin: VerticalOrigin.TOP,
        pixelOffset: new Cartesian3(0, -30, 0),
        show: false
    })

    // model.readyEvent.addEventListener(() => {
    //     // 绘制模型的包围球
    //     const boundingSphere = model.boundingSphere;
    //     const radius = boundingSphere.radius;
    //     const position = boundingSphere.center;
    //     const ball = viewer.entities.add({
    //         position: position,
    //         ellipsoid: {
    //             radii: new Cartesian3(radius, radius, radius),
    //             material: Color.RED.withAlpha(0.5),
    //             outline: true,
    //             outlineColor: Color.RED,
    //         }
    //     })
    // })

    const label = viewer.entities.add({
        position: new CallbackProperty(() => {
            if (model.ready) {
                // 取包围盒上顶点
                const center = model.boundingSphere.center;
                const radius = model.boundingSphere.radius;
                const centerJWD = Ellipsoid.WGS84.cartesianToCartographic(center);
                const position = Cartesian3.fromRadians(centerJWD.longitude, centerJWD.latitude, centerJWD.height + radius);
                return position;
            } else {
                return position;
            }

        }, false) as any,
        label: labelGraphic,
        // polyline: {
        //     // 顶点和中心连线
        //     positions: new CallbackProperty(() => {
        //         if (model.ready) {
        //             const center = model.boundingSphere.center;
        //             const radius = model.boundingSphere.radius;
        //             const centerJWD = Ellipsoid.WGS84.cartesianToCartographic(center);
        //             console.log('centerJWD', centerJWD);
        //             return [Cartesian3.fromRadians(centerJWD.longitude, centerJWD.latitude, centerJWD.height + radius), center];
        //         } else {
        //             return [position, position];
        //         }
        //     }, false),
        // }
    })

    model.show = defaultValue(options.show, true);
    if (options.zoomTo) {
        viewer.camera.flyToBoundingSphere(model.boundingSphere, {
            duration: 0,
        });
    }
    const leaf: Leaf = {
        name: options.name,
        guid: options.guid || uuid(),
        customProps: options.customProps,
        _zIndex: defaultValue(options.zIndex, 0),
        setVisible: (visible: boolean) => {
            model.show = visible;
        },
        zoomTo: () => {
            viewer.camera.flyToBoundingSphere(model.boundingSphere, {
                duration: 0,
            });
        },
        get show() {
            return model.show;
        },
        set show(value: boolean) {
            model.show = value;
            label.show = value;
        },
        _model: model,
        _label: label,
        set showLabel(value: boolean) {
            label.show = value;
        },
        get showLabel() {
            return label.show;
        },
        set zIndex(value: number) {
            leaf._zIndex = value;
            setLayersZIndex(viewer);
        },
        get zIndex() {
            return leaf._zIndex;
        },
        set position(value: any) {
            leaf._position = value;
        },
        get position() {
            return leaf._position ?? options.position;
        },
        set hpr(value: any) {
            leaf._hpr = value;
        },
        get hpr() {
            return leaf._hpr ?? options.hpr;
        },
        get playAnimations() {
            return leaf._playAnimations ?? false;
        },
        set playAnimations(value: boolean) {
            leaf._playAnimations = value;
            if (value) {
                if (model.ready) {
                    model.activeAnimations.addAll({
                        loop: ModelAnimationLoop.REPEAT,
                        multiplier: 1
                    });
                } else {
                    model.readyEvent.addEventListener(() => {
                        model.activeAnimations.addAll({
                            loop: ModelAnimationLoop.REPEAT,
                            multiplier: 1
                        });
                    })
                }
            } else {
                model.activeAnimations.removeAll();
            }
        },
        get url() {
            return options.url;
        },
        get scale() {
            return model.scale;
        },
        get link() {
            return leaf._link;
        },
        set link(value: string) {
            leaf._link = value;
        },
        get linkType() {
            return leaf._linkType;
        },
        set linkType(value: string) {
            leaf._linkType = value;
        },
        get panoramas() {
            return leaf._panoramas;
        },
        set panoramas(value: any[]) {
            leaf._panoramas = value;
        },
        onclick: options.onclick ?? onclick,
        toJSON: toJSON
    }
    leaf.link = options.link;
    leaf.linkType = options.linkType;
    leaf.panoramas = options.panoramas;
    leaf.playAnimations = options.playAnimations;
    model.id = leaf.guid;
    (model as any).name = leaf.name;
    (model as any).link = leaf.link;

    function onclick() {
        // debugger
        if (leaf.link || leaf.panoramas) {
            if (leaf.linkType === 'panorama') {
                const panel = document.createElement('webgis-widget-panel') as BaseWidget;
                panel.startup({
                    // mapView: this.mapView,
                    viewer: viewer,
                    config: {
                        "label": leaf.name ?? '全景',
                        icon: "bi bi-list",
                        position: {
                            top: 100,
                            left: 500,
                            width: '1200px',
                            height: '800px',
                        }
                    },
                    globalConfig: BaseWidget.prototype.globalConfig,
                })
                document.querySelector('.czm-widget-manager')?.appendChild(panel)

                const panorama = document.createElement('czm-panorama') as BaseWidget;
                panorama.startup({
                    viewer: viewer,
                    config: {
                        url: leaf.link,
                        urls: leaf.panoramas,
                        position: {
                            top: 100,
                            left: 500,
                            width: '1200px',
                            height: '800px',
                        }
                    },
                    globalConfig: BaseWidget.prototype.globalConfig,
                })
                panel.querySelector('.widget-content')?.appendChild(panorama)
                panel.setWidget(panorama);

            } else if (leaf.linkType === 'flv') {
                const panel = document.createElement('webgis-widget-panel') as BaseWidget;
                panel.startup({
                    // mapView: this.mapView,
                    viewer: viewer,
                    config: {
                        "label": leaf.name ?? 'flv视频流',
                        icon: "bi bi-list",
                        position: {
                            top: 100,
                            left: 500,
                            width: '1200px',
                            height: '800px',
                        }
                    },
                    globalConfig: BaseWidget.prototype.globalConfig,
                })
                document.querySelector('.czm-widget-manager')?.appendChild(panel)
                function reload() {
                    const video = document.getElementById('videoElement') as HTMLVideoElement;
                    if (video) {
                        // 销毁之前的video
                        if (leaf._flvPlayer) {
                            leaf._flvPlayer.pause();
                            leaf._flvPlayer.unload();
                            leaf._flvPlayer.detachMediaElement();
                            leaf._flvPlayer.destroy();
                            leaf._flvPlayer = null;
                        }
                        if (window['flvjs']) {
                            const flv = window['flvjs'];
                            const flvPlayer = flv.createPlayer({
                                type: 'flv',
                                hasAudio: false,
                                isLive: true,
                                url: leaf.link,
                            });
                            leaf._flvPlayer = flvPlayer;
                            flvPlayer.on(flv.Events.ERROR, (err: any) => {
                                console.log('flv error', err);
                                reload();
                            })
                            flvPlayer.attachMediaElement(video);
                            flvPlayer.load();
                        }
                    }
                }
                const video = document.createElement('video');
                video.id = 'videoElement';
                video.autoplay = true;
                video.muted = true;
                import('../../third/flv.min.js' as any).then((flvjs) => {
                    console.log('flvjs', flvjs);
                    const flv = window['flvjs'];
                    const flvPlayer = flv.createPlayer({
                        type: 'flv',
                        hasAudio: false,
                        isLive: true,
                        url: leaf.link,
                    });
                    leaf._flvPlayer = flvPlayer;
                    flvPlayer.on(flv.Events.ERROR, (err: any) => {
                        reload();
                    })
                    flvPlayer.attachMediaElement(video);
                    flvPlayer.load();
                })
                video.style.width = '100%';
                video.style.height = '98%';
                panel.onClose = () => {
                    console.log('close');
                    if (leaf._flvPlayer) {
                        leaf._flvPlayer.pause();
                        leaf._flvPlayer.unload();
                        leaf._flvPlayer.detachMediaElement();
                        leaf._flvPlayer.destroy();
                        leaf._flvPlayer = null;
                    }
                }
                panel.querySelector('.widget-content')?.appendChild(video)
            }
            else {
                const panel = document.createElement('webgis-widget-panel') as BaseWidget;
                panel.startup({
                    // mapView: this.mapView,
                    viewer: viewer,
                    config: {
                        "label": leaf.name ?? '超链接',
                        icon: "bi bi-list",
                        position: {
                            top: 100,
                            left: 500,
                            width: '1200px',
                            height: '800px',
                        }
                    },
                    globalConfig: BaseWidget.prototype.globalConfig,
                })
                document.querySelector('.czm-widget-manager')?.appendChild(panel)
                //判断是否是视频
                const isVideo = leaf.link.endsWith('.mp4') || leaf.link.endsWith('.flv') || leaf.link.endsWith('.avi') || leaf.link.endsWith('.mov') || leaf.link.endsWith('.wmv') || leaf.link.endsWith('.mkv');
                if (isVideo) {
                    const video = document.createElement('video');
                    video.src = leaf.link;
                    video.controls = true;
                    video.autoplay = true;
                    video.muted = true;
                    video.loop = true;
                    video.style.width = '100%';
                    video.style.height = '98%';
                    panel.querySelector('.widget-content')?.appendChild(video)
                } else {
                    const iframe = document.createElement('iframe');
                    iframe.src = leaf.link;
                    iframe.style.width = '100%';
                    iframe.style.height = '98%';
                    panel.querySelector('.widget-content')?.appendChild(iframe)
                }

            }
        }
    }

    function toJSON() {
        return {
            ...opt,
            type: "model",
            name: leaf.name,
            show: leaf.show,
            guid: leaf.guid,
            url: options.url,
            position: leaf.position,
            hpr: leaf.hpr,
            zoomTo: false,
            allowPicking: options.allowPicking,
            playAnimations: leaf.playAnimations,
            scale: model.scale,
            silhouetteSize: model.silhouetteSize,
            silhouetteColor: model.silhouetteColor.toCssColorString(),
            link: leaf.link,
        }
    }
    return leaf;
}

export const SSPolygonLoader = async (viewer: Viewer, options: any) => {
    const polygon = new SSPolygon(viewer);
    polygon.createFromJson(options);
    return polygon;
}

export const SSRectangleLoader = async (viewer: Viewer, options: any) => {
    const rectangle = new SSRectangle(viewer);
    rectangle.createFromJson(options);
    return rectangle;
}

export const SSPolylineLoader = async (viewer: Viewer, options: any) => {
    const polyline = new SSPolyline(viewer);
    polyline.createFromJson(options);
    return polyline;
}

export const SSPointLoader = async (viewer: Viewer, options: any) => {
    const point = new SSPoint(viewer);
    point.createFromJson(options);
    return point;
}

export const SSLabelLoader = async (viewer: Viewer, options: any) => {
    const label = new SSLabel(viewer);
    label.createFromJson(options);
    return label;
}

export const SSCircleLoader = async (viewer: Viewer, options: any) => {
    const circle = new SSCircle(viewer);
    circle.createFromJson(options);
    return circle;
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