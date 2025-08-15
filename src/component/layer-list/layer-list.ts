
import { Component } from "../core/decorators";
import BaseWidget from "../earth/base-widget";
import { Tree } from "../../lib/tree/tree";
import "../../lib/tree/tree-view.scss";
import Template from "./layer-list.html?raw";
import "./layer-list.scss"
// import { Modal, Popover } from "bootstrap";
import { showLegend, showStyle } from "./utils";
import { Group } from "@/lib/cesium/sceneTree";
import Popover from "./popover";
import "./popover.scss";
@Component({
    tagName: "layer-list",
    className: "layer-list",
    template: Template,
})
export default class LayerList extends BaseWidget {
    // treeview: Tree | null = null;
    constructor() {
        super();
    }
    public async onInit() {
        this.$data = {
            layer: {
                guid: "",
                name: "",
                zIndex: 0,
            },
            zIndex: 0,
            showZIndexItem: false,
            menuItems: [
                {
                    name: "平移",
                    id: "positionEdit",
                },
                {
                    name: "删除",
                    id: "delete",
                },
                {
                    name: "设置层级",
                    id: "ZIndex",
                },
                {
                    name: "图例",
                    id: "legend",
                },
                {
                    name: "样式",
                    id: "style",
                },
                {
                    name: "打印配置",
                    id: "console",
                },
                {
                    name: "导出配置",
                    id: "export",
                }
            ],
            search: "",
        }
    }
    public async afterInit() {
        this.layers = [];
        this.sceneTree.updateEvent.addEventListener((val) => {
            this.treeView?.updateTree(val);
            if (this.querySelector('.contextmenu')) return;
            const menuHTML =
                `
                    <ul>
                        <li id="positionEdit">平移</li>
                        <li data-bs-toggle="modal" data-bs-target="#confirmModal" id="delete">删除</li>
                        <li data-bs-toggle="modal" data-bs-target="#exampleModal" id="ZIndex">设置层级</li>
                        <li id="legend">图例</li>
                        <li id="style">样式</li>
                        <li id="console">打印配置</li>
                        <li id="export">导出配置</li>
                    </ul>
               `;
            const m = document.createElement('div');
            m.classList.add('contextmenu')
            m.innerHTML = menuHTML;

            setTimeout(() => {
                const leafList = this.querySelectorAll('.tree-node-content.leaf')
                leafList.forEach((leaf) => {
                    const guid: any = leaf.getAttribute('guid')
                    const layer = this.sceneTree.getLayerByGuid(guid)
                    const type = (layer.status === 'loading' || layer.status === 'error') ? '' : layer.toJSON().type
                    const moreIcon: any = leaf.querySelector('.bi-three-dots')
                    const contextmenu: any = m.cloneNode(true)
                    this.$data.menuItems.forEach((item: any) => {
                        contextmenu.querySelector(`#${item.id}`).style.display = this.showMenuCondition(item.id, type) ? 'block' : 'none'
                    })

                    contextmenu.querySelector('#delete').addEventListener('click', () => {
                        this.$data.layer = layer
                    })
                    if (this.showMenuCondition('positionEdit', type)) {
                        contextmenu.querySelector('#positionEdit').addEventListener('click', () => {
                            this.positionEdit(layer, this)
                        })
                    }
                    if (this.showMenuCondition('legend', type)) {
                        contextmenu.querySelector('#legend').addEventListener('click', () => {
                            showLegend(layer, this)
                        })
                    }
                    if (this.showMenuCondition('style', type)) {
                        contextmenu.querySelector('#style').addEventListener('click', () => {
                            showStyle(layer, this)
                        })
                    }

                    contextmenu.querySelector('#console').addEventListener('click', () => {
                        this.consoleJSON(layer)
                    })
                    contextmenu.querySelector('#export').addEventListener('click', () => {
                        this.exportJSON(layer)
                    })

                    // moreIcon.setAttribute('tabindex', '0')
                    // new Popover(moreIcon, {
                    //     placement: "bottom",
                    //     trigger: 'focus',
                    //     content: contextmenu,
                    //     html: true,
                    // });
                    this.pop = new Popover(moreIcon, {
                        content: contextmenu,
                    })

                })
            }, 100);
        });
        this.layers = this.sceneTree.imageryLayers;
        this.initLayerList();
    }

    initLayerList() {
        this.initTreeView();
    }

