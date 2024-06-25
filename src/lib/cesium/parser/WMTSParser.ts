import x2js from "x2js";
import { queryToObject, objectToQuery, Resource } from "cesium";

class XbsjWMTSParser {
    Layers: any[];
    TileMatrixSets: any[];
    url: any;
    queryParameters: any;
    constructor() {
        this.Layers = [];
        this.TileMatrixSets = [];
        this.queryParameters = {};
    }

    addUrlParam(url: string) {
        let idx = url.lastIndexOf("?");
        let queryParameters: any = {};

        if (idx > 0) {
            queryParameters = queryToObject(url.substr(idx + 1));
            url = url.substr(0, idx);
        }
        this.url = url;

        queryParameters.Request = 'GetCapabilities';
        queryParameters.Service = 'wmts';

        this.queryParameters = queryParameters;

        return url + '?' + objectToQuery(queryParameters);
    }

    makeTemplate(layer: string) {
        console.log(layer);
        let ret = this.url + '?REQUEST=GetTile&VERSION=1.0.0&SERVICE=wmts';

        ret += '&LAYER=' + layer;
        ret += '&STYLE={style}';
        ret += '&TILEMATRIXSET={TileMatrixSet}';
        ret += '&TILEMATRIX={TileMatrix}';
        ret += '&TILEROW={TileRow}';
        ret += '&TILECOL={TileCol}';

        //遍历queryParameters，提取非request参数
        for (let key in this.queryParameters) {
            let k = key.toLowerCase();
            if (k == 'request' || k == 'service')
                continue;
            ret += '&' + k + '=' + this.queryParameters[k];
        }
        console.log('make template', ret);

        return ret;
    }

    parser(url: string, proxy: any) {
        return new Promise((resolve, reject) => {
            //使用cesium请求
            Resource.fetchText({ url: url })?.then(text => {
                let x2jsone: any = new x2js();
                this.Layers = [];
                this.TileMatrixSets = [];
                let contents = x2jsone.xml2js(text).Capabilities.Contents;

                //先处理所有 tilematrixset
                if (contents.TileMatrixSet instanceof Array) {
                    contents.TileMatrixSet.forEach((t: any) => {
                        this.addTileMatrixSet(t);
                    });
                } else if (contents.TileMatrixSet) {
                    this.addTileMatrixSet(contents.TileMatrixSet);
                }

                //再处理layer
                if (contents.Layer instanceof Array) {
                    contents.Layer.forEach((layer: any) => {
                        this.addLayer(layer);
                    });
                } else if (contents.Layer) {
                    this.addLayer(contents.Layer);
                }

                resolve(this.Layers);
            })
                .catch(err => {
                    reject(err);
                })
        });
    }

