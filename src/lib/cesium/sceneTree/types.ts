import { ImageryLayer } from "@cesium/engine";
import { Cesium3DTile, Cesium3DTileset } from "cesium";

/**
 * 自定义图层基础配置，各类型图层配置继承此配置
 */
interface SSLayerOptions {
    token?: any;
    type: string;
    name: string;
    url: string;
    index?: number;
    show?: boolean;
    zoomTo?: boolean;
}

/**
 * 自定义图层接口，继承cesium的ImageryLayer接口,扩展一些自定义属性
 */
interface SSImageryLayer extends ImageryLayer {
    name?: string;
    _layerIndex?: number;
    guid?: string;
}

interface SSTilesetLayer extends Cesium3DTileset {
    name?: string;
    guid?: string;
}

interface SceneTreeLeaf {
    name: string;
    index?: number;
    guid?: string;
    setVisible: (visible: boolean) => void;
    zoomTo: () => void;
    show: boolean;
}


export abstract class Leaf implements SceneTreeLeaf {
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

export type { SSLayerOptions, SSImageryLayer, SSTilesetLayer, SceneTreeLeaf }