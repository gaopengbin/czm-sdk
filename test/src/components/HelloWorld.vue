<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import { initScene, SceneTree } from "../../../src/index";
import { UrlTemplateImageryProvider } from "cesium";
import { TreeOption } from "naive-ui";
let viewer: any = null;
let sceneTree: SceneTree;
let layers = ref([
  {
    name: "123",
    index: 1,
  },
]);
let defaultCheckedKeys = ref<any>([]);
nextTick(() => {
  viewer = initScene("container", {
    baseLayerPicker: false,
    baseLayer: false,
  });
  window.viewer = viewer;
  sceneTree = new SceneTree(viewer);
  console.log(sceneTree);
  layers.value = sceneTree.imageryLayers;

  sceneTree.updateEvent.addEventListener((val) => {
    layers.value = val;
    console.log(val);
    // return
    const flatLayers = layers2Flat(val);
    defaultCheckedKeys.value = [];
    flatLayers.forEach((layer: any) => {
      if (layer.show) {
        defaultCheckedKeys.value.push(layer.guid);
      }
    });
  });
});

const layers2Flat = (layers: any) => {
  const result: any = [];
  layers.forEach((layer: any) => {
    if (layer.children) {
      result.push(...layers2Flat(layer.children));
    } else {
      result.push(layer);
    }
  });
  return result;
};

const addImagery = () => {
  viewer.imageryLayers.addImageryProvider(
    new UrlTemplateImageryProvider({
      url: "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
    })
  );
};

const addMapserver = async () => {
  let arcgis = await sceneTree.createArcGisMapServerLayer({
    type: "ArcGisMapServer",
    name: "wujiang",
    url: "http://120.48.115.17:6080/arcgis/rest/services/wujiang/MapServer",
    show: true,
    zoomTo: true,
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

  group.addLayer(arcgis1);
  sceneTree.root?.addLayer(group);
  // sceneTree.addImageryLayer({
  //   type: "ArcGisMapServer",
  //   name: "wujiang",
  //   url: "http://120.48.115.17:6080/arcgis/rest/services/wujiang/MapServer",
  //   show: true,
  //   zoomTo: true,
  // });
  // sceneTree.addImageryLayer({
  //   type: "ArcGisMapServer",
  //   name: "宿豫区",
  //   url: "http://120.48.115.17:6080/arcgis/rest/services/3857/MapServer",
  //   show: true,
  //   zoomTo: true,
  // });
};
interface SceneTreeOption extends TreeOption {
  name: string;
  children?: Array<TreeOption>;
  show?: boolean;
  guid: string;
  zoomTo: () => void;
}
const nodeProps = ({ option }: { option: SceneTreeOption }) => {
  return {
    onClick() {
      console.log("click", option);
      option.zoomTo();
    },
  };
};
const updateCheckedKeys = (
  keys: Array<string | number>,
  options: Array<TreeOption | null>,
  meta: {
    node: TreeOption | null;
    action: "check" | "uncheck";
  }
) => {
  if (meta.node) {
    console.log(meta.node);
    if (meta.node?.children) {
      meta.node.children.forEach((child: any) => {
        // keys.push(child.index)
      });
    } else {
      meta.node.show = meta.action === "check";
    }
  }
  defaultCheckedKeys.value = keys;
};
</script>

<template>
  <div>
    <div id="container"></div>
    <button type="button" class="btn btn-primary" @click="addImagery">
      Primary
    </button>
    <button type="button" class="btn btn-primary" @click="addMapserver">
      Primary
    </button>
    <!-- <basic-test />
    <w-comp /> -->
    <div class="layerlist">
      <NTree
        block-line
        :data="layers"
        key-field="guid"
        label-field="name"
        children-field="children"
        selectable
        checkable
        cascade
        :checked-keys="defaultCheckedKeys"
        :node-props="nodeProps"
        @update:checked-keys="updateCheckedKeys"
        :default-expand-all="true"
      />
    </div>
  </div>
</template>

<style scoped>
#container {
  width: 90vw;
  height: 80vh;
}
.layerlist {
  position: absolute;
  top: 0;
  right: 0;
  width: 200px;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.5);
}
</style>
