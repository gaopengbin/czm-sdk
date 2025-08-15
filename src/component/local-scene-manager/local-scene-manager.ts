
import { Component } from "../core/decorators";
import BaseWidget from "../earth/base-widget";
import { Tree } from "../../lib/tree/tree";
import "../../lib/tree/tree-view.scss";
import Template from "./local-scene-manager.html?raw";
import "./local-scene-manager.scss"
// import { Modal, Popover } from "bootstrap";
import { showLegend, showStyle } from "./utils";
import { Group } from "@/lib/cesium/sceneTree";
import Popover from "./popover";
import "./popover.scss";
import { SceneManager } from "./sceneManager";
@Component({
    tagName: "local-scene-manager",
    className: "local-scene-manager",
    template: Template,
})
export default class LocalSceneManager extends BaseWidget {
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
        this.sceneManager = new SceneManager();
    }
    public async afterInit() {
        this.layers = [];
        this.sceneTree.updateEvent.addEventListener((val) => {
            // console.log("updateEvent", this.sceneTree._groupCollection);
            const res = this.sceneTree._groupCollection.filter((group: any) => {
                return group.isScene;
            });
            const value = res.map((group: any) => {
                return group.toJSON();
            });
            console.log("updateEvent", value);
            this.treeView2?.updateTree(value);
            if (this.querySelector('.contextmenu')) return;
            const menuHTML =
                `
                    <ul>
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

            // setTimeout(() => {
            //     const leafList = this.querySelectorAll('.tree-node-content.leaf')
            //     leafList.forEach((leaf) => {
            //         const guid: any = leaf.getAttribute('guid')
            //         const layer = this.sceneTree.getLayerByGuid(guid)
            //         const type = (layer.status === 'loading' || layer.status === 'error') ? '' : layer.toJSON().type
            //         const moreIcon: any = leaf.querySelector('.bi-three-dots')
            //         const contextmenu: any = m.cloneNode(true)
            //         this.$data.menuItems.forEach((item: any) => {
            //             contextmenu.querySelector(`#${item.id}`).style.display = this.showMenuCondition(item.id, type) ? 'block' : 'none'
            //         })
            //         contextmenu.querySelector('#delete').addEventListener('click', () => {
            //             this.$data.layer = layer
            //         })
            //         if (this.showMenuCondition('legend', type)) {
            //             contextmenu.querySelector('#legend').addEventListener('click', () => {
            //                 showLegend(layer, this)
            //             })
            //         }
            //         if (this.showMenuCondition('style', type)) {
            //             contextmenu.querySelector('#style').addEventListener('click', () => {
            //                 showStyle(layer, this)
            //             })
            //         }

            //         contextmenu.querySelector('#console').addEventListener('click', () => {
            //             this.consoleJSON(layer)
            //         })
            //         contextmenu.querySelector('#export').addEventListener('click', () => {
            //             this.exportJSON(layer)
            //         })

            //         // moreIcon.setAttribute('tabindex', '0')
            //         // new Popover(moreIcon, {
            //         //     placement: "bottom",
            //         //     trigger: 'focus',
            //         //     content: contextmenu,
            //         //     html: true,
            //         // });
            //         new Popover(moreIcon, {
            //             content: contextmenu,
            //         })

            //     })
            // }, 100);
        });
        this.layers = this.sceneTree.imageryLayers.filter((layer: any) => {
            return layer.children && layer.isScene;
        });
        this.initLayerList();
    }

    initLayerList() {
        this.initTreeView();
    }

    initTreeView = () => {
        this.treeView2 = new Tree({
            el: document.getElementById("localscenelist"),
            treeData: this.layers,
            style: {
                parentIcon: "bi bi-buildings",
                childrenIcon: "bi bi-box",
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
                                console.log(node);
                                const showStatus = node.showStatus;
                                if (showStatus === "all") {
                                    return "bi bi-check-square";
                                } else if (showStatus === "half") {
                                    return "bi bi-dash-square";
                                } else {
                                    return "bi bi-square";
                                }
                            } else {
                                node = this.sceneTree.getLayerByGuid(node.guid);
                                return node.show ? "bi bi-check-square" : "bi bi-square"
                            }

                        },
                        onClick: (node: any, btn: any) => {
                            // if (node.children) {
                            node = this.sceneTree.getLayerByGuid(node.guid);
                            node.show = !node.show;
                            // } else {
                            //     node.show = !node.show;
                            // }
                            btn.setIcon(node.show ? "bi bi-check-square" : "bi bi-square");
                            this.sceneTree.updateSceneTree();
                        },
                        // show: (node: any) => !node.children,
                    },
                    {
                        name: "导出局部场景",
                        icon: "bi bi-cloud-arrow-up",
                        onClick: (node: any) => {
                            this.exportGeoJSON(node);
                        },
                        show: (node: any) => node.children,
                    },
                    {
                        name: "定位",
                        icon: "bi bi-cursor",
                        onClick: (node: any) => {
                            const layer = this.sceneTree.getLayerByGuid(node.guid);
                            layer.zoomTo();
                        },
                        show: (node: any) => !node.children,
                    },
                    {
                        name: "删除",
                        icon: "bi bi-trash",
                        onClick: (data: any) => {
                            const node = this.sceneTree.getLayerByGuid(data.guid);
                            this.$data.layer = node;
                            this.delete()
                        },
                        // show: (node: any) => node.children,
                    },
                    // {
                    //     name: "更多选项",
                    //     icon: "bi bi-three-dots",
                    //     onClick: (node: any, el: Element) => {
                    //         this.$data.layer = node;
                    //         this.layer = node;
                    //         this.showZIndex()
                    //     },
                    //     show: (node: any) => !node.children,
                    // },

                ],
            },
        });
        this.treeView2.initialize();
        // const more = this.treeView2.element?.querySelectorAll('.bi-three-dots')

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
        this.treeView2.filterByText(val);
    }

    delete = () => {
        // let layer = this.sceneTree.getLayerByGuid(this.$data.layer.guid);
        // layer && layer.destroy && layer.destroy();
        // layer && layer.remove();
        // this.treeView2.selectedNode = null;
        this.sceneTree.removeLayerByGuid(this.$data.layer.guid);
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

    //新建分组
    addGroup = () => {
        let group = this.sceneTree.createGroup('新建场景分组');
        group.isScene = true;
        const selectedNode = this.treeView2?.selectedNode
        if (selectedNode) {
            const guid = selectedNode.getAttribute('guid');
            if (!guid) return;
            const node = this.sceneTree.getLayerByGuid(guid);
            if (node instanceof Group) {
                group.parent = node;
                group.isScene = false;
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
        input.accept = ".json,.geojson";
        input.onchange = (e: any) => {
            const file = e.target.files[0];
            const name = file.name.replace(/\.[^/.]+$/, "");
            const reader = new FileReader();
            reader.onload = (e) => {
                const json = JSON.parse(e.target?.result as string);
                // this.mapView.renderFromJson(json);
                const option = {
                    name: name,
                    json: json,
                    viewer: this.viewer,
                    sceneTree: this.sceneTree,
                }
                this.loading = true;
                this.sceneManager.addScene(option).then((dataSource: any) => {
                    // this.viewer.dataSources.add(dataSource);
                    // this.viewer.zoomTo(dataSource);
                    this.loading = false;
                });
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

    exportGeoJSON = (group: any) => {
        // const json = group.toJSON();
        let geojson: any = {
            type: "FeatureCollection",
            features: [],
        };
        group.children.forEach((layer: any) => {
            if (layer.children) {
                layer.children.forEach((child: any) => {
                    child.parent = {
                        name: layer.name,
                        guid: layer.guid,
                    }
                    if (child.type === 'model') {
                        const feature = {
                            type: "Feature",
                            geometry: {
                                type: "Point",
                                coordinates: child.position,
                            },
                            properties: child,
                        };
                        geojson.features = geojson.features.concat(feature);
                    } else {
                        console.log('child', child)
                        const l = this.sceneTree.getLayerByGuid(child.guid);
                        if (l) {
                            geojson.features = geojson.features.concat(l.toGeoJson());
                        }
                    }

                });
            } else {

                if (layer.type === 'model') {
                    const feature = {
                        type: "Feature",
                        geometry: {
                            type: "Point",
                            coordinates: layer.position,
                        },
                        properties: layer,
                    };
                    geojson.features = geojson.features.concat(feature);
                } else {
                    console.log('child', layer)
                    const l = this.sceneTree.getLayerByGuid(layer.guid);
                    if (l) {
                        geojson.features = geojson.features.concat(l.toGeoJson());
                    }
                }


            }


        });
        const blob = new Blob([JSON.stringify(geojson)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = group.name + ".geojson";
        a.click();
    }
}