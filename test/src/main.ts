import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
// import CzmSDK from 'czm-sdk';
import CzmSDK from '../../src'
import 'cesium/Build/Cesium/Widgets/widgets.css'
// import '../../src/style.css'
// import '../../src/style.scss'
import naive from 'naive-ui'

console.log(CzmSDK)

let app = createApp(App)
app.use(naive)
app.mount('#app')
console.log(app)
