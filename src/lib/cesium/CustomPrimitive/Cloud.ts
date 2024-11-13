import { Cartesian3, Cartesian4, Color, EllipsoidSurfaceAppearance, GeometryInstance, JulianDate, Material, Matrix4, Primitive, Quaternion, Rectangle, RectangleGeometry, Viewer } from "cesium";

export class Cloud {
    viewer: Viewer;
    cloud: any;
    aroundTime: number;
    _quat: Quaternion;
    _rot: number;
    _lastTime: number;
    // enabled: boolean = true;
    constructor(viewer: Viewer) {
        this.viewer = viewer;
        this.cloud = new Primitive({
            geometryInstances: new GeometryInstance({
                geometry: new RectangleGeometry({
                    rectangle: Rectangle.fromDegrees(-180, -90, 180, 90),
                    vertexFormat: EllipsoidSurfaceAppearance.VERTEX_FORMAT,
                    height: 10000,
                }),
                id: 'cloud',
            }),
            appearance: new EllipsoidSurfaceAppearance({
                aboveGround: false,
                material: new Material({
                    fabric: {
                        type: 'Image',
                        uniforms: {
                            image: '../../src/assets/images/earthclouds1k.jpg',
                            color: new Color(1.0, 1.0, 1.0, 0.8),
                        },
                        components: {
                            diffuse: 'vec3(1.0)',
                            alpha: 'texture(image, fract(repeat * materialInput.st)).r * color.a'
                        }
                    },
                }),
            }),
            show: this.enabled,
            modelMatrix: Matrix4.IDENTITY
        });
        this._quat = new Quaternion();
        this._rot = 0;
        this._lastTime = JulianDate.now().secondsOfDay;
        this.aroundTime = 120;
        this.viewer.scene.preRender.addEventListener(this.update.bind(this));
        this.viewer.scene.primitives.add(this.cloud);
    }

    set enabled(value: boolean) {
        this.cloud.show = value;
    }

    updateMaterial() {
        // 纹理旋转
        const spead = 1 / this.aroundTime;
        const currentTime = JulianDate.now().secondsOfDay;
        const duration = currentTime - this._lastTime;
        this._lastTime = currentTime;
        this._rot += (duration * spead);
        this._rot = this._rot - Math.floor(this._rot);
        const fm = Matrix4.fromTranslationQuaternionRotationScale;
        this._quat = Quaternion.fromAxisAngle(Cartesian4.UNIT_Z, -this._rot * Math.PI * 2, this._quat);
        this.cloud.modelMatrix = fm(Cartesian3.ZERO, this._quat, new Cartesian3(1, 1, 1), this.cloud.modelMatrix);
    }

    update() {
        if (this.cloud.show) {
            this.updateMaterial();
        }
    }

    destroy() {
        this.viewer.scene.preRender.removeEventListener(this.update);
        this.viewer.scene.primitives.remove(this.cloud);
    }
}