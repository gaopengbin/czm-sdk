import { Cartesian3, Cartographic, Cesium3DTileset, Cesium3DTileStyle, defaultValue, defined, ScreenSpaceEventHandler, ScreenSpaceEventType, Transforms, Viewer, Math as CesiumMath, Matrix4, Quaternion, Matrix3, HeadingPitchRoll, clone } from "cesium";
import SSBaseObj from "./SSBaseObj";
import { SSLayerOptions } from "../sceneTree/types";
import { uuid } from "@/lib/common";
import { PositionEdit } from "../Edit/PositionEdit";
import { RotationEdit } from "../Edit/RotationEdit";

export default class SSTileset extends SSBaseObj {
    [x: string]: any;
    constructor(viewer: Viewer, options: any) {
        const { id, ...rest } = options;
        super(viewer, id);
        this.type = "SSTileset";
        this._type = "SSTileset";
        this._name = rest.name || "SSTileset";
        this._defaultValue = {
            url: "",
            boundingVolume: {
                box: {
                    center: [0, 0, 0],
                    halfAxes: [1, 0, 0, 0, 1, 0, 0, 0, 1],
                },
            },
            maximumScreenSpaceError: 16,
            maximumNumberOfLoadedTiles: 10000,
            skipLevelOfDetail: false,
            baseScreenSpaceError: 1024,
            skipScreenSpaceErrorFactor: 16,
            skipLevels: 1,
        };
        this.handler = new ScreenSpaceEventHandler(this.viewer.scene.canvas);
        // await this.createTileset(options)
    }

    async createTileset(options: SSLayerOptions) {
        if (!(options as Cesium3DTileset.ConstructorOptions).maximumCacheOverflowBytes) {
            (options as Cesium3DTileset.ConstructorOptions).maximumCacheOverflowBytes = 5368709120;
        }
        let tileset: any;
        if (options.url) {
            tileset = await Cesium3DTileset.fromUrl(
                options.url,
                options as Cesium3DTileset.ConstructorOptions
            );
        } else if (options.ionAssetId) {
            tileset = await Cesium3DTileset.fromIonAssetId(
                options.ionAssetId,
                options as Cesium3DTileset.ConstructorOptions
            );
            // Apply the default style if it exists
            const extras = tileset.asset.extras;
            if (
                defined(extras) &&
                defined(extras.ion) &&
                defined(extras.ion.defaultStyle)
            ) {
                tileset.style = new Cesium3DTileStyle(extras.ion.defaultStyle);
            }
        }
        if (!tileset) {
            throw new Error("Failed to create tileset");
        }

        this.viewer.scene.primitives.add(tileset);
        this._tileset = tileset;
        if (options.position) {
            // 处理位置经纬度[经度, 纬度, 高度]
            // const position = Cartesian3.fromDegrees(options.position[0], options.position[1], options.position[2]);
            // tileset.modelMatrix = Transforms.eastNorthUpToFixedFrame(position);
            this.position = options.position;
        }
        this._originCenter = clone(tileset.boundingSphere.center);
        this._originModelMatrix = clone(tileset.modelMatrix);
        tileset.name = options.name;
        tileset.show = defaultValue(options.show, true);
        if (options.style) {
            tileset.style = new Cesium3DTileStyle(options.style);
        }
        if (options.zoomTo) {
            this.viewer.zoomTo(tileset);
        }

        return tileset;
    }

    get name() {
        return this._name;
    }

    set name(name: string) {
        this._name = name;
        this.tileset.name = name;
    }

    get tileset() {
        return this._tileset;
    }

    get customProps() {
        return this._customProps;
    }

    set customProps(value: any) {
        this._customProps = value;
    }

    get zIndex() {
        return this._zIndex;
    }

    set zIndex(value: number) {
        this._zIndex = value;
    }

    get show() {
        if (this._tileset) {
            this._show = this._tileset.show;
        }
        return this._show;
    }

    set show(value: boolean) {
        this._show = value;
        this.tileset.show = value;
    }

    get originCenter() {
        return this._originCenter;
    }

    get originModelMatrix() {
        if (this._tileset) {
            return this._originModelMatrix;
        }
        return Matrix4.IDENTITY;
    }

    get position() {
        if (this._tileset) {
            const position = this.getTilesetLonLatHeight(this._tileset);
            return position;
        }
        return [0, 0, 0];
    }

    set position(value: any[]) {
        console.log(value);
        if (this._tileset) {
            const position = Cartesian3.fromDegrees(value[0], value[1], value[2]);
            const translation = Cartesian3.subtract(position, this._tileset.boundingSphere.center, new Cartesian3());
            const transMatrix = Matrix4.fromTranslation(translation);
            const newMatrix = Matrix4.multiply(this._tileset.modelMatrix, transMatrix, new Matrix4());
            this._tileset.modelMatrix = newMatrix;
        }
    }

    get rotation() {
        // 获取当前绕east轴的旋转角度（单位：度）
        if (!this._tileset) return [0, 0, 0];
        return [this._rotationX, this._rotationY, this._rotationZ];
    }

    set rotation(value: [number, number, number]) {
        if (!this._tileset) return;
        const [rx, ry, rz] = value;
        this._rotationX = rx;
        this._rotationY = ry;
        this._rotationZ = rz;
        this.rotate(this._tileset, rx, ry, rz);
    }

    get rotationX(): number {
        // 获取当前绕east轴的旋转角度（单位：度）
        if (!this._tileset) return 0;
        return this._rotationX;
    }

    set rotationX(value: number) {
        if (!this._tileset) return;
        this._rotationX = value;
        this.rotate(this._tileset, value, 0, 0);
    }

