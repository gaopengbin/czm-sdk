import {
    Viewer,
    ArcGisMapServerImageryProvider,
    ImageryLayer,
    Rectangle,
    Resource,
    UrlTemplateImageryProvider,
    WebMapServiceImageryProvider,
    defined,
    Event,
    defaultValue,
} from "cesium";

import { SSLayerOptions, SSImageryLayer, SceneTreeLeaf } from "./types";
import { debounce } from "../../common/debounce";
import { ArcGisMapServerLoader, TilesetLoader } from "./load";
import uuid from "../../common/uuid";

// function uuid() {
//     return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
//         var r = (Math.random() * 16) | 0,
//             v = c === "x" ? r : (r & 0x3) | 0x8;
//         return v.toString(16);
//     });
// }

class SceneTree {
    _root: any;
    _viewer: Viewer;
    _imageryLayers: any;

    updateEvent: Event = new Event();
    pickEvent: Event = new Event();
    defaultImageryLayerOptions: SSLayerOptions = {
        type: "XYZ",
        name: "新建图层",
        url: "",
        show: true,
    };
    constructor(viewer: Viewer) {
        console.log("SceneTree constructor");
        this._viewer = viewer;
        // 原生方式添加的也进行监听
        viewer.imageryLayers.layerAdded.addEventListener(() => {
            console.log("layerAdded");
            this.updateSceneTree();
        });

        this.root = new Group("root");
    }

    get root() {
        return this._root;
    }

    set root(value) {
        this._root = value;
    }

    set viewer(value: Viewer) {
        this._viewer = value;
        this.updateSceneTree();
    }

    get imageryLayers() {
        this.updateSceneTree();
        return this._imageryLayers;
    }

    treeToArray(node: any) {
        let result: any[] = [];
        if (node.children) {
            node.children.forEach((child: any) => {
                if (child.children) {
                    result.push({
                        name: child.name,
                        guid: child.guid,
                        children: this.treeToArray(child),
                    });
                } else {
                    result.push(child);
                }
            });
        } else {
            result.push(node);
        }
        return result;
    }

    // 做个防抖处理，避免频繁调用
    updateSceneTree = debounce(() => {
        console.log("updateSceneTree");
        // let imageryLayers = (this._viewer.imageryLayers as any)._layers;
        this._imageryLayers = this.treeToArray(this._root);
        this.updateEvent.raiseEvent(this._imageryLayers);
    }, 30, true);

    async addImageryLayer(options: SSLayerOptions) {
        switch (options.type) {
            case "WMS":
                let wmsLayer = this._viewer.imageryLayers.addImageryProvider(
                    new WebMapServiceImageryProvider({
                        url: options.url,
                        layers: options.name,
                        parameters: {
                            format: "image/png",
                            transparent: true,
                            version: "1.1.1",
                        },
                    })
                );
                // wmsLayer.name = options.name;
                wmsLayer.show = defaultValue(options.show, true);
                // wmsLayer._layerIndex = options.index;
                this.updateSceneTree();
                break;
            case "XYZ":
                let xyzLayer = this._viewer.imageryLayers.addImageryProvider(
                    new UrlTemplateImageryProvider({
                        url: options.url,
                    })
                );
                // xyzLayer.name = options.name;
                xyzLayer.show = defaultValue(options.show, true);
                // xyzLayer._layerIndex = options.index;
                this.updateSceneTree();
                break;
            case "ArcGisMapServer":
                await this.createArcGisMapServerLayer(options);
                // this.updateSceneTree();
                break;
            default:
                break;
        }
    }

    createWMSLayer(options: SSLayerOptions) {
        const param = defaultValue(options, this.defaultImageryLayerOptions);
        console.log("createWMSLayer", param);
    }

    createXYZLayer(options: SSLayerOptions) {
        const param = defaultValue(options, this.defaultImageryLayerOptions);
        console.log("createXYZLayer", param);
    }

    async createArcGisMapServerLayer(options: SSLayerOptions) {
        let leaf: Leaf = await ArcGisMapServerLoader(this._viewer, options);
        this.updateSceneTree();
        return leaf;
    }

    async addTilesetLayer(options: SSLayerOptions) {
        console.log("addTilesetLayer", options);
        let leaf = await TilesetLoader(this._viewer, options);
        this.updateSceneTree();
        return leaf;
    }

    // 创建分组用于管理图层
    createGroup(groupName: string) {
        return new Group(groupName);
    }

    // addGroup(group: any) {
    //     this.root.addLayer(group);
    // }

    // removeGroup(group: any) {
    //     this.root.removeLayer(group);
    // }

    // addLayer(layer: any) {
    //     this.root.addLayer(layer);
    // }
}

// interface SceneTreeChildren extends Array<SceneTreeChildren> {
//     name: string;
//     guid: string;
//     push: (item: SceneTreeChildren) => number;
// }

abstract class Leaf implements SceneTreeLeaf {
    name: string;
    index?: number;
    guid?: string;
    abstract setVisible: (visible: boolean) => void;
    abstract zoomTo: () => void;
    show!: boolean;
    constructor(name: string) {
        this.name = name;
    }
}

// 判断是否符合SceneTreeLeaf接口
// zoomTo: () => void;
const isSceneTreeLeaf = (object: any): object is SceneTreeLeaf => {
    return "name" in object && "setVisible" in object && "zoomTo" in object;
};
// 判断是否符合SSLayerOptions接口
const isSSLayerOptions = (object: any): object is SSLayerOptions => {
    return "type" in object && "name" in object && "url" in object;
};

class children extends Array {
    constructor() {
        super();
    }

    push(...items: any[]): number {
        // 判断items是否符合SceneTreeLeaf接口
        [...items].forEach(async (item) => {
            if (isSceneTreeLeaf(item)) {
                console.log("this is SceneTreeLeaf");
                super.push(item);
            }
            else if (isSSLayerOptions(item)) {
                console.log("this is SSLayerOptions");
                // 如果是图层配置，创建图层
                let leaf = await SceneTree.prototype.addImageryLayer(item);
                console.log("leaf", leaf);
                // super.push(items);
            } else if (item instanceof Group) {
                console.log("this is not SceneTreeLeaf", item);
                super.push(item);
            }
        })

        return this.length;

    }

    test() {
        console.log("test");
    }
}

class Group {
    name: string;
    children: children = new children();
    guid: string = uuid();
    constructor(name: string) {
        this.name = name;
    }

    addLayer(layer: any) {
        // this.children.test
        this.children.push(layer);
    }

    removeLayer(layer: any) {
        const index = this.children.indexOf(layer);
        if (index > -1) {
            this.children.splice(index, 1);
        }
    }


}
export { SceneTree };

