---
title: three.js中glsl写法整理01
date: 2021-07-15 20:58:26
categories:
  - 计算机图形学
tags:
  - threejs
  - 前端
  - React
  - 图形学
---































在web网页上写glsl是一件比较麻烦的事情，而且感觉网上比较缺乏一些glsl的文档，

所以本文结合three.js中shader的写法，对glsl中的语法进行整理。

<!-- more -->



## 📘three.js 内置的变量(uniforms)和属性

来源：https://threejs.org/docs/index.html#api/zh/renderers/webgl/WebGLProgram

### 顶点着色器(无条件的):

```glsl
// = object.matrixWorld
uniform mat4 modelMatrix;

// = camera.matrixWorldInverse * object.matrixWorld
uniform mat4 modelViewMatrix;

// = camera.projectionMatrix
uniform mat4 projectionMatrix;

// = camera.matrixWorldInverse
uniform mat4 viewMatrix;

// = inverse transpose of modelViewMatrix
uniform mat3 normalMatrix;

// = camera position in world space
uniform vec3 cameraPosition;
```

attribute:

```glsl
// default vertex attributes provided by Geometry and BufferGeometry
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
```

注意，可以通过以下方式计算顶点着色器中顶点的位置：

```glsl
gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
```

或者也可以这样：

```glsl
gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4( position, 1.0 );
```



## 🔵向量的分量访问

glsl中的向量(vec2,vec3,vec4)往往有特殊的含义,比如可能代表了一个空间坐标(x,y,z,w),或者代表了一个颜色(r,g,b,a),再或者代表一个纹理坐标(s,t,p,q) 所以glsl提供了一些更人性化的分量访问方式.

`vector.xyzw` 其中xyzw 可以任意组合

`vector.rgba` 其中rgba 可以任意组合

`vector.stpq` 其中rgba 可以任意组合

```glsl
vec4 v=vec4(1.0,2.0,3.0,1.0);
float x = v.x; //1.0
float x1 = v.r; //1.0
float x2 = v[0]; //1.0

vec3 xyz = v.xyz; //vec3(1.0,2.0,3.0)
vec3 xyz1 = vec(v[0],v[1],v[2]); //vec3(1.0,2.0,3.0)
vec3 rgb = v.rgb; //vec3(1.0,2.0,3.0)

vec2 xyzw = v.xyzw; //vec4(1.0,2.0,3.0,1.0);
vec2 rgba = v.rgba; //vec4(1.0,2.0,3.0,1.0);
```



## 🎈变量类型

### 基本类型

```html
Type 		Meaning
---------------------------------------------------------------------------------
void 		for functions that do not return a value
bool 		a conditional type, taking on values of true or false
int 		a signed integer
uint 		an unsigned integer
float 		a single floating-point scalar
vec2 		a two-component floating-point vector
vec3 		a three-component floating-point vector
vec4	 	a four-component floating-point vector
bvec2 		a two-component Boolean vector
bvec3 		a three-component Boolean vector
bvec4 		a four-component Boolean vector
ivec2 		a two-component signed integer vector
ivec3 		a three-component signed integer vector
ivec4 		a four-component signed integer vector
uvec2 		a two-component unsigned integer vector
uvec3 		a three-component unsigned integer vector
uvec4 		a four-component unsigned integer vector
mat2 		a 2×2 floating-point matrix
mat3 		a 3×3 floating-point matrix
mat4 		a 4×4 floating-point matrix
mat2x2 		same as a mat2
mat2x3 		a floating-point matrix with 2 columns and 3 rows
mat2x4 		a floating-point matrix with 2 columns and 4 rows
mat3x2 		a floating-point matrix with 3 columns and 2 rows
mat3x3 		same as a mat3
mat3x4 		a floating-point matrix with 3 columns and 4 rows
mat4x2 		a floating-point matrix with 4 columns and 2 rows
mat4x3 		a floating-point matrix with 4 columns and 3 rows
mat4x4 		same as a mat4
```

### 浮点采样器类型

