---
title: 分析 cornerstone.js 中渲染图像的方法
date: 2021-09-06 11:10:16
categories:
- 医学影像处理
tags:
- 医学影像处理
- vtk.js
- 前端
- React
---



























探索 cornerstone中渲染 DICOM 2D图像的方法

<!-- more -->

**cornerstonejs**

https://github.com/cornerstonejs/cornerstone

## cornerstone使用例

```html
<!-- include the cornerstone library -->
<script src="../../dist/cornerstone.js"></script>
<script>window.cornerstone || document.write('<script src="https://unpkg.com/cornerstone-core">\x3C/script>')</script>

<!-- include special code for these examples which provides images -->
<script src="../exampleImageIdLoader.js"></script>

<script>
    // image enable the element
    const element = document.getElementById('dicomImage');
    cornerstone.enable(element);

    // load the image and display it
    const imageId = 'example://1';
    cornerstone.loadImage(imageId).then(function(image) {
       cornerstone.displayImage(element, image);
    });

    // Add event handler to the ww/wc apply button
    document.getElementById('apply').addEventListener('click', function (e) {
        let viewport = cornerstone.getViewport(element);
        viewport.voi.windowWidth = parseFloat(document.getElementById('ww').value);
        viewport.voi.windowCenter = parseFloat(document.getElementById('wc').value);
        cornerstone.setViewport(element, viewport);
    });

    document.getElementById('invert').addEventListener('click', function (e) {
        let viewport = cornerstone.getViewport(element);
        viewport.invert = !viewport.invert;
        cornerstone.setViewport(element, viewport);
    });

    // add event handlers to mouse move to adjust window/center
    element.addEventListener('mousedown', function (e) {
        let lastX = e.pageX;
        let lastY = e.pageY;

        function mouseMoveHandler(e) {
            const deltaX = e.pageX - lastX;
            const deltaY = e.pageY - lastY;
            lastX = e.pageX;
            lastY = e.pageY;

            let viewport = cornerstone.getViewport(element);
            viewport.voi.windowWidth += (deltaX / viewport.scale);
            viewport.voi.windowCenter += (deltaY / viewport.scale);
            cornerstone.setViewport(element, viewport);
        };

        function mouseUpHandler() {
            document.removeEventListener('mousemove', mouseMoveHandler);
            document.removeEventListener('mouseup', mouseUpHandler);
        }

        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
    });
</script>
```

### 渲染单张DICOM数据的核心代码

```javascript
 cornerstone.loadImage(imageId).then(function(image) {
       cornerstone.displayImage(element, image);
    });
```

其中 exampleImageIdLoader.js 为自定义Loader



## cornerstone 源码解析

显示图片的核心方法又2个

- loadImage
- displayImage

### 1 loadImage

```javascript
/**
 * Loads an image given an imageId and optional priority and returns a promise which will resolve to
 * the loaded image object or fail if an error occurred.  The loaded image is not stored in the cache.
 *
 * @param {String} imageId A Cornerstone Image Object's imageId
 * @param {Object} [options] Options to be passed to the Image Loader
 *
 * @returns {ImageLoadObject} An Object which can be used to act after an image is loaded or loading fails
 * @memberof ImageLoader
 */
export function loadImage (imageId, options) {
  if (imageId === undefined) {
    throw new Error('loadImage: parameter imageId must not be undefined');
  }

  const imageLoadObject = getImageLoadObject(imageId);

  if (imageLoadObject !== undefined) {
    return imageLoadObject.promise;
  }

  return loadImageFromImageLoader(imageId, options).promise;
}
```

加载一个给定 imageId 和 选项 的图像，并返回一个promise，该promise将解析到加载的图像object，或者在发生错误时失败。

加载的图像不存储在缓存中。



**getImageLoadObject** 该方法，返回的是缓存中的图片。所以来看 **loadImageFromImageLoader** 方法



#### 1.1 loadImageFromImageLoader

