import { Cartesian3, Color, GeoJsonDataSource, HeadingPitchRange, PointGraphics, PolylineGraphics } from "cesium";
import { Component } from "../core/decorators";
import BaseWidget from "../earth/base-widget";
import Template from "./statistics.html?raw";
import "./statistics.scss";
import * as echarts from "echarts";
import elementResizeDetectorMaker from "element-resize-detector";
import { arcgisQuery } from "./query";
import { transformCartesianArrayToWGS84Array } from "@/lib/cesium/measure";
import { esri2geo } from "@/lib";
import * as XLSX from "xlsx";

@Component({
    tagName: "czm-statistics",
    className: "czm-statistics",
    template: Template,
})
export default class Statistics extends BaseWidget {
    constructor() {
        super();
    }

    async beforeInit() {
        this.$data = {
            layers: [],
            layerGuid: "",
            fields: [],
            field: "",
            fieldType: "",
            searchValue: "",
            searchWay: "like",
            results: [],
            pages: [],
            showPages: [],
            currentPage: 1,
            currentProperties: [],
            jumpPage: 1,
            statisticField: "",
            statisticWay: "count",
            statisticFields: [],
            statisticData: [],

        };
    }

    public onOpen(): void {
        this.getLayers();
    }

    async onInit() {

        this.getLayers();
        // this.initChart();
        // const erd = elementResizeDetectorMaker();
        // erd.listenTo(document.getElementById("chart"), () => {
        //     this.myChart.resize();
        // });
        document.addEventListener("addEvent", (e: any) => {
            this.currentId = e.detail.mid
        })
        document.addEventListener("stopEdit", () => {
            const graphic = this.graphicManager.get(this.currentId)
            graphic.setMaterial(Color.WHITE.withAlpha(0.2))
            this.graphic = graphic
        })
    }

    getLayers() {
        const layersMap = this.sceneTree.layersMap;
        const layers = [] as any;
        layersMap.forEach((layer: any) => {
            if (layer.toJSON && !layer.children && (layer.toJSON().type === "ssmapserver" || layer.toJSON().type === "arcgismapserver")) {
                layers.push({
                    name: layer.name,
                    guid: layer.guid,
                });
            }

        })
        this.$data.layers = layers;
        if (layers.length > 0) {
            this.changeLayer(layers[0].guid);
        }
        // return layers;
    }

    changeLayer(l: any) {
        this.$data.layerGuid = l;
        this.getFields();
    }

    // 获取所有图层的字段
    getFields() {
        this.$data.fields = [];
        let layer = this.sceneTree.getLayerByGuid(this.$data.layerGuid);

        let url = layer.toJSON().url;
        fetch(url + '?f=pjson')
            .then((res) => res.json())
            .then(async (res) => {
                for (let i = 0; i < res.layers.length; i++) {
                    let layerJson = await fetch(url + res.layers[i].id + '?f=pjson').then((res) => res.json());
                    for (let i = 0; i < layerJson.fields.length; i++) {
                        const item = layerJson.fields[i];
                        if (this.$data.fields.findIndex((e: any) => e.field == item.name) == -1) {
                            this.$data.fields.push({
                                value: item.alias,
                                field: item.name,
                                type: item.type
                            });
                        }
                    }
                }
                this.changeField(this.$data.fields[0].field);
                this.changeStatisticField(this.$data.fields[0].field);
            });

    };

    changeField(f: any) {
        this.$data.field = f;
        this.$data.fieldType = this.$data.fields.find((e: any) => e.field == f).type;
    }

