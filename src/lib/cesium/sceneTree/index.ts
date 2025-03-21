import {
    Viewer,
    Event,
    defaultValue,
} from "cesium";

import { SSLayerOptions, SceneTreeLeaf, SSWMSLayerOptions, SSXYZLayerOptions, SSTerrainLayerOptions } from "./types";
import { debounce } from "../../common/debounce";
import { ArcGisMapServerLoader, GeoJsonLoader, IonTilesetLoader, ModelLoader, SSMapServerLoader, SSPolygonLoader, SSRectangleLoader, TerrainLoader, TilesetLoader, WMSLoader, WMTSLoader, XYZLoader, setLayersZIndex } from "./loader";
import uuid from "../../common/uuid";
import { buildLayers } from "./creator";
// import { CesiumPolygon, CesiumPolyline } from "../draw/core/Graphic";
import GraphicManager from "../draw/core/GraphicManager";
import MarkerManager from "../draw/core/MarkerManager";

class SceneTree {
    [x: string]: any;
    _root: any;
    _viewer: Viewer;
    _graphicManager: GraphicManager;
    _markerManager: MarkerManager;
    _imageryLayers: any;
    _imageryCollection: any = [];
    _tilesetCollection: any;
    _groupCollection: any = [];
    updateEvent: Event = new Event();
    pickEvent: Event = new Event();
    defaultImageryLayerOptions: SSLayerOptions = {
        type: "XYZ",
        name: "新建图层",
        url: "",
        show: true,
    };
    layersMap: Map<string, any> = new Map();
    constructor(viewer: Viewer, graphicManager: GraphicManager, markerManager: MarkerManager) {
        this._viewer = viewer;
        this._graphicManager = graphicManager;
        this._markerManager = markerManager;
        // 原生方式添加的也进行监听
        viewer.imageryLayers.layerAdded.addEventListener((l) => {
            this.updateSceneTree();
        });

        this.root = new Group("root");
        this.root._sceneTree = this;
    }

