---
title: 在3D图形引擎中，使 2D Sprite 填充满窗口的做法
date: 2021-10-25 20:02:31
categories:
  - 计算机图形学
tags:
  - threejs
  - 前端
  - 图形学
---

最近尝试在three.js中渲染DICOM影像，由于three.js是一个3D的图形引擎，所以做一些2D的操作相对来说是不那么方便的。

<!-- more -->



## 问题描述：

现在能利用three.js 配合 @react-three/drei 辅助库，来渲染基本的DICOM影像数据了，但是问题是three.js 是一个3D引擎，DICOM影像是作为一个mesh的材质来渲染的，现在需要让它能智能的填充整个窗口，并且不应该去拉伸这个mesh。

![image-20211025200805998](25-在3D图形引擎中，使-2D-Sprite-填充满窗口的做法/image-20211025200805998.png)



## 查阅资料

网上一些资料来源自 Unity 的论坛：

https://answers.unity.com/questions/620699/scaling-my-background-sprite-to-fill-screen-2d-1.html

https://answers.unity.com/questions/687230/2d-scaling-sprites-by-screen-resolution.html

但是three.js的资料是比较缺乏的，但是它们都是3D的图形引擎，从原理上来说都是相同的。



## 着手解决

### step.1 首先新增一个 重置的按钮，和配套事件

```html
    <div style={{ position: 'relative' }}>
      <Button style={{ position: 'absolute', zIndex: 1, fontSize: '8px', padding: '4px' }}>
        重置
      </Button>
      <Canvas camera={{ position: [0, 0, 70], fov: 45 }}>
        <Suspense fallback={null}>
          <color attach="background" args={[0, 0.3, 0.5]} />
          <DicomImage uniforms={uniforms} />
          <OrbitControls />
        </Suspense>
      </Canvas>
    </div>
```

