import { DRAW_INTERPOLATION_RADIUS_THRESHOLD, DRAW_INTERPOLATION_STEP_BASE } from '../constants/index';

const { sign, abs, max } = Math;

/**
 * 计算x/y轴方向移动距离及水平/垂直方向上的最大移动距离
 * @param {*} movements
 * @returns
 */
export const computeMovements = (movements) => {
    const { movementX, movementY } = movements;
    const unsignedMovementX = abs(movementX);
    const unsignedMovementY = abs(movementY);
    const maxMovement = max(unsignedMovementX, unsignedMovementY);
    return { unsignedMovementX, unsignedMovementY, maxMovement };
}

/**
 * 是否需要插值渲染
 * @param {*} maxMovement
 * @param {*} radius
 * @returns
 */
export const needDrawInterpolation = (maxMovement, radius) => {
    return radius > DRAW_INTERPOLATION_RADIUS_THRESHOLD && maxMovement > radius / DRAW_INTERPOLATION_STEP_BASE;
}

/**
 * 计算插值的步长
 * @param {*} interpolationConfig
 * @returns
 */
export const computeInterpolationStep = (interpolationConfig) => {
    const { drawingConfig, unsignedMovementX, unsignedMovementY, maxMovement } = interpolationConfig;
    const { movementX, movementY, stepBase } = drawingConfig;
    const rawStepX = computePivotRawStep(movementX, stepBase);
    const rawStepY = computePivotRawStep(movementY, stepBase);
    const movementXIsMaximum = isMaxMovement(unsignedMovementX, maxMovement);
    const stepX = computePivotStep(movementXIsMaximum, rawStepX, unsignedMovementX, unsignedMovementY);
    const stepY = computePivotStep(!movementXIsMaximum, rawStepY, unsignedMovementY, unsignedMovementX);
    return { stepX, stepY };
}

/**
 * 计算x/y轴方向上朝上一次鼠标指针位置的插值步长
 * @param {*} pivotMovement
 * @param {*} stepBase
 * @returns
 */
const computePivotRawStep = (pivotMovement, stepBase) => {
    return -sign(pivotMovement) * stepBase;
}

/**
 * 是否为最大移动距离
 * @param {*} pivotMovement
 * @param {*} maxMovement
 * @returns
 */
const isMaxMovement = (pivotMovement, maxMovement) => {
    return pivotMovement === maxMovement;
}

/**
 * 计算x/y轴方向的累加步长
 * @param {*} isMaxMovement
 * @param {*} rawStepOfPivot
 * @param {*} unsignedPivotMovement
 * @param {*} unsignedCrossedMovement
 * @returns
 */
const computePivotStep = (isMaxMovement, rawStepOfPivot, unsignedPivotMovement, unsignedCrossedMovement) => {
    return isMaxMovement ? rawStepOfPivot : (unsignedPivotMovement / unsignedCrossedMovement) * rawStepOfPivot;
}

/**
 * 判断是否需要绘制插值圆点
 * @param {*} movement
 * @param {*} moved
 * @param {*} step
 * @returns
 */
export const needDrawInterpolationPoint = (movement, moved, step) => {
    return movement - moved > step;
}


/**
 * 计算绘制点坐标位置及鼠标指针水平、垂直移动距离
 */
export const computePositionAndMovements = (config) => {
    const { ev, scaleRatio, positionRange, left, top } = config;
    const { minX, minY } = positionRange;
    const { movementX, movementY, offsetX, offsetY } = ev;
    const realPosition = computeRealPosition({ offsetX, offsetY, left, top, minX, minY, scaleRatio });
    const realMovements = computeRealMovements({ movementX, movementY }, scaleRatio);
    return { ...realPosition, ...realMovements };
}

/**
 * 计算相对于真实图像尺寸的鼠标位置
 */
export const computeRealPosition = (config) => {
    const { offsetX, offsetY, left, top, minX, minY, scaleRatio } = config;
    const x = (offsetX - left - minX) / scaleRatio;
    const y = (offsetY - top - minY) / scaleRatio;
    return { x, y };
}

/**
 * 计算相对于真实图像尺寸的移动距离
 */
export const computeRealMovements = (rawMovements, scaleRatio) => {
    const { movementX: rawMovementX, movementY: rawMovementY } = rawMovements;
    const movementX = rawMovementX / scaleRatio;
    const movementY = rawMovementY / scaleRatio;
    return { movementX, movementY };
}


/**
 * 判断是否可以绘制
 */
export const canDrawing = (totalMovement, step) => {
    return totalMovement >= step;
}

/**
 * 判断点位是否为拐点
 * @param {*} points
 * @param {*} i
 * @returns
 */
export const isCorner = (points, i, computeAngle = 10) => {
    /* 计算点i与前后两个点的方向向量 */
    let prev = points[i - 1];
    let curr = points[i];
    let next = points[i + 1];
    let u1 = { x: prev[0] - curr[0], y: prev[1] - curr[1] }
    let u2 = { x: next[0] - curr[0], y: next[1] - curr[1] }
    /* 计算两个向量的角度 */
    let cosAngle = (u1.x * u2.x + u1.y * u2.y) /
        (Math.sqrt(u1.x * u1.x + u1.y * u1.y) *
            Math.sqrt(u2.x * u2.x + u2.y * u2.y));
    let angle = Math.acos(cosAngle) * 180 / Math.PI;
    /* 若角度大于某个阈值,则认为是拐点 */
    return 180 - angle > computeAngle;
}

/**
 * 获取一组点位内的主要点位（不超出150个）
 * @param {*} pointList
 * @returns
 */
export const getMainPoints = (pointList) => {
    /* 小于20个点位就不处理了 */
    if (pointList.length < 20) {
        return pointList;
    }
    /* 点位数越多，拐动的对比角度越大 */
    let addAngle = 10;
    if (pointList.length > 100) addAngle = 15;
    if (pointList.length > 200) addAngle = 20;
    if (pointList.length > 500) addAngle = 25;
    if (pointList.length > 1000) addAngle = 30;

    let newPoints = [pointList[0]];
    for (let i = 1; i < pointList.length - 1; i++) {
        /* 拐动大于10度的变化我认为是拐点 */
        if (isCorner(pointList, i, 10)) {
            newPoints.push(pointList[i]);
        }
    }
    // console.log('getMainPoints - 修改前', pointList.length);
    newPoints.push(pointList[pointList.length - 1]);
    // console.log('getMainPoints - 修改后 - 1', newPoints.length);
    /* 如果还是超出了150 均匀取出部分点位 */
    if (newPoints.length > 150) {
        let splicePoints = [newPoints[0]];
        let step = Math.ceil(newPoints.length / 150);
        for (let i = step; i < newPoints.length - 1; i += step) {
            splicePoints.push(newPoints[i]);
        }
        splicePoints.push(newPoints[newPoints.length - 1]);
        newPoints = JSON.parse(JSON.stringify(splicePoints));
    }
    // console.log('getMainPoints - 修改后 - 2', newPoints.length);
    return newPoints;
}
