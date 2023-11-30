import { HIDDEN_BOARD_GAP_SIZE, HIDDEN_BOARD_MAX_SIZE, INITIAL_SCALE_RATIO, INITIAL_GAP_SIZE } from '../constants/index';
import { computeScaledImageSize, fixed } from './util';

/**
 * 计算画板的左上角坐标及宽高
 * @param {*} canvas 画布内容
 * @returns
 */
export const computeBoardRect = (canvas) => {
    const inputBoardRect = canvas.getBoundingClientRect();
    const domRect = document.documentElement.getBoundingClientRect();
    return computeBoardRectSize(inputBoardRect, domRect);
}
export const computeBoardRectSize = (inputBoardRect, domRect) => {
    const { width, height, left: boardLeft, top: boardTop } = inputBoardRect;
    const { left: domLeft, top: domTop } = domRect;
    const left = boardLeft - domLeft;
    const top = boardTop - domTop;
    return { left, top, width, height };
}

/**
 * 计合法的图片尺寸(低于2k分辨率的尺寸)
 * @param {*} imageSource 图片信息
 * @returns
 */
export const computeValidImageSize = (imageSource) => {
    let { width, height } = imageSource;
    const imageScaleRatio = computeScaleRatio({
        imageSize: { width, height },
        gapSize: HIDDEN_BOARD_GAP_SIZE,
        targetSize: HIDDEN_BOARD_MAX_SIZE,
    });
    width *= imageScaleRatio;
    height *= imageScaleRatio;
    return { width, height };
}

/**
 * 计算自适应缩放比例
 * @param {*} transformParametersConfig
 * @returns
 */
export const computeScaleRatio = (transformParametersConfig) => {
    const { imageSize, gapSize, targetSize } = transformParametersConfig;
    const drawingAreaSize = getDrawingAreaSize(targetSize, gapSize);
    return Math.min(
        Math.min(drawingAreaSize.width / imageSize.width, drawingAreaSize.height / imageSize.height),
        INITIAL_SCALE_RATIO,
    );
}

/**
 * 默认最大绘制区的尺寸(即画框尺寸减去间隙)
 * @param {*} boardSize
 * @param {*} gapSize
 * @returns
 */
export const getDrawingAreaSize = (boardSize, gapSize) => {
    return {
        width: boardSize.width - gapSize.horizontal * 2,
        height: boardSize.height - gapSize.vertical * 2,
    };
}

/**
 * 计算自适应变换(缩放、平移)参数
 * @param {*} transformParametersConfig
 * @returns
 */
export const computeTransformParameters = (transformParametersConfig) => {
    const scaleRatio = computeScaleRatio(transformParametersConfig);
    const positionRange = computePositionRange(transformParametersConfig, scaleRatio);
    return { scaleRatio, positionRange };
}

/**
 * 计算自适应变换后的绘制区域
 * @param {*} transformParametersConfig 缩放的配置信息
 * @param {*} scaleRatio 缩放比例
 * @returns
 */
function computePositionRange(transformParametersConfig, scaleRatio) {
    const scaledImageSize = computeScaledImageSize(transformParametersConfig.imageSize, scaleRatio);
    return {
        minX: getPositionRangeMinX(transformParametersConfig, scaledImageSize),
        maxX: getPositionRangeMaxX(transformParametersConfig, scaledImageSize),
        minY: getPositionRangeMinY(transformParametersConfig, scaledImageSize),
        maxY: getPositionRangeMaxY(transformParametersConfig, scaledImageSize),
    };
}

/**
 * 计算绘制区域范围最小x坐标(相对于画布左上角)
 * @param {*} transformParametersConfig
 * @param {*} scaledImageSize
 * @returns
 */
function getPositionRangeMinX(transformParametersConfig, scaledImageSize) {
    const { gapSize, targetSize } = transformParametersConfig;
    return fixed((getDrawingAreaSize(targetSize, gapSize).width - scaledImageSize.width) / 2) + gapSize.horizontal;
}
/**
 * 计算绘制区域范围最小y坐标(相对于画布左上角)
 * @param {*} transformParametersConfig
 * @param {*} scaledImageSize
 * @returns
 */
function getPositionRangeMinY(transformParametersConfig, scaledImageSize) {
    const { gapSize, targetSize } = transformParametersConfig;
    return fixed((getDrawingAreaSize(targetSize, gapSize).height - scaledImageSize.height) / 2) + gapSize.vertical;
}
/**
 * 计算绘制区域范围最大x坐标(相对于画布左上角)
 * @param {*} transformParametersConfig
 * @param {*} scaledImageSize
 * @returns
 */
function getPositionRangeMaxX(transformParametersConfig, scaledImageSize) {
    return fixed(getPositionRangeMinX(transformParametersConfig, scaledImageSize) + scaledImageSize.width);
}
/**
 * 计算绘制区域范围最大y坐标(相对于画布左上角)
 * @param {*} transformParametersConfig
 * @param {*} scaledImageSize
 * @returns
 */
function getPositionRangeMaxY(transformParametersConfig, scaledImageSize) {
    return fixed(getPositionRangeMinY(transformParametersConfig, scaledImageSize) + scaledImageSize.height);
}

/**
 * 判断变换配置是否无效
 * @param {*} transformConfig 变化配置
 * @returns
 */
export function isInvalidTransformConfig(transformConfig) {
    const { scaleRatio, positionRange } = transformConfig;
    return !scaleRatio || !positionRange;
}

/**
 * 计算画板的变换配置对象
 * @param {*} computeConfig
 * @returns
 */
export function computeTransformConfig(computeConfig) {
    const { imageSource, targetSize, gapSize = INITIAL_GAP_SIZE } = computeConfig;
    const imageSize = computeValidImageSize(imageSource);
    return computeTransformParameters({
        gapSize,
        imageSize,
        targetSize,
    });
}


/**
 * 获取有效的变换配置
 */
export const getValidTransformConfig = (getParametersConfig) => {
    const { transformConfig, ...computeConfig } = getParametersConfig;
    if (isInvalidTransformConfig(transformConfig)) {
        const { scaleRatio, positionRange } = computeTransformConfig(computeConfig);
        transformConfig.scaleRatio = scaleRatio;
        transformConfig.positionRange = positionRange;
    }
    return transformConfig;
}
