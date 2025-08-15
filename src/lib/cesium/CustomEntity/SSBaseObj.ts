import { uuid } from "@/lib/common";
import { Viewer } from "cesium";

export default class SSBaseObj {
    _defaultOptions: any;
    guid: string;
    type: string;
    viewer: Viewer;
    constructor(viewer: Viewer, id?: string) {
        this.guid = id ?? uuid()
        this.type = 'SSBaseObj';
        this.viewer = viewer;
    }

    flyTo() {
        // console.log('SSBaseObj flyTo');
    }

    set defaultOptions(value: any) {
        this._defaultOptions = value;
    }

    get defaultOptions() {
        return this._defaultOptions;
    }

    destroy() {
        console.log('SSBaseObj destroy');
    }
}