---
title: vtk.js中ProxyManager的API整理v1.0
date: 2021-06-29 11:29:56
categories:
- 医学影像处理
tags:
- 医学影像处理
- vtk.js
- 前端
- React
- API文档
---





这个 ProxyManager 官方似乎是不给api文档的，尝试自己总结一下：

**当前vtk.js 版本：18.2.0**

**使用例来源大多数来自paraview-glance**

<!-- more -->

## 🔵基础API

### setProxyConfiguration

设置proxyConfiguration

### getProxyConfiguration

获取proxyConfiguration

### ~~setActiveSource~~

~~设置activeSource~~

### getActiveSource

设置activeSource

**使用例:**

```javascript
    const source = this.$proxyManager.getActiveSource();
    if (source) {
      this.setInternalValue(source.getProxyId());
    }
    this.updateSourceList();
```

### ~~setActiveView~~

~~设置activeView~~

### getActiveView

设置activeView

**使用例:**

```java
const activeView = this.$proxyManager.getActiveView();.
```



## 🔵事件 

### onActiveSourceChange

当 activeSource 改变

**使用例:**

```javascript
              this.$proxyManager.onActiveSourceChange((s) =>
                macro.setImmediate(() =>
                  hooks.onActiveSourceChange.call(this, s)
                )
              )
```

### onActiveViewChange

当 activeView 改变

**使用例:**

```javascript
              this.$proxyManager.onActiveViewChange((v) =>
                macro.setImmediate(() => hooks.onActiveViewChange.call(this, v))
              )
```

### onProxyRegistrationChange

当 proxyRegistration 改变时

**使用例**

```javascript
              this.$proxyManager.onProxyRegistrationChange((info) => {
                const { action, proxyId, proxy } = info;
                if (action === 'register') {
                  if (hooks.onProxyCreated) {
                    hooks.onProxyCreated.call(this, info);
                  }
                  if (hooks.onProxyModified) {
                    proxySubs[proxyId] = proxy.onModified((p) =>
                      hooks.onProxyModified.call(this, p)
                    );
                  }
                } else if (action === 'unregister') {
                  if (proxyId in proxySubs) {
                    proxySubs[proxyId].unsubscribe();
                    delete proxySubs[proxyId];
                  }
                  if (hooks.onProxyDeleted) {
                    hooks.onProxyDeleted.call(this, info);
                  }
                }
                if (hooks.onProxyRegistrationChange) {
                  hooks.onProxyRegistrationChange.call(this, info);
                }
              })
```



## 🔵核心core

### setActiveSource

设置 activeSource

**源码**

```javascript
publicAPI.setActiveSource = (source) => {
    if (model.activeSource !== source) {
      if (model.activeSourceSubscription) {
        model.activeSourceSubscription.unsubscribe();
        model.activeSourceSubscription = null;
      }
      model.activeSource = source;
      if (source) {
        model.activeSourceSubscription = source.onModified(publicAPI.modified);
      }
      publicAPI.modified();
      publicAPI.invokeActiveSourceChange(source);
    }
  };
```



### setActiveView

设置 activeView

**源码**

```javascript
  publicAPI.setActiveView = (view) => {
    if (model.activeView !== view) {
      if (model.activeViewSubscription) {
        model.activeViewSubscription.unsubscribe();
        model.activeViewSubscription = null;
      }
      model.activeView = view;
      if (view) {
        model.activeViewSubscription = view.onModified(publicAPI.modified);
      }
      publicAPI.modified();
      publicAPI.invokeActiveViewChange(view);
    }
  };
```



### getProxyById

获取 proxy 通过 id

**源码**

```javascript
publicAPI.getProxyById = (id) => model.proxyIdMapping[id];
```

**使用例**

```javascript
    source() {
      return this.$proxyManager.getProxyById(this.sourceId);
    },
```



### getProxyGroups

获取 proxy Groups

**源码**

```javascript
publicAPI.getProxyGroups = () => Object.keys(model.proxyByGroup);
```

**使用例**

```javascript
const groups = this.$proxyManager.getProxyGroups();
```



### getProxyInGroup

获取 group 中的proxy

**源码**

```javascript
  publicAPI.getProxyInGroup = (name) =>
    [].concat(model.proxyByGroup[name] || []);
```

**使用例**

