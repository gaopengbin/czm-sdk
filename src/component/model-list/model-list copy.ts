import { getCartesian3FromCartesian2, transformCartesianToWGS84 } from "@/lib/cesium/measure";
import { Component } from "../core/decorators";
import BaseWidget from "../earth/base-widget";
import Template from "./model-list.html?raw";
import "./model-list.scss";
import { Cartesian3, Ellipsoid, HeadingPitchRoll, Matrix3, Matrix4, ScreenSpaceEventType, Transforms, Math as CesiumMath, Quaternion, ModelAnimationLoop, HeightReference, Model } from "cesium";
import { Group } from "@/lib/cesium/sceneTree";
import { Tooltip } from "bootstrap";
import { TreeSelect } from "./tree-select";
import "./tree-select.scss"
import { DrawTool } from "./draw-tool";

@Component({
    tagName: "czm-model-list",
    className: "czm-model-list",
    template: Template,
})
export default class ModelList extends BaseWidget {
    constructor() {
        super();
    }

    async beforeInit() {
        this.$data = {
            models: [],
            modelTypes: [],
            selectType: '',
            modelList: [],
            currentModel: {
                name: '',
                url: '',
                scale: 1,
                rotation: 0,
                animation: false,
                clampToGround: false,
                link: '',
                linkType: 'url',
            },
            canMove: false,
            cmodel: null,
            disabled: true,
            continuousDraw: false,
            drawType: 0,
        }
    }

