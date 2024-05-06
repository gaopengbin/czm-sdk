/// <reference types="vite/client" />

declare module '*.ce.vue' {
    import { ComponentOptions } from 'vue'
    const component: ComponentOptions
    export default component
}
