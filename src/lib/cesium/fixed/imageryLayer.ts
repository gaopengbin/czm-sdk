// let throttleByServer = false;

import {
    ImageryLayer,
    Request,
    defined,
    TileProviderError,
    RequestState,
    RequestType,

} from "cesium";
const ImageryState = {
    UNLOADED: 0,
    TRANSITIONING: 1,
    RECEIVED: 2,
    TEXTURE_LOADED: 3,
    READY: 4,
    FAILED: 5,
    INVALID: 6,
    PLACEHOLDER: 7,
};
(ImageryLayer.prototype as any)._requestImagery = function (imagery: any) {
    const imageryProvider = this._imageryProvider;

    const that = this;

    function success(image: any) {
        if (!defined(image)) {
            return failure();
        }

        imagery.image = image;
        imagery.state = ImageryState.RECEIVED;
        imagery.request = undefined;

        TileProviderError.reportSuccess(that._requestImageError);
    }

    function failure(e?: any) {
        if (imagery.request.state === RequestState.CANCELLED) {
            // Cancelled due to low priority - try again later.
            imagery.state = ImageryState.UNLOADED;
            imagery.request = undefined;
            return;
        }

        // Initially assume failure. An error handler may retry, in which case the state will
        // change to TRANSITIONING.
        imagery.state = ImageryState.FAILED;
        imagery.request = undefined;

        const message = `Failed to obtain image tile X: ${imagery.x} Y: ${imagery.y} Level: ${imagery.level}.`;
        that._requestImageError = TileProviderError.reportError(
            that._requestImageError,
            imageryProvider,
            imageryProvider.errorEvent,
            message,
            imagery.x,
            imagery.y,
            imagery.level,
            e
        );
        if (that._requestImageError.retry) {
            doRequest();
        }
    }

    function doRequest() {
        const request = new Request({
            throttle: false,
            throttleByServer: false,
            type: RequestType.IMAGERY,
        });
        imagery.request = request;
        imagery.state = ImageryState.TRANSITIONING;
        const imagePromise = imageryProvider.requestImage(
            imagery.x,
            imagery.y,
            imagery.level,
            request
        );

        if (!defined(imagePromise)) {
            // Too many parallel requests, so postpone loading tile.
            imagery.state = ImageryState.UNLOADED;
            imagery.request = undefined;
            return;
        }

        if (defined(imageryProvider.getTileCredits)) {
            imagery.credits = imageryProvider.getTileCredits(
                imagery.x,
                imagery.y,
                imagery.level
            );
        }

        imagePromise
            .then(function (image: any) {
                success(image);
            })
            .catch(function (e: any) {
                failure(e);
            });
    }

    doRequest();
};