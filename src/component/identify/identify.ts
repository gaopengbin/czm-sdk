
import { Cartesian2, Cartesian3, Cesium3DTileFeature, Color, ConstantPositionProperty, Entity, GeoJsonDataSource, JulianDate, Ray, ScreenSpaceEventType, Viewer, clone, defaultValue, defined, Math as CesiumMath, ScreenSpaceEventHandler, Cartographic, KeyboardEventModifier, CameraEventType } from "cesium";
import { Component } from "../core/decorators";
import BaseWidget from "../earth/base-widget";
import esri2geo from "@/lib/cesium/parser/esri2geo";
import template from "./identify.html?raw"
import ResizeHandle, { Mode } from "@/base/layout/ResizeHandle";
import "@/lib/cesium/fixed/ArcGisMapServerImageryProvider"
import "@/lib/cesium/fixed/imageryLayerCollection"
import "./identify.scss"
import { getCartesian3FromCartesian2 } from "@/lib/cesium/measure";
import proj4 from "proj4";
@Component({
    tagName: "czm-identify",
    className: "czm-identify",
    template: template,
})
export default class Identify extends BaseWidget {
    constructor() {
        super();
        this.cartesian3Scratch = new Cartesian3();
        this.highLightEntity = null
    }
    async onInit() {
        this.$data = {
            isEmpty: true,
            attrs: [],
            range: 'top',
            coordinate: '',
            position: null,
            unit: 'd',
            count: 0
        }
        this.highLightEntity = await this.viewer.dataSources.add(new GeoJsonDataSource());
        this.highLightAll = [];
        const container: any = this.querySelector('#tree-container');
        // 添加缩放
        new ResizeHandle(container, {
            mode: Mode.vertical
        });
    }

    // ctrl+右键框选
    setExtentSelect(enabled: boolean = true) {
        if (enabled) {
            // 禁止ctrl+左键改变视角
            this.viewer.scene.screenSpaceCameraController.tiltEventTypes = [CameraEventType.MIDDLE_DRAG];
            const viewer = this.viewer;
            //右键按下标识
            var flag = false;
            //起点终点x,y
            var startX: any = null;
            var startY: any = null;
            var endX = null;
            var endY = null;
            //创建框选元素
            var selDiv = document.createElement("div");
            var handler = new ScreenSpaceEventHandler(this.viewer.canvas);
            //右键按下事件，设置起点，div设置样式和位置，添加到页面
            handler.setInputAction(function (event: any) {
                flag = true;
                startX = event.position.x;
                startY = event.position.y;
                selDiv.style.cssText =
                    "position:absolute;width:0;height:0;font-size:0;margin:0;padding:0;border:1px dashed #0099FF;background-color:#C3D5ED;z-index:1000;filter:alpha(opacity:60);opacity:0.6;";
                selDiv.id = "selectDiv";
                selDiv.style.left = startX + "px";
                selDiv.style.top = startY + "px";
                // document.body.appendChild(selDiv);
                document.querySelector("base-earth")?.appendChild(selDiv);
            }, ScreenSpaceEventType.LEFT_DOWN, KeyboardEventModifier.CTRL);
            //鼠标抬起事件，获取div坐上和右下的x,y 转为经纬度坐标
            let _this = this;
            handler.setInputAction(function (event: any) {
                flag = false;
                var l = parseInt(selDiv.style.left);
                var t = parseInt(selDiv.style.top);
                var w = parseInt(selDiv.style.width);
                var h = parseInt(selDiv.style.height);

                // var earthPosition = viewer.camera.pickEllipsoid(
                //     { x: l, y: t },
                //     viewer.scene.globe.ellipsoid
                // );
                let earthPosition = getCartesian3FromCartesian2(viewer, { x: l, y: t } as Cartesian2) as Cartesian3;
                var cartographic = Cartographic.fromCartesian(
                    earthPosition,
                    viewer.scene.globe.ellipsoid,
                    new Cartographic()
                );
                const topLeft = [
                    CesiumMath.toDegrees(cartographic.longitude),
                    CesiumMath.toDegrees(cartographic.latitude),
                ]

                // earthPosition = viewer.camera.pickEllipsoid(
                //     { x: l + w, y: t + h },
                //     viewer.scene.globe.ellipsoid
                // );
                earthPosition = getCartesian3FromCartesian2(viewer, { x: l + w, y: t + h } as Cartesian2) as Cartesian3;
                cartographic = Cartographic.fromCartesian(
                    earthPosition,
                    viewer.scene.globe.ellipsoid,
                    new Cartographic()
                );
                const bottomRight = [
                    CesiumMath.toDegrees(cartographic.longitude),
                    CesiumMath.toDegrees(cartographic.latitude),
                ]

                const extent = [
                    ...topLeft,
                    ...bottomRight
                ]
                _this.pickImageryLayerFeature(viewer, event.position, extent);
                //根据业务确定是否删除框选div
                document?.getElementById("selectDiv")?.parentNode?.removeChild(document.getElementById("selectDiv") as any);
            }, ScreenSpaceEventType.LEFT_UP, KeyboardEventModifier.CTRL);
            //鼠标移动事件，处理位置css
            handler.setInputAction(function (event: any) {
                if (flag) {
                    endX = event.endPosition.x;
                    endY = event.endPosition.y;
                    selDiv.style.left = Math.min(endX, startX) + "px";
                    selDiv.style.top = Math.min(endY, startY) + "px";
                    selDiv.style.width = Math.abs(endX - startX) + "px";
                    selDiv.style.height = Math.abs(endY - startY) + "px";
                }
            }, ScreenSpaceEventType.MOUSE_MOVE, KeyboardEventModifier.CTRL);
            this.extentSelectHandler = handler;
        } else {
            this.extentSelectHandler?.destroy();
            this.extentSelectHandler = null;
            this.viewer.scene.screenSpaceCameraController.tiltEventTypes = [CameraEventType.MIDDLE_DRAG, CameraEventType.PINCH, { eventType: CameraEventType.LEFT_DRAG, modifier: KeyboardEventModifier.CTRL }, { eventType: CameraEventType.RIGHT_DRAG, modifier: KeyboardEventModifier.CTRL }];
        }
    }

