import {
    Viewer,
} from "@cesium/widgets";
import {
    ArcGisMapServerImageryProvider,
    ImageryLayer,
    Rectangle,
    Resource,
    UrlTemplateImageryProvider,
    WebMapServiceImageryProvider,
    defined,
    Event,
    defaultValue,
} from "@cesium/engine";

import { SSImageryLayerOptions, SSImageryLayer, SceneTreeLeaf } from "./types";
import { debounce } from "./debounce";

function uuid() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        var r = (Math.random() * 16) | 0,
            v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

class SceneTree {
    _root: any;
    _viewer: Viewer;
    _imageryLayers: any;

    updateEvent: Event = new Event();
    pickEvent: Event = new Event();
    defaultImageryLayerOptions: SSImageryLayerOptions = {
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
        // console.log("node", node);
        let result: any[] = [];
        if (node.children) {
            node.children.forEach((child: any) => {
                if (child.children) {
                    // console.log("child", child);
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

    async addImageryLayer(options: SSImageryLayerOptions) {
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

    createWMSLayer(options: SSImageryLayerOptions) {
        const param = defaultValue(options, this.defaultImageryLayerOptions);
        console.log("createWMSLayer", param);
    }

    createXYZLayer(options: SSImageryLayerOptions) {
        const param = defaultValue(options, this.defaultImageryLayerOptions);
        console.log("createXYZLayer", param);
    }

    async createArcGisMapServerLayer(options: SSImageryLayerOptions) {
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

        // esri.pickFeatures

        let arcGisMapServerLayer: SSImageryLayer =
            this._viewer.imageryLayers.addImageryProvider(esri);

        Object.assign(arcGisMapServerLayer, {
            name: options.name,
            show: options.show,
            guid: uuid(),
        });

        if (options.zoomTo) {
            this._viewer.zoomTo(arcGisMapServerLayer);
        }
        this.updateSceneTree();
        const leaf: Leaf = {
            name: options.name,
            index: arcGisMapServerLayer._layerIndex,
            guid: arcGisMapServerLayer.guid,
            setVisible: (visible: boolean) => {
                arcGisMapServerLayer.show = visible;
            },
            zoomTo: () => {
                this._viewer.zoomTo(arcGisMapServerLayer);
            },
            get show() {
                return arcGisMapServerLayer.show;
            },
            set show(value: boolean) {
                console.log("arcGisMapServerLayer", arcGisMapServerLayer);
                arcGisMapServerLayer.show = value;
            },
        }
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
// 判断是否符合SSImageryLayerOptions接口
const isSSImageryLayerOptions = (object: any): object is SSImageryLayerOptions => {
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
            else if (isSSImageryLayerOptions(item)) {
                console.log("this is SSImageryLayerOptions");
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

