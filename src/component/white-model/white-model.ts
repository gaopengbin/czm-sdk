import { HTMLElementEvent } from "@/lib/tree/htmlElement";
import { Component } from "../core/decorators";
import BaseWidget from "../earth/base-widget";
import Template from "./white-model.html?raw";
import "./white-model.scss";
import proj4 from "proj4";
import { GeoJsonDataSource, HeadingPitchRange, Math as CMath, Color } from "cesium";
import * as turf from "@turf/turf";
import { GeoJsonPrimitiveLayer } from '@cesium-extends/primitive-geojson';
import { isNumeric } from "@/lib";
@Component({
    tagName: "czm-white-model",
    className: "czm-white-model",
    template: Template,
})
export default class WhiteModel extends BaseWidget {
    constructor() {
        super();
    }
    async onInit(): Promise<void> {
        this.$data = {
            fields: [],
            selectedField: '',
            baseHeight: 100,
            fillColor: '#ff0000',
            strokeColor: '#0000ff',
            outlineColor: '#0000ff',
        }
        import('@/lib/third/shp.min.js' as any).then((shpjs) => {
            console.log(shpjs);
            if (shpjs.default) {
                window.shp = shpjs.default;
            }
        });
        this.prjList = [];
        this.index = 0;
        this.fields = [];
    }

    async inputFiles(e: HTMLElementEvent<HTMLInputElement>) {
        console.log(e.target.files);
        const files: any = e.target.files;
        if (files?.length === 0) {
            return;
        }
        try {
            const object: any = {}
            let shpName: any, file, dbf, cpg;
            for (let i = 0; i < files.length; i++) {
                const [name, ext] = files[i].name.split(".");
                if (ext.toLowerCase() === "shp") {
                    shpName = name;
                    file = files[i];
                    break;
                }
            }
            if (!file) {
                throw new Error("没有找到shp文件");
            }

            const result = await this.loadFile(file, 'buffer');
            if (!result) {
                throw new Error("读取文件失败");
            }
            object.shp = result;

            // 读取dbf
            for (let i = 0; i < files.length; i++) {
                const [name, ext] = files[i].name.split(".");
                if (ext.toLowerCase() === "dbf" && name == shpName) {
                    dbf = files[i];
                    break;
                }
            }
            if (dbf) {
                const result = await this.loadFile(dbf, 'buffer');
                if (!result) {
                    throw new Error("读取文件失败");
                }
                object.dbf = result;
            }

            // 读取cpg
            for (let i = 0; i < files.length; i++) {
                const [name, ext] = files[i].name.split(".");
                if (ext.toLowerCase() === "cpg" && name == shpName) {
                    cpg = files[i];
                    break;
                }
            }
            if (cpg) {
                const result = await this.loadFile(cpg, 'text');
                if (!result) {
                    throw new Error("读取文件失败");
                }
                object.cpg = result;
            }

            console.log(object);
            // shpjs与vite有点冲突，改成通过配置文件加载
            let geojson = await window.shp(object).then(
                (geojson: any) => {
                    return geojson;
                },
                (error: any) => {
                    throw new Error(error);
                }
            );

            // 读取prj 需要注意的是，shapefile.js默认对输入的数据根据prj坐标文件进行坐标转换，转换为wgs84，
            // 当我们需要其他椭球坐标系（非WGS84椭球）时，比如2000经纬度或者平面坐标系，转换就会报错，读取失败。
            // 所以这里我们手动进行投影转换
            // 注意 ESRI WKT 和 OGC WKT 是不同的，这里容易混淆 请参照https://epsg.io/
            let prjFile;
            for (let i = 0; i < files.length; i++) {
                const [name, ext] = files[i].name.split(".");
                if (ext.toLowerCase() === "prj" && name == shpName) {
                    prjFile = files[i];
                    break;
                }
            }
            let geojsonFeature;
            if (prjFile) {
                let prj = (await this.loadFile(prjFile, "text")) as string;
                prj = prj.replace("Gauss_Kruger", "Transverse_Mercator"); // 改一下投影名称，不然proj4无法识别
                // 判读是否被注册
                let esriPrj = this.prjList.find((item: any) => {
                    return item.prj === prj;
                });

                let esriName;
                if (esriPrj) {
                    esriName = esriPrj.name;
                } else {
                    esriName = `ESRI:${this.index++}`;
                    this.prjList.push({
                        name: esriName,
                        prj: prj,
                    });
                    proj4.defs(esriName, prj);
                }

                // geojson坐标转换为WGS84
                turf.coordEach(geojson, (coord: any) => {
                    let [x, y] = coord;
                    let [lon, lat] = proj4(esriName, "EPSG:4326", [x, y]);
                    coord[0] = lon;
                    coord[1] = lat;
                });
                // 获取属性字段key
                turf.propEach(geojson, (prop: any) => {
                    for (let key in prop) {
                        if (this.fields.indexOf(key) === -1) {
                            this.fields.push(key);
                        }
                    }
                });
                this.$data.fields = this.fields;
                // this.loadAsPrimitiveGeoJson(geojson);
                console.log(geojson);
                const shp = await this.sceneTree.createGeoJsonLayer({
                    type: "geojson",
                    url: geojson,
                    name: "shp",
                    zoomTo: true,
                })
                this.sceneTree.root?.addLayer(shp);
                this.shp = shp;
            } else {

            }
            return geojsonFeature;
        } catch (ex: any) {
            console.error(ex);
        }

    }
    loadFile = (file: Blob, readType?: "text" | "buffer" | "binary") => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            switch (readType) {
                case "text":
                    reader.readAsText(file);
                    break;
                case "buffer":
                    reader.readAsArrayBuffer(file);
                    break;
                case "binary":
                    reader.readAsBinaryString(file);
                    break;
                default:
                    reader.readAsDataURL(file);
                    break;
            }

