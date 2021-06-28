---
title: 如何在vtk.js中创建新的类(class)？
date: 2021-06-28 16:37:44
categories:
- 医学影像处理
tags:
- 医学影像处理
- vtk.js
- 前端
- React
---













原文：https://kitware.github.io/vtk-js/docs/develop_class.html

## 📃在vtk.js中创建新的类

本指南说明了如何向vtk.js库添加新类，以及我们使用的基本结构背后的概念。
<!-- more -->

首先，vtk.js不依赖于ES6规范中引入的类定义。相反，vtk.js提供了一个基于闭包的基础架构，它允许我们在没有任何层次约束的情况下将方法组合到特定的实例中。

由于我们的闭包范式，方法可以在它们的实例上下文之外使用，并且可以作为回调函数直接传递。因此，它们的使用不需要每次引用**this**。

按照惯例，我们为每个类创建一个目录。目录名必须是类名的大写形式，不带“vtk”前缀(尽管在导入类时，我们会添加“vtk”前缀)。该类的定义应该保存在该目录中的“index.js”文件中。

```javascript
import vtkDataSet from 'vtk.js/Sources/Common/DataModel/DataSet';
```

使用目录而不是简单的JavaScript文件的原因是允许将几个资源关联到特定的类，比如常量文件、测试、示例和/或其他文档。

这个类应该属于一个**模块**，而那个模块应该属于一个**工具 (kit)**。

**Kits**对应于存储库的**source**目录下的根目录。

每个**kit**包含几个**模块**，这些模块是内部的直接子目录。

在每个**模块**中，您可以找到它的类定义。



例如，vtk.js目前有以下粗体套件和斜体模块。

- Common
  - *Core*
  - *DataModel*
  - *System*
- Filters
  - *General*
  - *Sources*
- IO
  - *Core*
- Interaction
  - *Style*
- Rendering
  - *Core*
  - *Misc*
  - *OpenGL*
  - *SceneGraph*



### 🔵类定义

下面是一个如何为vtk.js编写一个新类的例子。

