class Esri2Geo {
    constructor() { }

    public toGeoJSON(data: any): any {
        // if (typeof data === 'string') {
        //     if (cb) {
        //         // this.ajax(data, (err: any, d: any) => {
        //         //     this.toGeoJSON(d, cb);
        //         // });
        //         return;
        //     } else {
        //         throw new TypeError('callback needed for url');
        //     }
        // }
        var outPut: any = { "type": "FeatureCollection", "features": [] };
        var fl = data.features.length;
        var i = 0;
        while (fl > i) {
            var ft = data.features[i];
            /* as only ESRI based products care if all the features are the same type of geometry, check for geometry type at a feature level*/
            var outFT: any = {
                "type": "Feature",
                "properties": this.prop(ft.attributes)
            };
            if (ft.geometry.x) {
                //check if it's a point
                outFT.geometry = this.point(ft.geometry);
            } else if (ft.geometry.points) {
                //check if it is a multipoint
                outFT.geometry = this.points(ft.geometry);
            } else if (ft.geometry.paths) {
                //check if a line (or "ARC" in ESRI terms)
                outFT.geometry = this.line(ft.geometry);
            } else if (ft.geometry.rings) {
                //check if a poly.
                outFT.geometry = this.poly(ft.geometry);
            }
            outPut.features.push(outFT);
            i++;
        }
        return outPut;
        // cb(null, outPut);
    }
    point(geometry: any) {
        //this one is easy
        return { "type": "Point", "coordinates": [geometry.x, geometry.y] };
    }
    points(geometry: any) {
        //check if the multipoint only has one point, if so exports as point instead
        if (geometry.points.length === 1) {
            return { "type": "Point", "coordinates": geometry.points[0] };
        } else {
            return { "type": "MultiPoint", "coordinates": geometry.points };
        }
    }
    line(geometry: any) {
        //check if their are multiple paths or just one
        if (geometry.paths.length === 1) {
            return { "type": "LineString", "coordinates": geometry.paths[0] };
        } else {
            return { "type": "MultiLineString", "coordinates": geometry.paths };
        }
    }
    poly(geometry: any) {
        //first we check for some easy cases, like if their is only one ring
        if (geometry.rings.length === 1) {
            return { "type": "Polygon", "coordinates": geometry.rings };
        } else {
            /*if it isn't that easy then we have to start checking ring direction, basically the ring goes clockwise its part of the polygon,
            if it goes counterclockwise it is a hole in the polygon, but geojson does it by haveing an array with the first element be the polygons 
            and the next elements being holes in it*/
            return this.decodePolygon(geometry.rings);
        }
    }
    decodePolygon(a: any) {
        //returns the feature
        var coords = [], type;
        var len = a.length;
        var i = 0;
        var len2 = coords.length - 1;
        console.log(len2,a);
        while (len > i) {
            if (this.ringIsClockwise(a[i])) {
                coords.push([a[i]]);
                len2++;
            } else {
                console.log(coords,len2);
                if(coords.length === 0){
                    coords.push([]);
                    len2++;
                }
                coords[len2].push(a[i]);
            }
            i++;
        }
        if (coords.length === 1) {
            type = "Polygon";
        } else {
            type = "MultiPolygon";
        }
        return { "type": type, "coordinates": (coords.length === 1) ? coords[0] : coords };
    }
    /*determine if polygon ring coordinates are clockwise. clockwise signifies outer ring, counter-clockwise an inner ring
    or hole. this logic was found at http://stackoverflow.com/questions/1165647/how-to-determine-if-a-list-of-polygon-
    points-are-in-clockwise-order
    this code taken from http://esri.github.com/geojson-utils/src/jsonConverters.js by James Cardona (MIT lisense)
    */
    ringIsClockwise(ringToTest: any) {
        var total = 0,
            i = 0,
            rLength = ringToTest.length,
            pt1 = ringToTest[i],
            pt2;
        for (i; i < rLength - 1; i++) {
            pt2 = ringToTest[i + 1];
            total += (pt2[0] - pt1[0]) * (pt2[1] + pt1[1]);
            pt1 = pt2;
        }
        return (total >= 0);
    }
    prop(a: any) {
        var p: any = {};
        for (var k in a) {
            if (a[k]) {
                p[k] = a[k];
            }
        }
        return p;
    }
    async ajax(url: any) {
        // var xhr = new XMLHttpRequest();
        // xhr.open("GET", url, true);
        // xhr.onreadystatechange = function () {
        //     if (xhr.readyState === 4 && xhr.status === 200) {
        //         cb(null, JSON.parse(xhr.responseText));
        //     }
        // };
        // xhr.send();
        const response = await fetch(url);
        const data = response && response.ok && await response.json() || {};
        return data
    }

}
export default new Esri2Geo();