
import {
    WebMercatorTilingScheme,
    WebMercatorProjection,
    Math as CesiumMath,
    Cartographic,
    Cartesian2,
} from '@cesium/engine'

import CoordTransform from './CoordTransform'
import { Cartesian3 } from 'cesium'

class GCJ02TilingScheme extends WebMercatorTilingScheme {
    constructor(options?: any) {
        super(options)
        let projection = new WebMercatorProjection()
        this.projection.project = function (cartographic: Cartographic, result: any): any {
            result = CoordTransform.WGS84ToGCJ02(
                CesiumMath.toDegrees(cartographic.longitude),
                CesiumMath.toDegrees(cartographic.latitude)
            )
            result = projection.project(
                new Cartographic(
                    CesiumMath.toRadians(result[0]),
                    CesiumMath.toRadians(result[1])
                )
            )
            return new Cartesian2(result.x, result.y)
        }
        this.projection.unproject = function (cartesian: Cartesian3, result: any) {
            let cartographic = projection.unproject(cartesian)
            result = CoordTransform.GCJ02ToWGS84(
                CesiumMath.toDegrees(cartographic.longitude),
                CesiumMath.toDegrees(cartographic.latitude)
            )
            return new Cartographic(
                CesiumMath.toRadians(result[0]),
                CesiumMath.toRadians(result[1])
            )
        }
    }
}

export default GCJ02TilingScheme
