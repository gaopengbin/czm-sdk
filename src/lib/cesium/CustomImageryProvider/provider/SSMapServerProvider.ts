import { ArcGisMapServerImageryProvider, Cartesian3, Cartographic, GeographicProjection, ImageryLayerFeatureInfo, WebMercatorProjection, defined, Math as CesiumMath, Check, defaultValue, Resource, Credit, GeographicTilingScheme, Cartesian2, DiscardMissingTileImagePolicy, RuntimeError, Rectangle, WebMercatorTilingScheme } from "cesium";


export default class SSMapServerProvider extends ArcGisMapServerImageryProvider {
    [x: string]: any
    constructor(options: any = {}) {
        super(options)
    }
    static async fromUrl(url: string, options: any): Promise<any> {
        console.log("fromUrl")
        //>>includeStart('debug', pragmas.debug);
        Check.defined("url", url);
        //>>includeEnd('debug');

        options = defaultValue(options, Object.freeze({}));
        const resource = (Resource as any).createIfNeeded(url);
        resource.appendForwardSlash();

        if (defined(options.token)) {
            resource.setQueryParameters({
                token: options.token,
            });
        }
        const provider = new SSMapServerProvider(options);
        provider._resource = resource;
        const imageryProviderBuilder = new ImageryProviderBuilder(options);
        const useTiles = defaultValue(options.usePreCachedTilesIfAvailable, true);
        if (useTiles) {
            await requestMetadata(resource, imageryProviderBuilder);
        }

        imageryProviderBuilder.build(provider);
        return provider;
    }

    pickFeatures(x: number, y: number, level: number, longitude: number, latitude: number): any {
        console.log("pickFeatures")
        if (!this.enablePickFeatures) {
            return undefined;
        }

        const rectangle = this._tilingScheme.tileXYToNativeRectangle(x, y, level);

        let horizontal;
        let vertical;
        let sr;
        if (this._tilingScheme.projection instanceof GeographicProjection) {
            horizontal = CesiumMath.toDegrees(longitude);
            vertical = CesiumMath.toDegrees(latitude);
            sr = "4326";
        } else {
            const projected = this._tilingScheme.projection.project(
                new Cartographic(longitude, latitude, 0.0)
            );
            horizontal = projected.x;
            vertical = projected.y;
            sr = "3857";
        }

        let layers = "all";
        if (defined(this._layers)) {
            layers = `visible:${this._layers}`;
            // layers += `:${this._layers}`;
        }

        const query = {
            f: "json",
            tolerance: 2,
            geometryType: "esriGeometryPoint",
            geometry: `${horizontal},${vertical}`,
            mapExtent: `${rectangle.west},${rectangle.south},${rectangle.east},${rectangle.north}`,
            imageDisplay: `${this._tileWidth},${this._tileHeight},96`,
            sr: sr,
            layers: layers,
        };

        const resource = this._resource.getDerivedResource({
            url: "identify",
            queryParameters: query,
        });

        return resource.fetchJson().then(function (json: any) {
            const result: any = [];

            const features = json.results;
            if (!defined(features)) {
                return result;
            }

            for (let i = 0; i < features.length; ++i) {
                const feature = features[i];

                const featureInfo: any = new ImageryLayerFeatureInfo();
                featureInfo.data = feature;
                featureInfo.name = feature.value;
                featureInfo.properties = feature.attributes;
                featureInfo.configureDescriptionFromProperties(feature.attributes);

                // If this is a point feature, use the coordinates of the point.
                if (feature.geometryType === "esriGeometryPoint" && feature.geometry) {
                    const wkid =
                        feature.geometry.spatialReference &&
                            feature.geometry.spatialReference.wkid
                            ? feature.geometry.spatialReference.wkid
                            : 4326;
                    if (wkid === 4326 || wkid === 4283) {
                        featureInfo.position = Cartographic.fromDegrees(
                            feature.geometry.x,
                            feature.geometry.y,
                            feature.geometry.z
                        );
                    } else if (wkid === 102100 || wkid === 900913 || wkid === 3857) {
                        const projection = new WebMercatorProjection();
                        featureInfo.position = projection.unproject(
                            new Cartesian3(
                                feature.geometry.x,
                                feature.geometry.y,
                                feature.geometry.z
                            )
                        );
                    }
                }

                result.push(featureInfo);
            }

            return result;
        });
    }

}