```html
Type 					Meaning
---------------------------------------------------------------------------------
sampler1D 				a handle for accessing a 1D texture
sampler2D 				a handle for accessing a 2D texture
sampler3D 				a handle for accessing a 3D texture
samplerCube 			a handle for accessing a cube mapped texture
sampler2DRect 			a handle for accessing a rectangular texture
sampler1DShadow 		a handle for accessing a 1D depth texture with comparison
sampler2DShadow 		a handle for accessing a 2D depth texture with comparison
sampler2DRectShadow 	a handle for accessing a rectangular texture with comparison
sampler1DArray 			a handle for accessing a 1D array texture
sampler2DArray 			a handle for accessing a 2D array texture
sampler1DArrayShadow 	a handle for accessing a 1D array depth texture with comparison
sampler2DArrayShadow 	a handle for accessing a 2D array depth texture with comparison
samplerBuffer 			a handle for accessing a buffer texture
```

### 有符号整数采样器类型

```html
Type 				Meaning
---------------------------------------------------------------------------------
isampler1D 			a handle for accessing an integer 1D texture
isampler2D 			a handle for accessing an integer 2D texture
isampler3D 			a handle for accessing an integer 3D texture
isamplerCube 		a handle for accessing an integer cube mapped texture
isampler2DRect 		a handle for accessing an integer 2D rectangular texture
isampler1DArray 	a handle for accessing an integer 1D array texture
isampler2DArray 	a handle for accessing an integer 2D array texture
isamplerBuffer 		a handle for accessing an integer buffer texture
```

### 无符号整数采样器类型

```html
Type 				Meaning
---------------------------------------------------------------------------------
usampler1D 			a handle for accessing an unsigned integer 1D texture
usampler2D 			a handle for accessing an unsigned integer 2D texture
usampler3D 			a handle for accessing an unsigned integer 3D texture
usamplerCube 		a handle for accessing an unsigned integer cube mapped texture
usampler2DRect 		a handle for accessing an unsigned integer rectangular texture
usampler1DArray 	a handle for accessing an unsigned integer 1D array texture
usampler2DArray 	a handle for accessing an unsigned integer 2D array texture
usamplerBuffer 		a handle for accessing an unsigned integer buffer texture
```



### 类型的一些例子

#### sampler3D

简述：3D 的纹理类型

使用例：

```glsl
uniform sampler3D u_data;
...
texture(u_data, texcoords.xyz).r
```



#### sampler2DArray

简述：2D 的纹理的列表

使用例：

```glsl
uniform sampler2DArray diffuse;
...
vec4 color = texture( diffuse, pos.xyz );
```





## 💙内置函数库



#### 纹理查询函数

实际上例如 texture2D 这种方法是已经被弃用了，但是在以前的代码里面可能很常见

**主要的**

```glsl
gvec4 texture (gsampler1D sampler, float P [, float bias] )
gvec4 texture (gsampler2D sampler, vec2 P [, float bias] ) 
gvec4 texture (gsampler3D sampler, vec3 P [, float bias] ) 
```

**其他的**

```glsl
gvec4 texture (gsamplerCube sampler, vec3 P [, float bias] ) 
float texture (sampler1DShadow sampler, vec3 P [, float bias] ) 
float texture (sampler2DShadow sampler, vec3 P [, float bias] ) 
float texture (samplerCubeShadow sampler, vec4 P [, float bias] ) 
gvec4 texture (gsampler1DArray sampler, vec2 P [, float bias] ) 
gvec4 texture (gsampler2DArray sampler, vec3 P [, float bias] ) 
float texture (sampler1DArrayShadow sampler, vec3 P [, float bias] ) 
float texture (sampler2DArrayShadow sampler, vec4 P) 
gvec4 texture (gsampler2DRect sampler, vec2 P) 
float texture (sampler2DRectShadow sampler, vec3 P)
```

**解释：**

Use the texture coordinate P to do a texture lookup in the texture currently bound to sampler. The last component of P is used as Dref for the shadow forms. For array forms, the array layer comes from the last component of P in the nonshadow forms, and the second to last component of P in the shadow forms.



## 来源

- GLSL 中文手册 ：https://github.com/wshxbqq/GLSL-Card
- The OpenGL Shading Language ：https://www.khronos.org/registry/OpenGL/specs/gl/GLSLangSpec.1.40.pdf