    initTreeView = () => {
        this.treeView = new Tree({
            el: document.getElementById("layerlist"),
            treeData: this.layers,
            style: {
                parentIcon: "bi bi-folder",
                childrenIcon: "bi bi-file-earmark-image",
            },
            defaultExpandAll: false,
            props: {
                label: "name",
                children: "children",
                labelRender: (data: any) => {
                    if (data.status && data.status === "error") {
                        return `<font color='gray'><i class="bi bi-exclamation-circle"></i>${data.name}</font>`;
                    } else if (data.status && data.status === "loading") {
                        return `<font color='gray'><i class="bi bi-hourglass-split"></i>${data.name}</font>`;
                    }
                    else {
                        return data.children ? data.name + `<font color='gray'>(${data.children.length})</font>` : data.name;
                    }
                    // if (data.children) {
                    //   return `<font style="color:var(--bs-emphasis-color)">${data.label}</font>`;
                    // } else {
                    //   return `<font color='red'>${data.label}</font>`;
                    // }
                },
                handleNodeClick: (node: any, e: Event) => {
                    // console.log("handleNodeClick", node, e);
                },
                handleDoubleClick: (node: any, e: any) => {
                    console.log("handleNodeDblClick", node, e);
                    const span = e.querySelector("span.label");
                    const czmNode = this.sceneTree.layersMap.get(node.data.guid);
                    // 重命名，双击节点，变为输入框
                    const input = document.createElement("input");
                    input.style.width = span.offsetWidth + 10 + "px";
                    input.value = node.data.name;
                    input.autofocus = true;
                    input.onblur = () => {
                        node.data.name = input.value;
                        const span = document.createElement("span");
                        span.className = "label";
                        span.innerText = input.value;
                        input.replaceWith(span);
                        czmNode.name = input.value;
                    };

                    input.onkeydown = (evt) => {
                        if (evt.key === "Enter") {
                            input.blur();
                        }
                    };


                    span.replaceWith(input);
                    input.focus();
                },
                handleRightClick: (node: any, e: Element) => {
                    console.log("handleRightClick", node, e, this.pop);
                },
                handleNodeExpand: (node: any) => {
                    node.data.expand = !node.data.expand
                    this.sceneTree.layersMap.get(node.data.guid).expand = node.data.expand;
                    this.sceneTree.updateSceneTree();
                },
                onDragStart: (node: any) => {

                },
                onDragEnd: (node: any, type: string) => {
                    // console.log("onDragEnd", node, this.sceneTree);
                    let parent, dragNode, targetNode;
                    if (node.parentGuid) {
                        parent = this.sceneTree.getLayerByGuid(node.parentGuid);
                    } else {
                        parent = this.sceneTree.root;
                    }
                    dragNode = this.sceneTree.getLayerByGuid(node.dragGuid);
                    targetNode = this.sceneTree.getLayerByGuid(node.targetGuid);
                    console.log("onDragEnd", parent, dragNode, targetNode);
                    if (type === "moveInto") {
                        this.sceneTree.moveIntoGroup(dragNode, targetNode);
                    } else if (type === "moveForward") {
                        this.sceneTree.moveForward(dragNode, targetNode);
                    }
                    this.sceneTree.updateSceneTree();
                },
                extraBtns: [
                    {
                        name: "显示",
                        icon: (node: any) => {
                            if (node.children) {
                                node = this.sceneTree.getLayerByGuid(node.guid);
                                const showStatus = node.showStatus;
                                if (showStatus === "all") {
                                    return "bi bi-check-square";
                                } else if (showStatus === "half") {
                                    return "bi bi-dash-square";
                                } else {
                                    return "bi bi-square";
                                }
                            } else {
                                return node.show ? "bi bi-check-square" : "bi bi-square"
                            }

                        },
                        onClick: (node: any, btn: any) => {
                            console.log("显示", node);
                            if (node.children) {
                                node = this.sceneTree.getLayerByGuid(node.guid);
                                node.show = !node.show;
                            } else {
                                node.show = !node.show;
                            }
                            btn.setIcon(node.show ? "bi bi-check-square" : "bi bi-square");
                            this.sceneTree.updateSceneTree();
                        },
                        // show: (node: any) => !node.children,
                    },
                    {
                        name: "定位",
                        icon: "bi bi-cursor",
                        onClick: (node: any) => {
                            node.zoomTo();
                        },
                        show: (node: any) => !node.children,
                    },
                    {
                        name: "删除",
                        icon: "bi bi-trash",
                        onClick: (data: any) => {
                            console.log("删除", data);
                            const node = this.sceneTree.getLayerByGuid(data.guid);
                            if (node instanceof Group) {
                                node.parent?.removeLayer(node);
                                this.sceneTree.updateSceneTree();
                                const selectedNode = this.treeView?.selectedNode
                                if (selectedNode) {
                                    const guid = selectedNode.getAttribute('guid');
                                    if (!guid) return;
                                    if (guid === data.guid) {
                                        setTimeout(() => {
                                            this.treeView.selectedNode = null;
                                        }, 100);
                                    }
                                }
                            } else {
                                this.$data.layer = node;
                                this.delete()
                            }
                        },
                        // show: (node: any) => node.children,
                    },
                    {
                        name: "更多选项",
                        icon: "bi bi-three-dots",
                        onClick: (node: any, el: Element) => {
                            console.log("更多选项", node, this.pop);
                            // this.pop.showPopover()
                            this.$data.layer = node;
                            this.layer = node;
                            this.showZIndex()
                        },
                        show: (node: any) => !node.children,
                    },

                ],
            },
        });
        this.treeView.initialize();
        // const more = this.treeView.element?.querySelectorAll('.bi-three-dots')

        // const contextmenu:any = document.querySelector('.contextmenu')
        // contextmenu?.addEventListener('Conten')
        // more?.forEach((el: any) => {
        //     // el.setAttribute('tabindex', '0')
        //     // new Popover(el, {
        //     //     placement: "bottom",
        //     //     trigger: 'focus',
        //     //     content: contextmenu,
        //     //     html: true,
        //     // });
        //     new Popover(el,{
        //         content: contextmenu,
        //     } )
        // })
    };

