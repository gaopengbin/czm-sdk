
import { Cartesian2, Cartesian3, Cesium3DTileFeature, Color, ConstantPositionProperty, Entity, GeoJsonDataSource, JulianDate, Ray, ScreenSpaceEventType, Viewer, clone, defaultValue, defined } from "cesium";
import { Component } from "../core/decorators";
import BaseWidget from "../earth/base-widget";
import esri2geo from "@/lib/cesium/parser/esri2geo";
import template from "./identify.html?raw"
import ResizeHandle, { Mode } from "@/base/layout/ResizeHandle";
import "@/lib/cesium/fixed/ArcGisMapServerImageryProvider"
import "@/lib/cesium/fixed/imageryLayerCollection"
import "./identify.scss"
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
        }
        this.highLightEntity = await this.viewer.dataSources.add(new GeoJsonDataSource());
        const container: any = this.querySelector('#tree-container');
        // 添加缩放
        new ResizeHandle(container, {
            mode: Mode.vertical
        });
    }
    pickAndSelectObject(e: any) {
        this.clearHighLight();
        this.results = []
        this.loading = true;
        this.viewer.selectedEntity = this.pickEntity(this.viewer, e);
    }
    pickEntity(viewer: Viewer, e: any) {
        const picked = viewer.scene.pick(e.position);
        if (defined(picked)) {
            const id = defaultValue(picked.id, picked.primitive.id);
            if (id instanceof Entity) {
                this.highLight(id);
                this.loading = false;
                let results = [];
                results.push({ layerName: id.name ?? id.id, features: [id] });
                this.results = results;
                return id;
            }

            if (picked instanceof Cesium3DTileFeature) {
                this.highLight(picked);
                this.loading = false;
                let results = [];
                results.push({ layerName: (picked.tileset as any).name, features: [picked] });
                this.results = results;
                return new Entity({
                    name: this.getCesium3DTileFeatureName(picked),
                    description: this.getCesium3DTileFeatureDescription(picked),
                    feature: picked,
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
                console.log(features);
                // 按feature.imageryLayer.guid分组
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
                }
                this.results = results;
                console.log(this.results);
                // Select the first feature.
                const feature = features[0];
                this.highLight(feature);
                if (feature.description) {
                    feature.description = this.formatHtml(feature.description)
                }
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
                (feature.polygon.material as any) = Color.HOTPINK.withAlpha(0.5);
            }
            if (feature.polyline) {
                this.lastPolylineMaterial = clone(feature.polyline.material);
                (feature.polyline.material as any) = Color.HOTPINK.withAlpha(0.5);
            }
            if (feature.billboard) {
                this.lastBillboardColor = clone(feature.billboard.color);
                (feature.billboard.color as any) = Color.HOTPINK.withAlpha(0.5);
            }

            // 属性
            let attrs = [];
            for (let key in feature.properties?.getValue(new JulianDate())) {
                attrs.push({ key, value: feature.properties[key] })
            }
            this.$data.attrs = attrs;
            return
        }
        if (feature && feature instanceof Cesium3DTileFeature) {
            feature.color = Color.HOTPINK.withAlpha(0.5);

            // 属性
            let attrs: any = [];
            feature.getPropertyIds().forEach((key: any) => {
                attrs.push({ key, value: feature.getProperty(key) })
            })
            this.$data.attrs = attrs;
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
                stroke: Color.HOTPINK,
                fill: Color.PINK.withAlpha(0.5),
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