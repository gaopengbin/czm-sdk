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
        handleRightClick: Function;
        handleNodeExpand: Function;
        handleDoubleClick?: Function;
        extraBtns: any[];
        draggable?: boolean;
        onDragStart?: Function;
        onDrag?: Function;
        onDragEnd?: Function;
        onDragEnter?: Function;
        onDragOver?: Function;
        onDragLeave?: Function;
        onDrop?: Function;
    }
}

class Tree {
    options: TreeOptions;
    element: HTMLElement | null;
    selectedNode: HTMLElement | null;
    dragNode: HTMLElement | null;
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
                handleRightClick: () => { },
                handleNodeExpand: () => { },
                handleDoubleClick: () => { },
                extraBtns: [],
            }
        };
        this.element = options?.el || document.createElement("div");
        this.selectedNode = null;
        this.dragNode = null;
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
            handleRightClick: this.options.props.handleRightClick,
            handleDoubleClick: this.options.props.handleDoubleClick,
            handleNodeSelect: this.nodeSelect,
            draggable: this.options.props.draggable,
            onDragStart: this.options.props.onDragStart,
            onDrag: this.options.props.onDrag,
            onDragEnd: this.options.props.onDragEnd,
            onDragEnter: this.options.props.onDragEnter,
            onDragOver: this.options.props.onDragOver,
            onDragLeave: this.options.props.onDragLeave,
            onDrop: this.options.props.onDrop,

        });
        root.initialize();
        this.registerExpandEvents();
        this.registerOutsideClickEvents();
    }

    updateTree(data: TreeData) {
        // debugger
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
            handleRightClick: this.options.props.handleRightClick,
            handleNodeSelect: this.nodeSelect,
        });
        root.initialize();
        this.registerExpandEvents();
        this.registerOutsideClickEvents();
        if (this.selectedNode) {
            const guid = this.selectedNode.getAttribute("guid");
            if (guid) {
                let node = this.element?.querySelector(`[guid='${guid}']`);
                console.log(node);
                if (node) {
                    this.nodeSelect(node as HTMLElement);
                }
            }
        }
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
            if (this.selectedNode && !this.selectedNode.contains(evt.target as HTMLElement)
                && document.querySelector("layer-list")?.contains(evt.target as HTMLElement)
                && !document.querySelector(".btn-group")?.contains(evt.target as HTMLElement)
            ) {
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
    handleRightClick: Function;
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
        this.handleRightClick = () => { };
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

    set dragEl(el: HTMLElement | null) {
        this.store.dragNode = el;
    }

    get dragEl() {
        return this.store.dragNode;
    }

    registerDragEvents(el: HTMLElement) {
        el.addEventListener("dragstart", (evt: any) => {
            let e = evt as HTMLElementMouseEvent<HTMLElement>;
            this.dragEl = e.target;
            this.store.options.props.onDragStart?.(this.data, e);
        });
        el.addEventListener("dragover", (evt: any) => {
            let e = evt as HTMLElementMouseEvent<HTMLElement>;
            let node = e.target;
            if (evt.target.classList.contains("label")) {
                node = evt.target.parentElement;
                // console.log("dragover", node);
                // node.style.border = "1px dashed blue";
            }
            if (node.classList.contains("tree-node-content")) {
                if (node.classList.contains("leaf")) {
                    node.style.borderTop = "1px solid blue";
                } else {
                    // 如果鼠标位置在节点的上半部分，就在节点上方显示虚线
                    if (e.offsetY < node.offsetHeight / 2) {
                        node.style.border = 'none';
                        node.style.borderTop = "1px solid blue";
                    } else {
                        node.style.border = "1px solid blue";
                    }
                }

            }

            e.preventDefault();
        });

        el.addEventListener("dragleave", (evt: any) => {
            let e = evt as HTMLElementMouseEvent<HTMLElement>;
            let node = e.target;
            if (evt.target.classList.contains("label")) {
                node = evt.target.parentElement;
                // node.style.border = "none";
            }
            if (node.classList.contains("tree-node-content")) {
                node.style.border = "none";
            }
        });

        el.addEventListener("dragend", (evt: any) => {
            let e = evt as HTMLElementMouseEvent<HTMLElement>;
            let node = e.target;
            if (evt.target.classList.contains("label")) {
                node = evt.target.parentElement;
            }
            if (node.classList.contains("tree-node-content")) {
                console.log("dragend", node);
                node.style.borderTop = "none";
            }
        });

        el.addEventListener("drop", (evt: any) => {
            let e = evt as HTMLElementMouseEvent<HTMLElement>;
            let node = e.target;
            if (evt.target.classList.contains("label")) {
                node = evt.target.parentElement;
            }
            console.log("drop", node);
            if (node.classList.contains("tree-node-content")) {
                node.style.border = "none";
                // this.store.options.props.onDrop?.(this.data, e);
                if (node.classList.contains("leaf")) {
                    if (this.dragEl) {
                        node.parentElement?.parentElement?.insertBefore(this.dragEl, node.parentElement);
                        const parentGuid = node.parentElement?.parentElement?.previousElementSibling?.getAttribute("guid");
                        const dragGuid = this.dragEl.firstElementChild?.getAttribute("guid");
                        const targetGuid = node.getAttribute("guid");
                        this.store.options.props.onDragEnd?.({
                            parentGuid: parentGuid,
                            dragGuid: dragGuid,
                            targetGuid: targetGuid
                        }, 'moveForward', e);
                    }
                } else {
                    // 如果鼠标位置在节点的上半部分，就移动到节点上方，否则移入为子节点
                    if (e.offsetY < node.offsetHeight / 2) {
                        if (this.dragEl) {
                            node.parentElement?.parentElement?.insertBefore(this.dragEl, node.parentElement);
                            const parentGuid = node.parentElement?.parentElement?.previousElementSibling?.getAttribute("guid");
                            const dragGuid = this.dragEl.firstElementChild?.getAttribute("guid");
                            const targetGuid = node.getAttribute("guid");
                            this.store.options.props.onDragEnd?.({
                                parentGuid: parentGuid,
                                dragGuid: dragGuid,
                                targetGuid: targetGuid
                            }, 'moveForward', e);
                        }
                    } else {
                        if (this.dragEl) {
                            node.parentElement?.querySelector(".tree-node-children")?.appendChild(this.dragEl);
                            const parentGuid = node?.getAttribute("guid");
                            const dragGuid = this.dragEl.firstElementChild?.getAttribute("guid");
                            const targetGuid = node.getAttribute("guid");
                            this.store.options.props.onDragEnd?.({
                                parentGuid: parentGuid,
                                dragGuid: dragGuid,
                                targetGuid: targetGuid
                            }, 'moveInto', e);
                            // console.log("drop", this.data, e);
                        }
                    }
                }

                // const cloneNode = dragEl!.cloneNode(true);
                // dragEl!.parentElement?.removeChild(dragEl);
                // if (node.classList.contains("leaf")) {

                // }
            }
        });

    }

    initialize() {
        // this.expand = this._expand;
        if (Array.isArray(this.data)) {
            this.setData(this.data);
        } else {
            let parentElement = this.el;
            let parentNode = document.createElement("li");
            parentNode.draggable = true;

            // 拖拽事件
            this.registerDragEvents(parentNode);

            parentElement?.appendChild(parentNode);

            let contendNode = document.createElement("span");
            contendNode.classList.add("tree-node-content");
            contendNode.setAttribute("guid", this.data?.guid);

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
                icon.classList.add("isFolder");
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
            this.registerDoubleClickEvents(contendNode);
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
                    handleRightClick: this.handleRightClick,
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
                    handleRightClick: this.handleRightClick,
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
        if (element) {
            element.oncontextmenu = (evt) => {
                this.handleRightClick(this, element);
                return false;
            }
        }

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

                extraBtn.innerHTML = `<a class="${icon}"></a>`;
                extraBtn.setIcon = (icon: string) => {
                    extraBtn.innerHTML = `<a class="${icon}"></a>`;
                }
                extraBtn.addEventListener("click", (evt) => {
                    //ruir modify
                    // let nodeData = data[parseInt(evt?.target?.parentElement?.parentElement?.getAttribute("nodeindex") || "0")];
                    btn.onClick(this.data, extraBtn, evt);
                });
                if (btn.show === undefined) {
                    btn.show = () => true;
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

    registerDoubleClickEvents(element: HTMLElement | null) {
        element?.addEventListener("dblclick", (evt) => {
            let e = evt as HTMLElementMouseEvent<HTMLElement>;
            if (e.target?.classList.contains('label')) {
                this.store.options.props.handleDoubleClick?.(this, element);
            }
            evt.preventDefault();
        });
    }
}

function isUndefined(value: any): value is undefined {
    return typeof value === "undefined";
}

export {
    Tree,
    TreeNode
}