import { ImageryLayer } from "cesium";

/**
 * 自定义图层基础配置，各类型图层配置继承此配置
 */
interface SSImageryLayerOptions {
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

export type { SSImageryLayerOptions, SSImageryLayer }