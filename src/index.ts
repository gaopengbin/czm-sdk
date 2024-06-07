import './style.css'
import './style.scss'
import 'bootstrap-icons/font/bootstrap-icons.css'
import 'cesium/Build/Cesium/Widgets/widgets.css'
export * from './lib'
export * from './component'
import * as lib from './lib'
import * as component from './component'

export default {
    ...lib,
    ...component
}