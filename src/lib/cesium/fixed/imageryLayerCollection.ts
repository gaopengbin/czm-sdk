import { ImageryLayerCollection, Rectangle, Scene, defined, Math as CesiumMath, Ray, ArcGisMapServerImageryProvider } from "cesium";
import SSMapServerProvider from "../CustomImageryProvider/provider/SSMapServerProvider";

const pickImageryLayerFeatures = (ray: Ray, scene: Scene, extent?: any, type: string = 'all') => {
    // Find the picked location on the globe.
    const pickedPosition = scene.globe.pick(ray, scene);
    if (!defined(pickedPosition)) {
        return;
    }

    const pickedLocation = scene.globe.ellipsoid.cartesianToCartographic(
        pickedPosition
    );

    let promises: any = [];
    const imageryLayers: any = [];
    // const imageryLayerCollection = scene.imageryLayers;
    // for (let i = 0; i < imageryLayerCollection.length; ++i) {
    //     const imageryLayer = imageryLayerCollection.get(i);
    //     // if (!imageryLayer.show) {
    //     //     continue;
    //     // }
    //     if (!imageryLayer.ready) {
    //         continue;
    //     }

    //     const provider = imageryLayer.imageryProvider;
    //     if (!defined(provider.pickFeatures)) {
    //         continue;
    //     }
    //     console.log(provider)
    //     if (provider instanceof ArcGisMapServerImageryProvider || provider instanceof SSMapServerProvider) {
    //         const promise = (provider as any).pickFeatures(
    //             0, 0, 1,
    //             pickedLocation.longitude,
    //             pickedLocation.latitude,
    //             polygon
    //         );
    //         if (defined(promise)) {
    //             promises.push(promise);
    //             imageryLayers.push(imageryLayer);
    //         }
    //     } else {
    //         const promise = provider.pickFeatures(
    //             0, 0, 1,
    //             pickedLocation.longitude,
    //             pickedLocation.latitude,
    //         );
    //         if (defined(promise)) {
    //             promises.push(promise);
    //             imageryLayers.push(imageryLayer);
    //         }
    //     }

    // }
    pickImageryHelper(scene, pickedLocation, true, function (imagery: any) {
        if (!imagery.imageryLayer.ready) {
            return undefined;
        }
        const provider = imagery.imageryLayer.imageryProvider;

        if (provider instanceof ArcGisMapServerImageryProvider || provider instanceof SSMapServerProvider) {
            const promise = (provider as any).pickFeatures(
                0, 0, 1,
                pickedLocation.longitude,
                pickedLocation.latitude,
                extent
            );
            if (defined(promise)) {
                promises.push(promise);
                imageryLayers.push(imagery.imageryLayer);
            }
        } else {
            const promise = provider.pickFeatures(
                imagery.x,
                imagery.y,
                imagery.level,
                pickedLocation.longitude,
                pickedLocation.latitude
            );
            if (defined(promise)) {
                promises.push(promise);
                imageryLayers.push(imagery.imageryLayer);
            }
        }
    });

    if (promises.length === 0) {
        return undefined;
    }
    if (type === 'top') {
        promises = [promises[0]]
    }
    return Promise.all(promises).then(function (results) {
        const features = [];
        for (let resultIndex = 0; resultIndex < results.length; ++resultIndex) {
            const result = results[resultIndex];
            const image = imageryLayers[resultIndex];
            if (defined(result) && result.length > 0) {
                for (
                    let featureIndex = 0;
                    featureIndex < result.length;
                    ++featureIndex
                ) {
                    const feature = result[featureIndex];
                    feature.imageryLayer = image;
                    // For features without a position, use the picked location.
                    if (!defined(feature.position)) {
                        feature.position = pickedLocation;
                    }
                    features.push(feature);
                }
            }
        }
        return features;
    });
}

