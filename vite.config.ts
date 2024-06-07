import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path';
import { viteExternalsPlugin } from 'vite-plugin-externals';
export default defineConfig({
  plugins: [
    vue(),
    dts({
      outDir: 'dist'
    }),
    viteExternalsPlugin({
      cesium: 'Cesium', // 外部化 cesium 依赖，之后全局访问形式是 window['Cesium']
      '@cesium/widgets': 'Cesium',
    })
  ],
  build: {
    lib: {
      entry: './src/index.ts',
      name: 'ssczm',
      fileName: 'ssczm',
      formats: ['es', 'umd', 'cjs'],
    },
    rollupOptions: {
      external: ['cesium', '@cesium/widgets'],
      output: {
        globals: {
          cesium: 'Cesium',
          '@cesium/widgets': '@cesium/widgets'
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