    pickAndSelectObject(e: any) {
        let position = getCartesian3FromCartesian2(this.viewer, e.position);
        if (position) {
            this.$data.position = position;
            this.onUnitChange(this.$data.unit);
        }
        this.clearHighLight();
        this.results = []
        this.loading = true;
        this.viewer.selectedEntity = this.pickEntity(this.viewer, e);
    }

    onUnitChange(value: 'm' | 'd') {
        this.$data.unit = value;
        if (this.$data.position) {
            let position = this.viewer.scene.globe.ellipsoid.cartesianToCartographic(this.$data.position);
            position = [CesiumMath.toDegrees(position.longitude).toFixed(6), CesiumMath.toDegrees(position.latitude).toFixed(6), position.height.toFixed(2)];

            if (value === 'd') {
                this.$data.coordinate = position;
            } else {
                position = position.map((item: any) => parseFloat(item));
                position = proj4('EPSG:4326', 'EPSG:3857', position);
                position = [position[0].toFixed(2), position[1].toFixed(2), position[2].toFixed(2)];
                this.$data.coordinate = position;
            }
        }
    }

    pickEntity(viewer: Viewer, e: any) {
        let drillPick = viewer.scene.drillPick(e.position);
        if (defined(drillPick) && drillPick.length > 0) {
            let entities: any = [];
            let features: any = [];
            if (this.$data.range === 'top') {
                drillPick = drillPick.slice(0, 1);
            }
            drillPick.forEach((item: any) => {
                const id = defaultValue(item.id, item.primitive.id);
                if (id instanceof Entity) {
                    if (!entities[id.id]) {
                        entities[id.id] = { layerName: '', features: [] }
                    }
                    entities[id.id].layerName = id.name ?? id.id;
                    entities[id.id].features.push(id);
                }
                if (item instanceof Cesium3DTileFeature) {
                    if (!features[(item.tileset as any).url]) {
                        features[(item.tileset as any).url] = { layerName: '', features: [] }
                    }
                    features[(item.tileset as any).url].layerName = (item.tileset as any).name;
                    features[(item.tileset as any).url].features.push(item);
                }
            })
            entities = Object.values(entities);
            features = Object.values(features);
            this.$data.count = drillPick.length;
            this.results = entities.concat(features);
            this.loading = false;
            if (this.results.length === 0) {
                return;
            }
            this.highLight(this.results[0].features[0]);
            if (this.results[0].features[0] instanceof Entity) {
                return this.results[0].features[0];
            } else if (this.results[0].features[0] instanceof Cesium3DTileFeature) {
                return new Entity({
                    name: this.getCesium3DTileFeatureName(this.results[0].features[0]),
                    description: this.getCesium3DTileFeatureDescription(this.results[0].features[0]),
                    feature: this.results[0].features[0],
                } as any);
            }
        }
        // No regular entity picked.  Try picking features from imagery layers.
        if (defined(viewer.scene.globe)) {
            return this.pickImageryLayerFeature(viewer, e.position);
        }
    }
    pickImageryLayerFeature(viewer: Viewer, windowPosition: Cartesian2, polygon?: any) {
        const scene: any = viewer.scene;
        const pickRay: Ray | undefined = scene.camera.getPickRay(windowPosition);
        if (!pickRay) { return; }
        let imageryLayerFeaturePromise;
        if (this.$data.range === 'visible' || this.$data.range === 'top') {
            imageryLayerFeaturePromise = scene.imageryLayers.pickImageryLayerFeatures(
                pickRay,
                scene,
                polygon,
                this.$data.range
            );
        } else if (this.$data.range === 'all') {
            imageryLayerFeaturePromise = scene.imageryLayers.pickImageryLayerFeatures2(
                pickRay,
                scene,
                polygon,
                'all'
            );
        }
        // const pickImageryLayers = scene.imageryLayers.pickImageryLayers(pickRay, scene);
        // if(defined(pickImageryLayers)) {
        //     console.log(pickImageryLayers);
        // }
        if (!defined(imageryLayerFeaturePromise)) {
            this.loading = false;
            return;
        }

        // Imagery layer feature picking is asynchronous, so put up a message while loading.
        const loadingMessage = new Entity({
            id: "Loading...",
            description: "Loading feature information...",
        });
        imageryLayerFeaturePromise.then(
            (features: any) => {
                this.markAll(features);
                // Has this async pick been superseded by a later one?
                // if (viewer.selectedEntity !== loadingMessage) {
                //     this.loading = false;
                //     return;
                // }

                if (!defined(features) || features.length === 0) {
                    this.loading = false;
                    viewer.selectedEntity = this.createNoFeaturesEntity();
                    return;
                }
                // 按feature.imageryLayer.guid分组
                this.$data.count = features.length;
                let results: any = []
                features.forEach((feature: any) => {
                    if (!results[feature.imageryLayer.guid]) {
                        results[feature.imageryLayer.guid] = { layerName: '', features: [] }
                    }
                    results[feature.imageryLayer.guid].layerName = feature.imageryLayer.name;
                    results[feature.imageryLayer.guid].features.push(feature)
                })
                results = Object.values(results);
                if (this.$data.range === 'top') {
                    results = results.slice(0, 1);
                    this.$data.count = results[0].features.length;
                }
                this.results = results;
                // Select the first feature.
                const feature = features[0];
                this.highLight(feature);
                // if (feature.description) {
                //     feature.description = this.formatHtml(feature.description)
                // }
                const entity = new Entity({
                    id: feature.name,
                    description: feature.description,
                });

                if (defined(feature.position)) {
                    const ecfPosition = viewer.scene.globe.ellipsoid.cartographicToCartesian(
                        feature.position,
                        this.cartesian3Scratch
                    );
                    entity.position = new ConstantPositionProperty(ecfPosition);
                }
                this.loading = false;
                viewer.selectedEntity = entity;
                this.$data.isEmpty = false;
                // this.infoBox.innerHTML = this.formatHtml(viewer.selectedEntity.description?.getValue(new JulianDate()));
            },
            () => {
                // Has this async pick been superseded by a later one?
                if (viewer.selectedEntity !== loadingMessage) {
                    return;
                }
                this.loading = false;
                viewer.selectedEntity = this.createNoFeaturesEntity();

            }
        );

        return loadingMessage;
    }
    createNoFeaturesEntity() {
        return new Entity({
            id: "None",
            description: "No features found.",
        });
    }
    getCesium3DTileFeatureName(feature: Cesium3DTileFeature) {
        // We need to iterate all property IDs to find potential
        // candidates, but since we prefer some property IDs
        // over others, we store them in an indexed array
        // and then use the first defined element in the array
        // as the preferred choice.

        let i;
        const possibleIds = [];
        const propertyIds = feature.getPropertyIds();
        for (i = 0; i < propertyIds.length; i++) {
            const propertyId = propertyIds[i];
            if (/^name$/i.test(propertyId)) {
                possibleIds[0] = feature.getProperty(propertyId);
            } else if (/name/i.test(propertyId)) {
                possibleIds[1] = feature.getProperty(propertyId);
            } else if (/^title$/i.test(propertyId)) {
                possibleIds[2] = feature.getProperty(propertyId);
            } else if (/^(id|identifier)$/i.test(propertyId)) {
                possibleIds[3] = feature.getProperty(propertyId);
            } else if (/element/i.test(propertyId)) {
                possibleIds[4] = feature.getProperty(propertyId);
            } else if (/(id|identifier)$/i.test(propertyId)) {
                possibleIds[5] = feature.getProperty(propertyId);
            }
        }

        const length = possibleIds.length;
        for (i = 0; i < length; i++) {
            const item = possibleIds[i];
            if (defined(item) && item !== "") {
                return item;
            }
        }
        return "Unnamed Feature";
    }
    getCesium3DTileFeatureDescription(feature: Cesium3DTileFeature) {
        const propertyIds = feature.getPropertyIds();

        let html = "";
        propertyIds.forEach(function (propertyId: any) {
            const value = feature.getProperty(propertyId);
            if (defined(value)) {
                html += `<tr><th>${propertyId}</th><td>${value}</td></tr>`;
            }
        });

        if (html.length > 0) {
            html = `<table class="table table-sm table-bordered"><tbody>${html}</tbody></table>`;
        }

        return html;
    }

