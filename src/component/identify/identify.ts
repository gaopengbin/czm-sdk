
import { Cartesian2, Cartesian3, Cesium3DTileFeature, Color, ConstantPositionProperty, Entity, GeoJsonDataSource, JulianDate, Ray, ScreenSpaceEventType, Viewer, clone, defaultValue, defined, Math as CesiumMath } from "cesium";
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
        const container: any = this.querySelector('#tree-container');
        // 添加缩放
        new ResizeHandle(container, {
            mode: Mode.vertical
        });
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
            this.highLight(this.results[0].features[0]);
            if(this.results[0].features[0] instanceof Entity) {
                return this.results[0].features[0];
            }else if(this.results[0].features[0] instanceof Cesium3DTileFeature) {
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
    pickImageryLayerFeature(viewer: Viewer, windowPosition: Cartesian2) {
        const scene: any = viewer.scene;
        const pickRay: Ray | undefined = scene.camera.getPickRay(windowPosition);
        if (!pickRay) { return; }
        let imageryLayerFeaturePromise;
        if (this.$data.range === 'visible' || this.$data.range === 'top') {
            imageryLayerFeaturePromise = scene.imageryLayers.pickImageryLayerFeatures(
                pickRay,
                scene
            );
        } else if (this.$data.range === 'all') {
            imageryLayerFeaturePromise = scene.imageryLayers.pickImageryLayerFeatures2(
                pickRay,
                scene
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
                // Has this async pick been superseded by a later one?
                if (viewer.selectedEntity !== loadingMessage) {
                    this.loading = false;
                    return;
                }

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

    async highLight(feature: any) {
        this.clearHighLight();
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
            }));

            // 属性
            let attrs = [];
            for (let key in feature.data.attributes) {
                attrs.push({ key, value: feature.data.attributes[key] })
            }
            this.$data.attrs = attrs;

        } else {
            if (this.highLightEntity) {
                this.viewer.dataSources.remove(this.highLightEntity);
            }
        }

    }

    clearHighLight() {
        if (this.highLightEntity) {
            this.viewer.dataSources.remove(this.highLightEntity);
            this.highLightEntity = null;
        }
        if (this.viewer.selectedEntity && this.viewer.selectedEntity.feature && this.viewer.selectedEntity.feature instanceof Cesium3DTileFeature) {
            this.viewer.selectedEntity.feature.color = Color.WHITE;
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
    }
    public onClose(): void {
        (document.querySelector('.cesium-viewer') as HTMLElement).style.cursor = 'default';
        this.viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(ScreenSpaceEventType.LEFT_CLICK);
        this.clearHighLight();
    }
}