    async onInit() {
        if (this.config) {
            let models: any = {};
            if (this.config.modelList) {
                this.$data.models = this.config.modelList;
            } else if (this.config.modelListUrl) {
                models = await fetch(this.config.modelListUrl).then(res => res.json());
                this.$data.models = models;
            }
            for (const key in models) {
                if (Object.prototype.hasOwnProperty.call(models, key)) {
                    this.$data.modelTypes.push(key);
                }
            }
            this.typeChange(this.$data.modelTypes[0]);
        }
        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
        const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new Tooltip(tooltipTriggerEl))
        const ts = new TreeSelect(document.querySelector('.treeSelect') as HTMLElement,
            (item) => {
                console.log(item)
                this.selectNode = item;
            },
            () => {
                ts.treeData = (document.querySelector('base-earth') as any).toJSON().earth.layers
                ts.buildTree()
            });
        // ts.dropdown.appendChild(this.treeView.element)
        this.drawTool = new DrawTool(this.viewer, this.drawEnd.bind(this));
    }

    drawEnd(item: any) {
        console.log('drawEnd', item);
        const positions = this.drawTool.getSampledPointsForLineEntity(item, 10);
        console.log('采样点:', positions, this.cmodel, this);
        const modelJson = this.cmodel.toJSON();
        modelJson.allowPicking = true;
        modelJson.guid = '';
        console.log('modelJson', modelJson);
        let selectedNode: any;
        if (this.selectNode) {
            selectedNode = this.sceneTree.getLayerByGuid(this.selectNode.guid);

        } else {
            selectedNode = this.sceneTree.root
        }
        positions.forEach(async (position: any) => {
            // cartesian3 转经纬度
            let jwd = transformCartesianToWGS84(this.viewer, position);
            if (!jwd) return;
            modelJson.position = [jwd.lon, jwd.lat, jwd.alt];
            const m = await this.sceneTree.createModelLayer(modelJson);
            selectedNode.addLayer(m);
        })
    }

    typeChange(type: any) {
        this.$data.selectType = type;
        this.$data.modelList = this.$data.models[type].map((item: any) => {
            if (item.style.url && !item.style.url.startsWith('http')) {
                item.style.url = '//' + item.style.url;
            }
            if (item.image && !item.image.startsWith('http')) {
                item.image = '//' + item.image;
            }
            return {
                ...item,
            }
        });
    }

    async selectModel(model: any) {
        this.deleteModel()
        this.$data.currentModel = {
            name: model.name,
            scale: model.style.scale || 1,
            rotation: 0,
            clampToGround: false,
            url: model.style.url,
            link: model.style.link ?? '',
            linkType: model.style.link ?? 'url',
        }
        if (model.animation) {
            this.$data.currentModel.animation = model.animation.play;
        }

        const m = await this.sceneTree.createModelLayer({
            type: "model",
            name: this.$data.currentModel.name,
            url: model.style.url,
            position: [0, 0, 0],
            show: true,
            allowPicking: false,
            scale: this.$data.currentModel.scale,
            link: this.$data.currentModel.link,
            linkType: this.$data.currentModel.linkType,
        } as any);
        m._model.originModelMatrix = m._model.modelMatrix.clone();
        m._model.playAnimations = true;
        m._model.readyEvent.addEventListener(() => {
            m._model.activeAnimations.addAll({
                loop: ModelAnimationLoop.REPEAT,
                multiplier: 1
            });
        })
        this.cmodel = m;
        console.log('drawType', this.$data.drawType);
        if (this.$data.drawType === 2) {
            const line = this.drawTool.drawLine(1)
            console.log('line', line);
        } else {
            this.$data.canMove = true;
        }

        this.changeDisabled();
    }

    setPositon(position: any) {
        if (!this.$data.canMove) return;
        this.cmodel.position = [position.lon, position.lat, position.alt];
        let cartesian3 = Cartesian3.fromDegrees(position.lon, position.lat, position.alt);

        // const headingPositionRoll = new HeadingPitchRoll();
        const headingPositionRoll = this.getHprFromModelMatrix(this.cmodel._model.modelMatrix).hpr;
        const fixedFrameTransform = Transforms.localFrameToFixedFrameGenerator(
            "east",
            "north"
        );
        const modelMatrix = Transforms.headingPitchRollToFixedFrame(
            cartesian3,
            headingPositionRoll,
            Ellipsoid.WGS84,
            fixedFrameTransform
        )
        // Matrix4
        this.cmodel._model.modelMatrix = modelMatrix;
        this.cmodel._model.originModelMatrix = modelMatrix.clone();
    }

    linkTypeChange(e: any) {
        console.log(e);
        this.$data.currentModel.linkType = e;
    }

    scaleChange(e: any) {
        this.$data.currentModel.scale = e;
        const model = this.cmodel._model;
        model.scale = e;
    }
    rotationChange(e: any) {
        this.$data.currentModel.rotation = e;
        const model = this.cmodel._model;
        let originModelMatrix = model.originModelMatrix;
        const angel = Matrix3.fromRotationZ(CesiumMath.toRadians(e))
        const rotation = Matrix4.fromRotationTranslation(angel)
        Matrix4.multiply(originModelMatrix, rotation, model.modelMatrix)
        const hpr = this.getHprFromModelMatrix(model.modelMatrix);
        this.cmodel.hpr = [hpr.heading, hpr.pitch, hpr.roll];
    }

    getHprFromModelMatrix(modelMatrix: Matrix4) {
        var m1 = Transforms.eastNorthUpToFixedFrame(
            Matrix4.getTranslation(modelMatrix, new Cartesian3()),
            Ellipsoid.WGS84,
            new Matrix4(),
        );
        var m3 = Matrix4.multiply(
            Matrix4.inverse(m1, new Matrix4()),
            modelMatrix,
            new Matrix4(),
        );
        var mat3 = Matrix4.getMatrix3(m3, new Matrix3());
        var q = Quaternion.fromRotationMatrix(mat3);
        var hpr = HeadingPitchRoll.fromQuaternion(q);
        var heading = CesiumMath.toDegrees(hpr.heading);
        var pitch = CesiumMath.toDegrees(hpr.pitch);
        var roll = CesiumMath.toDegrees(hpr.roll);
        return {
            hpr,
            heading: heading,
            pitch: pitch,
            roll: roll
        };
    }

    animationChange(e: any) {
        this.$data.currentModel.animation = e.target.checked;
        // const model = this.cmodel._model;
        this.cmodel.playAnimations = e.target.checked;
        // if (model.playAnimations) {
        //     model.activeAnimations.addAll({
        //         loop: ModelAnimationLoop.REPEAT,
        //         multiplier: 1
        //     });
        // } else {
        //     model.activeAnimations.removeAll();
        // }

    }

    // continuousDrawChange(e: any) {
    //     this.$data.continuousDraw = e.target.checked;
    // }

    changeDrawType(type: number) {
        this.$data.drawType = type;
    }

    clampToGroundChange(e: any) {
        this.$data.currentModel.clampToGround = e.target.checked;
        const model = this.cmodel._model;
        this.cmodel.clampToGround = e.target.checked;
        if (model.clampToGround) {
            model.heightReference = HeightReference.CLAMP_TO_GROUND;
        } else {
            model.heightReference = HeightReference.NONE;
        }
    }
    changePosition() {
        this.$data.canMove = true;
    }
    async saveModel() {
        if (!this.cmodel && !this._model) return;
        console.log('saveModel', this.cmodel, this._model, this.editGuid);
        if (this._model && !this.editGuid) {
            this._model.remove();
        }
        let position = this.cmodel.position ?? [0, 0, 0];
        let hpr = this.cmodel.hpr ?? [0, 0, 0];
        let name = this.$data.currentModel.name;
        let url = this.$data.currentModel.url;
        const m = await this.sceneTree.createModelLayer({
            guid: this.editGuid,
            type: "model",
            name: name,
            url: url,
            position: position,
            hpr: hpr,
            show: true,
            allowPicking: true,
            scale: this.$data.currentModel.scale,
            playAnimations: this.$data.currentModel.animation,
            link: this.$data.currentModel.link,
            linkType: this.$data.currentModel.linkType,
        } as any);
        console.log('saveModel', m);
        if (this.editGuid) {
            this.sceneTree.updateLayerByGuid(this.editGuid, m);
        } else {
            // const selectedNode = this.treeView?.selectedNode || this.treeView2?.selectedNode;
            let selectedNode: any;
            if (this.selectNode) {
                selectedNode = this.sceneTree.getLayerByGuid(this.selectNode.guid);
                selectedNode.addLayer(m);
            } else {
                this.sceneTree.root.addLayer(m);
            }
        }
        if (this.editGuid || (this.cmodel && this.$data.drawType !== 1)) {
            console.log('enne');
            this.deleteModel();
        }
    }
    deleteModel() {
        console.log('deleteModel', this.cmodel, this._model);
        // this.forceRefresh();
        if (this.cmodel) {
            this.cmodel._model.destroy();
            this.cmodel._label.entityCollection.remove(this.cmodel._label);
            this.cmodel = null;
            this.changeDisabled();
        }
        if (this._model) {
            this._model.show = true;
            this._model = null;
        }
        this.$data.currentModel = {
            name: '',
            scale: 1,
            rotation: 0,
            animation: false,
            clampToGround: false,
            link: '',
        }
    }

    cancel() {
        this.forceRefresh();
        this.editGuid = '';
        if (this.cmodel && this._model) {
            this._model.show = true;
            this.deleteModel();
        }
    }

    pickPosition(callback: any) {
        // 鼠标样式设置为十字
        // this.viewer.container.style.cursor = "crosshair";
        this.viewer.cesiumWidget.screenSpaceEventHandler.setInputAction(async (click: any) => {
            let position = getCartesian3FromCartesian2(this.viewer, click.position);
            if (!position) {
                return;
            }
            let jwd = transformCartesianToWGS84(this.viewer, position);
            if (!jwd) return;

            callback(jwd);

            let pick = this.viewer.scene.pick(click.position);
            console.log('pick', pick);
            // 点击模型进入编辑状态
            if (pick && pick.id && pick.primitive instanceof Model) {
                this.$data.canMove = false;
                this.cancel();
                this.editGuid = pick.id;
                const _model = this.sceneTree.getLayerByGuid(pick.id)
                this._model = _model;
                let json = _model.toJSON();
                _model.show = false;
                json.allowPicking = false;
                this.cmodel = await this.sceneTree.createModelLayer(json);
                this.cmodel._model.silhouetteSize = 3;
                // this.$data.canMove = true;
                this.$data.currentModel = {
                    name: this.cmodel.name,
                    url: this.cmodel.url,
                    scale: this.cmodel.scale,
                    rotation: 0,
                    animation: this.cmodel.playAnimations,
                    clampToGround: this.cmodel.clampToGround,
                    link: this.cmodel.link ?? '',
                    linkType: this.cmodel.linkType ?? 'url',
                }
                this.changeDisabled();
            } else {
                if (this.$data.drawType === 2) {

                } else {
                    if (!this.editGuid) {
                        this.saveModel();
                        if (this.$data.drawType === 1) {
                            this.$data.canMove = true;
                        } else {
                            this.$data.canMove = false;
                        }

                    } else {
                        if (!this.$data.canMove) {
                            this.cancel();
                        } else {
                            // callback(jwd)
                            this.$data.canMove = false;
                        }
                    }
                }


            }

        }, ScreenSpaceEventType.LEFT_CLICK);

        this.viewer.cesiumWidget.screenSpaceEventHandler.setInputAction(async (click: any) => {
            if (this.$data.drawType === 1 && !this.editGuid) {
                console.log('continuousDraw', this.cmodel);
                this.$data.canMove = false;
                this.deleteModel();
            }
        }, ScreenSpaceEventType.RIGHT_CLICK);

        this.viewer.cesiumWidget.screenSpaceEventHandler.setInputAction((movement: any) => {
            if (!this.$data.canMove) return;
            let position = getCartesian3FromCartesian2(this.viewer, movement.endPosition);
            if (!position) {
                return;
            }
            let jwd = transformCartesianToWGS84(this.viewer, position);
            if (!jwd) return;
            callback(jwd);
        }, ScreenSpaceEventType.MOUSE_MOVE);
    }

    changeDisabled() {
        let optionBtns = document.querySelectorAll('.modelOptions');
        optionBtns.forEach((item: any) => {
            item.disabled = this.cmodel ? false : true;
        })
    }

    uploadFile() {
        const input: any = document.querySelector('#uploadFile');
        input?.click();
    }

    handleUploadFile(e: any) {
        console.log(e);
        let file = e.target.files[0];
        // 读取json文件
        let reader = new FileReader();
        reader.readAsText(file);
        reader.onload = async (evt) => {
            let data = JSON.parse(evt.target?.result as string);
            console.log(evt, data);
            if (Array.isArray(data)) {
                data.forEach(async (item: any) => {
                    const m = await this.sceneTree.createModelLayer(item);
                    const selectedNode = this.treeView?.selectedNode
                    if (selectedNode) {
                        const guid = selectedNode.getAttribute('guid');
                        if (!guid) return;
                        const node = this.sceneTree.getLayerByGuid(guid);
                        if (node instanceof Group) {
                            node.addLayer(m);
                        } else {
                            this.sceneTree.root.addLayer(m);
                        }
                    } else {
                        this.sceneTree.root.addLayer(m);
                    }
                })
            }

        }

    }

    public onOpen(): void {
        this.pickPosition(this.setPositon.bind(this));
        this.changeDisabled();
    }

    public onClose(): void {
        this.cancel();
        this.deleteModel();
        this.viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(ScreenSpaceEventType.LEFT_CLICK);
        this.viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(ScreenSpaceEventType.MOUSE_MOVE);
    }

}