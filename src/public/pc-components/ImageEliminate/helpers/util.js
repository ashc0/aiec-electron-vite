import { DRAWING_STEP_BASE, DRAWING_STEP_BASE_BASE, MIN_RADIUS } from '../constants';

const { sqrt, max } = Math;

export function fixed(num) {
    return num | 0;
}
/**
 * 比Math.hypot(x,y)快一些(在数量级较大的情况下)
 * @param {*} xDistance
 * @param {*} yDistance
 * @returns
 */
export function getRawDistance(xDistance, yDistance) {
    return sqrt(xDistance ** 2 + yDistance ** 2);
}

/**
 * 计算插值绘制的间隔步长
 * @param {*} radius 画笔大小
 * @returns
 */
export function computeStepBase(radius) {
    return radius / DRAWING_STEP_BASE_BASE;
}

/**
 * 计算真实(相对真实，如果图像分辨率会控制在2K以内以保证性能)尺寸的画笔绘制点的半径
 * @param {*} rawRadius 显示用的画笔大小
 * @param {*} scaleRatio 缩放比例
 * @returns
 */
export function computeRealRadius(rawRadius, scaleRatio) {
    return max(MIN_RADIUS, rawRadius) / scaleRatio;
    // return max(MIN_RADIUS, rawRadius);
}

/**
 * 计算移动绘制的节流步长
 * @param {*} radius 画笔大小
 * @returns
 */
export function computeStep(radius) {
    return radius / DRAWING_STEP_BASE;
}

/**
 * 基于新的缩放比例计算新的绘制范围
 * @param {*} transformConfig 缩放配置信息
 * @param {*} pictureSize 图片大小
 * @param {*} scaleRatio 缩放比例
 * @returns
 */
export function computeNewTransformConfigByScaleRatio(transformConfig, pictureSize, scaleRatio) {
    const { minX, minY } = transformConfig.positionRange;
    const { width, height } = pictureSize;
    const maxX = minX + width * scaleRatio;
    const maxY = minY + height * scaleRatio;
    return { positionRange: { minX, maxX, minY, maxY }, scaleRatio };
}

/**
 * 获取图片缩放到画框区域内的实际尺寸
 * @param {*} imageSize 图片大小
 * @param {*} scaleRatio 缩放比例
 * @returns
 */
export function computeScaledImageSize(imageSize, scaleRatio) {
    return {
        width: imageSize.width * scaleRatio,
        height: imageSize.height * scaleRatio,
    };
}

/**
 * 去掉前后 空格/空行/tab 的正则 预先定义 避免在函数中重复构造
 * @type {RegExp}
 */
let trimReg = /(^\s*)|(\s*$)/g;

/**
 * 判断一个值是否为空
 */
export const isEmpty = (key) => {
    if (key === undefined || key === '' || key === null) {
        return true;
    }
    if (typeof (key) === 'string') {
        key = key.replace(trimReg, '');
        if (key == '' || key == null || key == 'null' || key == undefined || key == 'undefined') {
            return true;
        } else {
            return false;
        }
    } else if (typeof (key) === 'undefined') {
        return true;
    } else if (typeof (key) === 'object') {
        for (let i in key) {
            return false;
        }
        return true;
    } else if (typeof (key) === 'boolean') {
        return false;
    }
}

/**
 * 是否为字符串
 * @param {*} str
 * @returns
 */
export const isString = (str) => {
    return typeof str === 'string';
}