class ImageryProviderBuilder {
    [x: string]: any
    constructor(options: any) {
        this.useTiles = defaultValue(options.usePreCachedTilesIfAvailable, true);

        const ellipsoid = options.ellipsoid;
        this.tilingScheme = defaultValue(
            options.tilingScheme,
            new GeographicTilingScheme({ ellipsoid: ellipsoid })
        );
        this.rectangle = defaultValue(options.rectangle, this.tilingScheme.rectangle);
        this.ellipsoid = ellipsoid;

        let credit = options.credit;
        if (typeof credit === "string") {
            credit = new Credit(credit);
        }
        this.credit = credit;
        this.tileCredits = undefined;
        this.tileDiscardPolicy = options.tileDiscardPolicy;

        this.tileWidth = defaultValue(options.tileWidth, 256);
        this.tileHeight = defaultValue(options.tileHeight, 256);
        this.maximumLevel = options.maximumLevel;
    }

    build(provider: any) {
        provider._useTiles = this.useTiles;
        provider._tilingScheme = this.tilingScheme;
        provider._rectangle = this.rectangle;
        provider._credit = this.credit;
        provider._tileCredits = this.tileCredits;
        provider._tileDiscardPolicy = this.tileDiscardPolicy;
        provider._tileWidth = this.tileWidth;
        provider._tileHeight = this.tileHeight;
        provider._maximumLevel = this.maximumLevel;

        // Install the default tile discard policy if none has been supplied.
        if (this.useTiles && !defined(this.tileDiscardPolicy)) {
            provider._tileDiscardPolicy = new DiscardMissingTileImagePolicy({
                missingImageUrl: buildImageResource(provider, 0, 0, this.maximumLevel)
                    .url,
                pixelsToCheck: [
                    new Cartesian2(0, 0),
                    new Cartesian2(200, 20),
                    new Cartesian2(20, 200),
                    new Cartesian2(80, 110),
                    new Cartesian2(160, 130),
                ],
                disableCheckIfAllPixelsAreTransparent: true,
            });
        }
    }
}

function buildImageResource(imageryProvider: any, x: number, y: number, level: number, request?: any) {
    let resource;
    if (imageryProvider._useTiles) {
        resource = imageryProvider._resource.getDerivedResource({
            url: `tile/${level}/${y}/${x}`,
            request: request,
        });
    } else {
        const nativeRectangle = imageryProvider._tilingScheme.tileXYToNativeRectangle(
            x,
            y,
            level
        );
        const bbox = `${nativeRectangle.west},${nativeRectangle.south},${nativeRectangle.east},${nativeRectangle.north}`;

        const query: any = {
            bbox: bbox,
            size: `${imageryProvider._tileWidth},${imageryProvider._tileHeight}`,
            format: "png32",
            transparent: true,
            f: "image",
        };

        if (
            imageryProvider._tilingScheme.projection instanceof GeographicProjection
        ) {
            query.bboxSR = 4326;
            query.imageSR = 4326;
        } else {
            query.bboxSR = 3857;
            query.imageSR = 3857;
        }
        if (imageryProvider.layers) {
            query.layers = `show:${imageryProvider.layers}`;
        }

        resource = imageryProvider._resource.getDerivedResource({
            url: "export",
            request: request,
            queryParameters: query,
        });
    }
    return resource;
}

async function requestMetadata(resource: Resource, imageryProviderBuilder: ImageryProviderBuilder) {
    const jsonResource = resource.getDerivedResource({
        queryParameters: {
            f: "json",
        },
    });

    try {
        const data = await jsonResource.fetchJson();
        metadataSuccess(data, imageryProviderBuilder);
    } catch (error) {
        metadataFailure(resource, error);
    }
}