```javascript
/**
 * Load an image using a registered Cornerstone Image Loader.
 *
 * The image loader that is used will be
 * determined by the image loader scheme matching against the imageId.
 *
 * @param {String} imageId A Cornerstone Image Object's imageId
 * @param {Object} [options] Options to be passed to the Image Loader
 *
 * @returns {ImageLoadObject} An Object which can be used to act after an image is loaded or loading fails
 * @memberof ImageLoader
 */
function loadImageFromImageLoader (imageId, options) {
  const colonIndex = imageId.indexOf(':');
  const scheme = imageId.substring(0, colonIndex);
  const loader = imageLoaders[scheme];

  if (loader === undefined || loader === null) {
    if (unknownImageLoader !== undefined) {
      return unknownImageLoader(imageId);
    }

    throw new Error('loadImageFromImageLoader: no image loader for imageId');
  }

  const imageLoadObject = loader(imageId, options);

  // Broadcast an image loaded event once the image is loaded
  imageLoadObject.promise.then(function (image) {
    triggerEvent(events, EVENTS.IMAGE_LOADED, { image });
  }, function (error) {
    const errorObject = {
      imageId,
      error
    };

    triggerEvent(events, EVENTS.IMAGE_LOAD_FAILED, errorObject);
  });

  return imageLoadObject;
}
```

使用注册的Cornerstone image Loader加载图像。

**本例中：**

const imageId = 'example://1';

此时 scheme =  "example"

加载的loader 为：imageLoaders["example"]

```javascript
// register our imageLoader plugin with cornerstone
    cs.registerImageLoader('example', getExampleImage);
```

这个为自定义loader，已经注册在cornerstone中。



**图片加载过程**

```javascript
function getExampleImage(imageId) {
        const width = 256;
        const height = 256;

        function getPixelData () {
            if(imageId === 'example://1') {
                return image1PixelData;
            } else if (imageId === 'example://2') {
                return image2PixelData;
            }

            throw "unknown imageId";
        }

        var image = {
            imageId: imageId,
            minPixelValue : 0,
            maxPixelValue : 257,
            slope: 1.0,
            intercept: 0,
            windowCenter : 127,
            windowWidth : 256,
            getPixelData: getPixelData,
            rows: height,
            columns: width,
            height: height,
            width: width,
            color: false,
            columnPixelSpacing: .8984375,
            rowPixelSpacing: .8984375,
            sizeInBytes: width * height * 2
        };

        return {
            promise: new Promise((resolve) => {
              resolve(image);
            }),
            cancelFn: undefined
        };
    }
```



**核心**

主要想要得到的东西就是 image object

```javascript
        var image = {
            imageId: imageId,
            minPixelValue : 0,
            maxPixelValue : 257,
            slope: 1.0,
            intercept: 0,
            windowCenter : 127,
            windowWidth : 256,
            getPixelData: getPixelData,
            rows: height,
            columns: width,
            height: height,
            width: width,
            color: false,
            columnPixelSpacing: .8984375,
            rowPixelSpacing: .8984375,
            sizeInBytes: width * height * 2
        };
```



### 2 displayImage

```javascript
/**
 * Sets a new image object for a given element.
 *
 * Will also apply an optional viewport setting.
 *
 * @param {HTMLElement} element An HTML Element enabled for Cornerstone
 * @param {Object} image An Image loaded by a Cornerstone Image Loader
 * @param {Object} [viewport] A set of Cornerstone viewport parameters
 * @returns {void}
 * @memberof Drawing
 */
export default function (element, image, viewport) {
  if (element === undefined) {
    throw new Error('displayImage: parameter element must not be undefined');
  }
  if (image === undefined) {
    throw new Error('displayImage: parameter image must not be undefined');
  }

  const enabledElement = getEnabledElement(element);
  const oldImage = enabledElement.image;

  enabledElement.image = image;

  if (enabledElement.layers && enabledElement.layers.length) {
    setLayerImage(element, image);
  }

  if (enabledElement.viewport === undefined) {
    enabledElement.viewport = getDefaultViewport(enabledElement.canvas, image);
  }

  // Merge viewport
  if (viewport) {
    for (const attrname in viewport) {
      if (viewport[attrname] !== null) {
        enabledElement.viewport[attrname] = viewport[attrname];
      }
    }
  }

  let frameRate;

  if (enabledElement.lastImageTimeStamp !== undefined) {
    const timeSinceLastImage = now() - enabledElement.lastImageTimeStamp;

    frameRate = (1000 / timeSinceLastImage).toFixed();
  }

  enabledElement.lastImageTimeStamp = now();

  const newImageEventData = {
    viewport: enabledElement.viewport,
    element: enabledElement.element,
    image: enabledElement.image,
    oldImage,
    enabledElement,
    frameRate
  };

  triggerEvent(enabledElement.element, EVENTS.NEW_IMAGE, newImageEventData);

  updateImage(element);
}
```



为给定元素设置一个新的图像对象。