```javascript
              for (let i = 0; i < groups.length; i++) {
                const name = groups[i];
                proxies = proxies.concat(
                  this.$proxyManager.getProxyInGroup(name)
                );
              }
```



### getSources

获取 sources

**源码**

```javascript
 publicAPI.getSources = () => [].concat(model.proxyByGroup.Sources || []);
```

**使用例**

```javascript
            // restore proxy keys
            proxyManager.getSources().forEach((source) => {
              const ds = source.getDataset();
              if (restoreProxyKeys.has(ds)) {
                const kv = restoreProxyKeys.get(ds);
                Object.keys(kv).forEach((key) => source.setKey(key, kv[key]));
              }
            });
```



### getRepresentations

获取所有 Representations

**源码**

```javascript
  publicAPI.getRepresentations = () =>
    [].concat(model.proxyByGroup.Representations || []);
```

**使用例**

```javascript
        const myReps = this.$proxyManager
          .getRepresentations()
          .filter((r) => r.getInput() === this.source);
```



### getViews

获取所有 views

**源码**

```javascript
 publicAPI.getViews = () => [].concat(model.proxyByGroup.Views || []);
```

**使用例**

```javascript
const views2D = pxm.getViews().filter((v) => v.isA('vtkView2DProxy'));
...
const view3d = pxm.getViews().find((v) => v.getProxyName() === 'View3D');
...
const view = this.$proxyManager.getViews()[0];
```



### createProxy

创建 proxy

**源码**

```javascript
  publicAPI.createProxy = (group, name, options) => {
    const { definitions } = model.proxyConfiguration;
    if (!definitions[group] || !definitions[group][name]) {
      return null;
    }
    const definition = definitions[group][name];
    const definitionOptions = { ...definition.options, ...options };
    const proxy = definition.class.newInstance({
      ...definitionOptions,
      proxyGroup: group,
      proxyName: name,
      proxyManager: publicAPI,
    });

    // Handle proxy property settings
    if (definition.proxyProps) {
      const proxyMap = {};
      Object.keys(definition.proxyProps).forEach((key) => {
        const newProxyDef = definition.proxyProps[key];
        proxyMap[key] = publicAPI.createProxy(
          newProxyDef.group,
          newProxyDef.name,
          newProxyDef.options
        );
      });
      proxy.set(proxyMap);
    }

    // Handle property setting
    if (definition.props) {
      proxy.set(definition.props);
    }

    registerProxy(proxy);

    if (definitionOptions.activateOnCreate) {
      proxy.activate();
    }

    return proxy;
  };
```

**使用例**

```javascript
const view = proxyManager.createProxy('Views', 'ItkVtkView');
...
const imageSource = proxyManager.createProxy('Sources', 'TrivialProducer', {
          name: 'Image',
});

```



### getRepresentation

获取 Representation

**源码**

```javascript
  publicAPI.getRepresentation = (source, view) => {
    const sourceToUse = source || publicAPI.getActiveSource();
    const viewToUse = view || publicAPI.getActiveView();

    // Can only get a representation for a source and a view
    if (!sourceToUse || !viewToUse || !sourceToUse.getType()) {
      return null;
    }

    const sourceId = sourceToUse.getProxyId();
    const viewId = viewToUse.getProxyId();

    let viewRepMap = model.sv2rMapping[sourceId];
    if (!viewRepMap) {
      viewRepMap = {};
      model.sv2rMapping[sourceId] = viewRepMap;
    }
    let rep = viewRepMap[viewId];
    if (!rep) {
      const viewName = viewToUse.getProxyName();
      const sourceType = sourceToUse.getType();
      const definition =
        model.proxyConfiguration.representations[viewName][sourceType];
      if (!definition) {
        vtkErrorMacro(
          `No definition for representation of ${sourceType} in view ${viewName}`
        );
        return null;
      }
      rep = publicAPI.createProxy(
        'Representations',
        definition.name,
        definition.options
      );

      model.r2svMapping[rep.getProxyId()] = { sourceId, viewId };
      viewRepMap[viewId] = rep;

      rep.setInput(sourceToUse);
      viewToUse.addRepresentation(rep);
    }
    return rep;
  };
```

**使用例**

```javascript
const imageRepresentation = proxyManager.getRepresentation(imageSource, view);
...
const sliceActors = imageRepresentation.getActors();
sliceActors.forEach((actor) => {
	actor.getProperty().setRGBTransferFunction(lut);
});
```