    get root(): Group {
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
            // node.children.reverse();
            node.children.forEach((child: any) => {
                if (child.children) {
                    result.push({
                        name: child.name,
                        guid: child.guid,
                        expand: child.expand,
                        isScene: child.isScene,
                        children: this.treeToArray(child),
                    });
                    this._groupCollection.push(child);
                    this.layersMap.set(child.guid, child);
                    // console.log("child", child.guid, child);
                } else {
                    result.push(child);
                    this.layersMap.set(child.guid, child);
                    if (child._imageLayer) {
                        this._imageryCollection.push(child);
                    } else if (child._tileset) {
                        this._tilesetCollection.push(child);
                    }
                }
            });
        } else {
            result.push(node);
            this.layersMap.set(node.guid, node);
            if (node._imageLayer) {
                this._imageryCollection.push(node);
            } else if (node._tileset) {
                this._tilesetCollection.push(node);
            }

        }
        // return result.reverse();
        return result;
    }

    // 做个防抖处理，避免频繁调用
    updateSceneTree = debounce(() => {
        this._imageryCollection = [];
        this._tilesetCollection = [];
        this._groupCollection = [];
        this._imageryLayers = this.treeToArray(this._root);
        this.updateEvent.raiseEvent(this._imageryLayers);
        setLayersZIndex(this._viewer);
    }, 30, true);

    /**
     * 添加图层
     * @param options 图层配置
     */
    async addLayer(options: SSLayerOptions) {
        let node = await buildLayers(this, options);
        this.root.addLayer(node);
        setLayersZIndex(this._viewer);
        return node;
    }
    /**
     * 获取图层
     * @param guid 
     * @returns 
     */
    getLayerByGuid(guid: string) {
        return this.layersMap.get(guid);
    }

    /**
     * 移除图层
     * @param guid 图层guid
     */
    removeLayerByGuid(guid: any) {
        let node = this.layersMap.get(guid);
        if (node) {
            if (node.guid === 'fb3fa1af-a71a-4084-ad71-3fe7b7cc87e8') {
                console.log("removeLayerByGuid", node);
            }
            if (node.children) {
                const children = node.children;
                //逆向删除
                for (let i = children.length - 1; i >= 0; i--) {
                    this.removeLayerByGuid(children[i].guid);
                }
                this.layersMap.delete(node.guid);
            } else {
                if (node._imageLayer) {
                    this._viewer.imageryLayers.remove(node._imageLayer);
                } else if (node._tileset) {
                    this._viewer.scene.primitives.remove(node._tileset);
                } else if (node._model) {
                    this._viewer.scene.primitives.remove(node._model);
                    if (node._label) {
                        this._viewer.entities.remove(node._label);
                    }
                }
                else if (node._terrain) {
                    if (this._viewer.terrainProvider === node._terrain) {
                        (this._viewer.terrainProvider as any) = undefined;
                    }
                } else if (node._dataSource) {
                    this._viewer.dataSources.remove(node._dataSource);
                } else if (node._graphic) {
                    node.remove();
                } else if (node._entity) {
                    this._viewer.entities.remove(node._entity);
                }
                else {
                    // node.remove();
                }
                this.layersMap.delete(node.guid);
            }
            if (node.parent) {
                node.parent.removeLayer(node);
            }
            this.updateSceneTree();
        }
    }

    async addImageryLayer(options: SSLayerOptions) {
        switch (options.type) {
            case "WMS":
                await this.createWMSLayer(options as SSWMSLayerOptions);
                break;
            case "XYZ":
                await this.createXYZLayer(options);
                break;
            case "ArcGisMapServer":
                await this.createArcGisMapServerLayer(options);
                // this.updateSceneTree();
                break;
            default:
                break;
        }
    }

    async createWMSLayer(options: SSWMSLayerOptions) {
        const param = defaultValue(options, this.defaultImageryLayerOptions);
        let leaf: Leaf = await WMSLoader(this._viewer, param);
        this.updateSceneTree();
        return leaf;
    }

    async createWMTSLayer(options: SSLayerOptions) {
        const param = defaultValue(options, this.defaultImageryLayerOptions);
        let leaf: Leaf = await WMTSLoader(this._viewer, param);
        this.updateSceneTree();
        return leaf;
    }

    async createGeoJsonLayer(options: SSLayerOptions) {
        const param = defaultValue(options, this.defaultImageryLayerOptions);
        let leaf: Leaf = await GeoJsonLoader(this._viewer, param);
        this.updateSceneTree();
        return leaf;
    }

    async createXYZLayer(options: SSXYZLayerOptions) {
        const param = defaultValue(options, this.defaultImageryLayerOptions);
        let leaf: Leaf = await XYZLoader(this._viewer, param);
        this.updateSceneTree();
        return leaf;
    }

    async createSSMapServerLayer(options: SSLayerOptions) {
        const param = defaultValue(options, this.defaultImageryLayerOptions);
        let leaf: Leaf = await SSMapServerLoader(this._viewer, param);
        this.updateSceneTree();
        return leaf;
    }

    async createArcGisMapServerLayer(options: SSLayerOptions) {
        const param = defaultValue(options, this.defaultImageryLayerOptions);
        let leaf: Leaf = await ArcGisMapServerLoader(this._viewer, param);
        this.updateSceneTree();
        return leaf;
    }

    async addTilesetLayer(options: SSLayerOptions) {
        let leaf = await TilesetLoader(this._viewer, options);
        this.updateSceneTree();
        return leaf;
    }

    async createIonTilesetLayer(options: SSLayerOptions) {
        let leaf = await IonTilesetLoader(this._viewer, options);
        this.updateSceneTree();
        return leaf;
    }

    async createTerrainLayer(options: SSTerrainLayerOptions) {
        let leaf = await TerrainLoader(this._viewer, options);
        this.updateSceneTree();
        return leaf;
    }

    async createModelLayer(options: SSLayerOptions) {
        let leaf = await ModelLoader(this._viewer, options);
        this.updateSceneTree();
        return leaf;
    }

    createGraphicLayer(options: SSLayerOptions) {
        let leaf = this._graphicManager.jsonToGraphic(options)
        this.updateSceneTree();
        return leaf;
    }

    createMarkerLayer(options: SSLayerOptions) {
        let leaf = this._markerManager.jsonToMarker(options)
        this.updateSceneTree();
        return leaf;
    }

    createLabelLayer(options: SSLayerOptions) {
        let leaf = this._markerManager.jsonToLabel(options)
        this.updateSceneTree();
        return leaf;
    }

    createSSPolygonLayer(options: SSLayerOptions) {
        let leaf = SSPolygonLoader(this._viewer, options);
        this.updateSceneTree();
        return leaf;
    }

    createSSRectangleLayer(options: SSLayerOptions) {
        let leaf = SSRectangleLoader(this._viewer, options);
        this.updateSceneTree();
        return leaf;
    }

    createLayer(options: SSLayerOptions) {
        const type = options.type.toLocaleLowerCase();
        switch (type) {
            case "wms":
                return this.createWMSLayer(options as SSWMSLayerOptions);
            case "xyz":
                return this.createXYZLayer(options);
            case "arcgismapserver":
                return this.createArcGisMapServerLayer(options);
            case "geojson":
                return this.createGeoJsonLayer(options);
            case "tileset":
                return this.addTilesetLayer(options);
            case "iontileset":
                return this.createIonTilesetLayer(options);
            case "terrain":
                return this.createTerrainLayer(options as SSTerrainLayerOptions);
            case "model":
                return this.createModelLayer(options);
            case "graphic":
                return this.createGraphicLayer(options);
            case "marker":
                return this.createMarkerLayer(options);
            case "label":
                return this.createLabelLayer(options);
            default:
                return this.createWMSLayer(options as SSWMSLayerOptions);
        }
    }



    // 创建分组用于管理图层
    createGroup(groupName: string, guid?: string) {
        const group = new Group(groupName, guid);
        group._sceneTree = this;
        return group;
    }

    moveIntoGroup(source: any, group: any) {
        if (!source || !group) return;
        group.children.push(source);
        const index = source.parent.children.indexOf(source);
        source.parent.children.splice(index, 1);
        source.parent = group;
    }

    moveForward(source: any, target: any) {
        let sourceIndex = source.parent.children.indexOf(source);
        const targetIndex = target.parent.children.indexOf(target);
        if (sourceIndex > -1 && targetIndex > -1) {
            if (source.parent === target.parent) {
                target.parent.children.splice(targetIndex, 0, target.parent.children.splice(sourceIndex, 1)[0]);
            } else {
                const sourceParent = source.parent;
                target.parent.children.splice(targetIndex, 0, source);
                sourceParent.children.splice(sourceIndex, 1);
                source.parent = target.parent;
            }
        }

    }

    updateLayerByGuid(guid: any, newLayer: any) {
        let node = this.layersMap.get(guid);
        if (node) {
            node.parent.updateLayer(guid, newLayer);
            this.layersMap.set(guid, newLayer);
            this.updateSceneTree();
        }
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
    abstract remove?: () => void;
    abstract toJSON?: () => void;
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
            if (!item.guid) {
                item.guid = uuid()
            }
            if (isSceneTreeLeaf(item)) {
                // console.log("this is SceneTreeLeaf");
                super.push(item);
            }
            else if (isSSLayerOptions(item)) {
                // console.log("this is SSLayerOptions");
                // 如果是图层配置，创建图层
                // let leaf = await SceneTree.prototype.addImageryLayer(item);
                // console.log("leaf", leaf);
                super.push(item);
            } else if (item instanceof Group) {
                // console.log("this is not SceneTreeLeaf", item);
                super.push(item);
            } else {
                // console.log("this is wrong SceneTreeLeaf", item);
                super.push(item);
            }
        })
        return this.length;

    }
}

