import x2js from "x2js";
import { queryToObject, objectToQuery, Resource } from "cesium";

class WMSParser {
    Layers: any[];
    originUrl: string;
    type: string;
    token: string;
    url: string;
    queryParameters: any;
    constructor() {
        this.Layers = []
        this.originUrl = ''
        this.type = ''
        this.token = ''
        this.url = ''
        this.queryParameters = {}
    }
    addUrlParam(url: string, token?: string, type?: string) {
        // this.originUrl = url
        // this.type = type
        // this.token = token
        let idx = url.lastIndexOf("?");
        var queryParameters: any = {};

        if (idx > 0) {
            queryParameters = queryToObject(url.substr(idx + 1));
            url = url.substr(0, idx);
        }
        this.url = url;
        this.originUrl = url
        queryParameters.Request = 'GetCapabilities';
        queryParameters.Service = 'wms';
        if (token) {
            if (type == 'arcgis') {
                queryParameters.key = token;
            } else {
                queryParameters.token = token;
            }
        }

        // console.log(url, '?' + Cesium.objectToQuery(queryParameters))

        this.queryParameters = queryParameters;

        return url + '?' + objectToQuery(queryParameters);
    }
    async fetchWithTimeout(url: string, options = { timeout: 8000 }) {
        const { timeout = 8000 } = options;

        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response.text();
    }
    parser(url: string) {
        return new Promise((resolve, reject) => {
            // Resource.fetchText({ url: url })
            this.fetchWithTimeout(url, { timeout: 8000 })
                ?.then(text => {
                    var x2jsone: any = new x2js();
                    this.Layers = [];
                    let contents = x2jsone.xml2js(text).WMS_Capabilities.Capability.Layer;
                    let getMap = x2jsone.xml2js(text).WMS_Capabilities.Capability.Request.GetMap;
                    let requestURL = getMap.DCPType.HTTP.Get.OnlineResource['_xlink:href'];
                    let format = getMap.Format;
                    let urls = {
                        url: requestURL,
                        format: format
                    }
                    //处理layer
                    this.parseLayer(contents.Layer, urls)
                    // if (contents.Layer instanceof Array) {
                    //     contents.Layer.forEach(layer => {
                    //         this.addLayer(layer, urls)
                    //     })
                    // } else if (contents.Layer) {
                    //     this.addLayer(contents.Layer, urls)
                    // }
                    resolve(this.Layers)
                })
            // .catch(err => {
            //     reject(err)
            // })
        })
    }

    parseLayer(layer: any, urls: any) {
        if (layer instanceof Array) {
            layer.forEach(l => {
                this.parseLayer(l, urls)
            })
        } else if (layer) {
            this.addLayer(layer, urls)
        }
    }

    addLayer(Layer: any, urls: any) {
        let urlTemp = ''
        if (this.token) {
            if (this.type == 'arcgis') {
                urlTemp = this.originUrl + '?key=' + this.token
            } else {
                urlTemp = this.originUrl + '?token=' + this.token
            }
        } else {
            urlTemp = this.originUrl
        }
        var l: any = {
            title: Layer.Title.toString(),
            name: Layer.Name.toString(),
            urls: urlTemp,
            styles: [],
            format: urls.format,
            srs: [],

        }
        //范围
        if (Layer.EX_GeographicBoundingBox) {
            let box = Layer.EX_GeographicBoundingBox
            let w = parseFloat(box.westBoundLongitude);
            let e = parseFloat(box.eastBoundLongitude);
            let s = parseFloat(box.southBoundLatitude);
            let n = parseFloat(box.northBoundLatitude);
            //限定下范围
            if (w < -180) w = -180;
            if (e > 180) e = 180;
            if (s < -90) s = -90;
            if (n > 90) n = 90;
            l.rectangle = [
                w, s, e, n
            ];
        }
        //支持srs
        if (Layer.CRS) {
            l.srs = Layer.CRS
        }
        //支持style

        if (Layer.Style instanceof Array) {
            Layer.Style.forEach((s: any) => {
                l.styles.push({
                    name: s.Name,
                    legend: s.LegendURL
                })
            })
        } else {
            let s = Layer.Style;
            if (!s) {
                s = {
                    Name: 'default',
                    LegendURL: ''
                }
            }
            l.styles.push({
                name: s.Name,
                legend: s.LegendURL
            })
        }
        this.Layers.push(l)

    }
}
// module.exports = WMSParser
export default WMSParser;