function metadataSuccess(data: any, imageryProviderBuilder: ImageryProviderBuilder) {
    const tileInfo = data.tileInfo;
    if (!defined(tileInfo)) {
        imageryProviderBuilder.useTiles = false;
    } else {
        imageryProviderBuilder.tileWidth = tileInfo.rows;
        imageryProviderBuilder.tileHeight = tileInfo.cols;

        if (
            tileInfo.spatialReference.wkid === 102100 ||
            tileInfo.spatialReference.wkid === 102113
        ) {
            imageryProviderBuilder.tilingScheme = new WebMercatorTilingScheme({
                ellipsoid: imageryProviderBuilder.ellipsoid,
            });
        } else if (data.tileInfo.spatialReference.wkid === 4326) {
            imageryProviderBuilder.tilingScheme = new GeographicTilingScheme({
                ellipsoid: imageryProviderBuilder.ellipsoid,
            });
        } else {
            const message = `Tile spatial reference WKID ${data.tileInfo.spatialReference.wkid} is not supported.`;
            throw new RuntimeError(message);
        }
        imageryProviderBuilder.maximumLevel = data.tileInfo.lods.length - 1;

        if (defined(data.fullExtent)) {
            if (
                defined(data.fullExtent.spatialReference) &&
                defined(data.fullExtent.spatialReference.wkid)
            ) {
                if (
                    data.fullExtent.spatialReference.wkid === 102100 ||
                    data.fullExtent.spatialReference.wkid === 102113
                ) {
                    const projection = new WebMercatorProjection();
                    const extent = data.fullExtent;
                    const sw = projection.unproject(
                        new Cartesian3(
                            Math.max(
                                extent.xmin,
                                -imageryProviderBuilder.tilingScheme.ellipsoid.maximumRadius *
                                Math.PI
                            ),
                            Math.max(
                                extent.ymin,
                                -imageryProviderBuilder.tilingScheme.ellipsoid.maximumRadius *
                                Math.PI
                            ),
                            0.0
                        )
                    );
                    const ne = projection.unproject(
                        new Cartesian3(
                            Math.min(
                                extent.xmax,
                                imageryProviderBuilder.tilingScheme.ellipsoid.maximumRadius *
                                Math.PI
                            ),
                            Math.min(
                                extent.ymax,
                                imageryProviderBuilder.tilingScheme.ellipsoid.maximumRadius *
                                Math.PI
                            ),
                            0.0
                        )
                    );
                    imageryProviderBuilder.rectangle = new Rectangle(
                        sw.longitude,
                        sw.latitude,
                        ne.longitude,
                        ne.latitude
                    );
                } else if (data.fullExtent.spatialReference.wkid === 4326) {
                    imageryProviderBuilder.rectangle = Rectangle.fromDegrees(
                        data.fullExtent.xmin,
                        data.fullExtent.ymin,
                        data.fullExtent.xmax,
                        data.fullExtent.ymax
                    );
                } else {
                    const extentMessage = `fullExtent.spatialReference WKID ${data.fullExtent.spatialReference.wkid} is not supported.`;
                    throw new RuntimeError(extentMessage);
                }
            }
        } else {
            imageryProviderBuilder.rectangle =
                imageryProviderBuilder.tilingScheme.rectangle;
        }

        imageryProviderBuilder.useTiles = true;
    }

    if (defined(data.copyrightText) && data.copyrightText.length > 0) {
        if (defined(imageryProviderBuilder.credit)) {
            imageryProviderBuilder.tileCredits = [new Credit(data.copyrightText)];
        } else {
            imageryProviderBuilder.credit = new Credit(data.copyrightText);
        }
    }
}

function metadataFailure(resource: Resource, error: any) {
    let message = `An error occurred while accessing ${resource.url}`;
    if (defined(error) && defined(error.message)) {
        message += `: ${error.message}`;
    }

    throw new RuntimeError(message);
}