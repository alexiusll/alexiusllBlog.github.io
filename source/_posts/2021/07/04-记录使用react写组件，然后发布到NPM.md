---
title: 记录使用react写组件，然后发布到NPM
date: 2021-07-04 23:07:45
categories:
- 前端
tags:
- 前端
- React
---

















想使用lerna和yarn workspace来管理大型项目，学会如何发布npm包是不可缺少的。

如何用 react 发包参考的是这个博客的内容：

https://segmentfault.com/a/1190000018079170

*<!-- more -->*

## 📘初始化项目

首先在git上创建一个项目，项目地址：

https://github.com/alexiusll/test_react_npm

如果这个能搭建好的话，可以考虑成为一个通用的脚手架。



#### 构建项目：

```bash
$ yarn init
```

生成 package.json

```json
{
  "name": "npm_common",
  "version": "1.0.0",
  "description": "npm发包通用",
  "main": "index.ts",
  "repository": "https://github.com/alexiusll/test_react_npm",
  "author": "linkenzone <linkenzone@163.com>",
  "license": "MIT"
}
```

**安装 react 相关的包**

```bash
$ yarn add react react-dom --dev
```

💢疑点？为啥这里放dev呢？



**采用 babel 编译相关的依赖**

```bash
$ yarn add @babel/cli @babel/core @babel/preset-env @babel/preset-react --dev
```

💢疑点？这些都是干啥的？



**采用 webpack 做构建，webpack-dev-server 作为本地开发服务器，所以需要安装如下依赖：**

```bash
$ yarn add webpack webpack-cli webpack-dev-server --dev
```



**这里为了简单演示，只安装 babel-loader 用来编译 jsx，其他 loader 安装自己的需要自己安装。**

```bash
$ yarn add babel-loader --dev
```



**另外再安装一个 webpack 插件 html-webpack-plugin ，用来生成 html：**

```bash
$ yarn add html-webpack-plugin --dev
```



**然后再添加上常规的 start 和 build 脚本，package.json 如下：**

```json
{
  "name": "npm_common",
  "version": "1.0.0",
  "description": "npm发包通用",
  "main": "index.ts",
  "repository": "https://github.com/alexiusll/test_react_npm",
  "author": "linkenzone <linkenzone@163.com>",
  "license": "MIT",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "start": "webpack-dev-server --open development",
    "build": "webpack --mode production"
  },
  "devDependencies": {
    "@babel/cli": "^7.14.5",
    "@babel/core": "^7.14.6",
    "@babel/preset-env": "^7.14.7",
    "@babel/preset-react": "^7.14.5",
    "babel-loader": "^8.2.2",
    "html-webpack-plugin": "^5.3.2",
    "react": "^17.0.2",
    "react-dom": "^17.0.2",
    "webpack": "^5.42.0",
    "webpack-cli": "^4.7.2",
    "webpack-dev-server": "^3.11.2"
  }
}
```



#### **使用 typescript**

为了使用 typescript 在原博客的内容上补充一些内容

参考：https://zh-hans.reactjs.org/docs/static-type-checking.html#using-typescript-with-create-react-app

**添加 TypeScript 到现有项目中**

```bash
$ yarn add --dev typescript
```

**配置 TypeScript 编译器**

**执行：**

```bash
$ yarn run tsc --init
```

会生成 tsconfig.json，配置文档：https://www.typescriptlang.org/docs/handbook/tsconfig-json.html

我们来看一下 `rootDir` 和 `outDir` 这两个配置项。编译器将从项目中找到 TypeScript 文件并编译成相对应 JavaScript 文件。但我们不想混淆源文件和编译后的输出文件。

为了解决该问题，我们将执行以下两个步骤：

- 首先，让我们重新整理下项目目录，把所有的源代码放入 `src` 目录中。

```
├── package.json
├── src
│   └── index.ts
└── tsconfig.json
```

- 更改 tsconfig.json 为

```json
{
  "compilerOptions": {
    "outDir": "build/dist",
    "module": "commonjs",
    "target": "es5",
    "lib": ["es6", "dom"],
    "sourceMap": true,
    "allowJs": true,
    "jsx": "react",
    "moduleResolution": "node",
    "rootDir": "src",
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  },
  "exclude": [
    "node_modules",
    "build",
    "scripts",
    "acceptance-tests",
    "webpack",
    "jest",
    "src/setupTests.ts"
  ],
  "types": [
    "typePatches"
  ]
}
```



**安装 react 的声明文件**

```bash
$ yarn add --dev @types/react @types/react-dom
```



## 📘配置 webpack

配置非常简单的 webpack, 在项目根路径下创建 webpack.config.js 文件

```javascript
const path = require('path');
const HtmlWebpackPlugin = require("html-webpack-plugin");
const htmlWebpackPlugin = new HtmlWebpackPlugin({
    template: path.join(__dirname, "./example/src/index.html"),
    filename: "./index.html"
});

module.exports = {
    entry: path.join(__dirname, "./example/src/app.js"),
    output: {
        path: path.join(__dirname, "example/dist"),
        filename: "bundle.js"
    },
    module: {
        rules: [{
            test: /\.(js|jsx)$/,
            use: "babel-loader",
            exclude: /node_modules/
        }]
    },
    plugins: [htmlWebpackPlugin],
    resolve: {
        extensions: [".js", ".jsx"]
    },
    devServer: {
        port: 3001
    }
};
```

Webpack 的配置文件主要做了如下事情：

- 使用 example/src/index.js 作为项目入口，处理资源文件的依赖关系
- 通过 babel-loader 来编译处理 js 和 jsx 文件
- 通过 html-webpack-plugin 自动注入编译打包好的脚本文件
- 为 demo 启动端口为 3001 的服务