class Group {
    name: string;
    children: children = new children();
    guid: string;
    _expand: boolean = false;
    _sceneTree: SceneTree | null = null;
    parent: Group | null = null;
    isScene: boolean = false;
    constructor(name: string, guid?: string) {
        this.name = name;
        this.guid = guid || uuid();
    }

    set expand(value: boolean) {
        this._expand = value;
    }

    get expand() {
        return this._expand;
    }

    get showStatus() {
        // 分全选true 全空false 部分选中half
        let show = this.children.every((child: any) => {
            return child.show;
        });
        let hide = this.children.every((child: any) => {
            return !child.show;
        });
        if (this.children.length === 0) {
            return 'null';
        }
        return show ? 'all' : hide ? 'null' : "half";
    }

    set show(value: boolean) {
        this.setVisible(value);
    }

    get show() {
        return this.showStatus === 'all' ? true : this.showStatus === 'null' ? false : false;
    }


    async addLayer(layer: any, item?: any) {
        if (layer instanceof Promise) {
            let child = {
                name: item.name,
                status: "loading",
            }
            let length = this.children.push(child);
            layer.then((res: any) => {
                res.parent = this;
                res.remove = () => {
                    if (this._sceneTree) {
                        this._sceneTree.removeLayerByGuid(res.guid);
                    }
                }
                this.children[length - 1] = res;
                // getSceneTree().updateSceneTree();
                this._sceneTree?.updateSceneTree();
            });
        } else {
            layer.parent = this;
            layer.remove = () => {
                if (this._sceneTree) {
                    this._sceneTree.removeLayerByGuid(layer.guid);
                }
            }
            this.children.push(layer)
        }
        this._sceneTree?.layersMap.set(layer.guid, layer);
        this._sceneTree?.updateSceneTree();
    }