#### 2.1 核心方法 updateImage

```javascript
/**
 * Forces the image to be updated/redrawn for the specified enabled element
 * @param {HTMLElement} element An HTML Element enabled for Cornerstone
 * @param {Boolean} [invalidated=false] Whether or not the image pixel data has been changed, necessitating a redraw
 *
 * @returns {void}
 * @memberof Drawing
 */
export default function (element, invalidated = false) {
  const enabledElement = getEnabledElement(element);

  if (enabledElement.image === undefined && !enabledElement.layers.length) {
    throw new Error('updateImage: image has not been loaded yet');
  }

  drawImage(enabledElement, invalidated);
}
```

强制更新/重绘指定启用元素的图像



##### 2.1.1 drawImage

```javascript
/**
 * Internal API function to draw an image to a given enabled element
 *
 * @param {EnabledElement} enabledElement The Cornerstone Enabled Element to redraw
 * @param {Boolean} [invalidated = false] - true if pixel data has been invalidated and cached rendering should not be used
 * @returns {void}
 * @memberof Internal
 */
export default function (enabledElement, invalidated = false) {
  enabledElement.needsRedraw = true;
  if (invalidated) {
    enabledElement.invalid = true;
  }
}
```

内部API函数，用于向给定的启用元素绘制图像



**enable.js**

needsRedraw 改变后，在渲染循环中触发重新渲染

```javascript
    if (enabledElement.needsRedraw && hasImageOrLayers(enabledElement)) {
      drawImageSync(enabledElement, enabledElement.invalid);
    }
```



##### 2.1.2 drawImageSync

```javascript
/**
 * Draw an image to a given enabled element synchronously
 *
 * @param {EnabledElement} enabledElement An enabled element to draw into
 * @param {Boolean} invalidated - true if pixel data has been invalidated and cached rendering should not be used
 * @returns {void}
 * @memberof Internal
 */
export default function (enabledElement, invalidated) {
  const image = enabledElement.image;
  const element = enabledElement.element;
  const layers = enabledElement.layers || [];

  // Check if enabledElement can be redrawn
  if (!enabledElement.canvas || !(enabledElement.image || layers.length)) {
    return;
  }

  // Start measuring the time needed to draw the image/layers
  const start = now();

  image.stats = {
    lastGetPixelDataTime: -1.0,
    lastStoredPixelDataToCanvasImageDataTime: -1.0,
    lastPutImageDataTime: -1.0,
    lastRenderTime: -1.0,
    lastLutGenerateTime: -1.0
  };

  if (layers && layers.length) {
    drawCompositeImage(enabledElement, invalidated);
  } else if (image) {
    let render = image.render;

    if (!render) {
      if (enabledElement.viewport.colormap &&
          enabledElement.viewport.colormap !== '' &&
          enabledElement.image.labelmap === true) {
        render = renderLabelMapImage;
      } else if (enabledElement.viewport.colormap && enabledElement.viewport.colormap !== '') {
        render = renderPseudoColorImage;
      } else if (image.color) {
        render = renderColorImage;
      } else {
        render = renderGrayscaleImage;
      }
    }

    render(enabledElement, invalidated);
  }

  // Calculate how long it took to draw the image/layers
  const renderTimeInMs = now() - start;

  const eventData = {
    viewport: enabledElement.viewport,
    element,
    image,
    enabledElement,
    canvasContext: enabledElement.canvas.getContext('2d'),
    renderTimeInMs
  };

  image.stats.lastRenderTime = renderTimeInMs;

  enabledElement.invalid = false;
  enabledElement.needsRedraw = false;

  triggerEvent(element, EVENTS.IMAGE_RENDERED, eventData);
}
```



同步绘制图像 到 给定的启用元素



##### 2.1.3 renderGrayscaleImage 渲染灰度图