    getLabel(feature: any) {
        if (feature instanceof Entity) {
            return feature.name ?? feature.id ?? '未命名'
        } else if (feature instanceof Cesium3DTileFeature) {
            return feature.getProperty('name') ?? feature.getProperty('id') ?? '未命名'
        } else if (feature.data) {
            if (feature.data.properties) {
                return feature.data.properties.name ?? feature.name ?? feature.data.properties.id ?? '未命名'
            } else if (feature.data.attributes) {
                return feature.data.attributes[feature.data.displayFieldName] ?? feature.data.attributes.name ?? feature.data.attributes.id ?? feature.name ?? '未命名'
            } else {
                return feature.name ?? feature.id ?? '未命名'
            }
        } else {
            return feature.name ?? feature.id ?? '未命名'
        }
    }

    async highLight(feature: any) {
        this.clearHighLight(true);
        if (feature && feature instanceof Entity) {
            if (feature.polygon) {
                this.lastPolygonMaterial = clone(feature.polygon.material);
                (feature.polygon.material as any) = Color.BLUE.withAlpha(0.5);
            }
            if (feature.polyline) {
                this.lastPolylineMaterial = clone(feature.polyline.material);
                (feature.polyline.material as any) = Color.BLUE.withAlpha(0.5);
            }
            if (feature.billboard) {
                this.lastBillboardColor = clone(feature.billboard.color);
                (feature.billboard.color as any) = Color.BLUE.withAlpha(0.5);
            }
            if (feature.model) {
                (feature.model.silhouetteSize as any) = 3;
            }

            // 属性
            let attrs = [];
            for (let key in feature.properties?.getValue(new JulianDate())) {
                attrs.push({ key, value: feature.properties[key] })
            }
            this.$data.attrs = attrs;
            this.viewer.selectedEntity = feature;
            return
        }
        if (feature && feature instanceof Cesium3DTileFeature) {
            this.lastFeatureColor = clone(feature.color);
            feature.color = Color.BLUE.withAlpha(0.5);

            // 属性
            let attrs: any = [];
            feature.getPropertyIds().forEach((key: any) => {
                attrs.push({ key, value: feature.getProperty(key) })
            })
            this.$data.attrs = attrs;
            this.viewer.selectedEntity = new Entity({
                name: this.getCesium3DTileFeatureName(feature),
                description: this.getCesium3DTileFeatureDescription(feature),
                feature: feature,
            } as any);
            return
        }
        if (feature && feature.data) {
            let geojson = {};
            if (feature.data.geometryType) {
                geojson = esri2geo.toGeoJSON({ features: [feature.data] })
            } else {
                geojson = feature.data
            }
            this.highLightEntity = await this.viewer.dataSources.add(GeoJsonDataSource.load(geojson, {
                stroke: Color.BLUE,
                fill: Color.BLUE.withAlpha(0.5),
                strokeWidth: 3,
                markerColor: Color.BLUE,
                clampToGround: true
            }));

            // 属性
            let attrs = [];
            if (feature.data.properties) {
                for (let key in feature.data.properties) {
                    attrs.push({ key, value: feature.data.properties[key] })
                }
            } else if (feature.data.attributes) {
                for (let key in feature.data.attributes) {
                    attrs.push({ key, value: feature.data.attributes[key] })
                }
            }

            this.$data.attrs = attrs;
        } else {
            if (this.highLightEntity) {
                this.viewer.dataSources.remove(this.highLightEntity);
            }
        }

    }

