import { Viewer } from "cesium";

export default class SSBaseObj {
    _defaultOptions: any;
    constructor(viewer: Viewer) {
        console.log('SSBaseObj constructor');
    }

    flyTo() {
        console.log('SSBaseObj flyTo');
    }

    set defaultOptions(value: any) {
        this._defaultOptions = value;
    }

    get defaultOptions() {
        return this._defaultOptions;
    }
}