import './style.css'
import './style.scss'
export * from './lib'
export * from './component'
import * as lib from './lib'
import * as component from './component'

export default {
    ...lib,
    ...component
}