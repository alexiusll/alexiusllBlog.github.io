---
title: rollup 使用整理 v1
date: 2021-09-07 15:42:01
categories:
- 前端
tags:
- 前端
- rollup
---











Rollup是一个JavaScript的模块绑定器，它将一小段代码编译成更大更复杂的东西，比如库或应用程序。 

它使用了JavaScript ES6版本中包含的代码模块的新的标准化格式，而不是以前的特殊解决方案，如CommonJS和AMD。 

ES模块可以让您自由和无缝地组合来自您喜欢的库的最有用的单独函数。 

<!-- more -->

## 官方网站

文档：

https://rollupjs.org/guide/en/



## 常用指令

```shell
# 查看帮助
$ rollup --help

# 使用配置文件来编译
# -c, --config <filename>     Use this config file (if argument is used but value
#                              is unspecified, defaults to rollup.config.js)
$ rollup -c
```



## 常用插件

- **rollup-plugin-typescript2**
- **@rollup/plugin-node-resolve**
- **rollup-plugin-postcss**
- **rollup-plugin-terser**
- **@rollup/plugin-commonjs**
- **rollup-plugin-cleaner**
- **rollup-plugin-string**



## 配置文件

### 最简化的配置文件 rollup.config.js

```javascript
export default {
  input: 'src/main.js',
  output: {
    file: 'bundle.js',
    format: 'cjs'
  }
};
```

这里会生成 CommonJS  的代码



### 所有的可配置项

```javascript
// rollup.config.js

// can be an array (for multiple inputs)
export default {
  // core input options
  external,
  input, // conditionally required
  plugins,

  // advanced input options
  cache,
  onwarn,
  preserveEntrySignatures,
  strictDeprecations,

  // danger zone
  acorn,
  acornInjectPlugins,
  context,
  moduleContext,
  preserveSymlinks,
  shimMissingExports,
  treeshake,

  // experimental
  experimentalCacheExpiry,
  perf,

  // required (can be an array, for multiple outputs)
  output: {
    // core output options
    dir,
    file,
    format, // required
    globals,
    name,
    plugins,

    // advanced output options
    assetFileNames,
    banner,
    chunkFileNames,
    compact,
    entryFileNames,
    extend,
    footer,
    hoistTransitiveImports,
    inlineDynamicImports,
    interop,
    intro,
    manualChunks,
    minifyInternalExports,
    outro,
    paths,
    preserveModules,
    preserveModulesRoot,
    sourcemap,
    sourcemapExcludeSources,
    sourcemapFile,
    sourcemapPathTransform,
    validate,

    // danger zone
    amd,
    esModule,
    exports,
    externalLiveBindings,
    freeze,
    indent,
    namespaceToStringTag,
    noConflict,
    preferConst,
    sanitizeFileName,
    strict,
    systemNullSetters
  },

  watch: {
    buildDelay,
    chokidar,
    clearScreen,
    skipWrite,
    exclude,
    include
  }
};
```



### 多配置文件

```javascript
// rollup.config.js
import defaultConfig from './rollup.default.config.js';
import debugConfig from './rollup.debug.config.js';

export default commandLineArgs => {
  if (commandLineArgs.configDebug === true) {
    return debugConfig;
  }
  return defaultConfig;
};
```

运行：

rollup --config --configDebug

debug configuration 会被使用