            reader.onload = (evt) => {
                let result = evt.target?.result;
                resolve(result);
            };
            reader.onerror = (error) => {
                reader.abort();
                reject(error);
            };
        });
    };

    loadAsPrimitiveGeoJson(geojson: any) {
        GeoJsonPrimitiveLayer.load(geojson).then((layer: any) => {
            console.log(layer);
            this.shp = layer;
            this.viewer.scene.primitives.add(layer.primitiveCollection);

        });
    }

    onchangeFillColor(value: any) {
        this.$data.fillColor = value;
        if (this.shp) {
            const dataSource = this.shp._dataSource;
            let entities = dataSource.entities.values;
            for (let i = 0; i < entities.length; i++) {
                let entity = entities[i];
                if (entity.polygon) {
                    if (this.$data.fillColor) {
                        entity.polygon.material = Color.fromCssColorString(this.$data.fillColor);
                    }
                }
            }
        }
    }

    onchangeStrokeColor(value: any) {
        this.$data.strokeColor = value;
        if (this.shp) {
            const dataSource = this.shp._dataSource;
            let entities = dataSource.entities.values;
            for (let i = 0; i < entities.length; i++) {
                let entity = entities[i];
                if (entity.polygon) {
                    if (this.$data.strokeColor) {
                        entity.polygon.outlineColor = Color.fromCssColorString(this.$data.strokeColor);
                    }
                }
            }
        }
    }

    onchangeOutlineColor(value: any) {
        this.$data.outlineColor = value;
        if (this.shp) {
            const dataSource = this.shp._dataSource;
            let entities = dataSource.entities.values;
            for (let i = 0; i < entities.length; i++) {
                let entity = entities[i];
                if (entity.polyline) {
                    if (this.$data.outlineColor) {
                        entity.polyline.material = Color.fromCssColorString(this.$data.outlineColor);
                    }
                }
            }
        }
    }

    setExtrudedHeight() {
        if (this.shp) {
            const baseHeight = Number(this.$data.baseHeight);
            const dataSource = this.shp._dataSource;
            let entities = dataSource.entities.values;
            for (let i = 0; i < entities.length; i++) {
                let entity = entities[i];
                let height = entity.properties[this.$data.selectedField];
                if (!isNumeric(height)) {
                    height = 1;
                }
                if (entity.polygon) {
                    if (height) {
                        entity.polygon.extrudedHeight = Number(height) * baseHeight;
                    }
                }
            }
        }
    }

    setRandomColor() {
        if (this.shp) {
            const dataSource = this.shp._dataSource;
            let entities = dataSource.entities.values;
            for (let i = 0; i < entities.length; i++) {
                let entity = entities[i];
                if (entity.polygon) {
                    let color = Color.fromRandom();
                    entity.polygon.material = color;
                }
                if (entity.polyline) {
                    let color = Color.fromRandom();
                    entity.polyline.material = color;
                }
            }
        }
    }
}