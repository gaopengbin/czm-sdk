import { BaseWidget } from "@/index";

export const creatPanel = (options: any) => {
    const panel = document.createElement('webgis-widget-panel') as BaseWidget;
    panel.startup({
        mapView: options.mapView,
        viewer: options.viewer,
        config: options.config,
        globalConfig: options.globalConfig,
    })
    document.querySelector('.webgis-widget-manager')?.appendChild(panel)

    let widget = null
    if (options.widget instanceof HTMLElement) {
        widget = options.widget
    } else {
        widget = createWidget(options.widget)
    }
    panel.querySelector('.widget-content')?.appendChild(widget)
    panel.setWidget(widget)
    return panel
}

export const createWidget = (options: any) => {
    const widget = document.createElement(options.tagName) as BaseWidget;
    widget.startup({
        mapView: options.mapView,
        viewer: options.viewer,
        config: options.config,
        globalConfig: options.globalConfig,
    })
    return widget
}