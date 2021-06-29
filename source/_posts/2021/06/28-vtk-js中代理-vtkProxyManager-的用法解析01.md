---
title: vtk.js中代理(vtkProxyManager)的用法解析01
date: 2021-06-28 16:31:45
categories:
- 医学影像处理
tags:
- 医学影像处理
- vtk.js
- 前端
- React
---









## 📋何为代理？

资料来源，官方ppt：

https://docs.google.com/presentation/d/1Sr1OGxMSw0oCt46koKQbmwSIE11Kqq8MGtyW3W0ASpk

<!-- more -->

### Proxy Architecture 代理架构

- 用于高级渲染管线管理的代理接口
  - 受ParaView的代理启发
- 允许使用统一的API来控制本地或远程渲染管线

- 创建简单的渲染管线

![1](28-vtk-js中代理-vtkProxyManager-的用法解析01/1.png)

### 架构内容

- 数据源 Sources 

  - 数据的来源

  - 原始数据、过滤器等。

- 表现 Representations 

  - 为渲染数据绑定适当的actor、mapper和properties 

  - 例:SliceRepresentationProxy

- 视口 view

  - 使用适当的交互器创建预定义的视图设置

  - 例如:2D视口，3D视口



### 架构简述

- Proxy Manager 是 state 的中心存储
- 基于配置连接
  - Source-Representation-View管道
  - 视图类型
  - 其他代理(如LookupTable 和 PiecewiseFunction)

- 生命周期管理
  - 渲染管线
  - 数据源
  - 表现 Representations  和 视口 view



### 代理设置

- 为数据源、表现和视口定义类
- 在类上公开所需的属性
- 同步不同对象的属性
- 定义数据在不同视口类型中的外观





## 📗ProxyManager 源码解析

```javascript
index.js

import macro from 'vtk.js/Sources/macro';

import core from './core';
import state from './state';
import view from './view';
import properties from './properties';

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(
    model,
    {
      proxyIdMapping: {},
      proxyByGroup: {},
      proxyConfiguration: {}, 
        // { definitions: {}, representations: { viewName: { sourceType: representationName } } }
      sv2rMapping: {}, // sv2rMapping[sourceId][viewId] = rep
      r2svMapping: {}, // r2svMapping[representationId] = { sourceId, viewId }
      collapseState: {},
      lookupTables: {},
      piecewiseFunctions: {},
      animating: false,
    },
    initialValues
  );

  // 对象方法
  macro.obj(publicAPI, model);
  // 创建 set get 方法
  macro.setGet(publicAPI, model, [
    'proxyConfiguration',
    'activeSource',
    'activeView',
  ]);
  // 事件
  macro.event(publicAPI, model, 'ActiveSourceChange');
  macro.event(publicAPI, model, 'ActiveViewChange');
  macro.event(publicAPI, model, 'ProxyRegistrationChange');
	
  // 代理注册处理
  core(publicAPI, model);
  // 代理状态处理
  state(publicAPI, model);
  // 代理视口处理
  view(publicAPI, model);
  // 代理属性管理
  properties(publicAPI, model);

  // 增加 代理 API
  macro.proxy(publicAPI, model);
    
  //设置类名
  model.classHierarchy.push('vtkProxyManager');
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkProxyManager');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
```
