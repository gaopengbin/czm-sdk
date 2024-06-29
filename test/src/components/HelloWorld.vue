<script setup lang="ts">
import { Color } from "cesium";
import { SceneTree, getSceneTree } from "../../../src/index";
import "../../../src/lib/tree/tree-view.scss";

let sceneTree: SceneTree;

const addMapserver = async () => {
  sceneTree = getSceneTree();
  let geojson = await sceneTree.createGeoJsonLayer({
    type: "geojson",
    name: "geojson",
    url: "http://120.46.179.233/geoserver/village/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=village%3A%E7%BD%91%E6%A0%BC&maxFeatures=50&outputFormat=application%2Fjson",
    show: true,
    zoomTo: false,
    stroke: Color.RED,
    strokeWidth: 5,
    fill: Color.BLUE.withAlpha(0.5),
  });
  sceneTree.root?.addLayer(geojson);
  let ssmapserver = await sceneTree.createSSMapServerLayer({
    type: "ssmapserver",
    name: "TWWW",
    url: "http://192.168.0.10:7578/services/TW/MapServer",
    show: true,
    zoomTo: false,
  });
  sceneTree.root?.addLayer(ssmapserver);
  let arcgis = await sceneTree.createArcGisMapServerLayer({
    type: "ArcGisMapServer",
    name: "wujiang",
    url: "http://120.48.115.17:6080/arcgis/rest/services/wujiang/MapServer",
    show: true,
    zoomTo: false,
  });
  sceneTree.root?.addLayer(arcgis);
  let arcgis1 = await sceneTree.createArcGisMapServerLayer({
    type: "ArcGisMapServer",
    name: "宿豫区",
    url: "http://120.48.115.17:6080/arcgis/rest/services/3857/MapServer",
    show: true,
    zoomTo: false,
  });
  let group = sceneTree.createGroup("group1");
  console.log(group, arcgis1);

  sceneTree.root?.addLayer(group);
  group.addLayer(arcgis1);

  let tileset = await sceneTree.addTilesetLayer({
    url: "http://120.48.115.17:81/data/F0001/tileset.json",
    name: "tileset",
    type: "3dtile",
  });
  group.addLayer(tileset);

  let wms = await sceneTree.createWMSLayer({
    type: "WMS",
    name: "wms",
    url: "http://120.46.179.233/geoserver/village/wms",
    layers: "village:合并",
    rectangle: [
      113.79589260058276, 35.213881770316036, 113.79991195207892,
      35.216112772339805,
    ],
    tilingScheme: "geographic",
    parameters: {
      transparent: true,
      format: "image/png",
    },
  });
  console.log(wms);
  group.addLayer(wms);

  let xyz = await sceneTree.createXYZLayer({
    type: "XYZ",
    name: "xyz",
    url: "http://120.48.115.17:81/data/beijing14/{z}/{x}/{y}.png",
    rectangle: [
      115.423307418823, 39.4427553831086, 117.514657974243, 41.060909292508,
    ],
    minimumLevel: 0,
    maximumLevel: 13,
  });

  group.addLayer(xyz);

  // let terrain = await sceneTree.createTerrainLayer({
  //   type: "Terrain",
  //   name: "terrain",
  //   url: "http://www.supermapol.com/realspace/services/3D-stk_terrain/rest/realspace/datas/info/data/path",
  //   rectangle: [
  //     115.423307418823, 39.4427553831086, 117.514657974243, 41.060909292508,
  //   ],
  //   requestMetadata: true,
  // });

  // group.addLayer(terrain);
};
</script>

<template>
  <div>
    <basic-test />
    <base-earth configUrl="config/config.json" />
    <!-- <base-layer /> -->
    <!-- <div id="container"></div> -->
    <div class="btn">
      <button type="button" class="btn btn-primary" @click="addMapserver">
        addMapserver
      </button>
    </div>

    <!-- <basic-test />
    <w-comp /> -->
    <div class="layerlist">
      <layer-list />
    </div>
  </div>
</template>

<style scoped>
#container {
  width: 80vw;
  height: 80vh;
}

.layerlist {
  margin: 10px;
  position: absolute;
  padding: 10px;
  bottom: 0;
  right: 0;
  width: 250px;
  height: 300px;
  background-color: rgb(255, 255, 255);
}

.btn {
  position: absolute;
  z-index: 99;
}
</style>