### deleteProxy

删除代理

**源码**

```java
  publicAPI.deleteProxy = (proxy) => {
    const group = proxy.getProxyGroup().toLowerCase();

    if (group === 'views') {
      proxy.getRepresentations().forEach((repProxy) => {
        publicAPI.deleteProxy(repProxy);
      });
      proxy.setContainer(null);
      unRegisterProxy(proxy);
      if (publicAPI.getActiveView() === proxy) {
        publicAPI.setActiveView(publicAPI.getViews()[0]);
      }
    } else if (group === 'representations') {
      const { sourceId, viewId } = model.r2svMapping[proxy.getProxyId()];
      const view = publicAPI.getProxyById(viewId);
      view.removeRepresentation(proxy);
      delete model.r2svMapping[proxy.getProxyId()];
      delete model.sv2rMapping[sourceId][viewId];
      unRegisterProxy(proxy);
    } else if (group === 'sources') {
      const viewToRep = model.sv2rMapping[proxy.getProxyId()];
      Object.keys(viewToRep).forEach((viewId) => {
        publicAPI.deleteProxy(viewToRep[viewId]);
      });
      unRegisterProxy(proxy);
      if (publicAPI.getActiveSource() === proxy) {
        publicAPI.setActiveSource(publicAPI.getSources()[0]);
      }
    } else {
      unRegisterProxy(proxy);
    }

    // Delete the object itself
    proxy.delete();
  };
```

**使用例**

```javascript
    deleteDataset(sourceId) {
      const proxy = this.$proxyManager.getProxyById(sourceId);
      if (proxy) {
        this.$proxyManager.deleteProxy(proxy);
      }
    },
```



## 🔵状态 state

### loadState

加载 state

**源码**

```javascript
  publicAPI.loadState = (state, options = {}) =>
    new Promise((resolve, reject) => {
      const proxyMapping = {};
      const $oldToNewIdMapping = {};
      const cameras = {};
      const datasetHandler = options.datasetHandler || vtk;
      const sourcePromises = [];

      state.sources.forEach(({ id, group, name, props }) => {
        sourcePromises.push(
          Promise.resolve(datasetHandler(props.dataset)).then((dataset) => {
            if (dataset) {
              const proxy = publicAPI.createProxy(group, name);
              proxy.setName(props.name);
              proxy.setInputData(dataset, props.type);
              proxyMapping[id] = proxy;
              return proxy;
            }
            return null;
          })
        );
      });

      Promise.all(sourcePromises)
        .then(() => {
          const views = publicAPI.getViews();
          state.views.forEach(({ id, group, name, props, camera }) => {
            let proxy = null;
            if (state.options.recycleViews) {
              proxy = views.find(
                (v) =>
                  v.getProxyGroup() === group &&
                  v.getProxyName() === name &&
                  v.getName() === props.name
              );
            }
            if (!proxy) {
              proxy = publicAPI.createProxy(group, name, {
                disableAnimation: true,
              });
            } else {
              proxy.setDisableAnimation(true);
            }

            proxy.set(props, true);
            proxyMapping[id] = proxy;
            cameras[id] = camera;
          });

          function updateView(view) {
            if (!proxyMapping[view] || !cameras[view]) {
              return;
            }
            proxyMapping[view].resetOrientation().then(() => {
              proxyMapping[view].getCamera().set(cameras[view]);
              proxyMapping[view]
                .getRenderer()
                .updateLightsGeometryToFollowCamera();
              proxyMapping[view].renderLater();
            });
          }

          state.representations.forEach(({ source, view, props }) => {
            const proxy = publicAPI.getRepresentation(
              proxyMapping[source],
              proxyMapping[view]
            );
            proxy.set(props, true);
            updateView(view);
          });

          // restore luts and pwfs after restoring reps to avoid
          // rep initialization from resetting restored luts/pwfs
          Object.keys(state.fields).forEach((fieldName) => {
            const { lookupTable, piecewiseFunction } = state.fields[fieldName];
            const lutProxy = publicAPI.getLookupTable(fieldName, lookupTable);
            lutProxy.setPresetName(lookupTable.presetName);
            lutProxy.setDataRange(...lookupTable.dataRange);
            const pwfProxy = publicAPI.getPiecewiseFunction(
              fieldName,
              piecewiseFunction
            );
            switch (piecewiseFunction.mode) {
              case vtkPiecewiseFunctionProxy.Mode.Gaussians:
                pwfProxy.setGaussians(piecewiseFunction.gaussians);
                break;
              case vtkPiecewiseFunctionProxy.Mode.Points:
                pwfProxy.setPoints(piecewiseFunction.points);
                break;
              case vtkPiecewiseFunctionProxy.Mode.Nodes:
                pwfProxy.setNodes(piecewiseFunction.nodes);
                break;
              default:
                // nothing that we can do
                break;
            }
            pwfProxy.setMode(piecewiseFunction.mode);
            pwfProxy.setDataRange(...piecewiseFunction.dataRange);
          });

          // Apply camera no matter what
          Object.keys(cameras).forEach(updateView);

          // Create id mapping
          Object.keys(proxyMapping).forEach((originalId) => {
            const newId = proxyMapping[originalId].getProxyId();
            $oldToNewIdMapping[originalId] = newId;
          });

          // Re-enable animation on views
          state.views.forEach(({ id }) => {
            proxyMapping[id].setDisableAnimation(false);
          });

          resolve({ ...state.userData, $oldToNewIdMapping });
        })
        .catch(reject);
    });
```

