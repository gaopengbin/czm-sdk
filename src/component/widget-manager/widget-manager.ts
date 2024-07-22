import { Component } from "../core/decorators";
import BaseWidget from "../earth/base-widget";

// 组件的样式
import './widget-manager.scss';
import { getPositionStyle, styleToString } from "@/lib/common/style";
import { WidgetConfig } from "../../component/interface";

/**
 * 组件管理器
 * - 用于加载所在地图的组件
 * - 该widget一般由地图widget调用，不需要手动配置
 *
 * @label 组件管理器
 * @tagName webgis-widget-manager
 * @inPanel false
 * @icon 不需要
 * @sample
 * 
 * @category Widget-Manager
 */
@Component({
    tagName: 'webgis-widget-manager',
    className: 'webgis-widget-manager',
    hasConfig: true
})
export default class WidgetManager extends BaseWidget {
    constructor() {
        super();
    }

    public isReady(): boolean {
        return true;
    }
    async afterInit() {
        this.config.forEach((_config: WidgetConfig) => {
            this.addWidget(_config);
        });
    }

    public configLoaded(): void {
        console.log("configLoaded", this.globalConfig);
    }

    /**
     * 添加参数默认值
     * @param {WidgetConfig} widgetConfig 
     * @returns {WidgetConfig}
     */
    #getDefault(widgetConfig: WidgetConfig): WidgetConfig {
        const d: WidgetConfig = {
            label: "",
            tagName: "",
            position: {},
            inPanel: false,
            icon: "",
            config: {}
        };
        widgetConfig = Object.assign(d, widgetConfig);
        widgetConfig.position = Object.assign({
            left: 'auto',
            right: 'auto',
            bottom: 'auto',
            top: 'auto',
            /** 不需要设置默认宽高 */
            // width: 'auto',
            // height: 'auto',
            // 'z-index': 1
        }, getPositionStyle(widgetConfig.position));
        return widgetConfig;
    }

    /**
     * 添加widget到当前dom
     * @param {WidgetConfig}_config 
     */
    addWidget(_config: WidgetConfig) {
        _config = this.#getDefault(_config);
        try {
            // 生成图标
            if (_config.inPanel) {
                const icon = this.createIcon(_config);
                // 渲染图标
                this.appendChild(icon);
            }
            // 创建widget
            else {
                const widget = this.createWidget(_config);
                // 渲染widget
                this.appendChild(widget);
            }
        } catch (error) {
            console.error(error);
        }
    }

    /**
     * 创建一个widget图标
     * @param {WidgetConfig} _config 
     * @returns {BaseWidget}
     */
    createIcon(_config: WidgetConfig): BaseWidget {
        const icon = document.createElement('webgis-widget-icon') as BaseWidget;
        icon.startup({
            mapView: this.mapView,
            // map: this.map,
            config: _config,
            globalConfig: this.globalConfig,
            viewer: this.viewer,
        });

        // 不需要宽高
        const { width, height, ...position } = _config.position;
        const styleString = styleToString(position);
        icon.setAttribute('style', styleString);
        // icon.style.zIndex = '2';

        icon.title = _config.label || _config.tagName;
        return icon;
    }

    /**
     * 创建一个widget
     * @param {WidgetConfig}_config 
     * @returns {BaseWidget}
     */
    createWidget(_config: WidgetConfig): BaseWidget {
        if (!_config.tagName) {
            throw new Error(`tagName不能为空`);
        }
        const widget = document.createElement(_config.tagName) as BaseWidget;
        if (!widget.startup) {
            throw new Error(`没有找到tagName为${_config.tagName}的组件`);
        }
        widget.startup({
            mapView: this.mapView,
            // map: this.map,
            viewer: this.viewer,
            config: _config.config,
            globalConfig: this.globalConfig
        });

        const position = _config.position;
        const styleString = styleToString(position);
        widget.setAttribute('style', styleString);
        widget.style.zIndex = widget.style.zIndex || '1';

        return widget;
    }

}