    get rotationY(): number {
        if (!this._tileset) return 0;
        return this._rotationY;
    }

    set rotationY(value: number) {
        if (!this._tileset) return;
        this._rotationY = value;
        this.rotate(this._tileset, 0, value, 0);
    }

    get rotationZ(): number {
        if (!this._tileset) return 0;
        return this._rotationZ;
    }

    set rotationZ(value: number) {
        if (!this._tileset) return;
        this._rotationZ = value;
        this.rotate(this._tileset, 0, 0, value);
    }

    rotate(tileset: Cesium3DTileset, rx: number, ry: number, rz: number) {
        // if (rx === 0 && ry === 0 && rz === 0) return
        // 获取中心点。
        // const origin = tileset.boundingSphere.center
        const origin = this.originCenter;
        // 以该点建立ENU坐标系
        const toWorldMatrix = Transforms.eastNorthUpToFixedFrame(origin)
        // 获取ENU矩阵的逆矩阵。也就是可以将世界坐标重新转为ENU坐标系的矩阵
        const toLocalMatrix = Matrix4.inverse(toWorldMatrix, new Matrix4())
        // 计算旋转矩阵
        const rotateMatrix = Matrix4.clone(Matrix4.IDENTITY)
        // if (rx !== 0) {
        const rotateXMatrix = Matrix4.fromRotation(Matrix3.fromRotationX(CesiumMath.toRadians(rx)))
        Matrix4.multiply(rotateXMatrix, rotateMatrix, rotateMatrix)
        // }
        // if (ry !== 0) {
        const rotateYMatrix = Matrix4.fromRotation(Matrix3.fromRotationY(CesiumMath.toRadians(ry)))
        Matrix4.multiply(rotateYMatrix, rotateMatrix, rotateMatrix)
        // }
        // if (rz !== 0) {
        const rotateZMatrix = Matrix4.fromRotation(Matrix3.fromRotationZ(CesiumMath.toRadians(rz)))
        Matrix4.multiply(rotateZMatrix, rotateMatrix, rotateMatrix)
        // }
        // ENU坐标系下的结果矩阵
        const localResultMatrix = Matrix4.multiply(rotateMatrix, toLocalMatrix, new Matrix4())
        // 世界坐标系下的结果矩阵
        const worldResultMatrix = Matrix4.multiply(toWorldMatrix, localResultMatrix, new Matrix4())
        // 应用结果
        tileset.modelMatrix = Matrix4.multiply(worldResultMatrix, this.originModelMatrix, new Matrix4())
        // tileset.modelMatrix = Matrix4.multiply(worldResultMatrix, tileset.modelMatrix, new Matrix4())

    }

    getTilesetLonLatHeight(tileset: Cesium3DTileset) {
        // 提取平移分量
        // const matrix = tileset.root.computedTransform;
        // const position = new Cartesian3(matrix[12], matrix[13], matrix[14]);
        const position = tileset.boundingSphere.center;
        // 转为经纬度
        const cartographic = Cartographic.fromCartesian(position);
        console.log(cartographic);
        const longitude = CesiumMath.toDegrees(cartographic.longitude);
        const latitude = CesiumMath.toDegrees(cartographic.latitude);
        const height = cartographic.height;
        return [longitude, latitude, height];
    }



    zoomTo() {
        if (this._tileset) {
            this.viewer.zoomTo(this._tileset);
        }
    }

    setVisible(visible: boolean) {
        if (this._tileset) {
            this._tileset.show = visible;
        }
    }

    get positionEditing() {
        return this._positionEditing;
    }

    set positionEditing(positionEditing: boolean) {
        this._positionEditing = positionEditing;
        if (this._tileset) {
            if (positionEditing) {
                this.positionEdit()
            } else {
                this.stopPositionEdit();
            }
        }
    }

    positionEdit() {
        if (this._tileset) {
            this.positionEditTool = new PositionEdit(this.viewer, this._tileset);
            this.handler.setInputAction((movement: any) => {
                if (this.positionEditTool) {
                    this.stopPositionEdit();
                }
            }, ScreenSpaceEventType.RIGHT_CLICK);
            return this.positionEditTool;
        }
        return null;
    }
    stopPositionEdit() {
        if (this.positionEditTool) {
            this.positionEditTool.destroy();
            this.positionEditTool = null;
            this.handler.removeInputAction(ScreenSpaceEventType.RIGHT_CLICK);
            // this.handler.destroy();
            this.positionEditing = false;
        }
    }

    rotationEdit() {
        if (this._tileset) {
            this.rotationEditTool = new RotationEdit(this.viewer, this._tileset);
            this.handler.setInputAction((movement: any) => {
                if (this.rotationEditTool) {
                    this.stopRotationEdit();
                }
            }, ScreenSpaceEventType.RIGHT_CLICK);
            return this.rotationEditTool;
        }
        return null;
    }

    stopRotationEdit() {
        if (this.rotationEditTool) {
            this.rotationEditTool.destroy();
            this.rotationEditTool = null;
            this.handler.removeInputAction(ScreenSpaceEventType.RIGHT_CLICK);
            // this.handler.destroy();
            this.positionEditing = false;
        }
    }

    toJSON() {
        return {
            ...this.option,
            type: "tileset",
            name: this.name,
            show: this.show,
            guid: this.guid,
            url: this?._tileset?.resource?.url,
            ionAssetId: this.ionAssetId,
            zIndex: this.zIndex,
            zoomTo: false,
            style: this?._tileset?.style?.style,
            position: this.position,
        }
    }

}