import * as turf from '@turf/turf';

export function arcgisQuery(options: { url: string, where: string, positions?: any[] }) {
    const { url, where, positions } = options;



    return new Promise(async (resolve, reject) => {
        const layerInfo = await fetch(url + '?f=pjson').then((res) => res.json());
        const resList: any = []
        for (let i = 0; i < layerInfo.layers.length; i++) {
            const layerUrl = url + i + '/query?';
            let params: any;
            if (positions && positions.length) {
                // if (positions[0][0] !== positions[positions.length - 1][0] || positions[0][1] !== positions[positions.length - 1][1]) {
                //     positions.push(positions[0]);
                // }
                //计算positions的外接矩形
                // const bbox = turf.bbox(turf.multiPoint(positions));
                params = {
                    where: where,
                    outFields: '*',
                    returnGeometry: true,
                    f: 'json',
                    spatialRel: "esriSpatialRelIntersects",
                    // geometryType: "esriGeometryEnvelope",
                    geometryType: "esriGeometryPolygon",
                    // geometry: `${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]}`,
                    geometry: { rings: [positions] },
                    inSR: 4326,
                    outSR: 4326,
                }
            } else {
                params = {
                    where: where,
                    outFields: '*',
                    returnGeometry: true,
                    f: 'json',
                    spatialRel: "esriSpatialRelIntersects",
                    inSR: 4326,
                    outSR: 4326,
                }
            }

            const urlEncoded = Object.keys(params).map((key) => {
                if (typeof params[key] === 'object') {
                    return encodeURIComponent(key) + '=' + encodeURIComponent(JSON.stringify(params[key]));
                }

                return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
            }
            ).join('&');

            const res = await fetch(layerUrl + urlEncoded).then((res) => res.json());
            if(res.features){
                resList.push(...res.features);
            }
        }
        resolve(resList);
    })

}