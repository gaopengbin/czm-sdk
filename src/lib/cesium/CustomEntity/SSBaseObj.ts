import { uuid } from "@/lib/common";
import { Viewer } from "cesium";

export default class SSBaseObj {
    _defaultOptions: any;
    guid: string;
    constructor(viewer: Viewer) {
        console.log('SSBaseObj constructor');
        this.guid = uuid()
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