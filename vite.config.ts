import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue(),
    dts({
      outDir: 'dist'
    })],
  build: {
    lib: {
      entry: './src/index.ts',
      name: 'CzmSDK',
      fileName: 'CzmSDK',
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
  }
})
