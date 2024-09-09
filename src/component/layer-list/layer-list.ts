
import { Component } from "../core/decorators";
import BaseWidget from "../earth/base-widget";
import { Tree } from "../../lib/tree/tree";
import "../../lib/tree/tree-view.scss";
import Template from "./layer-list.html?raw";
import "./layer-list.scss"
import { Modal, Popover } from "bootstrap";
import { showLegend, showStyle } from "./utils";
@Component({
    tagName: "layer-list",
    className: "layer-list",
    template: Template,
})
export default class LayerList extends BaseWidget {
    treeview: Tree | null = null;
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
                }
            ]
        }
    }
    public async afterInit() {
        this.layers = [];
        this.sceneTree.updateEvent.addEventListener((val) => {
            this.treeview?.updateTree(val);
            if (this.querySelector('.contextmenu')) return;
            const menuHTML =
                `
                    <ul>
                        <li data-bs-toggle="modal" data-bs-target="#confirmModal" id="delete">删除</li>
                        <li data-bs-toggle="modal" data-bs-target="#exampleModal" id="ZIndex">设置层级</li>
                        <li id="legend">图例</li>
                        <li id="style">样式</li>
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
                    const type = layer.toJSON().type
                    const moreIcon: any = leaf.querySelector('.bi-three-dots')
                    const contextmenu: any = m.cloneNode(true)
                    this.$data.menuItems.forEach((item: any) => {
                        contextmenu.querySelector(`#${item.id}`).style.display = this.showMenuCondition(item.id, type) ? 'block' : 'none'
                    })
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

                    moreIcon.setAttribute('tabindex', '0')
                    new Popover(moreIcon, {
                        placement: "bottom",
                        trigger: 'focus',
                        content: contextmenu,
                        html: true,
                    });
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
        this.treeview = new Tree({
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
                        return data.name;
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
                handleRightClick: (node: any, e: Element) => {
                    console.log("handleRightClick", node, e, this.pop);
                },
                handleNodeExpand: (node: any) => {
                    node.data.expand = !node.data.expand
                    this.sceneTree.layersMap.get(node.data.guid).expand = node.data.expand;
                },
                extraBtns: [
                    {
                        name: "显示",
                        icon: (node: any) => node.show ? "bi bi-check-square" : "bi bi-square",
                        onClick: (node: any, btn: any) => {
                            node.show = !node.show;
                            btn.setIcon(node.show ? "bi bi-check-square" : "bi bi-square");
                        },
                        show: (node: any) => !node.children,
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
                        name: "更多选项",
                        icon: "bi bi-three-dots",
                        onClick: (node: any, el: Element) => {
                            this.$data.layer = node;
                            this.layer = node;
                            this.showZIndex()
                        },
                        show: (node: any) => !node.children,
                    }
                ],
            },
        });
        this.treeview.initialize();
        const more = this.treeview.element?.querySelectorAll('.bi-three-dots')

        const contextmenu: any = document.querySelector('.contextmenu')
        more?.forEach((el) => {
            el.setAttribute('tabindex', '0')
            new Popover(el, {
                placement: "bottom",
                trigger: 'focus',
                content: contextmenu,
                html: true,
            });
        })
    };

    delete = () => {
        let layer = this.sceneTree.getLayerByGuid(this.$data.layer.guid);
        layer && layer.destroy && layer.destroy();
        layer && layer.remove();
    }
    showZIndex = () => {
        const zIndexInput = this.querySelector('#layerIndex') as HTMLInputElement;
        if (zIndexInput) {
            zIndexInput.value = this.$data.layer.zIndex;
        }
    }
    setZIndex = () => {
        this.$data.layer.zIndex = this.$data.zIndex;
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
        return true
    }
}