    async markAll(features: any) {
        this.clearHighLight();
        let json: any = {
            type: 'FeatureCollection',
            features: []
        };
        features.forEach((feature: any) => {
            let geojson: any = {};
            if (feature.data.geometryType) {
                geojson = esri2geo.toGeoJSON({ features: [feature.data] })
            } else {
                geojson = feature.data
            }
            json.features.push(...geojson.features)
        })
        const highLight = await this.viewer.dataSources.add(GeoJsonDataSource.load(json, {
            stroke: Color.AQUA.withAlpha(0.5),
            fill: Color.AQUA.withAlpha(0.2),
            strokeWidth: 3,
            markerColor: Color.AQUA.withAlpha(0.5),
            clampToGround: true
        }));
        this.highLightAll.push(highLight);
    }

    clearHighLight(onlySelected: boolean = false) {
        if (this.highLightEntity) {
            this.viewer.dataSources.remove(this.highLightEntity);
            this.highLightEntity = null;
        }
        if (this.highLightAll && this.highLightAll.length > 0 && !onlySelected) {
            this.highLightAll.forEach((item: any) => {
                this.viewer.dataSources.remove(item);
            })
            this.highLightAll = [];

        }
        if (!onlySelected) {
            this.$data.count = 0
        }
        if (this.viewer.selectedEntity && this.viewer.selectedEntity.feature && this.viewer.selectedEntity.feature instanceof Cesium3DTileFeature) {
            this.viewer.selectedEntity.feature.color = this.lastFeatureColor;
        }
        if (this.viewer.selectedEntity) {
            if (this.viewer.selectedEntity.polygon) {
                this.viewer.selectedEntity.polygon.material = this.lastPolygonMaterial;
            }
            if (this.viewer.selectedEntity.polyline) {
                this.viewer.selectedEntity.polyline.material = this.lastPolylineMaterial;
            }
            if (this.viewer.selectedEntity.billboard) {
                this.viewer.selectedEntity.billboard.color = this.lastBillboardColor;
            }
            if (this.viewer.selectedEntity.model) {
                this.viewer.selectedEntity.model.silhouetteSize = 0;
            }

        }
        this.$data.title = '';
        // this.infoBox.innerHTML = '';
        this.$data.isEmpty = true;
        this.$data.attrs = [];
        // this.results = [];
    }

    formatHtml(html: string) {
        if (!html) return '';
        html = html.replace(/cesium-infoBox-defaultTable/g, 'table table-sm table-bordered');
        let dom = document.createElement('div');
        dom.innerHTML = html;
        dom.querySelectorAll('tr').forEach((tr) => {
            let th = document.createElement('th')
            th.textContent = tr.childNodes[0].textContent;
            tr.children[0].replaceWith(th);
        });
        return dom.innerHTML;
    }

    public onOpen(): void {
        (document.querySelector('.cesium-viewer') as HTMLElement).style.cursor = 'help';
        this.viewer.cesiumWidget.screenSpaceEventHandler.setInputAction((e: any) => this.pickAndSelectObject(e), ScreenSpaceEventType.LEFT_CLICK);
        this.setExtentSelect();
    }
    public onClose(): void {
        (document.querySelector('.cesium-viewer') as HTMLElement).style.cursor = 'default';
        this.viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(ScreenSpaceEventType.LEFT_CLICK);
        this.clearHighLight();
        this.setExtentSelect(false);
    }
}