设计灵感来源于Douglas Crockford的功能继承，但我们在某些方面也走得更远。这个博客(https://medium.com/javascript-scene/functional-mixins-composing-software-ffb66d5e731c)提供了一个非常好的背景技术，我们使用和利用vtk.js。

这个博客(https://medium.com/@kentcdodds/classes-complexity-and-functional-programming-a8dd86903747)还解释了为什么JavaScript中的类并不总是最好的选择。

```javascript
MyClass/index.js
import macro          from 'vtk.js/macro';
import vtk            from 'vtk.js/vtk';
import vtkParentClass from 'vtk.js/Kit/Module/ParentClass';
import vtkOtherClass  from 'vtk.js/Kit/Module/OtherClass';
import Constants      from 'vtk.js/Kit/Module/MyClass/Constants';

const { Representation } = Constants;  // { POINT: 0, WIREFRAME: 1, ... }

// ----------------------------------------------------------------------------
// 全局函数
// ----------------------------------------------------------------------------

// 添加您想要静态公开的 模块级函数 或 api
// 下一节...

function moduleScopedMethod() {
  // 做一些什么..
}

function moduleScopedStaticMethod() {
  // 做一些什么...
}

// ----------------------------------------------------------------------------
// 静态 API
// ----------------------------------------------------------------------------

export const STATIC = {
  moduleScopedStaticMethod,
};

// ----------------------------------------------------------------------------
// vtkMyClass 方法
// ----------------------------------------------------------------------------

function vtkMyClass(publicAPI, model) {
  // 设置我们的 类名
  model.classHierarchy.push('vtkMyClass');

  // 捕获 “parentClass” api以供内部使用
  const superClass = Object.assign({}, publicAPI);

  // Public API 方法
  publicAPI.exposedMethod = () => {
    // 这是该对象的一个公开的方法
  };

  publicAPI.overriddenMethod = () => {
    superClass.overriddenMethod();
    // 让我们在这里添加自定义代码
    // ...
  };
}

// ----------------------------------------------------------------------------
// 对象工厂
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  myProp1: [0, 0, 0],
  // myProp2: null,     // 不初始化内部对象
  myProp3: true,
  myProp4: 6,
  myProp5: [1, 2, 3, 4],
  myProp6: Representation.WIREFRAME,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
   // model 获取值的顺序，首先是DEFAULT_VALUES，然后是initialValues
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // 继承
  vtkParentClass.extend(publicAPI, model, initialValues);

  // 内部对象初始化
  if (model.myProp2) {
    model.myProp2 = vtk(model.myProp2);
  } else {
    model.myProp2 = vtkOtherClass.newInstance();
  }

  // 创建 get-only 宏
  macro.get(publicAPI, model, ['myProp2', 'myProp4']);

  // 创建 get-set 宏
  macro.setGet(publicAPI, model, ['myProp3']);

  // 为数组创建set宏(需要知道大小)
  macro.setArray(publicAPI, model, ['myProp5'], 4);

  // Create get macros for array
  macro.getArray(publicAPI, model, ['myProp1', 'myProp5']);

  // 为数组创建get宏
  macro.setGet(publicAPI, model, [
    { name: 'myProp6', enum: Representation, type: 'enum' },
  ]);

  // 更多宏方法, 参阅 "Sources/macro.js"

  // 对象特定的方法
  vtkMyClass(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkMyClass');

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend }, STATIC, Constants);
```



### 🔵常量定义

```javascript
MyClass/Constants.js
export const Representation = {
  POINT: 0,
  WIREFRAME: 1,
  SURFACE: 2,
};

export const Format = {
  ASCII: 0,
  BINARY: 1,
}

export default {
  Representation,
  Format,
};
```



### 🔵API 文档

如果您不想让代码成为文档的唯一来源，您可以添加自己的markdown文件，以进一步用代码片段、成员变量和方法使用对其进行文档记录。

为此，您需要添加一个api。Md在类目录中，如下所示:

~~~md
## Usage

```js
import ConeSource from 'vtk.js/Sources/Filters/Sources/ConeSource';

const coneSource = ConeSource.New({ height: 2, radius: 1, resolution: 80 });
const polydata = coneSource.getOutputData();
~~~

#### Height (set/get)

Floating point number representing the height of the cone.

#### Radius (set/get)

Floating point number representing the radius of the cone base.

#### Resolution (set/get)

Integer representing the number of points used to build the base of the cone.

#### Capping (set/get)

Boolean letting you close the base of the cone.



## 📋我补充的部分内容

这里不再是原文中有的内容。

### 🔵macro.newInstance 的方法

```java
macro.js
    
// ----------------------------------------------------------------------------
// newInstance
// ----------------------------------------------------------------------------

export function newInstance(extend, className) {
  const constructor = (initialValues = {}) => {
    const model = {};
    const publicAPI = {};
    // 运行我们定义的class，为publicAPI和model赋值
    extend(publicAPI, model, initialValues);
	// 此方法可以冻结一个对象，一个被冻结的对象再也不能被修改
    return Object.freeze(publicAPI);
  };

  // 注册 构造函数 到工厂
  if (className) {
    vtk.register(className, constructor);
  }

  // 最后返回一个方法，这个方法放回冻结的 publicAPI
  return constructor;
}
```

```javascript
vtk.js

function register(vtkClassName, constructor) {
  factoryMapping[vtkClassName] = constructor;
}
```

**newInstance 需要传入2个参数:**

- extend：我们定义的继承方法

- className： 类的名字 



### 🔵macro.get 的方法

```javascript
export function get(publicAPI, model, fieldNames) {
  fieldNames.forEach((field) => {
    if (typeof field === 'object') {
      publicAPI[`get${capitalize(field.name)}`] = () => model[field.name];
    } else {
      publicAPI[`get${capitalize(field)}`] = () => model[field];
    }
  });
}
```



### 🔵一个的实例

例如平时使用的 vtkHttpDataSetReader,它的使用方法：

```javascript
const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });
```

它的源码（不全）：

```javascript
index.js

// For vtk factory
import 'vtk.js/Sources/Common/DataModel/ImageData';
import 'vtk.js/Sources/Common/DataModel/PolyData';

import vtk from 'vtk.js/Sources/vtk';
import macro from 'vtk.js/Sources/macro';
import DataAccessHelper from 'vtk.js/Sources/IO/Core/DataAccessHelper';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkStringArray from 'vtk.js/Sources/Common/Core/StringArray';

// Enable data soure for DataAccessHelper
import 'vtk.js/Sources/IO/Core/DataAccessHelper/LiteHttpDataAccessHelper'; // Just need HTTP

const fieldDataLocations = ['pointData', 'cellData', 'fieldData'];
const ARRAY_BUILDERS = {
  vtkDataArray,
  vtkStringArray,
};

// ----------------------------------------------------------------------------
// 全局方法
// ----------------------------------------------------------------------------

const cachedArrays = {};

const GEOMETRY_ARRAYS = {
  vtkPolyData(dataset) {
    ...
  },

  vtkImageData(dataset) {
    return [];
  },

  vtkUnstructuredGrid(dataset) {
    ....
  },

  vtkRectilinearGrid(dataset) {
    ...
  },
};

