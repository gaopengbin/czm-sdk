import { defineCustomElement } from 'vue'
import WebComp from './wc.ce.vue'

// 忽略ts检查
// @ts-ignore
export const WComp = defineCustomElement(WebComp)
export function register(tagName: string = 'w-comp') {
    customElements.define(tagName, WComp)
}
register()  