    initChart() {
        const myChart = echarts.init(document.getElementById("chart") as any);
        //空的饼图
        const option = {
            title: {
                text: '统计图表',
                left: 'center'
            },
            tooltip: {
                trigger: 'item',
                formatter: '{a} <br/>{b} : {c}'
            },
            legend: {
                bottom: 10,
                left: 'center',
            },
            series: [
                {
                    name: '数量统计',
                    type: 'pie',
                    radius: '50%',
                    data: [],
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: 'rgba(0, 0, 0, 0.5)'
                        }
                    }
                }
            ]
        };
        myChart.setOption(option);
        this.myChart = myChart;
    }

    drawPolygon() {
        if (this.graphic) {
            this.graphic.destroy()
            this.graphic = null
        }
        // this.graphicManager.createCircle()
        this.graphicManager.createPolygon()
    }

    query() {
        this.loading = true;
        let layer = this.sceneTree.getLayerByGuid(this.$data.layerGuid);
        let where = '';
        if (this.$data.field == '' || this.$data.searchValue == '') {
            where = '1=1';
        }
        else if (this.$data.searchWay == 'big') {
            if (this.$data.fieldType == 'esriFieldTypeString') {
                where = `${this.$data.field} > '${this.$data.searchValue}'`;
            } else if (
                this.$data.fieldType == 'esriFieldTypeInteger' ||
                this.$data.fieldType == 'esriFieldTypeDouble' ||
                this.$data.fieldType == 'esriFieldTypeSingle'
            ) {
                where = `${this.$data.field} > ${this.$data.searchValue}`;
            } else if (this.$data.fieldType == 'esriFieldTypeDate') {
                where = `${this.$data.field} > '${this.$data.searchValue}'`;
            } else if (this.$data.fieldType == 'esriFieldTypeOID') {
                where = `${this.$data.field} > ${this.$data.searchValue}`;
            } else {
                where = `${this.$data.field} > '${this.$data.searchValue}'`;
            }
        }
        else if (this.$data.searchWay == 'small') {
            if (this.$data.fieldType == 'esriFieldTypeString') {
                where = `${this.$data.field} < '${this.$data.searchValue}'`;
            } else if (
                this.$data.fieldType == 'esriFieldTypeInteger' ||
                this.$data.fieldType == 'esriFieldTypeDouble' ||
                this.$data.fieldType == 'esriFieldTypeSingle'
            ) {
                where = `${this.$data.field} < ${this.$data.searchValue}`;
            } else if (this.$data.fieldType == 'esriFieldTypeDate') {
                where = `${this.$data.field} < '${this.$data.searchValue}'`;
            } else if (this.$data.fieldType == 'esriFieldTypeOID') {
                where = `${this.$data.field} < ${this.$data.searchValue}`;
            } else {
                where = `${this.$data.field} < '${this.$data.searchValue}'`;
            }
        }
        else if (this.$data.searchWay == 'equal') {
            if (this.$data.fieldType == 'esriFieldTypeString') {
                where = `${this.$data.field} = '${this.$data.searchValue}'`;
            } else if (
                this.$data.fieldType == 'esriFieldTypeInteger' ||
                this.$data.fieldType == 'esriFieldTypeDouble' ||
                this.$data.fieldType == 'esriFieldTypeSingle'
            ) {
                where = `${this.$data.field} = ${this.$data.searchValue}`;
            } else if (this.$data.fieldType == 'esriFieldTypeDate') {
                where = `${this.$data.field} = '${this.$data.searchValue}'`;
            } else if (this.$data.fieldType == 'esriFieldTypeOID') {
                where = `${this.$data.field} = ${this.$data.searchValue}`;
            } else {
                where = `${this.$data.field} = '${this.$data.searchValue}'`;
            }
        }
        else {
            if (this.$data.fieldType == 'esriFieldTypeString') {
                where = `${this.$data.field} like '%${this.$data.searchValue}%'`;
            } else if (
                this.$data.fieldType == 'esriFieldTypeInteger' ||
                this.$data.fieldType == 'esriFieldTypeDouble' ||
                this.$data.fieldType == 'esriFieldTypeSingle'
            ) {
                where = `${this.$data.field}=${this.$data.searchValue}`;
            } else if (this.$data.fieldType == 'esriFieldTypeDate') {
                where = `${this.$data.field}='${this.$data.searchValue}'`;
            } else if (this.$data.fieldType == 'esriFieldTypeOID') {
                where = `${this.$data.field}=${this.$data.searchValue}`;
            } else {
                where = `${this.$data.field}='${this.$data.searchValue}'`;
            }
        }

        let positions: any = []
        if (this.graphic) {
            const Cartesian3s = this.graphic.nodePositions;
            const wgs84s = transformCartesianArrayToWGS84Array(this.viewer, Cartesian3s)
            positions = wgs84s?.map((e: any) => [e.lon, e.lat])
        }
        try {
            arcgisQuery({
                url: layer.toJSON().url,
                where: where,
                positions: positions
            }).then(async (res: any) => {
                this.loading = false;
                if (!res || res.length == 0) {
                    this.clear();
                    return
                }
                this.$data.results = res;
                await this.highLightAll();
                this.$data.pages = [];
                for (let i = 0; i < Math.ceil(res.length); i++) {
                    this.$data.pages.push(
                        {
                            page: i + 1,
                            data: this.formatTableListData(res[i].attributes)
                        }
                    )
                }
                this.changePage(1);
                // this.$data.currentProperties = this.formatTableListData(res.features[0].attributes);
            })
        } catch (error) {
            this.loading = false;
        }


    }

    changePage(page: string | number) {
        if (page === 'prev' && this.$data.currentPage > 1) {
            page = this.$data.currentPage - 1;
        } else if (page === 'next' && this.$data.currentPage < this.$data.pages.length) {
            page = this.$data.currentPage + 1;
        } else if (typeof page === 'number') {
            page = page;
        } else {
            return
        }
        this.$data.currentPage = page;
        this.$data.currentProperties = this.$data.pages[this.$data.currentPage - 1].data;
        this.$data.showPages = this.rePage(this.$data.currentPage);
        this.highLightFeature(this.$data.results[this.$data.currentPage - 1]);
    }

    rePage(page: number) {
        let pages = [];
        if (this.$data.pages.length <= 5) {
            pages = this.$data.pages;
        } else {
            if (page <= 3) {
                pages = this.$data.pages.slice(0, 5);
            } else if (page >= this.$data.pages.length - 2) {
                pages = this.$data.pages.slice(-5);
            } else {
                pages = this.$data.pages.slice(page - 3, page + 2);
            }
        }
        return pages;
    }

    formatTableListData(data: any) {
        let tableList: any = [];
        Object.keys(data).forEach((key) => {
            tableList.push({
                name: key,
                value: data[key]
            });
        });
        return tableList;
    }

    async highLightAll() {
        if (this.highLight) {
            this.viewer.dataSources.remove(this.highLight);
            this.highLight = null;
        }
        let json: any = {
            type: 'FeatureCollection',
            features: []
        };
        // this.$data.results.forEach((feature: any) => {
        let geojson: any = {};
        geojson = esri2geo.toGeoJSON({ features: this.$data.results })
        json.features.push(...geojson.features)
        // })
        this.highLight = await this.viewer.dataSources.add(GeoJsonDataSource.load(json, {
            stroke: Color.AQUA.withAlpha(0.2),
            fill: Color.AQUA.withAlpha(0.2),
            strokeWidth: 1,
            markerColor: Color.AQUA.withAlpha(0.5),
            clampToGround: true
        }));
        this.highLight.entities.values.forEach((entity: any) => {
            // if (entity.polygon) {
            //     entity.polyline = new PolylineGraphics({
            //         positions: entity.polygon.hierarchy.getValue().positions,
            //         width: 3,
            //         material: Color.AQUA.withAlpha(0.5),
            //         // clampToGround: true
            //     })
            // }
            if (entity.billboard) {
                entity.billboard = null
                entity.point = new PointGraphics({
                    color: Color.AQUA.withAlpha(0.5),
                    // outlineColor: Color.WHITE,
                    // outlineWidth: 2,
                    pixelSize: 5
                })
            }
        })
    }

    async highLightFeature(feature: any) {
        if (this.highLightOne) {
            this.viewer.dataSources.remove(this.highLightOne);
            this.highLightOne = null
        }
        let geojson: any = {};
        geojson = esri2geo.toGeoJSON({ features: [feature] })
        this.highLightOne = await this.viewer.dataSources.add(GeoJsonDataSource.load(geojson, {
            stroke: Color.AQUA,
            fill: Color.AQUA.withAlpha(0.2),
            strokeWidth: 3,
            markerColor: Color.AQUA.withAlpha(0.6),
            // clampToGround: true
        }));
        this.highLightOne.entities.values.forEach((entity: any) => {
            if (entity.polygon) {
                entity.polyline = new PolylineGraphics({
                    positions: entity.polygon.hierarchy.getValue().positions,
                    width: 3,
                    material: Color.AQUA.withAlpha(0.5),
                    // clampToGround: true
                })
            }
            if (entity.billboard) {
                entity.billboard = null
                entity.point = new PointGraphics({
                    color: Color.AQUA,
                    outlineColor: Color.WHITE,
                    outlineWidth: 2,
                    pixelSize: 10
                })
            }
            // if (entity.polyline) {
            //     entity.polyline = new PolylineGraphics({
            //         positions: entity.polyline.positions.getValue(),
            //         width: 3,
            //         material: Color.AQUA.withAlpha(0.5),
            //         // clampToGround: true
            //     })
            // }
        })
    }

    locate() {
        if (this.highLightOne) {
            // this.highLightOne.polygon.height = 0
            this.viewer.zoomTo(this.highLightOne)
        }
    }

    clear() {
        if (this.graphic) {
            this.graphic.destroy()
            this.graphic = null
        }
        if (this.highLight) {
            this.viewer.dataSources.remove(this.highLight);
            this.highLight = null;
        }
        if (this.highLightOne) {
            this.viewer.dataSources.remove(this.highLightOne)
            this.highLightOne = null
        }
        this.$data.results = [];
        this.$data.pages = [];
        this.$data.showPages = [];
        this.$data.currentPage = 1;
        this.$data.currentProperties = [];
        this.$data.jumpPage = 1;
        if (this.myChart) {
            this.myChart.clear();
        }
    }

    changeStatisticField(field: any) {
        this.$data.statisticField = field;

    }

    statistic() {
        if (this.$data.results.length == 0) {
            return
        }
        if (this.$data.statisticField == '') {
            return
        }
        if (this.$data.statisticWay == 'count') {
            let data = this.$data.results.map((e: any) => e.attributes[this.$data.statisticField]);
            let countData = this.countData(data);
            this.$data.statisticData = [];
            for (const key in countData) {
                this.$data.statisticData.push({
                    name: key,
                    value: countData[key]
                })
            }
            this.countDataList = countData
            this.drawChart(countData);
        } else if (this.$data.statisticWay == 'sum') {
            let data = this.$data.results.map((e: any) => e.attributes[this.$data.statisticField]);
            let sumData = this.sumData(data);
            this.$data.statisticData = [
                {
                    name: this.$data.statisticField,
                    value: sumData
                }
            ];
            this.sumDataList = sumData
            this.drawNumber(sumData);
        }
    }

    countData(data: any) {
        let countData: any = {};
        data.forEach((e: any) => {
            if (countData[e]) {
                countData[e] += 1;
            } else {
                countData[e] = 1;
            }
        });
        return countData;
    }

    sumData(data: any) {
        // 如果是字符串，转换为数字，如果无法转换，返回0
        let sumData = data.reduce((prev: any, curr: any) => {
            let num = parseFloat(curr);
            if (isNaN(num)) {
                return prev;
            } else {
                return prev + num;
            }
        }, 0);

        return sumData.toFixed(3);
    }

    drawChart(data: any) {
        let chartData: any = [];
        Object.keys(data).forEach((key) => {
            chartData.push({
                value: data[key],
                name: key
            });
        })
        const option = {
            title: {
                text: '统计图表',
                left: 'center'
            },
            tooltip: {
                trigger: 'item',
                formatter: '{a} <br/>{b} : {c}'
            },
            legend: {
                bottom: 10,
                left: 'center',
            },
            series: [
                {
                    name: '数量统计',
                    type: 'pie',
                    radius: '50%',
                    data: chartData,
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: 'rgba(0, 0, 0, 0.5)'
                        }
                    },
                    label: {
                        show: false
                    }
                }
            ]
        };
        if (this.myChart) {
            this.myChart.setOption(option);
        }
    }

    drawNumber(number: number) {
        // 根据数值的大小，设置不同的整数范围
        let max = 100;
        let numberRange = 0;
        if (number > max) {
            let length = String(Math.ceil(number)).length;
            let max = Math.pow(10, length - 1);
            numberRange = Math.ceil(number / max) * max;
        } else {
            numberRange = max;
        }

        const option = {
            title: {
                text: '统计图表',
                left: 'center'
            },
            tooltip: {
                formatter: '{a} <br/>{b} : {c}'
            },
            series: [
                {
                    name: '统计值总和',
                    type: 'gauge',
                    detail: { formatter: '{value}' },
                    data: [{ value: number, name: '数值' }],
                    min: 0,
                    max: numberRange
                }
            ]
        };
        if (this.myChart) {
            this.myChart.setOption(option);
        }
    }

    exportExcel() {
        const title = "统计结果";
        const wb = XLSX.utils.table_to_book(document.getElementById("statistic-result"));

        const wbout = XLSX.write(wb, { bookType: "xlsx", bookSST: true, type: "array" });
        try {
            XLSX.writeFile(wb, title + ".xlsx");
        }
        catch (e) {
            if (typeof console !== 'undefined') console.log(e, wbout);
        }

    }

    showChart() {
        const panel = document.createElement('webgis-widget-panel') as BaseWidget;
        panel.startup({
            mapView: this.mapView,
            viewer: this.viewer,
            config: {
                "label": "统计图表",
                icon: "bi bi-list",
                position: {
                    top: 100,
                    left: 300,
                    width: '400px',
                    height: '400px',
                }
            },
            globalConfig: this.globalConfig
        })
        document.querySelector('.czm-widget-manager')?.appendChild(panel)
        const div = document.createElement('div')
        div.id = 'chart'
        div.style.width = '100%'
        div.style.height = '100%'
        panel.querySelector('.widget-content')?.appendChild(div)
        this.initChart()
        if (this.countDataList) {
            this.drawChart(this.countDataList)
        }
        if (this.sumDataList) {
            this.drawNumber(this.sumDataList)
        }

        const erd = elementResizeDetectorMaker();
        erd.listenTo(document.getElementById("chart"), () => {
            this.myChart.resize();
        });
    }
}