function processDataSet(
  publicAPI,
  model,
  dataset,
  fetchArray,
  resolve,
  reject,
  loadData
) {
  const enable = model.enableArray;
  ...
}

// ----------------------------------------------------------------------------
// vtkHttpDataSetReader 类
// ----------------------------------------------------------------------------

function vtkHttpDataSetReader(publicAPI, model) {
  // 设置类名
  model.classHierarchy.push('vtkHttpDataSetReader');

  // 默认为空输出
  model.output[0] = vtk({ vtkClass: 'vtkPolyData' });

  // 创建默认的dataAccessHelper(如果不可用)
  if (!model.dataAccessHelper) {
    model.dataAccessHelper = DataAccessHelper.get('http');
  }

  // 获取Array的内部方法
  function fetchArray(array, options = {}) {
  	 ...
    return Promise.resolve(cachedArrays[arrayId]);
  }

  // 获取数据集 (metadata)
  publicAPI.updateMetadata = (loadData = false) => {
    if (model.compression === 'zip') {
      return new Promise((resolve, reject) => {
        ...
      });
    }

    return new Promise((resolve, reject) => {
      ...
    });
  };

  // 设置数据集的 url
  publicAPI.setUrl = (url, options = {}) => {
    if (url.indexOf('index.json') === -1 && !options.fullpath) {
      model.baseURL = url;
      model.url = `${url}/index.json`;
    } else {
      model.url = url;

      // Remove the file in the URL
      const path = url.split('/');
      path.pop();
      model.baseURL = path.join('/');
    }

    model.compression = options.compression;

    // 获取 metadata
    return publicAPI.updateMetadata(!!options.loadData);
  };

  // 获取实际的数据数组
  publicAPI.loadData = () => {
    const datasetObj = model.dataset;
    const arrayToFecth = model.arrays
      .filter((array) => array.enable)
      .filter((array) => array.array.ref)
      .map((array) => array.array);

    return new Promise((resolve, reject) => {
      const error = (e) => {
        reject(e);
      };

      const processNext = () => {
        if (arrayToFecth.length) {
          const { progressCallback } = model;
           // 是否启用 fetchGzip
          const compression = model.fetchGzip ? 'gz' : null;
          fetchArray(arrayToFecth.pop(), {
            compression,
            progressCallback,
          }).then(processNext, error);
        } else if (datasetObj) {
          // Perform array registration on new arrays
          model.arrays
            .filter(
              (metaArray) => metaArray.registration && !metaArray.array.ref
            )
            .forEach((metaArray) => {
              const newArray = ARRAY_BUILDERS[
                metaArray.array.vtkClass
              ].newInstance(metaArray.array);
              datasetObj[`get${macro.capitalize(metaArray.location)}`]()[
                metaArray.registration
              ](newArray);
              delete metaArray.registration;
            });
          datasetObj.modified();
          resolve(publicAPI, datasetObj);
        }
      };

      // 开始处理队列
      processNext();
    });
  };

  publicAPI.requestData = (inData, outData) => {
    // do nothing loadData will eventually load up the data
  };

  // 切换数组以加载
  publicAPI.enableArray = (location, name, enable = true) => {
    const activeArray = model.arrays.filter(
      (array) => array.name === name && array.location === location
    );
    if (activeArray.length === 1) {
      activeArray[0].enable = enable;
    }
  };

  // return Busy state
  publicAPI.isBusy = () => !!model.requestCount;
}

// ----------------------------------------------------------------------------
// 对象工厂
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  enableArray: true,
  fetchGzip: false, // fetchGzip 默认是false
  arrays: [],
  url: null,
  baseURL: null,
  requestCount: 0,
  // dataAccessHelper: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  // model 获取值的顺序，首先是DEFAULT_VALUES，然后是initialValues
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // 构建 VTK API
  macro.obj(publicAPI, model);
  // get
  macro.get(publicAPI, model, [
    'enableArray',
    'fetchGzip',
    'url',
    'baseURL',
    'dataAccessHelper',
  ]);
  // set
  macro.set(publicAPI, model, ['dataAccessHelper', 'progressCallback']);
  // getArray
  macro.getArray(publicAPI, model, ['arrays']);
  // vtkAlgorithm: setInputData(), setInputConnection(), getOutputData(), getOutputPort()
  macro.algo(publicAPI, model, 0, 1);
  // 注册事件
  macro.event(publicAPI, model, 'busy');

  // 对象方法
  vtkHttpDataSetReader(publicAPI, model);

  // 确保我们可以从模型中解构progressCallback
  if (model.progressCallback === undefined) {
    model.progressCallback = null;
  }
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkHttpDataSetReader');

// ----------------------------------------------------------------------------

export default { newInstance, extend };

```