    addLayer(Layer: any) {
        let l: any = {
            title: Layer.Title.toString(),
            urls: [],
            styles: [],
            tileMatrixSets: []
        };

        //范围
        if (Layer.WGS84BoundingBox) {
            let lb = Layer.WGS84BoundingBox.LowerCorner.toString().split(" ");
            let rt = Layer.WGS84BoundingBox.UpperCorner.toString().split(" ");
            let w = parseFloat(lb[0]);
            let s = parseFloat(lb[1]);
            let e = parseFloat(rt[0]);
            let n = parseFloat(rt[1]);
            //限定下范围
            if (w < -180) w = -180;
            if (e > 180) e = 180;
            if (s < -90) s = -90;
            if (n > 90) n = 90;
            l.rectangle = [
                w, s, e, n
            ];

        }
        //支持格式
        if (Layer.ResourceURL instanceof Array) {
            Layer.ResourceURL.forEach((r: any) => {
                if (r._resourceType == "tile") {
                    l.urls.push({
                        format: r._format,
                        template: r._template
                    });
                }
            });
        } else {
            let r = Layer.ResourceURL;
            if (r && r._resourceType == "tile") {
                l.urls.push({
                    format: r._format,
                    template: r._template
                });
            }
            else if (Layer.Format) {
                l.urls.push({
                    format: Layer.Format,
                    template: this.makeTemplate(l.title)
                });
            }
        }
        function getLegend(s: any) {
            if (!s.LegendURL) return;
            return {
                format: s.LegendURL['_format'],
                height: parseInt(s.LegendURL['_height']),
                width: parseInt(s.LegendURL['_width']),
                href: s.LegendURL['_xlink:href'],
            };
        }
        //支持的样式
        if (Layer.Style instanceof Array) {
            Layer.Style.forEach((s: any) => {
                l.styles.push({
                    id: s.Identifier.toString(),
                    legend: getLegend(s),
                    title: s.Title ? s.Title.toString() : s.Identifier.toString(),
                    default: s._isDefault == "true"
                });
            });
        } else {
            let s = Layer.Style;
            l.styles.push({
                id: s.Identifier.toString(),
                legend: getLegend(s),
                title: s.Title ? s.Title.toString() : s.Identifier.toString(),
                default: s._isDefault == "true"
            });
        }


        //支持的切片规则
        if (Layer.TileMatrixSetLink instanceof Array) {
            Layer.TileMatrixSetLink.forEach((tl: any) => {
                let tileMatrixSet = this.TileMatrixSets.find(t => t.tileMatrixSetID == tl.TileMatrixSet);
                if (tileMatrixSet)
                    l.tileMatrixSets.push(tileMatrixSet);
            });
        } else {
            let tl = Layer.TileMatrixSetLink;
            let tileMatrixSet = this.TileMatrixSets.find(t => t.tileMatrixSetID == tl.TileMatrixSet);
            if (tileMatrixSet)
                l.tileMatrixSets.push(tileMatrixSet);
        }

        this.Layers.push(l);
    }
    getLevelScales28mm() {
        //(6378137 * 2 * Math.PI  /256) 表示每像素多少米
        // 0.028 表示dpi 28mm
        // 100 表示转厘米
        //计算每一级别的标准比例尺
        const scale0 = (((6378137 * 2 * Math.PI) / 256) * 100) / 0.028;
        let scales = [];
        for (let i = 0; i < 25; i++) {
            scales[i] = scale0 / (1 << i);
        }
        return scales;
    }
    getLevelScales96dpi() {
        let dpi = 96; //每英寸多少点
        let res = 0.0254 / dpi; //每米/像素

        //(6378137 * 2 * Math.PI  /256) 表示每像素多少米
        //计算每一级别的标准比例尺
        const scale0 = ((6378137 * 2 * Math.PI) / 256) / res;
        let scales = [];
        for (let i = 0; i < 25; i++) {
            scales[i] = scale0 / (1 << i);
        }
        return scales;
    }
    getLevel(tileMatrixs: any[], standerScales: any[]) {
        let ret: any = {
            minimumLevel: 0,
            maximumLevel: 0,
            tileMatrixLabels: []
        };
        //遍历 tileMatrixs 寻找
        let level = -1;
        for (let i = 0; i < tileMatrixs.length; i++) {
            let tm = tileMatrixs[i];

            //寻找满足条件的级别
            let tl = standerScales.findIndex(s => {
                let error = s * 0.0001;
                return tm.scale < s + error && tm.scale > s - error;
            });
            //没有合适的跳过
            if (tl < 0) {
                continue;
            }
            //如果还没开始，那么添加第一个
            if (level < 0) {
                ret.minimumLevel = level = tl;
                //对前面label补全
                for (let j = 0; j < ret.minimumLevel; j++) {
                    ret.tileMatrixLabels[ret.tileMatrixLabels.length] = '0';
                }
                ret.tileMatrixLabels[ret.tileMatrixLabels.length] = tm.id;
            }
            //如果等于下一级 那么再添加一个
            else if (tl == level + 1) {
                ret.maximumLevel = tl;
                ret.tileMatrixLabels[ret.tileMatrixLabels.length] = tm.id;
                level += 1;
            }
            //如果级别不连续，那么停止
            else {
                break;
            }
        }
        //如果没有合适的级别，那么不返回
        if (ret.tileMatrixLabels.length == 0) return undefined;
        return ret;
    }
    getLevel4326(tileMatrixs: any) {
        //标准4326分块顶层是两块，所以要去除第0个
        let scales = this.getLevelScales28mm();
        scales.splice(0, 1);

        //根据 tileMatrixs判定获取级别
        let ret = this.getLevel(tileMatrixs, scales);
        if (!ret) {
            scales = this.getLevelScales96dpi();
            scales.splice(0, 1);
            ret = this.getLevel(tileMatrixs, scales);
        }
        if (!ret) return;

        ret.tilingScheme = "Geographic";
        return ret;
    }
    getLevel3857(tileMatrixs: any) {
        let scales = this.getLevelScales28mm();
        //根据 tileMatrixs判定获取级别
        let ret = this.getLevel(tileMatrixs, scales);
        if (!ret) {
            scales = this.getLevelScales96dpi();
            ret = this.getLevel(tileMatrixs, scales);
        }

        if (!ret) return;

        ret.tilingScheme = "WebMercator";
        return ret;
    }
    addTileMatrixSet(tms: any) {
        let t: any = {
            tileMatrixSetID: tms.Identifier.toString(),
            title: tms.Title ? tms.Title.toString() : tms.Identifier.toString()
        };

        let tileMatrixs: any = [];
        tms.TileMatrix.forEach((tm: any) => {
            tileMatrixs.push({
                id: tm.Identifier.toString(),
                scale: parseFloat(tm.ScaleDenominator)
            });
        });

        let crs = tms.SupportedCRS.toString();
        t.crs = crs;

        //核心在这里需要找到 每个tilematrix set的投影方式，要么是 4326的 要么是 3857的
        if (
            crs.indexOf(":4490") > 0 ||
            crs.indexOf(":4326") > 0 ||
            crs.indexOf("OGC:2:84") > 0 ||
            crs.indexOf('UNIT["degree",0.0174532925199') > 0
        ) {
            t.params = this.getLevel4326(tileMatrixs);

            if (t.params) {
                this.TileMatrixSets.push(t);
            } else {
                console.log("not support 4326 tilematrixs:", tileMatrixs);
            }
        } else if (crs.indexOf("3857") > 0 || crs.indexOf("900913") > 0) {
            t.params = this.getLevel3857(tileMatrixs);

            if (t.params) {
                this.TileMatrixSets.push(t);
            } else {
                console.log("not support 4326 tilematrixs:", tileMatrixs);
            }
        }
        //不支持的
        else {
            console.log("not support crs:", crs);
        }
    }
}

export default XbsjWMTSParser;