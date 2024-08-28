
import { Component } from "../core/decorators";
import BaseWidget from "../earth/base-widget";
import { Tree } from "../../lib/tree/tree";
import "../../lib/tree/tree-view.scss";
import Template from "./layer-list.html?raw";
import "./layer-list.scss"
import { Popover } from "bootstrap";
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
        }
    }
    public async afterInit() {
        this.layers = [];
        this.sceneTree.updateEvent.addEventListener((val) => {
            this.treeview?.updateTree(val);
            const menuHTML =
                `<div class="contextmenu">
                    <ul>
                        <li data-bs-toggle="modal" data-bs-target="#confirmModal">删除</li>
                        <li data-bs-toggle="modal" data-bs-target="#exampleModal">设置层级</li>
                    </ul>
                </div>`;
            this.insertAdjacentHTML('beforeend', menuHTML);

            const more = this.treeview?.element?.querySelectorAll('.bi-three-dots')
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
        layer && layer.remove();
        layer && layer.destroy && layer.destroy();
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

    showMenuCondition = (type: string) => {
        if (type === 'ZIndex') {
            return this.$data.layer && this.$data.layer.toJSON && this.$data.layer.toJSON() && ['ssmapserver', 'arcgisserver', 'wms', 'wmts', 'xyz'].indexOf(this.$data.layer.toJSON().type) > -1;
        }
    }
}