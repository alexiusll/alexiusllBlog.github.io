---
title: three.js 中控制器 orbitControls 原理解析
date: 2021-11-25 14:28:34
categories:
  - 计算机图形学
tags:
  - threejs
  - 前端
  - 图形学
  - WebGL
---


主要是orbitControls源码的解析，为了帮助自己理解three.js中摄像头操作的一些机制，为后续开发提供思路。

<!-- more -->

## 🔵源码地址

https://github.com/mrdoob/three.js/blob/dev/examples/jsm/controls/OrbitControls.js

不属于three.js 中核心库的部分，而是在examples 中



## 🔵从构造函数入手

OrbitControls 类继承了 EventDispatcher

```javascript
class OrbitControls extends EventDispatcher 
```

**EventDispatcher** 来自于另一个库：

https://github.com/mrdoob/eventdispatcher.js/

用来给自定义object添加事件



**轨道控制器（OrbitControls）**在代码中的使用方法：

```
const controls = new OrbitControls( camera, renderer.domElement );
```

它的构造函数的第一个参数需要传入摄像机，第二个参数传入了 渲染器的 dom元素

```javascript
constructor( object, domElement ) {

		super();
    	if ( domElement === undefined ) console.warn( 'THREE.OrbitControls: The second parameter "domElement" is now mandatory.' );
		if ( domElement === document ) console.error( 'THREE.OrbitControls: "document" should not be used as the target "domElement". Please use "renderer.domElement" instead.' );

		this.object = object;
		this.domElement = domElement;
		this.domElement.style.touchAction = 'none'; // disable touch scroll
    	...
```

后面对一些参数进行了初设化（只展示部分）：

```javascript
		// Set to false to disable this control
		this.enabled = true;

		// "target" sets the location of focus, where the object orbits around
		this.target = new Vector3();

		// How far you can dolly in and out ( PerspectiveCamera only )
		this.minDistance = 0;
		this.maxDistance = Infinity;

		// How far you can zoom in and out ( OrthographicCamera only )
		this.minZoom = 0;
		this.maxZoom = Infinity;
```



## 🔵reset 方法

**源码：**

```javascript
		this.reset = function () {

			scope.target.copy( scope.target0 );
			scope.object.position.copy( scope.position0 );
			scope.object.zoom = scope.zoom0;

			scope.object.updateProjectionMatrix();
			scope.dispatchEvent( _changeEvent );

			scope.update();

			state = STATE.NONE;

		};
```

这里使用了 state 来保存之前的 camera状态



