
import { Cartesian2, Cartesian3, Cesium3DTileFeature, Color, ConstantPositionProperty, Entity, GeoJsonDataSource, JulianDate, Ray, ScreenSpaceEventType, Viewer, defaultValue, defined } from "cesium";
import { Component } from "../core/decorators";
import BaseWidget from "../earth/base-widget";
import esri2geo from "@/lib/cesium/parser/esri2geo";
import template from "./identify.html?raw"
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
        }
        this.highLightEntity = await this.viewer.dataSources.add(new GeoJsonDataSource());
        this.viewer.cesiumWidget.screenSpaceEventHandler.setInputAction((e: any) => this.pickAndSelectObject(e), ScreenSpaceEventType.LEFT_CLICK);
        this.infoBox = this.querySelector('.infoBox');
    }
    pickAndSelectObject(e: any) {
        this.clearHighLight();
        this.viewer.selectedEntity = this.pickEntity(this.viewer, e);
    }
    pickEntity(viewer: Viewer, e: any) {
        const picked = viewer.scene.pick(e.position);
        if (defined(picked)) {
            const id = defaultValue(picked.id, picked.primitive.id);
            if (id instanceof Entity) {
                this.infoBox.innerHTML = this.formatHtml(id.description?.getValue(new JulianDate()));
                this.$data.isEmpty = false;
                return id;
            }

            if (picked instanceof Cesium3DTileFeature) {
                this.highLight(picked);
                this.infoBox.innerHTML = this.formatHtml(this.getCesium3DTileFeatureDescription(picked));
                this.$data.isEmpty = false;
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
        const scene = viewer.scene;
        const pickRay: Ray | undefined = scene.camera.getPickRay(windowPosition);
        if (!pickRay) { return; }
        const imageryLayerFeaturePromise = scene.imageryLayers.pickImageryLayerFeatures(
            pickRay,
            scene
        );
        if (!defined(imageryLayerFeaturePromise)) {
            return;
        }

        // Imagery layer feature picking is asynchronous, so put up a message while loading.
        const loadingMessage = new Entity({
            id: "Loading...",
            description: "Loading feature information...",
        });

        imageryLayerFeaturePromise.then(
            (features) => {
                // Has this async pick been superseded by a later one?
                if (viewer.selectedEntity !== loadingMessage) {
                    return;
                }

                if (!defined(features) || features.length === 0) {
                    viewer.selectedEntity = this.createNoFeaturesEntity();
                    return;
                }

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

                viewer.selectedEntity = entity;
                this.$data.isEmpty = false;
                this.infoBox.innerHTML = this.formatHtml(viewer.selectedEntity.description?.getValue(new JulianDate()));
            },
            () => {
                // Has this async pick been superseded by a later one?
                if (viewer.selectedEntity !== loadingMessage) {
                    return;
                }
                viewer.selectedEntity = this.createNoFeaturesEntity();
                this.$data.isEmpty = false;
                this.infoBox.innerHTML = this.formatHtml(viewer.selectedEntity.description?.getValue(new JulianDate()));;
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
        if (feature && feature instanceof Cesium3DTileFeature) {
            feature.color = Color.HOTPINK.withAlpha(0.5);
            return
        }
        if (feature && feature.data) {
            let geojson = {};
            if (feature.data.geometryType) {
                geojson = esri2geo.toGeoJSON({ features: [feature.data] })
            } else {
                geojson = feature.data
            }
            this.clearHighLight();
            this.highLightEntity = await this.viewer.dataSources.add(GeoJsonDataSource.load(geojson, {
                stroke: Color.HOTPINK,
                fill: Color.PINK.withAlpha(0.5),
                strokeWidth: 3,
            }));
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
        this.$data.title = '';
        this.infoBox.innerHTML = '';
        this.$data.isEmpty = true;
    }

    formatHtml(html: string) {
        html = html.replace('cesium-infoBox-defaultTable', 'table table-sm table-bordered');
        let dom = document.createElement('div');
        dom.innerHTML = html;
        dom.querySelectorAll('tr').forEach((tr) => {
            let th = document.createElement('th')
            th.textContent = tr.childNodes[0].textContent;
            tr.children[0].replaceWith(th);
        });
        return dom.innerHTML;
    }
}