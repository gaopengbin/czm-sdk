// import { defineConfig, type PluginOption, splitVendorChunkPlugin, loadEnv } from 'vite'
// import vue from '@vitejs/plugin-vue'
// import { viteExternalsPlugin } from 'vite-plugin-externals'
// import { insertHtml, h } from 'vite-plugin-insert-html'
// import { viteStaticCopy } from 'vite-plugin-static-copy'
// import compress from 'vite-plugin-compression'
// import { resolve } from 'path'

// export default defineConfig((context) => {
//   const mode = context.mode
//   const envDir = 'env' // 环境变量文件的文件夹，相对于项目的路径，也可以用 nodejs 函数拼接绝对路径
//   const isProd = mode === 'production'

//   const env = loadEnv(mode, envDir)
//   const cesiumBaseUrl = env['VITE_CESIUM_BASE_URL']
//   // 默认 base 是 '/'
//   const base = '/'

//   const plugins: PluginOption[] = [
//     vue(),
//     splitVendorChunkPlugin(),
//     viteExternalsPlugin({
//       cesium: 'Cesium', // 外部化 cesium 依赖，之后全局访问形式是 window['Cesium']
//     }),
//     insertHtml({
//       head: [
//         // 生产模式使用 CDN 或已部署的 CesiumJS 在线库链接，开发模式用拷贝的库文件，根据 VITE_CESIUM_BASE_URL 自动拼接
//         h('script', {
//           // 因为涉及前端路径访问，所以开发模式最好显式拼接 base 路径，适配不同 base 路径的情况
//           src: isProd ? `${cesiumBaseUrl}Cesium.js` : `${base}${cesiumBaseUrl}Cesium.js`
//         })
//       ]
//     })
//   ]
//   // if (isProd) {
//   // 开发模式，复制 node_modules 下的 cesium 依赖
//   const cesiumLibraryRoot = 'node_modules/cesium/Build/CesiumUnminified/'
//   const cesiumLibraryCopyToRootPath = 'libs/cesium/' // 相对于打包后的路径
//   const cesiumStaticSourceCopyOptions = ['Assets', 'ThirdParty', 'Workers', 'Widgets'].map((dirName) => {
//     return {
//       src: `${cesiumLibraryRoot}${dirName}/*`, // 注意后面的 * 字符，文件夹全量复制
//       dest: `${cesiumLibraryCopyToRootPath}${dirName}`
//     }
//   })
//   plugins.push(
//     viteStaticCopy({
//       targets: [
//         // 主库文件，开发时选用非压缩版的 IIFE 格式主库文件
//         {
//           src: `${cesiumLibraryRoot}Cesium.js`,
//           dest: cesiumLibraryCopyToRootPath
//         },
//         // 四大静态文件夹
//         ...cesiumStaticSourceCopyOptions
//       ]
//     }),
//   )
//   // }
//   plugins.push(compress({
//     threshold: 10 * 1024 // 10KB 以下不压缩
//   }))

//   const resolves = {
//     alias: {
//       '@': resolve(__dirname, 'src')
//     }
//   }

//   return {
//     base,
//     envDir,
//     mode,
//     plugins,
//     resolve: resolves,
//   }
// })