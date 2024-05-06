import './style.css'
import './style.scss'
export * from './lib'
import * as lib from './lib'
import * as component from './component'

export default {
    ...lib,
    ...component
}