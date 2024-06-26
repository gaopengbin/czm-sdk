import { ExtraBtn, HTMLElementEvent, HTMLElementMouseEvent } from "./htmlElement";

type TreeOptions = {
    el: HTMLElement | null;
    treeData: any;
    style: {
        parentIcon: string;
        childrenIcon: string;
    };
    defaultExpandedKeys?: string[];
    defaultExpandAll: boolean;
    props: {
        label: string;
        children: string;
        labelRender: Function;
        handleNodeClick: Function;
        handleNodeExpand: Function;
        extraBtns: any[];
    }
}

class Tree {
    options: TreeOptions;
    element: HTMLElement | null;
    selectedNode: HTMLElement | null;
    constructor(options?: TreeOptions) {
        this.options = {
            el: document.createElement("div"),
            treeData: [],
            style: {
                parentIcon: "",
                childrenIcon: "",
            },
            defaultExpandedKeys: [],
            defaultExpandAll: false,
            props: {
                label: "label",
                children: "children",
                labelRender: () => { },
                handleNodeClick: () => { },
                handleNodeExpand: () => { },
                extraBtns: [],
            }
        };
        this.element = options?.el || document.createElement("div");
        this.selectedNode = null;
        if (options) {
            this.setOptions(options);
        }
    }
    setOptions(options: TreeOptions) {
        this.options = options;
        if (this.options.props.extraBtns) {
            this.options.props.extraBtns.reverse();
        }
        this.element = options.el;
        this.element?.classList.add("rootUL");
    }

    initialize() {
        let root = new TreeNode({
            store: this,
            label: "root",
            // children: this.options.treeData,
            isLeaf: false,
            el: this.element,
            data: this.options.treeData,
            style: this.options.style,
            props: this.options.props,
            handleNodeClick: this.options.props.handleNodeClick,
            handleNodeSelect: this.nodeSelect,
        });
        root.initialize();
        this.registerExpandEvents();
        this.registerOutsideClickEvents();
    }

    updateTree(data: TreeData) {
        this.destroy();
        let root = new TreeNode({
            store: this,
            label: "root",
            // children: this.options.treeData,
            isLeaf: false,
            el: this.element,
            data: data,
            style: this.options.style,
            props: this.options.props,
            handleNodeClick: this.options.props.handleNodeClick,
            handleNodeSelect: this.nodeSelect,
        });
        root.initialize();
        this.registerExpandEvents();
        this.registerOutsideClickEvents();
    }

    registerExpandEvents() {
        // 折叠,只有点击到三角标才会触发
        let toggler = document.getElementsByClassName("expand-icon");
        let i;
        for (i = 0; i < toggler.length; i++) {
            toggler[i].addEventListener("click", function (evt) {
                let e = evt as HTMLElementEvent<HTMLElement>;
                // 创建动画过渡效果
                let node = e.target?.parentElement?.parentElement?.querySelector(".tree-node-children");
                if (node) {
                    node.setAttribute("style", "display:block");
                    if (!node.classList.contains("expand")) {
                        setTimeout(() => {
                            const func = () => {
                                node.removeEventListener("transitionend", func);
                            }
                            node.addEventListener("transitionend", func);
                            node.classList.toggle("expand");
                        }, 0);
                    } else {
                        setTimeout(() => {
                            const func = () => {
                                node.setAttribute("style", "display:none");
                                node.removeEventListener("transitionend", func);
                            }
                            node.addEventListener("transitionend", func);
                            node.classList.toggle("expand");
                        }, 0);
                    }
                }
                e.target?.classList.toggle("expand-icon-down");
            })
        }
    }

    registerOutsideClickEvents() {
        document.addEventListener("click", (evt) => {
            if (this.selectedNode && !this.selectedNode.contains(evt.target as HTMLElement)) {
                this.selectedNode.classList.remove("selected");
                this.selectedNode = null;
            }
        });
    }

    nodeSelect(node: HTMLElement) {
        if (node !== this.selectedNode) {
            if (this.selectedNode) {
                this.selectedNode.classList.remove("selected");
            }
            node?.classList.add("selected");
        }
        this.selectedNode = node;
    }