```javascript
/**
 * API function to draw a grayscale image to a given enabledElement
 *
 * @param {EnabledElement} enabledElement The Cornerstone Enabled Element to redraw
 * @param {Boolean} invalidated - true if pixel data has been invalidated and cached rendering should not be used
 * @returns {void}
 * @memberof rendering
 */
export function renderGrayscaleImage (enabledElement, invalidated) {
  if (enabledElement === undefined) {
    throw new Error('drawImage: enabledElement parameter must not be undefined');
  }

  const image = enabledElement.image;

  if (image === undefined) {
    throw new Error('drawImage: image must be loaded before it can be drawn');
  }

  // Get the canvas context and reset the transform
  const context = enabledElement.canvas.getContext('2d');

  context.setTransform(1, 0, 0, 1, 0, 0);

  // Clear the canvas
  context.fillStyle = 'black';
  context.fillRect(0, 0, enabledElement.canvas.width, enabledElement.canvas.height);

  // Turn off image smooth/interpolation if pixelReplication is set in the viewport
  context.imageSmoothingEnabled = !enabledElement.viewport.pixelReplication;
  context.mozImageSmoothingEnabled = context.imageSmoothingEnabled;

  // Save the canvas context state and apply the viewport properties
  setToPixelCoordinateSystem(enabledElement, context);

  let renderCanvas;

  if (enabledElement.options && enabledElement.options.renderer &&
    enabledElement.options.renderer.toLowerCase() === 'webgl') {
    // If this enabled element has the option set for WebGL, we should
    // User it as our renderer.
    renderCanvas = webGL.renderer.render(enabledElement);
  } else {
    // If no options are set we will retrieve the renderCanvas through the
    // Normal Canvas rendering path
    renderCanvas = getRenderCanvas(enabledElement, image, invalidated);
  }

  const sx = enabledElement.viewport.displayedArea.tlhc.x - 1;
  const sy = enabledElement.viewport.displayedArea.tlhc.y - 1;
  const width = enabledElement.viewport.displayedArea.brhc.x - sx;
  const height = enabledElement.viewport.displayedArea.brhc.y - sy;

  context.drawImage(renderCanvas, sx, sy, width, height, 0, 0, width, height);

  enabledElement.renderingTools = saveLastRendered(enabledElement);
}
```

API函数，用于绘制给定 enable element 的灰度图像



```javascript
 context.drawImage(renderCanvas, sx, sy, width, height, 0, 0, width, height);
```

**CanvasRenderingContext2D.drawImage()**

语法

```javascript
void ctx.drawImage(image, dx, dy);
void ctx.drawImage(image, dx, dy, dWidth, dHeight);
void ctx.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
```

参考： https://developer.mozilla.org/zh-CN/docs/Web/API/CanvasRenderingContext2D/drawImage



##### 2.1.4 getRenderCanvas 获取渲染canvas

```javascript
/**
 * Returns an appropriate canvas to render the Image. If the canvas available in the cache is appropriate
 * it is returned, otherwise adjustments are made. It also sets the color transfer functions.
 *
 * @param {Object} enabledElement The cornerstone enabled element
 * @param {Object} image The image to be rendered
 * @param {Boolean} invalidated Is pixel data valid
 * @param {Boolean} [useAlphaChannel = true] Will an alpha channel be used
 * @returns {HTMLCanvasElement} An appropriate canvas for rendering the image
 * @memberof rendering
 */
function getRenderCanvas (enabledElement, image, invalidated, useAlphaChannel = true) {
  const canvasWasColor = enabledElement.renderingTools.lastRenderedIsColor === true;

  if (!enabledElement.renderingTools.renderCanvas || canvasWasColor) {
    enabledElement.renderingTools.renderCanvas = document.createElement('canvas');
    initializeRenderCanvas(enabledElement, image);
  }

  const renderCanvas = enabledElement.renderingTools.renderCanvas;

  if (doesImageNeedToBeRendered(enabledElement, image) === false && invalidated !== true) {
    return renderCanvas;
  }

  // If our render canvas does not match the size of this image reset it
  // NOTE: This might be inefficient if we are updating multiple images of different
  // Sizes frequently.
  if (renderCanvas.width !== image.width || renderCanvas.height !== image.height) {
    initializeRenderCanvas(enabledElement, image);
  }

  // Get the lut to use
  let start = now();
  const lut = getLut(image, enabledElement.viewport, invalidated);

  image.stats = image.stats || {};
  image.stats.lastLutGenerateTime = now() - start;

  const renderCanvasData = enabledElement.renderingTools.renderCanvasData;
  const renderCanvasContext = enabledElement.renderingTools.renderCanvasContext;

  // Gray scale image - apply the lut and put the resulting image onto the render canvas
  if (useAlphaChannel) {
    storedPixelDataToCanvasImageData(image, lut, renderCanvasData.data);
  } else {
    storedPixelDataToCanvasImageDataRGBA(image, lut, renderCanvasData.data);
  }

  start = now();
  renderCanvasContext.putImageData(renderCanvasData, 0, 0);
  image.stats.lastPutImageDataTime = now() - start;

  return renderCanvas;
}
```

