import { Cartesian3, HorizontalOrigin, ScreenSpaceEventHandler, ScreenSpaceEventType, VerticalOrigin, Viewer } from "cesium";

// entity跟随鼠标气泡
export function followMouse(viewer: Viewer, entity: any, callback?: (position: Cartesian3) => void) {
    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((movement: any) => {
        const ray = viewer.camera.getPickRay(movement.endPosition);
        if (!ray) return;
        const position = viewer.scene.globe.pick(ray, viewer.scene);
        if (position) {
            entity.position = position;
            if (callback) {
                callback(position);
            }
        }
    }, ScreenSpaceEventType.MOUSE_MOVE);
    return handler;
}

export class Helper {
    viewer: Viewer;
    entity: any;
    handler: any;
    constructor(viewer: Viewer) {
        this.viewer = viewer;
    }
    show(text?: string) {
        this.entity = this.viewer.entities.add({
            label: {
                show: false,
                showBackground: true,
                font: '14px monospace',
                horizontalOrigin: HorizontalOrigin.LEFT,
                verticalOrigin: VerticalOrigin.BOTTOM,
                pixelOffset: new Cartesian3(15, 0, 0)
            }
        });
        text = text || 'Hello, World!';
        this.entity.label.text = text;
        this.entity.label.show = true;
        this.handler = followMouse(this.viewer, this.entity);
    }
    hide() {
        this.entity.label.show = false;
    }

    clear() {
        this.entity && this.viewer.entities.remove(this.entity);
        this.handler && this.handler.removeInputAction(ScreenSpaceEventType.MOUSE_MOVE);
        this.handler = null;
    }
}