    filterByText(value: string) {
        let filter = value.toUpperCase();
        let ul = this.element;
        let li = ul?.getElementsByTagName("li");
        if (!li) return;
        // 先清除所有节点的匹配状态
        for (let i = 0; i < li?.length; i++) {
            li[i].classList.remove("isMatched");
        }
        for (let i = 0; i < li?.length; i++) {
            let span = li[i].getElementsByTagName("span")[0];
            if (span) {
                let txtValue = span.textContent || span.innerText;
                if (txtValue.toUpperCase().indexOf(filter) > -1) {
                    li[i].classList.add("isMatched");
                    li[i].style.display = "";
                    let parent = li[i].parentElement;
                    while (parent && parent.id !== this.element?.id) {
                        parent.classList.add("isMatched");
                        if (parent.classList.contains("tree-node-children")) {
                            parent.classList.add("expand");
                            parent.previousElementSibling?.querySelector(".expand-icon")?.classList.add("expand-icon-down");
                        }
                        parent.style.display = "";
                        parent = parent.parentElement;
                    }
                } else {
                    li[i].classList.remove("isMatched");
                    li[i].style.display = "none";
                }
            }
        }
    }

    destroy() {
        // 移除this.element下的所有子节点
        while (this.element?.firstChild) {
            this.element.removeChild(this.element.firstChild);
        }
    }

}

type TreeNodeData = {
    [key: string]: any;
}

type TreeData = TreeNodeData[];

type TreeNodeOptions = {
    [key: string]: any;
    label: string;
    children?: TreeNodeOptions[];
    isLeaf: boolean;
    parent?: TreeNode;
    el?: HTMLElement | null;
    data: TreeNodeData;
    style?: {
        parentIcon: string;
        childrenIcon: string;
    };
}

class TreeNode {
    [key: string]: any;
    store: Tree;
    label: string;
    children: TreeNode[];
    isLeaf: boolean;
    parent: TreeNode | null;
    el: HTMLElement | null;
    data: TreeNodeData | null;
    handleNodeClick: Function;
    handleNodeSelect: Function;
    _expand: boolean;
    constructor(options: TreeNodeOptions) {
        this.store = options.store;
        this.label = ''
        this.children = [];
        this.isLeaf = false;
        this.parent = null;
        this.el = null;
        this.data = null;
        this._expand = false;
        this.handleNodeClick = () => { };
        this.handleNodeSelect = () => { };
        for (let key in options) {
            if (options.hasOwnProperty(key)) {
                if (key === 'expand') {
                    this._expand = options[key] ?? false;
                } else {
                    this[key] = options[key];
                }

            }
        }
    }

    initialize() {
        // this.expand = this._expand;
        if (Array.isArray(this.data)) {
            this.setData(this.data);
        } else {
            let parentElement = this.el;
            let parentNode = document.createElement("li");
            parentElement?.appendChild(parentNode);

            let contendNode = document.createElement("span");
            contendNode.classList.add("tree-node-content");

            // 创建展开/折叠图标
            let icon = document.createElement("span");
            icon.classList.add("expand-icon");

            icon.addEventListener

            if (this.expand) {
                icon.classList.add("expand-icon-down");
            }
            contendNode.appendChild(icon);
            parentNode.appendChild(contendNode);

            //在展开/折叠图标 和 文本之间创建父节点图标
            let iconNode = document.createElement("span");
            iconNode.classList.add("icon");
            // 父节点图标
            if (this.style?.parentIcon && this.data?.children) {
                if (this.style?.parentIcon.startsWith("bi")) {
                    let iconClass = this.style.parentIcon.split(" ");
                    iconNode.classList.add(...iconClass);
                } else {
                    iconNode.style.content = `url(${this.style.parentIcon})`;
                }
            }
            // 子节点图标
            if (this.style?.childrenIcon && !this.data?.children) {
                if (this.style?.childrenIcon.startsWith("bi")) {
                    let iconClass = this.style.childrenIcon.split(" ");
                    iconNode.classList.add(...iconClass);
                } else {
                    iconNode.style.content = `url(${this.style.childrenIcon})`;
                }
            }
            contendNode.appendChild(iconNode);

            if (this.store.options.props.labelRender) {
                contendNode.innerHTML += `<span class='label'>${this.store.options.props.labelRender(this.data)}</span>`;
            } else {
                contendNode.innerHTML += `<span class='label'>${this.label}</span>`;
            }
            this.registerClickEvents(contendNode);
            this.registerSelectEvents(contendNode);
            this.registerExpandEvents(contendNode);
            this.registerExtraBtns(contendNode);
            this.el = parentNode;
            if (this.data) {
                if (!this.data.children) {
                    contendNode.classList.add('leaf')
                }
                this.setData(this.data);
            }
        }
    }