    updateLayer(guid: any, newLayer: any) {
        newLayer.parent = this;
        newLayer.remove = () => {
            if (this._sceneTree) {
                this._sceneTree.removeLayerByGuid(guid);
            }
        }
        let index = this.children.findIndex((child: any) => {
            return child.guid === guid;
        });
        if (index > -1) {
            this.children[index] = newLayer;
            let old = this._sceneTree?.getLayerByGuid(guid);
            old && old.destroy && old.destroy();
            old && old.remove();
        }

    }

    removeLayer(layer: any) {
        const index = this.children.indexOf(layer);
        if (index > -1) {
            if (layer.children) {
                for (let i = layer.children.length - 1; i >= 0; i--) {
                    layer.removeLayer(layer.children[i]);
                }
            } else {
                layer && layer.destroy && layer.destroy();
                layer && layer.remove();
            }
            this.children.splice(index, 1);
        }
    }

    setVisible(visible: boolean) {
        this.children.forEach((child: any) => {
            // if (isSceneTreeLeaf(child)) {
            //     child.setVisible(visible);
            // } else if (child instanceof Group) {
            child.setVisible(visible);
            // }
        });
    }

    moveForward(layer: any, targetLayer: any) {
        let index = this.children.indexOf(layer);
        let targetIndex = this.children.indexOf(targetLayer);
        if (index > -1 && targetIndex > -1) {
            this.children.splice(index, 1);
            this.children.splice(targetIndex, 0, layer);
        }
    }

    toJSON(): any {
        // this.children.reverse();
        let parent: any;
        if (this.parent) {
            parent = {
                name: this.parent.name,
                guid: this.parent.guid,
            }
        }
        return {
            name: this.name,
            guid: this.guid,
            expand: this.expand,
            isScene: this.isScene,
            parent: this.parent ? parent : null,
            children: this.children.map((child: any) => {
                return child.toJSON ? child.toJSON() : child;
            })
        }
    }

}
export { SceneTree, Group };

