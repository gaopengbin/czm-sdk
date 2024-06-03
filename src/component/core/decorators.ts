/**
 * 组件的创建参数
 * 
 * @category Decorator
 */
export interface Manifest {
    /**
     * 标签的名称
     */
    tagName: string;
    /**
     * css类名，默认和tagName一致
     */
    className?: string;
    /**
     * html模板
     */
    template?: string;
    /**
     * 是否有config文件，默认为false，如果为true，widget初始化时会主动加载config文件
     */
    hasConfig?: boolean;
}

/**
 * 装饰器，用于引入widget的manifest参数，并创建标签
 * @param {Manifest} manifest 装饰器的参数
 * @returns {any} Target object.
 * @sample
 * ```ts
@Component({
    // 模块名称
    tagName: "sample-header",
    // css类名，默认和tagName一致
    className: "sample-header",
    // html模板字符串
    template: template,
})
export class SampleHeader extends BaseWidget {
    constructor() {
        super();
    }
}
 * ```
 *
 * @category Decorator
 */
export const Component = (manifest: Manifest): any => {
    console.log("Component", manifest);
    return (target: any) => {
        // 防止重复定义
        if (customElements.get(manifest.tagName)) {
            console.warn(`标签名称 "${manifest.tagName}" 已经被注册`);
            return;
        }
        target.prototype._manifest = getManifest(manifest);
        target.manifest = getManifest(manifest);
        // 创建标签
        customElements.define(manifest.tagName, target as CustomElementConstructor);
        console.log(`标签 "${manifest.tagName}" 创建成功`, target, getManifest(manifest));
        return target as any;
    };
}

/**
 * 给装饰器参数添加默认值
 * @param manifest 装饰器参数
 * @returns 添加默认值之后的装饰器参数
 * 
 * @category Decorator
 */
const getManifest = (manifest: Manifest): Manifest => {
    // 合成manifest，添加默认参数
    manifest = Object.assign({
        hasConfig: false
    }, manifest);
    console.log("getManifest", manifest);
    return manifest;
}