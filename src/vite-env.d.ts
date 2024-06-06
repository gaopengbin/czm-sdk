/// <reference types="vite/client" />

// 扩展全局变量
interface Window {
    // webgis全局配置文件
    __WEBGIS_CESIUM_CONFIG__: {
        /**
         * 根路径 默认 ''
         */
        baseUrl: string,
    };
    // 版本号
    __WEBGIS_CESIUM_VERSION__: string;
    // Cesium
    Cesium: any;
    // CesiumJS静态文件所在服务器上的URL
    CESIUM_BASE_URL: string;
}
