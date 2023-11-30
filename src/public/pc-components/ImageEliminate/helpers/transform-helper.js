import { ZOOM_OUT_COEFFICIENT, ZOOM_IN_COEFFICIENT, SCALE_STEP, MIN_SCALE_RATIO, MAX_SCALE_RATIO } from '../constants/index';
import { computeBoardRect } from './init-compute';

const { sign } = Math;

/**
 * 鼠标滚轮滚动缩放时更新变换参数
 * @param {*} ev
 * @param {*} transformConfig
 */
function updateTransformConfigWhileScaling(ev, transformConfig, canvas) {
    const { deltaY, deltaX, pageX, pageY, target } = ev;
    const { positionRange, scaleRatio } = transformConfig;
    const { left, top } = computeBoardRect(target);
    let x = computePivot(pageX, left);
    let y = computePivot(pageY, top);

    if (x > canvas.width || y > canvas.height) {
        x = canvas.width / 2;
        y = canvas.height / 2;
    }
    const deltaRatio = computeDeltaRatio(deltaY, deltaX, scaleRatio);
    const targetScaleRatio = computeNewScaleRatio(scaleRatio, deltaRatio);
    transformConfig.scaleRatio = computeClampedTargetScaleRatio(targetScaleRatio);
    // 不能直接使用deltaRatio，scaleRatio接近最大/最小值时，二者就不相等了。
    const rangeScaleRatio = computeRangeScaleRatio(transformConfig.scaleRatio, scaleRatio);
    transformConfig.positionRange = computeNewPositionRange(positionRange, { x, y }, rangeScaleRatio);
    return { transformConfig, rangeScaleRatio };
}

/**
 * 计算鼠标的位置对应的像素在图像中的位置
 * @param {*} pagePivot
 * @param {*} leftOrTop
 * @returns
 */
function computePivot(pagePivot, leftOrTop) {
    return pagePivot - leftOrTop;
}

/**
 * 计算变化比率
 * @param {*} deltaY
 * @returns
 */
function computeDeltaRatio(deltaY, deltaX, scaleRatio) {
    let scaleCoefficient = isZoomOut(deltaY) ? ZOOM_OUT_COEFFICIENT : ZOOM_IN_COEFFICIENT;
    if (deltaY === 0 || deltaY === -0) {
        scaleCoefficient = isZoomOut(deltaX) ? ZOOM_OUT_COEFFICIENT : ZOOM_IN_COEFFICIENT;
    }
    let scalStep = scaleRatio * 0.12;
    /* 先不分段了 */
    // if (scaleRatio >= 0.1 && scaleRatio < 0.3) scalStep = 0.02;
    // if (scaleRatio >= 0.3 && scaleRatio < 0.5) scalStep = 0.04;
    // if (scaleRatio >= 0.5 && scaleRatio < 1) scalStep = 0.1;
    // if (scaleRatio >= 1 && scaleRatio <= 4) scalStep = 0.2;
    return scaleCoefficient * scalStep;
}

/**
 * 是否为缩小
 * @param {*} deltaY
 * @returns
 */
export const isZoomOut = (deltaY) => {
    return -sign(deltaY) === ZOOM_OUT_COEFFICIENT;
}

/**
 * 计算新的缩放比率
 * @param {*} scaleRatio
 * @param {*} deltaRatio
 * @returns
 */
function computeNewScaleRatio(scaleRatio, deltaRatio) {
    return scaleRatio + deltaRatio;
}

/**
 * 计算绘制范围的变化比率
 * @param {*} newRatio
 * @param {*} oldRatio
 * @returns
 */
export const computeRangeScaleRatio = (newRatio, oldRatio) => {
    return (newRatio - oldRatio) / oldRatio;
}

/**
 * 夹住缩放比例使其不会超出范围
 * @param {*} scaleRatio 缩放比例
 * @returns
 */
function computeClampedTargetScaleRatio(scaleRatio) {
    return scaleRatio < MIN_SCALE_RATIO ? MIN_SCALE_RATIO : scaleRatio > MAX_SCALE_RATIO ? MAX_SCALE_RATIO : scaleRatio;
}

/**
 * 计算新的绘制范围
 * @param {*} positionRange 定位信息
 * @param {*} position 当前位置
 * @param {*} deltaRatio
 * @returns
 */
export const computeNewPositionRange = (positionRange, position, deltaRatio) => {
    const { x, y } = position;
    let { minX, maxX, minY, maxY } = positionRange;
    minX = computeNewSingleRange(minX, x, deltaRatio);
    maxX = computeNewSingleRange(maxX, x, deltaRatio);
    minY = computeNewSingleRange(minY, y, deltaRatio);
    maxY = computeNewSingleRange(maxY, y, deltaRatio);
    return { minX, maxX, minY, maxY };
}

/**
 * 计算缩放后x/y轴方向的新的绘制范围值
 * @param {*} singleRange
 * @param {*} pivot
 * @param {*} deltaRatio
 * @returns
 */
function computeNewSingleRange(singleRange, pivot, deltaRatio) {
    const vectorDistance = singleRange - pivot;
    const deltaRange = vectorDistance * deltaRatio;
    return singleRange + deltaRange;
}

/**
 * 变换(平移、缩放)时重绘画板中图像
 */
export const redrawMattingBoardsWhileScaling = (ev, transformConfig, canvas) => {
    return updateTransformConfigWhileScaling(ev, transformConfig, canvas);
}


/**
 * 获取缩放比例
 * @param {*} p1
 * @param {*} p2
 * @returns
 */
export const getDistance = (p1, p2) => {
    var x = p2.pageX - p1.pageX;
    var y = p2.pageY - p1.pageY;
    return Math.sqrt(x * x + y * y);
}
