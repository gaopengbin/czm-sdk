<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import {
  initScene,
  SceneTree,
  BaseWidget,
  getViewer,
  getSceneTree,
} from "../../../src/index";
import { Tree } from "../../../src/lib/tree/tree";
import "../../../src/lib/tree/tree-view.scss";
import { UrlTemplateImageryProvider, Cesium3DTileset } from "@cesium/engine";
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
nextTick(async () => {
  // let viewer = initScene("container", {
  //   baseLayerPicker: false,
  //   baseLayer: false,
  //   projectionPicker: true,
  //   // infoBox: false,
  // });
  // //   window.viewer = viewer;

  // //   // 加载tileset http://120.48.115.17:81/data/F0001/tileset.json
  // const tileset = await Cesium3DTileset.fromUrl(
  //   "http://120.48.115.17:81/data/F0001/tileset.json"
  // );
  // let t = viewer.scene.primitives.add(tileset);

  // viewer.zoomTo(t);

  //   sceneTree = new SceneTree(viewer);
  //   console.log(sceneTree);
  //   layers.value = sceneTree.imageryLayers;

  //   sceneTree.updateEvent.addEventListener((val) => {
  //     layers.value = val;
  //     console.log(val);
  //     treeview.updateTree(val);
  //     // return;
  //     const flatLayers = layers2Flat(val);
  //     console.log(flatLayers);
  //     defaultCheckedKeys.value = [];
  //     flatLayers.forEach((layer: any) => {
  //       if (layer.show) {
  //         defaultCheckedKeys.value.push(layer.guid);
  //       }
  //     });
  //   });
  //   initTreeView();
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
  // sceneTree = BaseWidget.prototype.sceneTree;
  sceneTree = getSceneTree();
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
let treeview: any;
const initTreeView = () => {
  treeview = new Tree({
    el: document.getElementById("test"),
    treeData: layers.value,
    style: {
      // parentIcon: "src/assets/images/文件夹@2x.png",
      parentIcon: "bi bi-folder",
      childrenIcon: "bi bi-file-earmark-image",
    },
    defaultExpandAll: true,
    props: {
      label: "name",
      children: "children",
      labelRender: (data: any) => {
        return data.name;
        // if (data.children) {
        //   return `<font style="color:var(--bs-emphasis-color)">${data.label}</font>`;
        // } else {
        //   return `<font color='red'>${data.label}</font>`;
        // }
      },
      handleNodeClick: (node: any, e: Event) => {
        console.log("handleNodeClick", node, e);
      },
      extraBtns: [
        {
          name: "显示",
          icon: "bi bi-eye",
          onClick: (node: any, btn) => {
            console.log("显示", node, btn);
            node.show = !node.show;
            btn.setIcon(node.show ? "bi bi-eye" : "bi bi-eye-slash");
            // sceneTree.showLayer(node.guid, node.show);
          },
          show: (node: any) => !node.children,
        },
        {
          name: "定位",
          icon: "bi bi-geo-alt",
          onClick: (node: any) => {
            console.log("定位", node);
            node.zoomTo();
          },
          show: (node: any) => !node.children,
        },
      ],
    },
  });
  treeview.initialize();
};
</script>

<template>
  <div>
    <basic-test />
    <base-earth />

    <!-- <div id="container"></div> -->
    <button type="button" class="btn btn-primary" @click="addImagery">
      Primary
    </button>
    <button type="button" class="btn btn-primary" @click="addMapserver">
      addMapserver
    </button>
    <!-- <basic-test />
    <w-comp /> -->
    <div class="layerlist">
      <layer-list />
      <!-- <NTree
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
      <div id="test"></div> -->
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
  top: 0;
  right: 0;
  width: 250px;
  height: 300px;
  background-color: rgb(255, 255, 255);
}
</style>