**使用例**

```javascript
      restoreAppState({ commit, dispatch, state }, appState) {
        commit('loadingState', true);

        const restoreProxyKeys = new WeakMap();

        dispatch('resetWorkspace');
        return proxyManager
          .loadState(appState, {
            datasetHandler(ds) {
            ...
```



### saveState

保存 state

**源码**

```javascript
  publicAPI.saveState = (options = {}, userData = {}) =>
    new Promise((resolve, reject) => {
      const sources = publicAPI.getSources();
      // const representations = publicAPI.getRepresentations();
      const views = publicAPI.getViews();

      // Extract handlers
      const datasetHandler = options.datasetHandler || ((d) => d.getState());
      delete options.datasetHandler;
      const datasets = [];

      const fieldNames = new Set();
      const state = {
        userData,
        options,
        sources: [],
        views: [],
        representations: [],
        fields: {},
      };
      sources.forEach((source) => {
        const dataset = Promise.resolve(
          datasetHandler(source.getDataset(), source)
        );
        datasets.push(dataset);
        state.sources.push({
          id: source.getProxyId(),
          group: source.getProxyGroup(),
          name: source.getProxyName(),
          props: {
            name: source.getName(),
            type: source.getType(),
            dataset,
          },
        });
      });
      views.forEach((view) => {
        const camera = view.getCamera().get('position', 'viewUp', 'focalPoint');
        state.views.push({
          id: view.getProxyId(),
          group: view.getProxyGroup(),
          name: view.getProxyName(),
          props: Object.assign(
            getProperties(view),
            view.get('axis', 'orientation', 'viewUp')
          ),
          camera,
        });

        // Loop over view representations
        const representations = view.getRepresentations();
        representations.forEach((representation) => {
          state.representations.push({
            source: representation.getInput().getProxyId(),
            view: view.getProxyId(),
            props: getProperties(representation),
          });
          fieldNames.add(representation.getColorBy()[0]);
        });
      });

      fieldNames.forEach((fieldName) => {
        state.fields[fieldName] = {
          lookupTable: publicAPI
            .getLookupTable(fieldName)
            .get(
              'mode',
              'presetName',
              'rgbPoints',
              'hsvPoints',
              'nodes',
              'arrayName',
              'arrayLocation',
              'dataRange'
            ),
          piecewiseFunction: publicAPI
            .getPiecewiseFunction(fieldName)
            .get(
              'mode',
              'gaussians',
              'points',
              'nodes',
              'arrayName',
              'arrayLocation',
              'dataRange'
            ),
        };
      });

      Promise.all(datasets)
        .then(() => {
          // Patch datasets in state to the result of the promises
          for (let i = 0; i < state.sources.length; i++) {
            state.sources[i].props.dataset.then((value) => {
              state.sources[i].props.dataset = value;
            });
          }

          // provide valide state
          resolve(state);
        })
        .catch(reject);
    });
```

**使用例**