    filterNode = (val: string) => {
        console.log(val);
        this.$data.search = val;
        this.treeView.filterByText(val);
    }

    delete = () => {
        // let layer = this.sceneTree.getLayerByGuid(this.$data.layer.guid);
        // layer && layer.destroy && layer.destroy();
        // layer && layer.remove();
        this.sceneTree.removeLayerByGuid(this.$data.layer.guid);
    }
    showZIndex = () => {
        console.log('showZIndex', this.$data.layer);
        const zIndexInput = this.querySelector('#layerIndex') as HTMLInputElement;
        if (zIndexInput) {
            zIndexInput.value = this.$data.layer.zIndex;
        }
    }
    setZIndex = () => {
        this.$data.layer.zIndex = this.$data.zIndex;
    }

    positionEdit = (layer: any, _this: any) => {
        layer.positionEditing = true;
    }

    // 根据图层类型显示右键菜单项
    showMenuCondition = (itemType: string, layerType: string) => {
        if (itemType === 'ZIndex') {
            const show = ['ssmapserver', 'arcgismapserver', 'wms', 'wmts', 'xyz'].indexOf(layerType) > -1;
            return show;
        }
        if (itemType === 'legend') {
            return layerType === 'arcgismapserver';
        }
        if (itemType === 'style') {
            return true;
        }
        if (itemType === 'positionEdit') {
            return layerType === 'tileset' || layerType === 'iontileset';

        }
        return true
    }

    //新建分组
    addGroup = () => {
        let group = this.sceneTree.createGroup('新建分组');
        const selectedNode = this.treeView?.selectedNode
        if (selectedNode) {
            console.log('selectedNode,', selectedNode);
            const guid = selectedNode.getAttribute('guid');
            if (!guid) return;
            const node = this.sceneTree.getLayerByGuid(guid);
            if (node instanceof Group) {
                group.parent = node;
                node.children.push(group);
                this.sceneTree.updateSceneTree();
                return;
            } else {
                group.parent = this.sceneTree.root;
                this.sceneTree.root.children.push(group);
                this.sceneTree.updateSceneTree();
            }
        } else {
            group.parent = this.sceneTree.root;
            this.sceneTree.root.children.push(group);
            this.sceneTree.updateSceneTree();
        }
    }

    //删除分组
    deleteGroup = () => {
        this.sceneTree.deleteGroup();
    }

    importScene = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.onchange = (e: any) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                const json = JSON.parse(e.target?.result as string);
                this.mapView.renderFromJson(json);
            };
            reader.readAsText(file);
        };
        input.click();
    }

    outputScene = () => {
        const json = this.mapView.toJSON();
        const blob = new Blob([JSON.stringify(json)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "scene.json";
        a.click();
    }

    consoleJSON = (layer: any) => {
        console.log(layer.toJSON());
    }

    exportJSON = (layer: any) => {
        const json = layer.toJSON();
        const blob = new Blob([JSON.stringify(json)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = layer.name + ".json";
        a.click();
    }
}