    setData(data: TreeNodeData) {
        let _this = this;
        if (!data) return;
        if (!Array.isArray(data)) {
            let childrenData = data.children;
            let childrenNode = document.createElement("ul");
            childrenNode.classList.add("tree-node-children");
            if (this.expand) {
                childrenNode.classList.add("expand");
            }
            this.el?.appendChild(childrenNode);
            childrenData?.forEach((child: TreeNodeData) => {
                this.el = childrenNode;
                let childNode = new TreeNode({
                    label: child.label,
                    isLeaf: child.children ? false : true,
                    parent: this,
                    el: childrenNode,
                    data: child,
                    style: this.style,
                    handleNodeClick: this.handleNodeClick,
                    store: _this.store,
                    expand: isUndefined(child.expand) ? this.store.options.defaultExpandAll : child.expand,
                });
                childNode.initialize();
                _this.insertChild(childNode);
            });
        } else {
            data?.forEach((child: TreeNodeData) => {
                let childNode = new TreeNode({
                    label: child.label,
                    isLeaf: child.children ? false : true,
                    parent: this,
                    el: _this.el,
                    data: child,
                    style: this.style,
                    handleNodeClick: this.handleNodeClick,
                    store: _this.store,
                    expand: isUndefined(child.expand) ? this.store.options.defaultExpandAll : child.expand,
                });
                childNode.initialize();
                _this.insertChild(childNode);
            });
        }
    }

    insertChild(child: TreeNode) {
        this.children.push(child);
    }

    set expand(value: boolean) {
        this._expand = value;
        // if (this.el?.classList.contains('rootUL')) return;
        // let groupEL = this.el?.parentElement;
        // groupEL?.querySelector(".expand-icon")?.classList.toggle("expand-icon-down", value);
        // groupEL?.querySelector(".tree-node-children")?.classList.toggle("expand", value);
    }

    get expand() {
        return this._expand;
    }

    /**
     * 节点点击事件
     * @param element tree-node-content
     */
    registerClickEvents(element: HTMLElement | null) {
        element?.addEventListener("click", (evt) => {
            let e = evt as HTMLElementMouseEvent<HTMLElement>;
            if (e.target?.classList.contains('expand-icon')) {
                return;
            }
            if (element.classList.contains('tree-node-content')) {
                this.handleNodeClick(this, element);
            }
        });
    }
    /**
     *  节点选中事件
     * @param element tree-node-content
     */
    registerSelectEvents(element: HTMLElement | null) {
        element?.addEventListener("click", (evt) => {
            let e = evt as HTMLElementMouseEvent<HTMLElement>;
            if (e.target?.classList.contains('expand-icon')) {
                return;
            }
            this.store.nodeSelect(element);
        });
    }
    /**
     *  节点展开/折叠事件
     * @param element tree-node-content
     */
    registerExpandEvents(element: HTMLElement | null) {
        element?.addEventListener("click", (evt) => {
            let e = evt as HTMLElementMouseEvent<HTMLElement>;
            if (e.target?.classList.contains('expand-icon')) {
                this._expand = !this.expand;
                this.store.options.props.handleNodeExpand(this, this.expand);
            }
        });
    }

    registerExtraBtns(contendNode: HTMLElement) {
        if (this.store.options?.props?.extraBtns) {
            for (let btn of this.store.options.props.extraBtns) {
                let extraBtn: ExtraBtn<HTMLElement> = document.createElement("span");
                extraBtn.classList.add("extra-btn");

                let icon;
                if (typeof btn.icon === "function") {
                    icon = btn.icon(this.data);
                } else {
                    icon = btn.icon;
                }

                extraBtn.innerHTML = `<i class="${icon}"></i>`;
                extraBtn.setIcon = (icon: string) => {
                    extraBtn.innerHTML = `<i class="${icon}"></i>`;
                }
                extraBtn.addEventListener("click", (evt) => {
                    //ruir modify
                    // let nodeData = data[parseInt(evt?.target?.parentElement?.parentElement?.getAttribute("nodeindex") || "0")];
                    btn.onClick(this.data, extraBtn);
                });
                if (btn.show === undefined) {
                    btn.show = (node: any) => true;
                } else if (typeof btn.show !== "function") {
                    extraBtn.style.display = btn.show ? "inline" : "none";
                } else if (btn.show(this.data)) {
                    extraBtn.style.display = "inline";
                } else {
                    extraBtn.style.display = "none";
                }
                contendNode.appendChild(extraBtn);
            }
        }
    }
}

function isUndefined(value: any): value is undefined {
    return typeof value === "undefined";
}

export {
    Tree,
    TreeNode
}