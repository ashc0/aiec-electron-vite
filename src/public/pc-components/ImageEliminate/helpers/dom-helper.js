import { DEFAULT_IMAGE_SMOOTH_CHOICE, REPAIR_INNER_COLOR, REPAIR_OUTER_COLOR, MASK_INNER_COLOR } from '../constants/index';
import { isEmpty, isString } from './util';

/**
 * 画布缩放
 * @param {*} config
 */
export const resizeCanvas = (config) => {
    const { ctx, targetWidth, targetHeight, hiddenCtx, transformConfig, withBorder = false } = config;
    const { positionRange, scaleRatio } = transformConfig;
    ctx.canvas.width = targetWidth;
    ctx.canvas.height = targetHeight;
    ctx.imageSmoothingEnabled = DEFAULT_IMAGE_SMOOTH_CHOICE;
    transformedDrawImage({
        ctx,
        hiddenCtx,
        positionRange: positionRange,
        scaleRatio: scaleRatio,
        withBorder,
        clearOld: false
    });
}

/**
 * 创建2D绘制上下文
 * @param {*} createConfig
 * @returns
 */
export const createContext2D = (createConfig = {}) => {
    const { targetSize, cloneCanvas } = createConfig;
    const canvas = document.createElement('canvas');
    const context2D = canvas.getContext('2d');
    if (targetSize) {
        canvas.width = targetSize.width;
        canvas.height = targetSize.height;
    }
    if (cloneCanvas) {
        copyImageInCanvas(context2D, cloneCanvas);
    }
    return context2D;
}

/**
 * 复制画布中的图像
 * @param {*} hiddenContext
 * @param {*} cloneCanvas
 */
const copyImageInCanvas = (hiddenContext, cloneCanvas) => {
    hiddenContext.canvas.width = cloneCanvas.width;
    hiddenContext.canvas.height = cloneCanvas.height;
    hiddenContext.drawImage(cloneCanvas, 0, 0);
}

/**
 * 隐藏各个画布
 * @param  {...any} ctxs
 */
export const hideCanvas = (...ctxs) => {
    for (const ctx of ctxs) {
        ctx.canvas.style.display = 'none';
    }
}

/**
 * 显示各个画布
 * @param  {...any} ctxs
 */
export const showCanvas = (...ctxs) => {
    for (const ctx of ctxs) {
        ctx.canvas.style.display = 'initial';
    }
}

/**
 * 获取指定链接下的位图图像
 * @param {*} picFile
 * @returns
 */
export const getLoadedImage = async (picFile) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = isString(picFile) ? picFile : URL.createObjectURL(picFile);
    await new Promise((resolve) => {
        img.onload = () => resolve(true);
    });
    return await createImageBitmap(img);
}

/**
 * 初始化隐藏的绘制画板和成果图画板的图片部分
 * @param {*} initConfig
 * @returns
 */
export const initHiddenBoardWithSource = (initConfig) => {
    initHiddenBoard(initConfig);
    const {
        hiddenCtx: ctx,
        imageSource,
        targetSize: { width, height },
    } = initConfig;
    return getImageSourceFromCtx({ ctx, imageSource, width, height });
}

/**
 * 初始化隐藏的绘制画板和成果图画板
 * @param {*} initConfig
 */
export const initHiddenBoard = (initConfig) => {
    const { targetSize, hiddenCtx, drawingCtx } = initConfig;
    const { width, height } = targetSize;
    hiddenCtx.canvas.width = width;
    hiddenCtx.canvas.height = height;
    drawingCtx.canvas.width = width;
    drawingCtx.canvas.height = height;
}

/**
 * 获取画布全屏绘制后的图像
 * @param {*} config
 * @returns
 */
export const getImageSourceFromCtx = (config) => {
    const { ctx, imageSource, width, height } = config;
    ctx.drawImage(imageSource, 0, 0, width, height);
    return createImageBitmap(ctx.canvas);
}

/**
 * 清除画布中之前的内容
 * @param {*} ctx
 */
const clearCanvas = (ctx) => {
    const {
        canvas: { width, height },
    } = ctx;
    ctx.clearRect(0, 0, width, height);
}


