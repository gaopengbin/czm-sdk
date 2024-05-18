import {
    ArcGisMapServerImageryProvider,
    ImageryLayer,
    Rectangle,
    Resource,
    UrlTemplateImageryProvider,
    Viewer,
    WebMapServiceImageryProvider,
    defined,
    Event,
    defaultValue,
} from "cesium";
import { SSImageryLayerOptions, SSImageryLayer } from "./types";
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
        console.log("node", node);
        let result: any[] = [];
        if (node.children) {
            node.children.forEach((child: any) => {
                if (child.children) {
                    console.log("child", child);
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
        console.log("this._root", this._root, this._imageryLayers);
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
        const jsonResource = resource.getDerivedResource({
            queryParameters: {
                f: "json",
            },
        });

        // 获取地图范围
        try {
            const data = await jsonResource.fetchJson();
            if (data.fullExtent) {
                console.log("data.fullExtent", data.fullExtent);
                // 根据wkid或wkt判断坐标系,原生Cesium只支持4326和3857
                if (data.fullExtent.spatialReference.wkid === 4326) {
                    rectangle = Rectangle.fromDegrees(
                        data.fullExtent.xmin,
                        data.fullExtent.ymin,
                        data.fullExtent.xmax,
                        data.fullExtent.ymax
                    );
                } else if (data.fullExtent.spatialReference.wkid === 3857 || data.fullExtent.spatialReference.wkid === 102100) {
                    // 3857坐标系转换为4326
                    function mercatorTolonlat(mercator: { x: number; y: number; }) {
                        var lonlat = {
                            x: 0,
                            y: 0
                        };
                        var x = mercator.x / 20037508.34 * 180;
                        var y = mercator.y / 20037508.34 * 180;
                        y = 180 / Math.PI * (2 * Math.atan(Math.exp(y * Math.PI / 180)) - Math.PI / 2);
                        lonlat.x = x;
                        lonlat.y = y;
                        return lonlat;
                    }
                    let min = mercatorTolonlat({ x: data.fullExtent.xmin, y: data.fullExtent.ymin });
                    let max = mercatorTolonlat({ x: data.fullExtent.xmax, y: data.fullExtent.ymax });
                    rectangle = Rectangle.fromDegrees(
                        min.x,
                        min.y,
                        max.x,
                        max.y
                    );
                }
            }
        } catch (error) { }
        const esri = await ArcGisMapServerImageryProvider.fromUrl(options.url, {
            rectangle: rectangle,
        });

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
        return {
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
                arcGisMapServerLayer.show = value;
            },
        };
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

class Group {
    name: string;
    children: any[] = [];
    guid: string = uuid();
    constructor(name: string) {
        this.name = name;
    }

    // get name() {
    //     return this.name;
    // }

    // get children() {
    //     return this._children;
    // }

    addLayer(layer: any) {
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

