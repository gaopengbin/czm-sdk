# 更新记录

- [版本 0.0.0](#版本-0.0.0)

- [版本 0.0.1](#版本-0.0.1)

...

# [版本 0.0.17] 2024.07.01

- 1.GeoJson 加载支持点和线配置，支持点的聚合
- 2.识别组件支持点击 entity 高亮
- 3.新增状态栏组件
- 4.新增 glb/gltf 模型加载配置

# [版本 0.0.18] 2024.07.02

- 1.识别组件鼠标样式 cursor = 'help'
- 2.新增界面化服务加载组件 loader-ui

# [版本 0.0.19] 2024.07.04

- 1.识别组件更新，包括界面、识别逻辑
- 2.为配合识别功能修改了以下类中的方法
  ArcGisMapServerImageryProvider.prototype.pickFeatures
  SSMapServerProvider.prototype.pickFeatures
  ImageryLayerCollection.prototype.pickImageryLayerFeatures2
- 3.修复了配置中的图层顺序与图上叠加顺序不符的问题

# [版本 0.0.20] 2024.07.05

- 1.识别组件支持穿透点击，但是实体（3dtiles、geojson、entity 等）与服务（imagery）是分开的，前者拾取优先级更高。
- 2.SceneTree 新增 removeLayerByGuid 方法

# [版本 0.0.21] 2024.07.08

- 1.开放 guid 属性设置（代码中设置、json 配置）
- 2.增加扩展属性（代码中设置、json 配置）
- 3.图层列表增加移除按钮
