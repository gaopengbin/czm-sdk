import { mergeUrl } from "@/lib/startup/loader";
import { SceneTree } from "src/lib";
import {
    init,
    classModule,
    propsModule,
    attributesModule,
    styleModule,
    eventListenersModule,
    h,
    VNode,
    Classes,
    On,
    Attrs,
    Props
} from "snabbdom";
import { ASTNode, parseHtml, listeners } from '../vnode';
import { timerFunc } from "@/base/utils/tools";

/**
 * 初始化必要的参数
 * 
 * @category Widget-Base
 */
export interface StartInfo {
    mapView: BaseWidget;
    map: any;
    config: object;
    mapConfig: object;
}

/**
 * 循环的参数
 */
/** @ignore */
interface Loop {
    keys: string[],
    values: any[]
}

const interpolationRegex = /\{\{(.+?)\}\}/g; // 插值的正则

export default abstract class BaseWidget extends HTMLElement {
    [x: string]: any;
    static #viewer: any;
    static #sceneTree: SceneTree;
    static #globalConfig: any;
    _config: any;

    #loading?: boolean;
    #data: any = {};
    #patch = init([
        // 使用所选模块初始化 patch 功能
        classModule, // 使切换类变得容易
        propsModule, // 用于设置DOM元素的属性
        attributesModule, // 用于设置DOM元素的属性
        styleModule, // 处理元素样式并支持动画
        eventListenersModule // 附加事件侦听器
    ]);
    #vnode: VNode | HTMLElement | undefined; // 当前的虚拟dom
    #AST: ASTNode[] = [];
    #rendered: boolean = false;// 渲染是否完成
    // 函数缓存
    #cachedFunctions = new Map();
    // class 缓存
    #cachedClasses = new Map();
    #refreshing: boolean = false;
    /**
     * 组件初始化状态，设置多个用于防抖
     * unInited 未初始化
     * initing 正在初始化
     * inited 已经初始化
     */
    #state: 'unInited' | 'initing' | 'inited' = "unInited";

    constructor() {
        super();
    }

    public startup(args: { mapView?: any; map?: any; config: any; mapConfig?: any; viewer?: any; globalConfig?: any; }) {
        this.viewer = args.viewer;
        this.config = args.config;
        this.globalConfig = args.globalConfig;
        console.log("startup", this, args);
    }

    public get manifest() {
        return this._manifest;
    }

    set globalConfig(value) {
        BaseWidget.#globalConfig = value;
    }

    get globalConfig() {
        return BaseWidget.#globalConfig;
    }

    get config() {
        return this._config;
    }

    set config(value) {
        this._config = value;
    }

    /**
     * 配置加载完成
     */
    public configLoaded() {

    }

    async loadConfig(configUrl: any) {
        if (!this.config && configUrl) {
            // this.loading = true;
            configUrl = mergeUrl(configUrl);
            // 禁用缓存
            const response = await fetch(configUrl, {
                method: 'GET',
                headers: {
                    'Cache-Control': 'no-cache'
                }
            });
            this.config = response && response.ok && await response.json() || {};
            this.configLoaded();
            // this.loading = false;
        }
    }

    get viewer() {
        return BaseWidget.#viewer;
    }

    set viewer(value) {
        if (!BaseWidget.#viewer && value) {
            BaseWidget.#viewer = value;
            this.earthReady();
        }
    }

    get sceneTree() {
        return BaseWidget.#sceneTree;
    }

    set sceneTree(value) {
        BaseWidget.#sceneTree = value;
    }

    public earthReady() { }

    async connectedCallback() {
        // 获取配置
        if (this._manifest.hasConfig) {
            this.loadConfig(this.getAttribute('configUrl') || this.getAttribute('config'));
        }
        // 渲染模板
        // 添加样式
        // this.classList.add(this.manifest.className || this.manifest.tagName);
        this.className += ' ' + (this.manifest.className || this.manifest.tagName || '');
        if (this.manifest.template) {
            // 获取原始 AST
            const list = parseHtml(this.manifest.template);
            /**
             * 附加函数
             *      模板字符串解析函数 {{x}}
             *      属性项解析函数 s-x
             *      绑定函数 onxxx
             */
            this.#AST = list.map(item => {
                return item;
            });

            // 创建一个容器 用于虚拟dom与真实dom更新
            let vnodeContainer = document.createElement('v-node');
            this.appendChild(vnodeContainer);
            // 更新 真实DOM
            const vnode = this.render(this.#AST);
            this.#vnode = this.#patch(vnodeContainer, vnode);
        }
        // 渲染完成
        this.#rendered = true;
        this.#onInit();
    }

    /**
    * 是否可以开始初始化 该方法可以被重写
    * 默认会等待 map、mapView、mapConfig和config加载完成
    * @returns 是否可以开始初始化
    */
    public isReady(): boolean {
        return !!(this.viewer && (this.config || !this.manifest.hasConfig));
    }

    /**
 * 组件初始化方法 该方法可以被重写
 */
    public async onInit() { }

    /**
     * 组件初始化方法，只初始化一次
     * 需要判断所有必要条件添加完成再进行初始化
     */
    async #onInit() {
        if (!this.#rendered) { // 尚未渲染完成
            return;
        }

        if (this.#state === 'initing' || this.#state === 'inited') {
            return;
        }
        this.loading = true;
        if (this.isReady()) {
            this.#state = 'initing';
            // this.loading = true;
            await this.onInit();
            this.loading = false;
            this.#state = 'inited';
            await this.afterInit();
        }
    }
    /**
 * 用于渲染html的响应式数据
 */
    public get $data(): any {
        return this.#data;
    }
    public set $data(value: any) {
        this.#data = this.#observe(value);
        this.#refresh();
    }
    /**
    * 判断是否为对象
    * @param value 
    * @returns 
    */
    #isObject(value: unknown): boolean {
        return typeof value === 'object' && value != null;
    }

    /**
     * 对象劫持 (观察器)
     * @param {any} value 
     * @returns {any}
     */
    #observe(value: any): any {
        return new Proxy(value, {
            get: (target, p) => {
                let val = target[p];
                if (this.#isObject(val)) {
                    val = this.#observe(val);
                }
                return val;
            },
            set: (target, p, val) => {
                if (target[p] !== val) {
                    target[p] = val;
                    this.#refresh();
                }
                return true;
            }
        });

    }

    /**
     * 刷新
     * @returns 
     */
    #refresh() {
        if (this.#refreshing) {
            return;
        }
        this.#refreshing = true;
        // 微队列里面进行
        timerFunc(() => {
            // 判断是否有虚拟节点
            if (!this.#vnode) {
                // 创建一个容器 用于虚拟dom与真实dom更新
                let vnodeContainer = document.createElement('v-node');
                this.appendChild(vnodeContainer);
                this.#vnode = vnodeContainer;
            }
            const vnode = this.render(this.#AST);
            // 更新 真实DOM
            this.#vnode = this.#patch(this.#vnode as VNode, vnode);
            this.#refreshing = false;
        })
    }
    /**
    * 获取函数
    * @param values 
    * @returns 
    */
    #getFunction(values: string[]) {
        // 函数字符串及参数一致，则认为其是同一函数
        const key = `${values}`; // 使用模板字符串替换join以提高性能
        if (!this.#cachedFunctions.has(key)) {
            const str = values[values.length - 1];
            // 空函数
            if (str.trim() === '') {
                return () => '';
            }

            // 校验字符串是否包含危险代码
            if (str.includes('eval') || str.includes('Function') || str.includes('setTimeout') || str.includes('setInterval')) {
                throw new Error('Input contains potentially dangerous code');
            }

            const f = new Function(...values).bind(this);
            this.#cachedFunctions.set(key, f);
            return f;
        }
        return this.#cachedFunctions.get(key);
    }


    /**
     * 根据字符串计算属性值
     * @param template 
     * @param loop 循环中包含的数据
     * @returns 
     */
    #getText(template: string, loop: Loop) {
        try {
            const func = this.#getFunction(['$data', ...loop.keys, `return \`\${${template}\}\``]);
            return func(this.$data, ...loop.values);
        }
        catch (e) {
            console.error(e);
        }
    }

    // 为VNode构建 class 对象
    #getClasses(className: string) {
        if (!this.#cachedClasses.has(className)) {
            const classes: any = {};
            if (className !== null && className !== undefined && className.length > 0) {
                className.split(' ').forEach((className) => {
                    if (className.trim().length) {
                        classes[className.trim()] = true;
                    }
                });
            }
            this.#cachedClasses.set(className, classes);
            return classes;
        }
        return this.#cachedClasses.get(className);
    }

    /**
     * 获取标签对应的虚拟dom
     * @param astNode 抽象语法树的节点
     * @param loop 循环的参数
     * @returns 
     */
    #getTagNode(astNode: ASTNode, loop: Loop): VNode {
        let sel = astNode.name || '';
        // 处理属性
        // 特殊属性: id class 事件 不需要包含在attrs中
        let classes: Classes = {};
        let sclasses: Classes = {};
        let on: On = {};
        // 处理属性 如 s-value 等
        // const names: string[] = Object.keys(astNode.attrs || {});
        let attrs: Attrs = {};
        let props: Props = {};
        Object.keys(astNode.attrs || {}).forEach((name: string) => {
            const value = astNode.attrs[name] || '';
            // 处理id
            if (name === 'id') {
                sel = sel + "#" + value;
            }
            // 处理class
            else if (name === 'class') {
                classes = this.#getClasses(value);
            }
            else if (name === 's-class') {
                const _value = this.#getText(value, loop);
                sclasses = this.#getClasses(_value);
            }
            // 处理特殊属性
            else if (['s-checked', 's-disabled', 's-readOnly', 's-selected'].includes(name)) {
                const text = this.#getText(value, loop);
                if (text === 'true') {
                    props[name.slice(2)] = text;
                }
            }
            // 处理其他自定义属性
            else if (name.startsWith("s-")) {
                attrs[name.slice(2)] = this.#getText(value, loop);
            }
            // 处理事件绑定
            else if (listeners.includes(name)) {
                // 传递一些关键字 如 event value $data loop
                const func = this.#getFunction(['event', 'value', '$data', ...loop.keys, value]); // 最后的value表示函数字符串
                on[name.slice(2)] = (event) => {
                    func(event, event.target.value, this.$data, ...loop.values);
                }
            }
            // 其他属性
            else {
                attrs[name] = value;
            }
        });

        // 获取子节点
        const children = this.#toVNode(astNode.children, loop);
        return h(
            sel,
            {
                attrs,
                props,
                class: {
                    ...classes,
                    ...sclasses
                },
                on
            },
            children
        );
    }

    /**
     * 将 抽象语法树 转换成 虚拟DOM
     * @param ast 抽象语法树
     * @param loop 循环中包含的数据
     * @returns 
     */
    #toVNode(ast: ASTNode[] | undefined, loop: Loop = { keys: [], values: [] }): VNode[] {
        const vnodes: VNode[] = [];

        // 处理单个节点
        const processNode = (node: ASTNode, loop: Loop) => {
            if (node.type === 'tag') {
                vnodes.push(this.#getTagNode(node, loop)); // 处理标签节点
            } else if (node.type === 'text') {
                const content: any = node.content?.replace(interpolationRegex, (...args: string[]) => {
                    return this.#getText(args[1], loop); // 处理文本节点中的插值表达式
                });
                vnodes.push(content);
            }
        };

        // 处理 If 节点
        const processIf = (node: ASTNode, loop: Loop) => {
            const func = this.#getFunction(['$data', ...loop.keys, `return (${node.attrs.when})`]); // 构造条件判断函数
            if (func(this.$data, ...loop.values)) {
                processNodes(node.children, loop); // 如果条件成立，处理子节点
            }
        };

        // 处理 For 节点
        const processFor = (node: ASTNode, loop: Loop) => {
            let key = node.attrs.item || 'item';
            let index = node.attrs.index || 'index';
            const func = this.#getFunction(['$data', ...loop.keys, `return (${node.attrs.each})`]); // 构造遍历数组的函数
            let arr = func(this.$data, ...loop.values) || [];
            let i = 0;
            arr.forEach((value: any) => {
                const loopCopy = { keys: [...loop.keys, key, index], values: [...loop.values, value, i] };
                processNodes(node.children, loopCopy); // 遍历数组，处理子节点
                i++;
            });
        };

        // 处理节点列表
        const processNodes = (nodes: ASTNode[] | undefined, loop: Loop) => {
            if (!nodes || nodes.length === 0) {
                return;
            }
            nodes.forEach((node) => {
                if (node.name === 'If') {
                    processIf(node, loop); // 处理 If 节点
                } else if (node.name === 'For') {
                    processFor(node, loop); // 处理 For 节点
                } else if (node.name === 'slot') {
                    // processFor(node, loop); // 处理 slot 插槽 节点
                    console.log(node);
                } else {
                    processNode(node, loop); // 处理普通节点
                }
            });
        };

        processNodes(ast, loop); // 开始处理节点列表
        return vnodes; // 返回处理后的 VNode 列表
    }
    /**
     * 渲染函数 该方法可以被重写
     * @param template 模板字符串 或 抽象语法树
     * @returns snabbdom 的虚拟DOM
     */
    public render(template: ASTNode[] | ASTNode | string): VNode {
        // 参数归一化 只初始化一次
        if (typeof template === 'string' && this.#AST.length === 0) {
            const list = parseHtml(template);
            this.#AST = list.map(item => {
                return item;
            });
        }
        else if (typeof template === 'object' && !Array.isArray(template)) {
            template = [template];
        }
        // 将 抽象语法树 转换成虚拟DOM 最外层的 v-node 作为容器
        // 使用v-node而不是div是防止div的样式造成影响
        return h('v-node', this.#toVNode(this.#AST));
    }
    public disconnectedCallback() {
        console.log("自定义元素从页面中移除。");
    }

    public adoptedCallback() {
        console.log("自定义元素移动至新页面。");
    }

    public attributeChangedCallback(name: any, oldValue: any, newValue: any) {
        console.log(`属性 ${name} 已变更。`);
    }

    /**
     * 初始化
     */
    public async afterInit() {
    }
    /**
    * 当组件被打开时调用的方法 该方法可以被重写
    */
    public onOpen() { }

    /**
     * 当组件被关闭时调用的方法 该方法可以被重写
     */
    public onClose() { }
}

const getViewer = () => {
    return BaseWidget.prototype.viewer;
}

const getSceneTree = () => {
    return BaseWidget.prototype.sceneTree;
}



export {
    getViewer,
    getSceneTree,
}