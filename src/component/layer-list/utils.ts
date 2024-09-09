import BaseWidget from "../earth/base-widget"

export const showLegend = (layer: any, _this: any) => {
    const url = layer.toJSON().url
    const legendUrl = url + '/legend?f=json'
    fetch(legendUrl).then(response => response.json()).then(data => {
        const layers = data.layers
        const legendDiv = document.createElement('div')
        legendDiv.id = 'legendContent'
        layers.forEach((l: any) => {
            let div = document.createElement('div');
            div.classList.add('legend-layer');
            div.innerHTML = `<div class="title">${l.layerName}</div>`;
            l.legend.forEach((item: any) => {
                let style = `
                        width: ${item.width || 32}px;
                        height: ${item.width || 32}px;
                    `;
                let legend = document.createElement('div');
                legend.classList.add('legend-item');
                legend.innerHTML = `<div class="legend-img"><img style="${style}" 
                                    src="data:${item.contentType};base64,${item.imageData}">
                                    <div class="label">${item.label}</div></div>`;
                div.appendChild(legend);
            });
            legendDiv.appendChild(div);
        });
        const panel = document.createElement('webgis-widget-panel') as BaseWidget;

        panel.startup({
            mapView: _this.mapView,
            viewer: _this.viewer,
            config: {
                "label": `[${layer.name}]图例`,
                icon: "bi bi-list",
                position: {
                    top: 100,
                    left: 300,
                    width: '300px',
                    height: '400px',
                }
            },
            globalConfig: _this.globalConfig
        })
        document.querySelector('.webgis-widget-manager')?.appendChild(panel)
        panel.querySelector('.widget-content')?.appendChild(legendDiv)
    })
}

export const showStyle = (layer: any, _this: any) => {
    const panel = document.createElement('webgis-widget-panel') as BaseWidget;
    panel.startup({
        mapView: _this.mapView,
        viewer: _this.viewer,
        config: {
            "label": `[${layer.name}]样式`,
            icon: "bi bi-list",
            position: {
                top: 100,
                left: 300,
                width: '400px',
                height: '400px',
            }
        },
        globalConfig: _this.globalConfig
    })
    document.querySelector('.webgis-widget-manager')?.appendChild(panel)

    const styleSetting = document.createElement('style-setting') as BaseWidget;
    styleSetting.startup({
        mapView: _this.mapView,
        viewer: _this.viewer,
        config: {
            layer: layer,
        },
        globalConfig: _this.globalConfig
    })
    panel.querySelector('.widget-content')?.appendChild(styleSetting)

}