返回一个适当的 canvas 来渲染图像。如果缓存中可用的 canvas 合适

返回该值，否则将进行调整。它还设置了 色彩转换方程。



##### 2.1.5 （核心！）storedPixelDataToCanvasImageDataRGBA

```javascript
/**
 * This function transforms stored pixel values into a canvas image data buffer
 * by using a LUT.
 *
 * @param {Image} image A Cornerstone Image Object
 * @param {Array} lut Lookup table array
 * @param {Uint8ClampedArray} canvasImageDataData canvasImageData.data buffer filled with white pixels
 *
 * @returns {void}
 * @memberof Internal
 */
export default function (image, lut, canvasImageDataData) {
  let start = now();
  const pixelData = image.getPixelData();

  image.stats.lastGetPixelDataTime = now() - start;

  const numPixels = pixelData.length;
  const minPixelValue = image.minPixelValue;
  let canvasImageDataIndex = 0;
  let storedPixelDataIndex = 0;
  let pixelValue;

  // NOTE: As of Nov 2014, most javascript engines have lower performance when indexing negative indexes.
  // We have a special code path for this case that improves performance.  Thanks to @jpambrun for this enhancement

  // Added two paths (Int16Array, Uint16Array) to avoid polymorphic deoptimization in chrome.
  start = now();
  if (pixelData instanceof Int16Array) {
    if (minPixelValue < 0) {
      while (storedPixelDataIndex < numPixels) {
        pixelValue = lut[pixelData[storedPixelDataIndex++] + (-minPixelValue)];
        canvasImageDataData[canvasImageDataIndex++] = pixelValue;
        canvasImageDataData[canvasImageDataIndex++] = pixelValue;
        canvasImageDataData[canvasImageDataIndex++] = pixelValue;
        canvasImageDataData[canvasImageDataIndex++] = 255; // Alpha
      }
    } else {
      while (storedPixelDataIndex < numPixels) {
        pixelValue = lut[pixelData[storedPixelDataIndex++]];
        canvasImageDataData[canvasImageDataIndex++] = pixelValue;
        canvasImageDataData[canvasImageDataIndex++] = pixelValue;
        canvasImageDataData[canvasImageDataIndex++] = pixelValue;
        canvasImageDataData[canvasImageDataIndex++] = 255; // Alpha
      }
    }
  } else if (pixelData instanceof Uint16Array) {
    while (storedPixelDataIndex < numPixels) {
      pixelValue = lut[pixelData[storedPixelDataIndex++]];
      canvasImageDataData[canvasImageDataIndex++] = pixelValue;
      canvasImageDataData[canvasImageDataIndex++] = pixelValue;
      canvasImageDataData[canvasImageDataIndex++] = pixelValue;
      canvasImageDataData[canvasImageDataIndex++] = 255; // Alpha
    }
  } else if (minPixelValue < 0) {
    while (storedPixelDataIndex < numPixels) {
      pixelValue = lut[pixelData[storedPixelDataIndex++] + (-minPixelValue)];
      canvasImageDataData[canvasImageDataIndex++] = pixelValue;
      canvasImageDataData[canvasImageDataIndex++] = pixelValue;
      canvasImageDataData[canvasImageDataIndex++] = pixelValue;
      canvasImageDataData[canvasImageDataIndex++] = 255; // Alpha
    }
  } else {
    while (storedPixelDataIndex < numPixels) {
      pixelValue = lut[pixelData[storedPixelDataIndex++]];
      canvasImageDataData[canvasImageDataIndex++] = pixelValue;
      canvasImageDataData[canvasImageDataIndex++] = pixelValue;
      canvasImageDataData[canvasImageDataIndex++] = pixelValue;
      canvasImageDataData[canvasImageDataIndex++] = 255; // Alpha
    }
  }

  image.stats.lastStoredPixelDataToCanvasImageDataTime = now() - start;
}
```

这个函数将存储的 像素值 转换 为画布图像数据缓冲区

这个地方就是将uint16 或者 int16的数据转换成 0-255 范围内的数据，即生成一张可以被显示的图片。

我们观察到，这段代码中，把每个像素点的Alpha通道写成255，另外的RGB通道统一写成 pixelvalue。

**这个 pixelvalue 是通过 lut 这个数组来获取到，lut这个数组是之前写在缓存中的一个数组，相比每次去计算像素值，这样做大大提高了程序的执行效率。**