const pickImageryLayerFeatures2 = (ray: Ray, scene: Scene, extent?: any, type: string = 'all') => {
    // Find the picked location on the globe.
    const pickedPosition = scene.globe.pick(ray, scene);
    if (!defined(pickedPosition)) {
        return;
    }

    const pickedLocation = scene.globe.ellipsoid.cartesianToCartographic(
        pickedPosition
    );

    let promises: any = [];
    const imageryLayers: any = [];
    const imageryLayerCollection = scene.imageryLayers;
    for (let i = 0; i < imageryLayerCollection.length; ++i) {
        const imageryLayer = imageryLayerCollection.get(i);
        // if (!imageryLayer.show) {
        //     continue;
        // }
        if (!imageryLayer.ready) {
            continue;
        }

        const provider = imageryLayer.imageryProvider;
        if (!defined(provider.pickFeatures)) {
            continue;
        }
        if (provider instanceof ArcGisMapServerImageryProvider || provider instanceof SSMapServerProvider) {
            const promise = (provider as any).pickFeatures(
                0, 0, 1,
                pickedLocation.longitude,
                pickedLocation.latitude,
                extent
            );
            if (defined(promise)) {
                promises.push(promise);
                imageryLayers.push(imageryLayer);
            }
        } else {
            const promise = provider.pickFeatures(
                0, 0, 1,
                pickedLocation.longitude,
                pickedLocation.latitude,
            );
            if (defined(promise)) {
                promises.push(promise);
                imageryLayers.push(imageryLayer);
            }
        }

    }
    // pickImageryHelper(scene, pickedLocation, true, function (imagery: any) {
    //     if (!imagery.imageryLayer.ready) {
    //         return undefined;
    //     }
    //     const provider = imagery.imageryLayer.imageryProvider;
    //     const promise = provider.pickFeatures(
    //         imagery.x,
    //         imagery.y,
    //         imagery.level,
    //         pickedLocation.longitude,
    //         pickedLocation.latitude
    //     );
    //     if (defined(promise)) {
    //         promises.push(promise);
    //         imageryLayers.push(imagery.imageryLayer);
    //     }
    // });

    if (promises.length === 0) {
        return undefined;
    }
    if (type === 'top') {
        promises = [promises[0]]
    }
    return Promise.all(promises).then(function (results) {
        const features = [];
        for (let resultIndex = 0; resultIndex < results.length; ++resultIndex) {
            const result = results[resultIndex];
            const image = imageryLayers[resultIndex];
            if (defined(result) && result.length > 0) {
                for (
                    let featureIndex = 0;
                    featureIndex < result.length;
                    ++featureIndex
                ) {
                    const feature = result[featureIndex];
                    feature.imageryLayer = image;
                    // For features without a position, use the picked location.
                    if (!defined(feature.position)) {
                        feature.position = pickedLocation;
                    }
                    features.push(feature);
                }
            }
        }
        return features;
    });
}
Object.assign(ImageryLayerCollection.prototype, {
    pickImageryLayerFeatures: pickImageryLayerFeatures,
    pickImageryLayerFeatures2: pickImageryLayerFeatures2
})


const applicableRectangleScratch = new Rectangle();

function pickImageryHelper(scene: any, pickedLocation: any, pickFeatures: any, callback: any) {
    // Find the terrain tile containing the picked location.
    const tilesToRender = scene.globe._surface._tilesToRender;
    let pickedTile;

    for (
        let textureIndex = 0;
        !defined(pickedTile) && textureIndex < tilesToRender.length;
        ++textureIndex
    ) {
        const tile = tilesToRender[textureIndex];
        if (Rectangle.contains(tile.rectangle, pickedLocation)) {
            pickedTile = tile;
        }
    }

    if (!defined(pickedTile)) {
        return;
    }

    // Pick against all attached imagery tiles containing the pickedLocation.
    const imageryTiles = pickedTile.data.imagery;

    for (let i = imageryTiles.length - 1; i >= 0; --i) {
        const terrainImagery = imageryTiles[i];
        const imagery = terrainImagery.readyImagery;
        if (!defined(imagery)) {
            continue;
        }
        if (!imagery.imageryLayer.ready) {
            continue;
        }
        const provider = imagery.imageryLayer.imageryProvider;
        if (pickFeatures && !defined(provider.pickFeatures)) {
            continue;
        }

        if (!Rectangle.contains(imagery.rectangle, pickedLocation)) {
            continue;
        }

        // If this imagery came from a parent, it may not be applicable to its entire rectangle.
        // Check the textureCoordinateRectangle.
        const applicableRectangle = applicableRectangleScratch;

        const epsilon = 1 / 1024; // 1/4 of a pixel in a typical 256x256 tile.
        applicableRectangle.west = CesiumMath.lerp(
            pickedTile.rectangle.west,
            pickedTile.rectangle.east,
            terrainImagery.textureCoordinateRectangle.x - epsilon
        );
        applicableRectangle.east = CesiumMath.lerp(
            pickedTile.rectangle.west,
            pickedTile.rectangle.east,
            terrainImagery.textureCoordinateRectangle.z + epsilon
        );
        applicableRectangle.south = CesiumMath.lerp(
            pickedTile.rectangle.south,
            pickedTile.rectangle.north,
            terrainImagery.textureCoordinateRectangle.y - epsilon
        );
        applicableRectangle.north = CesiumMath.lerp(
            pickedTile.rectangle.south,
            pickedTile.rectangle.north,
            terrainImagery.textureCoordinateRectangle.w + epsilon
        );
        if (!Rectangle.contains(applicableRectangle, pickedLocation)) {
            continue;
        }
        callback(imagery);
    }
}