```javascript
        const zip = new JSZip();
        proxyManager.saveState(options, userData).then((stateObject) => {
          zip.file('state.json', JSON.stringify(stateObject));
          zip
```



## 🔵视口 view

### create3DView

创建3D视口

**源码**

```javascript
  publicAPI.create3DView = (options) =>
    publicAPI.createProxy('Views', 'View3D', options);
```



### create2DView

创建2D视口

**源码**

```javascript
  publicAPI.create2DView = (options) =>
    publicAPI.createProxy('Views', 'View2D', options);
```



### render

渲染单个view

**源码**

```javascript
  publicAPI.render = (view) => {
    const viewToRender = view || publicAPI.getActiveView();
    if (viewToRender) {
      viewToRender.renderLater();
    }
  };
```



### renderAllViews

渲染所有views

**源码**

```javascript
  publicAPI.renderAllViews = (blocking = false) => {
    const allViews = publicAPI.getViews();
    for (let i = 0; i < allViews.length; i++) {
      allViews[i].render(blocking);
    }
  };
```

**使用例**

```javascript
        view.resize();
        proxyManager.renderAllViews();
```



### setAnimationOnAllViews

在所有views上设置动画

**源码**

```javascript
  publicAPI.setAnimationOnAllViews = (enable = false) => {
    const allViews = publicAPI
      .getViews()
      .filter((v) => !enable || v.getContainer());
    for (let i = 0; i < allViews.length; i++) {
      allViews[i].setAnimation(enable, publicAPI);
    }
  };
```

**使用例**

```javascript
    this.piecewiseWidget.onAnimation((animating) => {
      const pwfproxy = this.piecewiseFunction;
      if (pwfproxy) {
        this.proxyManager.setAnimationOnAllViews(animating);
      }
    }),
```



### clearAnimations

清理所有动画

**源码**

```javascript
  function clearAnimations() {
    model.animating = false;
    const allViews = publicAPI.getViews();
    for (let i = 0; i < allViews.length; i++) {
      allViews[i].setAnimation(false, publicAPI);
    }
  }
```



### autoAnimateViews

自动播放动画

**源码**

```javascript
  publicAPI.autoAnimateViews = (debouceTimout = 250) => {
    if (!model.animating) {
      model.animating = true;
      const allViews = publicAPI.getViews().filter((v) => v.getContainer());
      for (let i = 0; i < allViews.length; i++) {
        allViews[i].setAnimation(true, publicAPI);
      }
      model.clearAnimations = macro.debounce(clearAnimations, debouceTimout);
    }
    model.clearAnimations();
  };
```

**使用例**

```javascript
  proxyManagerHooks: {
    onProxyModified() {
      if (!this.loadingState) {
        this.$proxyManager.autoAnimateViews();
      }
    },
  },
```



### resizeAllViews

重置视口大小

**源码**

```javascript
  publicAPI.resizeAllViews = () => {
    const allViews = publicAPI.getViews();
    for (let i = 0; i < allViews.length; i++) {
      allViews[i].resize();
    }
  };
```

**使用例**

```javascript
window.addEventListener('resize', proxyManager.resizeAllViews);
...
...
updated() {
    this.$proxyManager.resizeAllViews();
},
```



### resetCamera

重置Camera

**源码**

```javascript
  publicAPI.resetCamera = (view) => {
    const viewToRender = view || publicAPI.getActiveView();
    if (viewToRender && viewToRender.resetCamera) {
      viewToRender.resetCamera();
    }
  };
```

**使用例**

```javascript
    resetCamera() {
      if (this.view) {
        this.view.resetCamera();
      }
    },
```



### createRepresentationInAllViews

在所有views 上创建 Representation

**源码**

```javascript
  publicAPI.createRepresentationInAllViews = (source) => {
    const allViews = publicAPI.getViews();
    for (let i = 0; i < allViews.length; i++) {
      publicAPI.getRepresentation(source, allViews[i]);
    }
  };
```

**使用例**

```javascript
proxyManager.createRepresentationInAllViews(imageSource);
const imageRepresentation = proxyManager.getRepresentation(imageSource, view);
```



### resetCameraInAllViews

重置所有views上面的摄像头

**源码**

```javascript
  publicAPI.resetCameraInAllViews = () => {
    const allViews = publicAPI.getViews();
    for (let i = 0; i < allViews.length; i++) {
      allViews[i].resetCamera();
    }
  };
```

