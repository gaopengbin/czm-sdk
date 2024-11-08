import { Cartesian3, ConstantProperty } from "cesium";
import Base from "../base";
import { State, VisibleAnimationOpts } from "../interface";
import EventListener from "../EventListener";

export default class Billbord extends Base {

    _scale: number = 1;

    constructor(cesium: any, viewer: any, option?: any) {
        super(cesium, viewer);
        this.cesium = cesium;
        this.viewer = viewer;
        this.option = {
            image: option?.image,
            scale: 1,
            width: 100,
            height: 100,
            sizeInMeters: true,
            verticalOrigin: 0,
            heightReference: 0,
            disableDepthTestDistance: 0,
            distanceDisplayCondition: undefined,
        };
        this.name = option?.name;
        this.setState('drawing');
        this.onMouseMove()
        this.on('editStart', () => {
            EventListener.dispatchEvent('editStart', this)
        })
        this.on('editEnd', () => {
            EventListener.dispatchEvent('editEnd', this)
        })
        this.on('drawEnd', () => {
            EventListener.dispatchEvent('drawEnd', this)
        })

    }

    getType(): 'polygon' | 'line' | 'billboard' {
        return 'billboard';
    }

    addPoint(cartesian: Cartesian3) {
        this.position = cartesian;
        console.log(this.position);
        // this.onMouseMove();
        // this.drawBillboard();
        this.finishDrawing();
    }

    updateMovingPoint(cartesian: Cartesian3) {
        this.position = cartesian;
        this.drawBillboard();
    }

    updateDraggingPoint(cartesian: Cartesian3) {
        console.log(cartesian);
        this.position = cartesian;
        this.drawBillboard();
    }

    drawBillboard() {
        if (this.billboardEntity) {
            this.viewer.entities.remove(this.billboardEntity);
        }
        this.billboardEntity = this.viewer.entities.add({
            position: new this.cesium.CallbackProperty(() => {
                return this.position;
            }, false) as any,
            billboard: {
                image: this.option?.image,
                scale: this.option?.scale,
                width: this.option?.width,
                height: this.option?.height,
                verticalOrigin: this.option?.verticalOrigin,
                heightReference: this.option?.heightReference,
                disableDepthTestDistance: this.option?.disableDepthTestDistance,
                distanceDisplayCondition: this.option?.distanceDisplayCondition,
            },
            point: {
                show: false,
                pixelSize: 10,
                color: this.cesium.Color.RED
            }
        });
    }

    stateChange(state: State) {
        if (!this.billboardEntity) return;
        if (state === 'edit') {
            this.billboardEntity!.point!.show = new ConstantProperty(true);
        } else {
            this.billboardEntity!.point!.show = new ConstantProperty(false);
        }
    }

    set _show(value: boolean) {
        if (!this.billboardEntity) return;
        this.billboardEntity!.show = value;
    }

    get _show() {
        if (!this.billboardEntity) return false;
        return this.billboardEntity!.show;
    }

    // set show(value: boolean) {
    //     this._show = value;
    //     if (this.billboardEntity) {
    //         this.billboardEntity!.show = new ConstantProperty(value);
    //     }
    // }

    // get show() {
    //     return this._show;
    // }

    set scale(value: number) {
        this._scale = value;
        if (this.billboardEntity) {
            this.billboardEntity!.billboard!.scale = new ConstantProperty(value);
        }
    }
    get scale() {
        return this._scale;
    }

    set width(value: number) {
        this._width = value;
        if (this.billboardEntity) {
            this.billboardEntity!.billboard!.width = new ConstantProperty(value);
        }
    }
    get width() {
        return this._width;
    }

    set height(value: number) {
        this._height = value;
        if (this.billboardEntity) {
            this.billboardEntity!.billboard!.height = new ConstantProperty(value);
        }
    }

    get height() {
        return this._height;
    }

    set sizeInMeters(value: boolean) {
        this._sizeInMeters = value;
        if (this.billboardEntity) {
            this.billboardEntity!.billboard!.sizeInMeters = new ConstantProperty(value);
        }
    }

    get sizeInMeters() {
        return this._sizeInMeters;
    }

    set rotation(value: number) {
        this._rotation = value;
        if (this.billboardEntity) {
            this.billboardEntity!.billboard!.rotation = new ConstantProperty(value);
        }
    }

    get rotation() {
        return this._rotation;
    }

    set color(value: any) {
        this._color = value;
        if (this.billboardEntity) {
            this.billboardEntity!.billboard!.color = new ConstantProperty(value);
        }
    }

    get color() {
        return this._color;
    }

    toJSON() {
        return {
            type: 'billboard',
            name: this.name,
            position: this.position,
            option: this.option,
            scale: this.scale,
            width: this.width,
            height: this.height,
            sizeInMeters: this.sizeInMeters,
            rotation: this.rotation,
            color: this.color,
        }
    }

    zoomTo() {
        if (!this.billboardEntity) return;
        this.viewer.zoomTo(this.billboardEntity);
    }

} 