/**
 * 进行变换和绘制
 * @param {*} transformedConfig
 */
export const transformedDrawImage = (transformedConfig) => {
    const { ctx, hiddenCtx, clearOld = true } = transformedConfig;
    const { positionRange, scaleRatio } = transformedConfig;
    const { minX: translateX, minY: translateY } = positionRange;
    if (clearOld) {
        clearCanvas(ctx);
    }
    ctx.save();
    ctx.translate(translateX, translateY);
    ctx.scale(scaleRatio, scaleRatio);
    ctx.drawImage(hiddenCtx.canvas, 0, 0);
    ctx.restore();
}



/**
 * 绘制笔刷圆点
 * @param {*} config
 */
export const drawBrushPoint = (config) => {
    const { ctx, x, y, radius, hardness } = config;
    let { innerColor = REPAIR_INNER_COLOR, outerColor = REPAIR_OUTER_COLOR } = config;

    ctx.beginPath();
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, innerColor);
    gradient.addColorStop(hardness, innerColor);
    gradient.addColorStop(1, outerColor);
    ctx.fillStyle = gradient;

    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
}


/**
 * 绘制修补/扣除的轨迹
 */
export const drawMattingTrack = (drawingCtx, hiddenCtx, mattingSource, drawingCallback) => {
    drawingCtx.globalCompositeOperation = 'source-over';
    drawingCtx.drawImage(mattingSource, 0, 0);
    drawingCtx.globalCompositeOperation = 'destination-in';
    drawingCallback();
    hiddenCtx.drawImage(drawingCtx.canvas, 0, 0);
}

/**
 * 获得生成蒙版后的图像资源
 * @param {*} imageSource
 * @param {*} targetSize
 * @returns
 */
export const generateMaskImageSource = async (targetSize, imageSource, fillColor = MASK_INNER_COLOR) => {
    /* 2d版本 */
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = targetSize.width;
    canvas.height = targetSize.height;
    // 绘制原图片到canvas
    ctx.drawImage(imageSource, 0, 0, targetSize.width, targetSize.height);
    // 设置蒙版样式
    ctx.fillStyle = fillColor;
    // 在canvas上绘制一个矩形作为蒙版
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    let imageInfo = await createImageBitmap(canvas);
    return imageInfo;
}

/**
 * 获取png图有内容的四个角坐标
 */
export const getPostionFromPng = (imageInfo) => {
    const img = new Image();
    img.src = imageInfo;
    return new Promise((resolve, reject) => {
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            // 设置 canvas 与图片一样大
            canvas.width = img.width;
            canvas.height = img.height;
            // 绘制图片到 canvas
            ctx.drawImage(img, 0, 0);
            // 获取像素数据
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            // 记录不透明点的最大最小 x 和 y 坐标
            let xMin = canvas.width, xMax = 0;
            let yMin = canvas.height, yMax = 0;
            // 遍历每个像素点
            for (let i = 0; i < data.length; i += 4) {
                // 如果 alpha 通道不为 0,则为不透明点
                if (data[i + 3] !== 0) {
                    const x = (i / 4) % canvas.width;
                    const y = Math.floor(i / 4 / canvas.width);
                    // 记录 x,y 坐标最大最小值
                    xMin = Math.min(xMin, x);
                    xMax = Math.max(xMax, x);
                    yMin = Math.min(yMin, y);
                    yMax = Math.max(yMax, y);
                }
            }
            // 计算矩形区域坐标
            const x = xMin;
            const y = yMin;
            const width = xMax - xMin;
            const height = yMax - yMin;
            resolve({ x, y, width, height, img });
        }
    })
}

/**
 * 获取png图片的点位是否为透明像素
 * @param {*} pngData
 * @param {*} x
 * @param {*} y
 * @returns
 */
export const getPngAlphaByCoordinate = (pngData, x, y, width, height) => {
    if (isEmpty(pngData)) {
        return false;
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(pngData, 0, 0, width, height);

    const imageData = ctx.getImageData(x.toFixed(), y.toFixed(), 1, 1);
    const alpha = imageData.data[0];
    if (alpha === 0) {
        return false;
    }
    return true;
}
