import { SceneTree } from '@/lib';
import { transformCartesianToWGS84 } from '@/lib/cesium/measure';
import * as Cesium from 'cesium';
export class SceneManager {

  inputFile(accept?: string): Promise<File> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.id = 'file-input';
      input.type = 'file';
      input.accept = accept || '*';
      input.onchange = () => {
        if (input.files && input.files[0]) {
          resolve(input.files[0]);
        } else {
          reject('No file selected');
        }
      };
      const button = document.createElement('button');
      button.style.display = 'block'; // 确保按钮在 DOM 中可见
      button.onclick = () => {
        input.click();
      };
      document.body.appendChild(button);
      button.click();
      document.body.removeChild(button);
    });
  }

  fileToJSON(file: File): Promise<any> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          resolve(JSON.parse(reader.result as string));
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsText(file);
    });
  }

  async addScene(option: { name?: string, json: any, viewer: Cesium.Viewer, sceneTree: SceneTree }): Promise<any> {
    const { name, json, viewer, sceneTree } = option;
    const group = sceneTree.createGroup(name || '新局部场景')
    group.isScene = true;
    sceneTree.root.addLayer(group);
    const dataSource = await Cesium.GeoJsonDataSource.load(json, {
      markerSize: 0,
    });
    viewer.dataSources.add(dataSource);
    viewer.zoomTo(dataSource);
    const entities = dataSource.entities.values;

    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      entity.billboard = undefined;
      // entity.point = new Cesium.PointGraphics({
      //   color: Cesium.Color.WHITE.withAlpha(0.1),
      //   pixelSize: 1,
      // });
      const propertyNames = entity.properties?.propertyNames;
      const position = entity.position?.getValue(new Cesium.JulianDate());
      if (!position) continue;
      let pos = transformCartesianToWGS84(viewer, position);
      if (!propertyNames) continue;
      const options: any = {};
      propertyNames.forEach((name) => {
        options[name] = entity.properties ? entity.properties[name].getValue() : undefined;
      });
      options.position = [pos?.lon, pos?.lat, pos?.alt];
      try {
        if (options.parent) {
          const parent = sceneTree.getLayerByGuid(options.parent.guid);
          if (parent) {
            const m: any = await sceneTree.createLayer(options);
            m.showLabel = false
            parent.addLayer(m);
          } else {
            const g = sceneTree.createGroup(options.parent.name, options.parent.guid)
            const m: any = await sceneTree.createLayer(options);
            m.showLabel = false
            g.addLayer(m);
            group.addLayer(g);
          }
        } else {
          const m: any = await sceneTree.createLayer(options);
          m.showLabel = false
          group.addLayer(m);
        }
      } catch (error) {

      }

    }
    // 清除dataSource
    viewer.dataSources.remove(dataSource);
    // dataSource.entities.values.forEach(async (entity) => {
    //   entity.billboard = undefined;
    //   entity.point = new Cesium.PointGraphics({
    //     color: Cesium.Color.WHITE.withAlpha(0.1),
    //     pixelSize: 1,
    //   });
    //   const propertyNames = entity.properties?.propertyNames;
    //   if (!propertyNames) return;
    //   const options: any = {};
    //   propertyNames.forEach((name) => {
    //     options[name] = entity.properties ? entity.properties[name].getValue() : undefined;
    //   });

    //   if (options.parent) {
    //     const parent = sceneTree.getLayerByGuid(options.parent.guid);
    //     console.log("parent", parent, options.parent.guid)
    //     if (parent) {
    //       const m: any = await sceneTree.createLayer(options);
    //       m.showLabel = false
    //       parent.addLayer(m);
    //     } else {
    //       const g = sceneTree.createGroup(options.parent.name, options.parent.guid)
    //       const m: any = await sceneTree.createLayer(options);
    //       m.showLabel = false
    //       g.addLayer(m);
    //       group.addLayer(g);
    //       console.log("new parent", g)
    //     }
    //   } else {
    //     const m: any = await sceneTree.createLayer(options);
    //     m.showLabel = false
    //     group.addLayer(m);
    //   }


    // });
    return group;
  }
}
