import { ArcGisMapServerImageryProvider, Cartesian3, Cartographic, GeographicProjection, ImageryLayerFeatureInfo, Rectangle, WebMercatorProjection, defined, Math as CesiumMath } from "cesium";

(ArcGisMapServerImageryProvider.prototype as any).pickFeatures = function (x: number, y: number, level: number, longitude: number, latitude: number, extent?: any): any {
    if (!this.enablePickFeatures) {
        return undefined;
    }

    let rectangle;
    let horizontal;
    let vertical;
    let sr;
    if (this._tilingScheme.projection instanceof GeographicProjection) {
        horizontal = CesiumMath.toDegrees(longitude);
        vertical = CesiumMath.toDegrees(latitude);
        sr = "4326";
        rectangle = new Rectangle(
            longitude - 0.00005,
            latitude - 0.00005,
            longitude + 0.00005,
            latitude + 0.00005
        );
    } else {
        const projected = this._tilingScheme.projection.project(
            new Cartographic(longitude, latitude, 0.0)
        );
        horizontal = projected.x;
        vertical = projected.y;
        sr = "3857";
        rectangle = new Rectangle(
            projected.x - 5,
            projected.y - 5,
            projected.x + 5,
            projected.y + 5
        )
    }

    let layers = "all";
    if (defined(this._layers)) {
        layers = `visible:${this._layers}`;
        // layers += `:${this._layers}`;
    }

    let geometryType = "esriGeometryPoint";
    let geometry = `${horizontal},${vertical}`;
    // polygon like [
    //     113.92145956364111,
    //     22.48660796097505,
    //     113.92145956364111,
    //     22.48660796097505,
    // ]
    if (defined(extent)) {
        geometryType = "esriGeometryEnvelope";
        geometry = `${extent[0]},${extent[1]},${extent[2]},${extent[3]}`;
    }

    const query = {
        f: "json",
        tolerance: 2,
        geometryType: geometryType,
        geometry: geometry,
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