这里有一段作者写的注释，翻译过来是：

注:截至2014年11月，大多数javascript引擎在 索引 负索引 时性能较低。

对于这种情况，我们有一个特殊的代码路径来提高性能。感谢@jpambrun提供的这种增强

增加了两个路径(Int16Array, Uint16Array)，以避免在chrome的多态反优化。



### 3 生成lut 数组

在 **getRenderCanvas** 方法中

```javascript
// Get the lut to use
  let start = now();
  const lut = getLut(image, enabledElement.viewport, invalidated);
```



#### 3.1 getLut

```javascript
/**
 * Retrieve or generate a LUT Array for an Image and Viewport
 *
 * @param {Image} image An Image Object
 * @param {Viewport} viewport An Viewport Object
 * @param {Boolean} invalidated Whether or not the LUT data has been invalidated
 * (e.g. by a change to the windowWidth, windowCenter, or invert viewport parameters).
 * @return {Uint8ClampedArray} LUT Array
 * @memberof rendering
 */
export default function (image, viewport, invalidated) {
  // If we have a cached lut and it has the right values, return it immediately
  if (image.cachedLut !== undefined &&
    image.cachedLut.windowCenter === viewport.voi.windowCenter &&
    image.cachedLut.windowWidth === viewport.voi.windowWidth &&
    lutMatches(image.cachedLut.modalityLUT, viewport.modalityLUT) &&
    lutMatches(image.cachedLut.voiLUT, viewport.voiLUT) &&
    image.cachedLut.invert === viewport.invert &&
    invalidated !== true) {
    return image.cachedLut.lutArray;
  }

  computeAutoVoi(viewport, image);

  // Lut is invalid or not present, regenerate it and cache it
  generateLut(image, viewport.voi.windowWidth, viewport.voi.windowCenter, viewport.invert, viewport.modalityLUT, viewport.voiLUT);

  image.cachedLut.windowWidth = viewport.voi.windowWidth;
  image.cachedLut.windowCenter = viewport.voi.windowCenter;
  image.cachedLut.invert = viewport.invert;
  image.cachedLut.voiLUT = viewport.voiLUT;
  image.cachedLut.modalityLUT = viewport.modalityLUT;

  return image.cachedLut.lutArray;
}
```

检索或生成 图像 和 Viewport 的LUT数组



**computeAutoVoi** 这个方法用来生成 窗宽 和 窗位



#### 3.2 （核心！）generateLut

```javascript
/**
 * Creates a LUT used while rendering to convert stored pixel values to
 * display pixels
 *
 * @param {Image} image A Cornerstone Image Object
 * @param {Number} windowWidth The Window Width
 * @param {Number} windowCenter The Window Center
 * @param {Boolean} invert A boolean describing whether or not the image has been inverted
 * @param {Array} [modalityLUT] A modality Lookup Table
 * @param {Array} [voiLUT] A Volume of Interest Lookup Table
 *
 * @returns {Uint8ClampedArray} A lookup table to apply to the image
 * @memberof Internal
 */
export default function (image, windowWidth, windowCenter, invert, modalityLUT, voiLUT) {
  const maxPixelValue = image.maxPixelValue;
  const minPixelValue = image.minPixelValue;
  const offset = Math.min(minPixelValue, 0);

  if (image.cachedLut === undefined) {
    const length = maxPixelValue - offset + 1;

    image.cachedLut = {};
    image.cachedLut.lutArray = new Uint8ClampedArray(length);
  }

  const lut = image.cachedLut.lutArray;
  const mlutfn = getModalityLUT(image.slope, image.intercept, modalityLUT);
  const vlutfn = getVOILUT(windowWidth, windowCenter, voiLUT);

  if (invert === true) {
    for (let storedValue = minPixelValue; storedValue <= maxPixelValue; storedValue++) {
      lut[storedValue + (-offset)] = 255 - vlutfn(mlutfn(storedValue));
    }
  } else {
    for (let storedValue = minPixelValue; storedValue <= maxPixelValue; storedValue++) {
      lut[storedValue + (-offset)] = vlutfn(mlutfn(storedValue));
    }
  }

  return lut;
}
```

从最小的像素一直循环到最大的像素，生成一个映射表LUT



## 总结

总而言之，在cornerstone中，为了优化生成图片的生成速度，建立一个数据值对应灰度值的映射表LUT，每次靠查表来获取像素的值。

未来的影像系统的版本考虑要在这个方向上进行优化。