**使用例**

```javascript
        setTimeout(() => {
          proxyManager.renderAllViews();
          proxyManager.resetCameraInAllViews();
        }, 0);
```



## 🔵属性 properties

### getSections

获取 sections

```javascript
  publicAPI.getSections = () => {
    const sections = [];
    const source = publicAPI.getActiveSource();
    if (!source) {
      return [];
    }
    const view = publicAPI.getActiveView();
    if (source) {
      const section = source.getProxySection();
      if (section.ui.length) {
        sections.push(
          Object.assign(section, {
            collapsed: model.collapseState[section.name],
          })
        );
      }
    }
    if (source && view) {
      const representation = publicAPI.getRepresentation(source, view);
      if (representation) {
        const section = representation.getProxySection();
        if (section.ui.length) {
          sections.push(
            Object.assign(section, {
              collapsed: model.collapseState[section.name],
            })
          );
        }
      }
    }
    if (view) {
      const section = view.getProxySection();
      if (section.ui.length) {
        sections.push(
          Object.assign(section, {
            collapsed: model.collapseState[section.name],
          })
        );
      }
    }
    return sections;
  };
```

**使用例**

```javascript
无...
```



### updateCollapseState

更新 数据的 CollapseState

**源码**

```javascript
  publicAPI.updateCollapseState = (name, state) => {
    model.collapseState[name] = state;
    publicAPI.modified();
  };
```

**使用例**

```javascript
无...
```



### applyChanges

**源码**

```javascript
  publicAPI.applyChanges = (changeSet) => {
    const groupBy = {};
    const keys = Object.keys(changeSet);
    let count = keys.length;
    while (count--) {
      const key = keys[count];
      const [id, prop] = key.split(':');
      if (!groupBy[id]) {
        groupBy[id] = {};
      }
      if (changeSet[key] === '__command_execute__') {
        const obj = publicAPI.getProxyById(id);
        if (obj) {
          obj[prop]();
        }
      } else {
        groupBy[id][prop] = changeSet[key];
      }
    }

    // Apply changes
    const objIds = Object.keys(groupBy);
    count = objIds.length;
    while (count--) {
      const id = objIds[count];
      const obj = publicAPI.getProxyById(id);
      if (obj) {
        obj.set(groupBy[id]);
      }
    }
    publicAPI.modified();
    publicAPI.renderAllViews();
  };
```

**使用例**

```javascript
无...
```



### getLookupTable

获取 LookupTable

**源码**

```javascript
  publicAPI.getLookupTable = (arrayName, options) => {
    if (!model.lookupTables[arrayName]) {
      model.lookupTables[arrayName] = publicAPI.createProxy(
        'Proxy',
        'LookupTable',
        { arrayName, ...options }
      );
    }
    return model.lookupTables[arrayName];
  };
```

**使用例**

```javascript
const dataArray = imageData.getPointData().getScalars();
const lookupTableProxy = proxyManager.getLookupTable(dataArray.getName());
```



### getPiecewiseFunction

获取 PiecewiseFunction

**源码**

```javascript
  publicAPI.getPiecewiseFunction = (arrayName, options) => {
    if (!model.piecewiseFunctions[arrayName]) {
      model.piecewiseFunctions[arrayName] = publicAPI.createProxy(
        'Proxy',
        'PiecewiseFunction',
        { arrayName, ...options }
      );
    }
    return model.piecewiseFunctions[arrayName];
  };
```

**使用例**

```javascript
const piecewiseFunction = proxyManager.getPiecewiseFunction(dataArray.getName());

...

const pwfProxy = this.$proxyManager.getPiecewiseFunction(arrayName);
if (value) {
    pwfProxy.setMode(PwfMode.Points);
} else {
    pwfProxy.setMode(PwfMode.Gaussians);
}
```



### rescaleTransferFunctionToDataRange

设置转换区间

**源码**

```javascript
  publicAPI.rescaleTransferFunctionToDataRange = (arrayName, dataRange) => {
    const lut = publicAPI.getLookupTable(arrayName);
    const pwf = publicAPI.getPiecewiseFunction(arrayName);
    lut.setDataRange(dataRange[0], dataRange[1]);
    pwf.setDataRange(dataRange[0], dataRange[1]);
  };
```

**使用例**

```
无..
```

