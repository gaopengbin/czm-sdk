
import { Component } from "../core/decorators";
import BaseWidget from "../earth/base-widget";
import { Tree } from "../../lib/tree/tree";
import "../../lib/tree/tree-view.scss";
import "./layer-list.scss"
@Component({
    tagName: "layer-list",
    className: "layer-list",
    template: "<div id='layerlist'></div>",
})
export default class LayerList extends BaseWidget {
    treeview: Tree | null = null;
    constructor() {
        super();
    }

    public async afterInit() {
        this.layers = [];

        this.sceneTree.updateEvent.addEventListener((val) => {
            this.treeview?.updateTree(val);
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
                // parentIcon: "src/assets/images/文件夹@2x.png",
                parentIcon: "bi bi-folder",
                childrenIcon: "bi bi-file-earmark-image",
            },
            defaultExpandAll: false,
            props: {
                label: "name",
                children: "children",
                labelRender: (data: any) => {
                    return data.name;
                    // if (data.children) {
                    //   return `<font style="color:var(--bs-emphasis-color)">${data.label}</font>`;
                    // } else {
                    //   return `<font color='red'>${data.label}</font>`;
                    // }
                },
                handleNodeClick: (node: any, e: Event) => {
                    console.log("handleNodeClick", node, e);
                },
                extraBtns: [
                    {
                        name: "显示",
                        icon: (node: any) => node.show ? "bi bi-eye" : "bi bi-eye-slash",
                        onClick: (node: any, btn: any) => {
                            node.show = !node.show;
                            btn.setIcon(node.show ? "bi bi-eye" : "bi bi-eye-slash");
                            // sceneTree.showLayer(node.guid, node.show);
                        },
                        show: (node: any) => !node.children,
                    },
                    {
                        name: "定位",
                        icon: "bi bi-geo-alt",
                        onClick: (node: any) => {
                            node.zoomTo();
                        },
                        show: (node: any) => !node.children,
                    },
                ],
            },
        });
        this.treeview.initialize();
    };

}