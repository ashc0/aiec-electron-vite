import React from 'react';
import { computeInterpolationStep, computeMovements, needDrawInterpolation, needDrawInterpolationPoint, computePositionAndMovements, canDrawing, getMainPoints } from '../../helpers/drawing-compute';
import { initHiddenBoardWithSource, transformedDrawImage, initHiddenBoard, resizeCanvas, drawBrushPoint, drawMattingTrack, generateMaskImageSource, getPngAlphaByCoordinate, createContext2D } from '../../helpers/dom-helper';
import { computeValidImageSize, getValidTransformConfig } from '../../helpers/init-compute';
import { isEmpty, fixed, computeStep, computeStepBase, computeRealRadius, getRawDistance, isString } from '../../helpers/util';
import { redrawMattingBoardsWhileScaling, getDistance, computeRangeScaleRatio, computeNewPositionRange } from '../../helpers/transform-helper';
import { MIN_SCALE_RATIO, MAX_SCALE_RATIO, DEFUALT_RADIUS, DEFUALT_HARDNESS } from '../../constants/index';
import TransformOption from '../TransformOption';
import { useMattingCursor, updateCursorInfo } from "../../helpers/use-matting-cursor";
import { getImgPieceByCoordinate, base64ToFile, fileToBase64 } from '../../helpers/image-splice';
import Iconfont from '../Iconfont';
import { message, Tooltip, Dropdown } from 'antd';
import { Loading } from '../../../Loading';
import KeyTooltip from '../KeyTooltip';
import './index.scss';

const EVENT_LIST = {
    pc: {
        start: 'mousedown',
        move: 'mousemove',
        end: 'mouseup',
        out: 'mouseout',
    },
    mobile: {
        start: 'touchstart',
        move: 'touchmove',
        end: 'touchend',
    }
}; /* canvas移动触摸相关的事件名 */

const DRAW_CONFIG = {
    step: -1,/* 步长 */
    stepBase: 3.5,/* 步长 */
    radius: DEFUALT_RADIUS,/* 画笔大小 */
    hardness: DEFUALT_HARDNESS,/* 画笔硬度 */
};

/**
 * 画布
 */
export default class DrawCanvas extends React.Component {
    /* 涂抹区域的画布 */
    ctx = null;
    interpolationCtx = null;/* 隐藏的辅助插值绘制的绘制上下文对象 */
    hiddenCtx = null;
    drawingCtx = null;
    canvas = null;
    hiddenCanvas = null;
    /* 抠图结果画布 */
    outputHiddenCtx = null;
    outputDrawingCtx = null;
    outputCanvas = null;
    outputCtx = null;
    /* 放大区域的画布 */
    bigCtx = null;
    lastX = 0;
    lastY = 0;
    targetSize = {
        width: 0,
        height: 0,
    };  /* 画布大小 */
    imageSize = {
        width: 0,
        height: 0,
    }; /* 放大区域大小 */
    amplifyArea = {
        width: 50,
        height: 50
    };
    from = 'pc'; /* 来源 */
    mask; /* 蒙版图片资源 */
    raw; /* 原图资源 */
    transformConfig = {
        scaleRatio: null,
        positionRange: {
            maxX: 0,
            maxY: 0,
            minX: 0,
            minY: 0
        }
    }; /* 变化的配置，缩放、定位等 */
    totalMovement = 0; /* 移动的区域大小 */
    drawingConfig = DRAW_CONFIG; /* 画笔相关的配置 */
    clickDrawingConfig = {
        ...DRAW_CONFIG,
        hardness: 0.8,
        radius: 16
    };
    magnifierCvsPosition = '左上'; /* 放大镜的位置 */
    startDistance = 0; /* 双指缩放用的，开始时的位置 */
    lastSize = { width: 0, height: 0 }; /* 双指缩放时用，记录上次的图片大小 */
    isMouseDown = false; /* 是否鼠标点击开始 */

    mattingCursor = {}; /* 指针 */

    lastRadius = DEFUALT_RADIUS;

    image = null; /* 原图 */
    imageSource = null;
    splitBodyImage = null; /* 抠除主体的原图 */
    /* 主体图 base64 和 Image */
    bodyImage = null;
    bodyImageData = null;

    /* 抠出来的图 base64 和 Image */
    splitImageInfo = null;
    splitImageData = null;

    moveInBody = false; /* 是不是移入了已抠的图内 */

    splitPositionList = {
        add: [],
        del: []
    };  /* 已经分割出的点位列表 其他位置 */
    bodySplitPositionList = {
        add: [],
        del: []
    };  /* 已经分割出的点位列表 主体位置 */

    drawAddMask = null; /* 绘制涂抹增加的蒙版图片资源 在图片选区变化时修改 */
    drawDelMask = null; /* 绘制涂抹减少的蒙版图片资源 在图片选区变化时修改 */
    drawPositionList = [];
    startInBody = false;

    constructor(props) {
        super(props);
        let magnifierStyle = {
            top: 0,
            left: 0,
            width: 100,
            height: 100,
            display: 'none'
        };
        let magnifierCvsStyle = {
            marginLeft: 25,
            marginTop: 25
        };
        let needMagnifier = false;
        if (!isEmpty(props.image)) this.image = props.image;
        if (!isEmpty(props.bodyImage)) this.bodyImage = props.bodyImage;
        if (!isEmpty(props.needMagnifier)) needMagnifier = props.needMagnifier;
        if (!isEmpty(props.targetSize)) this.targetSize = props.targetSize;
        if (!isEmpty(props.amplifyArea)) {
            if (!isEmpty(props.amplifyArea.width)) {
                this.amplifyArea.width = props.amplifyArea.width / 2;
            }
            if (!isEmpty(props.amplifyArea.height)) {
                this.amplifyArea.height = props.amplifyArea.height / 2;
            }
            magnifierStyle.width = props.amplifyArea.width * 2;
            magnifierStyle.height = props.amplifyArea.height * 2;
            magnifierCvsStyle.marginLeft = props.amplifyArea.width / 2;
            magnifierCvsStyle.marginTop = props.amplifyArea.height / 2;
        };

        this.state = {
            isErasing: false, /* 是否为消除笔刷 */
            isMoving: false, /* 是否处于移动状态 */
            drawingConfig: this.drawingConfig,
            magnifierStyle: magnifierStyle, /* 放大镜外框样式 */
            magnifierCvsStyle: magnifierCvsStyle, /* 放大镜canvas样式 */
            needMagnifier: needMagnifier,/* 是否显示放大镜 */
            maxWidth: !isEmpty(props.maxWidth) ? props.maxWidth * 2 + 24 : 1224, /* 最大宽度 */
            maxHeight: !isEmpty(props.maxHeight) ? props.maxHeight : 700, /* 最大高度 */
            mattingCursorStyle: {}, /* 鼠标指针的样式 */
            cursorImage: '', /* 鼠标指针的图片信息 canvas生成 */
            isClick: true, /* 是否为点选状态 */
            tipText: 'del',
            addTipVisible: false, /* 点选添加的tip展示状态 */
            delTipVisible: false, /* 点选去除的tip展示状态 */
            isLoading: false, /* 加载中 loading状态 */
        };
    };

    componentWillUnmount() {
        this.removeMouseListeners('mask');
        this.removeMouseListeners('result');
    }

    componentDidMount() {
        setTimeout(() => {
            this.initMatting();
        }, 0)
    }

    /**
     * 重新加载
     * @param {*} param
     */
    reloadImg = async (param) => {
        if (!isEmpty(param.image)) this.image = param.image;
        if (!isEmpty(param.bodyImage)) {
            this.bodyImage = param.bodyImage;
        } else {
            this.bodyImage = null;
        }
        this.targetSize.width = 0;
        this.targetSize.height = 0;
        this.transformConfig = {
            scaleRatio: null,
            positionRange: {
                maxX: 0,
                maxY: 0,
                minX: 0,
                minY: 0
            }
        }
        this.imageSize = {
            width: 0,
            height: 0,
        }

        this.imageSource = null;
        this.splitBodyImage = null; /* 抠除主体的原图 */
        /* 主体图 base64 和 Image */
        this.bodyImage = null;
        this.bodyImageData = null;

        /* 抠出来的图 base64 和 Image */
        this.splitImageInfo = null;
        this.splitImageData = null;

        this.moveInBody = false; /* 是不是移入了已抠的图内 */

        this.splitPositionList = {
            add: [],
            del: []
        };  /* 已经分割出的点位列表 其他位置 */
        this.bodySplitPositionList = {
            add: [],
            del: []
        };  /* 已经分割出的点位列表 主体位置 */

        await this.initMatting();
    }


    /**
     * 鼠标滚轮事件处理
     * @param {*} e
     * @returns
     */
    onWheel = (e) => {
        if (this.imageSize.width <= 0 || this.imageSize.height <= 0) {
            return;
        }


        let newConfig = redrawMattingBoardsWhileScaling(e, this.transformConfig, this.canvas);

        this.updateCanvasSize({
            ...newConfig.transformConfig,
            rangeScaleRatio: newConfig.rangeScaleRatio
        });
    }

    /**
     * 鼠标滚轮处理画布位置
     * @param {*} e
     */
    moveCanvasOnWheel = (e) => {
        let { deltaY } = e;
        let { state: { maxHeight }, transformConfig: { positionRange, scaleRatio }, targetSize } = this;
        let lastTop = positionRange.minY;
        /* 向上 */
        if (deltaY > 0) {
            // 615 > 400
            if (lastTop < 0 && Math.abs(lastTop) > targetSize.height) {
                return;
            }
            lastTop = lastTop - 50;
        } else {
            let lestHeight = targetSize.height < maxHeight ? targetSize.height : maxHeight;
            if (lastTop > lestHeight) {
                return;
            }
            /* 向下 */
            lastTop = lastTop + 50;
        }
        this.transformConfig = {
            ...this.transformConfig,
            positionRange: {
                ...positionRange,
                minY: lastTop
            }
        }
        this.transformConfigChange();
    }
    transformConfigChange = () => {
        const { positionRange, scaleRatio } = this.transformConfig;
        transformedDrawImage({
            ctx: this.ctx,
            hiddenCtx: this.hiddenCtx,
            positionRange, scaleRatio
        });
        transformedDrawImage({
            ctx: this.outputCtx,
            hiddenCtx: this.outputHiddenCtx,
            positionRange, scaleRatio
        });
    }

    /**
     * 修改canvas大小
     * @param {*} newConfig
     * @param {*} from
     * @returns
     */
    updateCanvasSize = (newConfig, from = 'pc') => {
        let sizeInfo = from === 'mobile' ? 'lastSize' : 'imageSize';
        let { width, height } = this[sizeInfo];
        if (width <= 0 || height <= 0) {
            return;
        }
        if (newConfig.scaleRatio > MAX_SCALE_RATIO || newConfig.scaleRatio < MIN_SCALE_RATIO) {
            return;
        }
        this.transformConfig.scaleRatio = newConfig.scaleRatio;

        if (!isEmpty(newConfig.positionRange)) {
            this.transformConfig.positionRange = newConfig.positionRange;
        }

        const commonConfig = { targetHeight: this.targetSize.height, targetWidth: this.targetSize.width, transformConfig: this.transformConfig };
        resizeCanvas({
            ctx: this.ctx,
            hiddenCtx: this.hiddenCtx,
            ...commonConfig,
        });
        resizeCanvas({
            ctx: this.outputCtx,
            hiddenCtx: this.outputHiddenCtx,
            ...commonConfig,
        });
        this.updateTransformPercent();
        this.eventListeners('mask');
        this.eventListeners('result');
    }

    /**
     * 修改缩放拖拽组件的比例显示
     */
    updateTransformPercent = () => {
        this.refs.transformOption.setState({
            persent: (this.transformConfig.scaleRatio * 100).toFixed()
        })
    }

    /**
     * 初始化画布
     */
    initMatting = async () => {
        if (isEmpty(this.image)) {
            return;
        }
        const self = this;
        /* 初始化隐藏的画布、绘制的画布、结果产出的画布 */
        this.hiddenCtx = createContext2D();

        this.interpolationCtx = createContext2D();
        this.drawingCtx = createContext2D();

        this.canvas = document.getElementById('image-canvas');
        this.ctx = this.canvas.getContext('2d');

        /* 抠图结果画布 */
        this.outputHiddenCtx = createContext2D();
        this.outputDrawingCtx = createContext2D();
        this.outputCanvas = document.getElementById('result-canvas');
        this.outputCtx = this.outputCanvas.getContext('2d');

        if (this.state.needMagnifier) {
            /* 放大镜画布 */
            const bigCanvas = document.getElementById('big-canvas');
            this.bigCtx = bigCanvas.getContext('2d');
            bigCanvas.width = this.amplifyArea.width;
            bigCanvas.height = this.amplifyArea.height;
        }

        if (this.image instanceof File) {
            this.image = await fileToBase64(this.image);
        }
        if (!isEmpty(this.bodyImage) && this.bodyImage instanceof File) {
            this.bodyImage = await fileToBase64(this.bodyImage);
        }

        const bgImage = new Image();
        bgImage.crossOrigin = 'anonymous';
        bgImage.src = this.image;


        await this.loadBgImage(bgImage);

        this.splitBodyImage = this.image;

        this.ctx.imageSmoothingEnabled = false;

        const imageSource = await createImageBitmap(bgImage);
        const validImageSize = computeValidImageSize(imageSource);

        const { scaleRatio, positionRange } = getValidTransformConfig({
            imageSource,
            transformConfig: this.transformConfig,
            targetSize: this.targetSize,
            gapSize: {
                horizontal: this.transformConfig.positionRange.minX,
                vertical: this.transformConfig.positionRange.minY,
            }
        });
        this.transformConfig.scaleRatio = scaleRatio;
        this.transformConfig.positionRange = positionRange;
        this.updateTransformPercent();

        initHiddenBoardWithSource({
            imageSource,
            targetSize: validImageSize,
            hiddenCtx: this.hiddenCtx,
            drawingCtx: this.drawingCtx,
        });
        transformedDrawImage({
            hiddenCtx: this.hiddenCtx,
            ctx: this.ctx,
            scaleRatio,
            positionRange,
        });
        initHiddenBoard({
            targetSize: validImageSize,
            hiddenCtx: this.outputHiddenCtx,
            drawingCtx: this.outputDrawingCtx,
        });

        this.raw = await createImageBitmap(this.hiddenCtx.canvas);
        this.mask = await generateMaskImageSource(validImageSize, bgImage);

        if (isEmpty(this.bodyImage)) {
            this.drawAddMask = await generateMaskImageSource(validImageSize, bgImage, 'rgba(116, 221, 208, 0.45)');
            this.drawDelMask = await generateMaskImageSource(validImageSize, bgImage, 'rgba(250, 145, 145, 0.45)');
        }


        const cursorRes = await useMattingCursor({
            inputCtx: this.ctx,
            isMoving: this.state.isMoving,
            isErasing: this.moveInBody,
            radius: 8,
            hardness: this.clickDrawingConfig.hardness,
            callback: this.updateCursorInfo
        });
        this.mattingCursor = cursorRes.mattingCursor;
        if (!this.state.isMoving) {
            this.setState({
                cursorImage: cursorRes.cursorImage,
                mattingCursorStyle: cursorRes.mattingCursorStyle,
            })
        }

        this.outputHiddenCtx.globalCompositeOperation = 'source-over';
        await this.loadPngMask(this.bodyImage, {
            outputHiddenCtx: this.outputHiddenCtx,
            hiddenCtx: this.hiddenCtx,
        }, 'mask', 'body');
        this.transformConfigChange();

        this.eventListeners('mask');
        this.eventListeners('result');
        this.loadTips();
        this.saveCanvas('initMatting');
    }
    /**
     * 修改指针样式（位置）
     * @param {*} info
     */
    updateCursorInfo = (info) => {
        let param = {};
        if (!isEmpty(info.cursorImage)) {
            param.cursorImage = info.cursorImage;
        }

        if (!this.state.isMoving && !isEmpty(info.mattingCursorStyle)) {
            this.deleteCursorTransition();
            param.mattingCursorStyle = info.mattingCursorStyle;
        }
        if (!isEmpty(info)) {
            this.setState({
                ...param
            })
        }
    }

    /**
     * 融合抠出来的图片
     * @returns
     */
    loadPngMask = async (bodyImage, ctxList = {}, type = 'mask', from = 'split') => {
        if (isEmpty(bodyImage)) {
            return;
        }
        if (!isString(bodyImage)) {
            return await this.imgOnLoadHandleMask(bodyImage, ctxList, type);
        }
        return new Promise((resolve) => {
            const image = new Image();
            image.src = bodyImage;
            image.crossOrigin = "Anonymous";
            image.onload = async () => {
                if (from === 'body') {
                    this.bodyImageData = image;
                    /* 把主体去除，保存一份base64图 */
                    this.splitBody(image);
                }
                await this.imgOnLoadHandleMask(image, ctxList, type);
                resolve({});
            };
        });
    }
    imgOnLoadHandleMask = async (image, ctxList, type) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = image.width;
        canvas.height = image.height;

        // 绘制原图和蒙版图
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        ctx.drawImage(this[type], 0, 0, canvas.width, canvas.height);
        // 保存画布状态
        ctx.save();
        // 裁剪区域设置为蒙版图的非透明区域
        ctx.globalCompositeOperation = 'destination-in';
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        // 在裁剪区域内绘制原图
        ctx.drawImage(this[type], 0, 0, canvas.width, canvas.height);
        // 恢复画布状态
        ctx.restore();

        if (!isEmpty(ctxList)) {
            if (ctxList.outputHiddenCtx) {
                ctxList.outputHiddenCtx.drawImage(image, 0, 0, ctxList.outputHiddenCtx.canvas.width, ctxList.outputHiddenCtx.canvas.height);
            }
            if (ctxList.outputCtx) {
                ctxList.outputCtx.drawImage(image, 0, 0, ctxList.outputCtx.canvas.width, ctxList.outputCtx.canvas.height);
            }
            if (ctxList.hiddenCtx) {
                ctxList.hiddenCtx.drawImage(canvas, 0, 0, ctxList.hiddenCtx.canvas.width, ctxList.hiddenCtx.canvas.height);
            }
            if (ctxList.ctx) {
                ctxList.ctx.drawImage(canvas, 0, 0, ctxList.ctx.canvas.width, ctxList.ctx.canvas.height);
            }
        }

        await this.saveBodyData();

    }

    /**
     * 将原图中的主体图抠除
     */
    splitBody = (image) => {
        const ctx = createContext2D({
            targetSize: {
                width: this.imageSource.width,
                height: this.imageSource.height,
            }
        });

        ctx.drawImage(this.imageSource, 0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.globalCompositeOperation = 'destination-out';
        ctx.drawImage(image, 0, 0, ctx.canvas.width, ctx.canvas.height);

        this.splitBodyImage = ctx.canvas.toDataURL();
    }

    /**
     * 保存抠出的图的Image对象
     */
    saveBodyData = (src = null) => {
        const bodyImg = new Image();
        if (isEmpty(src)) {
            let { positionRange } = this.transformConfig;
            const ctx = createContext2D({
                targetSize: {
                    width: positionRange.maxX - positionRange.minX,
                    height: positionRange.maxY - positionRange.minY,
                }
            })
            ctx.drawImage(this.outputHiddenCtx.canvas, 0, 0, ctx.canvas.width, ctx.canvas.height);
            src = ctx.canvas.toDataURL();

        }
        bodyImg.src = src;
        bodyImg.crossOrigin = "Anonymous";

        return new Promise((resolve) => {
            bodyImg.onload = async () => {
                this.splitImageData = bodyImg;
                this.splitImageInfo = bodyImg.src;
                let maskImageInfo = this.hiddenCtx.canvas.toDataURL();
                const maskImg = new Image();
                maskImg.src = maskImageInfo;
                maskImg.crossOrigin = "Anonymous";
                maskImg.onload = async () => {
                    this.drawAddMask = await generateMaskImageSource(this.imageSize, maskImg, 'rgba(116, 221, 208, 0.45)');
                    this.drawDelMask = await generateMaskImageSource(this.imageSize, maskImg, 'rgba(250, 145, 145, 0.45)');
                    resolve({});
                }
            }
        });
    }

    /**
     * 同步加载背景图
     * @param {*} bgImage
     */
    loadBgImage = async (bgImage) => {
        const self = this;
        await new Promise((resolve) => {
            bgImage.onload = () => {
                this.imageSource = bgImage;
                const canvasListBox = document.getElementById('eliminate-canvas-list');
                let canvasMaxWidth = (canvasListBox.clientWidth - 24) / 2;
                let canvasMaxHeight = canvasListBox.clientHeight;
                let contentSize = { width: 0, height: 0 };
                contentSize.width = bgImage.width;
                contentSize.height = bgImage.height;
                if (bgImage.width > canvasMaxWidth) {
                    contentSize.width = canvasMaxWidth * 0.96;
                    contentSize.height = (contentSize.width / bgImage.width) * bgImage.height;
                }
                if (contentSize.height > canvasMaxHeight) {
                    contentSize.height = canvasMaxHeight * 0.96;
                    contentSize.width = (contentSize.height / bgImage.height) * bgImage.width;
                }
                self.targetSize.width = canvasMaxWidth;
                self.targetSize.height = canvasMaxHeight;
                self.imageSize.width = bgImage.width;
                self.imageSize.height = bgImage.height;
                self.canvas.width = canvasMaxWidth;
                self.canvas.height = canvasMaxHeight;
                self.outputCanvas.width = canvasMaxWidth;
                self.outputCanvas.height = canvasMaxHeight;

                self.transformConfig.positionRange.minX = (canvasMaxWidth - contentSize.width) / 2;
                self.transformConfig.positionRange.minY = (canvasMaxHeight - contentSize.height) / 2;
                self.transformConfig.positionRange.maxX = self.targetSize.width - self.transformConfig.positionRange.minX;
                self.transformConfig.positionRange.maxY = self.targetSize.height - self.transformConfig.positionRange.minY;

                resolve({});
            };
        });
    }

    /**
     * 重置画板配置对象中关键的选项
     */
    resetPivotalOptions = () => {
        if (this.state.isErasing) {
            this.outputHiddenCtx.globalCompositeOperation = 'destination-out';
        } else {
            this.outputHiddenCtx.globalCompositeOperation = 'source-over';
        }
    }
    /**
     * 事件监听
     * 涂抹区域
     */
    eventListeners = (type) => {
        if (type === 'mask') {
            this.updateCursor();
        }
        this.removeMouseListeners(type);
        this.generateBrushBaseConfig();
        this.resetPivotalOptions();
        this.isMouseDown = false;
        let canvas = type === 'mask' ? this.canvas : this.outputCanvas;
        // 移动时触发
        canvas.addEventListener(EVENT_LIST[this.from].move, type === 'mask' ? this.maskOnMove : this.resultOnMove, false);
        // 开始点击或触摸时触发
        canvas.addEventListener(EVENT_LIST[this.from].start, type === 'mask' ? this.maskOnStart : this.resultOnStart, false);
        // 点击或触摸结束时(或移出时)触发
        canvas.addEventListener(EVENT_LIST[this.from].end, type === 'mask' ? this.maskOnEnd : this.resultOnEnd, false);
        if (this.from === 'pc') {
            canvas.addEventListener(EVENT_LIST[this.from].out, type === 'mask' ? this.maskOnOut : this.resultOnOut, false);
        }
    }

    /**
     * 更新指针样式
     * @param {*} type
     */
    updateCursor = async (type) => {
        let param = {
            mattingCursor: this.mattingCursor,
            isMoving: this.state.isMoving
        };
        if (this.state.isClick && type !== 'move') type = 'body';
        if (type === 'body') {
            param.isErasing = this.moveInBody;
            param.hardness = this.clickDrawingConfig.hardness;
            param.radius = 8;
        } else {
            param.hardness = this.drawingConfig.hardness;
            param.radius = this.lastRadius;
            param.isErasing = this.state.isErasing;
        }
        let res = await updateCursorInfo(param);
        if (type !== 'move') {
            this.setState({
                cursorImage: res.cursorImage
            });
        }
    }
    /**
     * 开始点击或触摸时触发
     * @param {*} e
     * @returns
     */
    maskOnStart = (e) => this.onStart('mask', e)
    resultOnStart = (e) => this.onStart('result', e)
    onStart = (type, e) => {
        e = this.handleMobileEvent(e, type);
        this.isMouseDown = true;
        this.lastX = e.x;
        this.lastY = e.y;
        if (this.state.isMoving || type === 'result') {
            /* 抓手状态 */
            return;
        }

        if (this.state.isClick) {
            if (this.state.isLoading) {
                return;
            }
            this.drawPositionList = [];
            this.startInBody = this.moveInBody;
            this.lastDrawHiddenImg = this.hiddenCtx.canvas.toDataURL();
        }

        /* 手机端的双指缩放 */
        if (this.from == 'mobile' && !isEmpty(e.touches) && e.touches.length === 2) {
            e.preventDefault();
            this.startDistance = getDistance(e.touches[0], e.touches[1]);
            this.lastSize = {
                width: this.targetSize.width,
                height: this.targetSize.height,
            };
            return;
        }

        this.executeMattingDrawing(e, 'start');

        if (this.state.needMagnifier) {
            let { magnifierStyle } = this.state;
            this.setState({
                magnifierStyle: {
                    ...magnifierStyle,
                    display: 'block'
                }
            }, () => {
                this.drawToBigCanvas(e, type);
            })
        }

    }
    /**
     * 移动时触发
     * @param {*} e
     * @returns
     */
    maskOnMove = (e) => this.onMove('mask', e)
    resultOnMove = (e) => this.onMove('result', e)
    onMove = (type, e) => {
        e = this.handleMobileEvent(e, type);
        if (this.state.isMoving || type === 'result') {
            this.moveCanvas(e);
            return;
        }
        if (this.state.isClick) {
            this.moveAndChangeCursor(e);
            if (this.state.isLoading) {
                return;
            }
        }

        /* 手机端的双指缩放 */
        if (this.from == 'mobile' && !isEmpty(e.touches) && e.touches.length === 2) {
            e.preventDefault();
            let endDistance = getDistance(e.touches[0], e.touches[1]);
            this.updateCanvasSize({
                scaleRatio: endDistance / this.startDistance
            }, 'mobile');
            return;
        }
        if (this.isMouseDown) {
            this.executeMattingDrawing(e, 'move');
            if (this.state.needMagnifier) {
                this.drawToBigCanvas(e, type);
            }
        }
    }

    /**
     * 移动canvas位置
     */
    moveCanvas = (e) => {
        if (!this.isMouseDown) {
            return;
        }
        let { movementX: deltaX, movementY: deltaY } = e;
        let { positionRange } = this.transformConfig;
        positionRange.minX += deltaX;
        positionRange.maxX += deltaX;
        positionRange.minY += deltaY;
        positionRange.maxY += deltaY;

        this.transformConfigChange();

    }

    /**
     * 移出画布时触发
     * @returns
     */
    maskOnOut = () => this.onOut('mask')
    resultOnOut = () => this.onOut('result')
    onOut = (type) => {
        this.onEnd(type);
    }
    /**
     * 点击或触摸结束时触发
     * @returns
     */
    maskOnEnd = () => this.onEnd('mask')
    resultOnEnd = () => this.onEnd('result')
    onEnd = (type) => {
        if (this.state.needMagnifier) {
            let { magnifierStyle } = this.state;
            this.setState({
                magnifierStyle: {
                    ...magnifierStyle,
                    display: 'none'
                }
            })
        }
        if (this.state.isClick) {
            console.log('this.isMouseDown');
            if (this.isMouseDown) {
                this.isMouseDown = false;
                if (!this.state.isMoving && type === 'mask') {
                    this.splitImage();
                }
            }
            return;
        }

        if (this.isMouseDown && !this.state.isMoving) {
            this.saveCanvas('onEnd');
        }
        this.isMouseDown = false;
    }

    /**
     * 移除事件监听
     * @param {*} type
     */
    removeMouseListeners = (type) => {
        let canvas = type === 'mask' ? this.canvas : this.outputCanvas;
        canvas.removeEventListener(EVENT_LIST[this.from].move, type === 'mask' ? this.maskOnMove : this.resultOnMove);
        canvas.removeEventListener(EVENT_LIST[this.from].start, type === 'mask' ? this.maskOnStart : this.resultOnStart);
        canvas.removeEventListener(EVENT_LIST[this.from].end, type === 'mask' ? this.maskOnEnd : this.resultOnEnd);
        if (this.from === 'pc') {
            canvas.removeEventListener(EVENT_LIST[this.from].out, type === 'mask' ? this.maskOnOut : this.resultOnOut);
        }
    }

    /**
     * 处理手机端的事件内容
     * @param {*} event
     * @returns
     */
    handleMobileEvent = (event, type) => {
        let x = this.from === 'mobile' ? event.touches[0].clientX : event.offsetX;
        let y = this.from === 'mobile' ? event.touches[0].clientY : event.offsetY;

        let canvas = type === 'mask' ? this.canvas : this.outputCanvas;

        if (this.from === 'mobile') {
            let rect = canvas.getBoundingClientRect();
            x = x - rect.left;
            y = y - rect.top;
            event.movementX = event.touches[0].clientX - event.changedTouches[0].clientX;
            event.movementY = event.touches[0].clientY - event.changedTouches[0].clientY;
            event.offsetX = x;
            event.offsetY = y;
            event.x = x;
            event.y = y;
        }
        return event;
    }

    /**
     * 绘制放大镜
     * 图片放的比较大的时候，会比较卡
     */
    drawToBigCanvas = (e, type) => {
        let ctx = type === 'mask' ? this.ctx : this.outputCtx;
        let touchPos = this.getTouchPos(e, type);
        let x = touchPos.x - this.amplifyArea.width / 2;
        let y = touchPos.y - this.amplifyArea.height / 2;
        let w = this.amplifyArea.width;
        let h = this.amplifyArea.height;
        let { offsetX, offsetY } = e;
        let { width, height } = ctx.canvas;

        this.bigCtx.clearRect(0, 0, w, h);
        // 绘制到 bigCanvas
        this.bigCtx.putImageData(ctx.getImageData(x, y, this.amplifyArea.width, this.amplifyArea.height), 0, 0);

        let magnifierStyle = {};

        /* 画笔靠近左上 放大区域放右上 */
        if ((offsetX <= (this.drawingConfig.radius * 2 + this.amplifyArea.width * 2)) && (offsetY <= (this.drawingConfig.radius * 2 + this.amplifyArea.height * 2))) {
            if (this.magnifierCvsPosition !== '右上') {
                this.magnifierCvsPosition = '右上';
                magnifierStyle = {
                    right: 0,
                    top: 0,
                    width: this.amplifyArea.width * 2,
                    height: this.amplifyArea.height * 2,
                    display: 'block'
                }
            }

        } else if ((((width - offsetX) <= this.drawingConfig.radius * 2 + this.amplifyArea.width * 2) && (offsetY <= this.drawingConfig.radius * 2 + this.amplifyArea.height * 2))) {
            /* 画笔靠近右上 放大区域放左上 */
            if (this.magnifierCvsPosition !== '左上') {
                this.magnifierCvsPosition = '左上';
                magnifierStyle = {
                    left: 0,
                    top: 0,
                    width: this.amplifyArea.width * 2,
                    height: this.amplifyArea.height * 2,
                    display: 'block'
                }
            }
        }

        if (!isEmpty(magnifierStyle)) {
            this.setState({
                magnifierStyle: magnifierStyle
            })
        }
    }
    /**
     * 保存历史
     */
    saveCanvas = (from) => {
        /* 如果这个时候已经是在撤销或反撤销过程中，需要把当前步骤后的内容清除 */
        let { historyInfo, step } = this.props.getHistory();
        if (step < historyInfo.length - 1) {
            historyInfo = historyInfo.slice(0, step + 1);
        }
        // 放入栈中
        historyInfo.push({
            ctx: this.ctx.canvas.toDataURL(),
            hiddenCtx: this.hiddenCtx.canvas.toDataURL(),
            outputCtx: this.outputCtx.canvas.toDataURL(),
            outputHiddenCtx: this.outputHiddenCtx.canvas.toDataURL(),
            splitImageInfo: this.splitImageInfo,
            splitPositionList: JSON.parse(JSON.stringify(this.splitPositionList)),
            bodySplitPositionList: JSON.parse(JSON.stringify(this.bodySplitPositionList))
        });


        // 移动指针
        this.props.saveHistory({ historyInfo, step: step + 1 });
    }
    /**
     * 抠图(修补/擦除)绘制
     */
    executeMattingDrawing = (e, type) => {
        let { scaleRatio, positionRange } = this.transformConfig;
        let step = this.state.isClick ? this.clickDrawingConfig.step : this.drawingConfig.step;

        const positionAndMovements = computePositionAndMovements({
            ev: e,
            scaleRatio: scaleRatio,
            positionRange: positionRange,
            left: 0,
            top: 0,
        });

        const { movementX, movementY, x, y } = positionAndMovements;
        this.totalMovement += getRawDistance(movementX, movementY);
        let canDraw = canDrawing(this.totalMovement, step);
        if (this.from == 'mobile' || type == 'start') {
            canDraw = true;
        }

        if (canDraw) {
            this.batchDrawing({
                e, movementX, movementY, x, y
            });
            this.totalMovement = 0;
        }
    }
    /**
     * 批量绘制
     */
    batchDrawing = (config) => {
        let { movementX, movementY, x, y } = config;
        const { maxMovement, unsignedMovementX, unsignedMovementY } = computeMovements({ movementX, movementY });
        [false, true].map((isOutPut) => {
            if (this.state.isClick && isOutPut) {
                return;
            }
            if (this.state.isClick) {
                if (x >= 0 && y >= 0 && x <= this.imageSize.width && y <= this.imageSize.height) {
                    this.drawPositionList.push([x, y]);
                }
            }
            if (needDrawInterpolation(maxMovement, this.state.isClick ? this.clickDrawingConfig.radius : this.drawingConfig.radius)) {
                this.renderMattingInterpolation({ x, y, maxMovement, movementX, movementY, unsignedMovementX, unsignedMovementY, isOutPut });
            } else {
                this.drawMattingPoint({ x, y, isOutPut });
            }
            this.drawResultArea(isOutPut);
        })
    }

    /**
     * 在呈现的画布上绘制图像
     */
    drawResultArea = (isOutPut) => {
        const { positionRange, scaleRatio } = this.transformConfig;
        transformedDrawImage({
            ctx: !isOutPut ? this.ctx : this.outputCtx,
            hiddenCtx: !isOutPut ? this.hiddenCtx : this.outputHiddenCtx,
            positionRange,
            scaleRatio,
            withBorder: false,
        });
    }

    /**
     * 绘制擦补/抠图区域的圆点
     */
    drawMattingPoint = ({ x, y, isOutPut }) => {
        let configName = this.state.isClick ? 'clickDrawingConfig' : 'drawingConfig';
        let { radius, hardness } = this[configName];
        let drawingCtx = !isOutPut ? this.drawingCtx : this.outputDrawingCtx;
        let hiddenCtx = !isOutPut ? this.hiddenCtx : this.outputHiddenCtx;
        let mattingSource = !isOutPut ? this.mask : this.raw;
        if (this.state.isErasing) mattingSource = this.raw;
        if (this.state.isClick && this.startInBody) mattingSource = this.drawDelMask;
        if (this.state.isClick && !this.startInBody) mattingSource = this.drawAddMask;

        drawMattingTrack(drawingCtx, hiddenCtx, mattingSource, () => {
            drawBrushPoint({ ctx: drawingCtx, x, y, radius, hardness });
        });
    }

    /**
     * 渲染插值图像区域
     */
    renderMattingInterpolation = (config) => {
        let { x, y, maxMovement, movementX, movementY, unsignedMovementX, unsignedMovementY, isOutPut } = config;

        let configName = this.state.isClick ? 'clickDrawingConfig' : 'drawingConfig';
        const { step, stepBase, radius, hardness } = this[configName];
        const { stepX, stepY } = computeInterpolationStep({
            unsignedMovementX,
            unsignedMovementY,
            maxMovement,
            drawingConfig: { stepBase, movementX, movementY }
        });
        this.resetInterpolationCtx(isOutPut);

        for (let movement = 0, moved = movement; movement < maxMovement; movement += stepBase, x += stepX, y += stepY) {
            if (needDrawInterpolationPoint(movement, moved, step)) {
                moved = movement;
                drawBrushPoint({ ctx: this.interpolationCtx, x: fixed(x), y: fixed(y), radius, hardness });
            }
        }
        this.drawMattingInterpolationTrack(isOutPut);
    }
    /**
     * 重置用于插值绘制的画板
     */
    resetInterpolationCtx = (isOutPut) => {
        let drawingCtx = !isOutPut ? this.drawingCtx : this.outputDrawingCtx;
        const { width, height } = drawingCtx.canvas;
        this.interpolationCtx.canvas.width = width;
        this.interpolationCtx.canvas.height = height;
        this.interpolationCtx.clearRect(0, 0, width, height);
    }

    /**
     * 绘制插值轨迹
     */
    drawMattingInterpolationTrack = (isOutPut) => {
        let drawingCtx = !isOutPut ? this.drawingCtx : this.outputDrawingCtx;
        let hiddenCtx = !isOutPut ? this.hiddenCtx : this.outputHiddenCtx;
        let mattingSource = !isOutPut ? this.mask : this.raw;
        if (this.state.isErasing) mattingSource = this.raw;
        if (this.state.isClick && this.startInBody) mattingSource = this.drawDelMask;
        if (this.state.isClick && !this.startInBody) mattingSource = this.drawAddMask;
        drawMattingTrack(drawingCtx, hiddenCtx, mattingSource, () => {
            drawingCtx.drawImage(this.interpolationCtx.canvas, 0, 0);
        });
    }

    /**
     * 获取触摸区域
     * @param {*} e
     * @param {*} canvas
     * @returns
     */
    getTouchPos = (e, type) => {
        let canvas = type === 'mask' ? this.canvas : this.outputCanvas;
        var rect = canvas.getBoundingClientRect();
        return {
            x: e.x - rect.left,
            y: e.y - rect.top
        };
    }

    /**
     * 撤销
     */
    canvasUndo = async (lastStep) => {
        this.hiddenCtx.width = this.imageSize.width;
        this.hiddenCtx.height = this.imageSize.height;
        this.outputHiddenCtx.width = this.imageSize.width;
        this.outputHiddenCtx.height = this.imageSize.height;

        // 还原canvas
        this.outputHiddenCtx.globalCompositeOperation = 'source-over';
        await this.imageLoadDraw(lastStep, 'outputHiddenCtx');
        if (this.state.isErasing && !this.state.isClick) {
            this.outputHiddenCtx.globalCompositeOperation = 'destination-out';
        }
        await this.imageLoadDraw(lastStep, 'hiddenCtx');
        this.transformConfigChange();

        if (!isEmpty(lastStep.splitImageInfo)) {
            await this.saveBodyData(lastStep.splitImageInfo);
            this.splitPositionList = JSON.parse(JSON.stringify(lastStep.splitPositionList));
            this.bodySplitPositionList = JSON.parse(JSON.stringify(lastStep.bodySplitPositionList));
        } else {
            this.splitImageInfo = null;
            this.splitImageData = null;
            this.moveInBody = false;
            this.splitPositionList = {
                add: [], del: []
            };
            this.bodySplitPositionList = {
                add: [], del: []
            };
        }
    }

    /**
     * 加载图片并绘制
     * @param {*} lastStep
     * @param {*} type
     */
    imageLoadDraw = (lastStep, type) => {
        const self = this;
        let canvasPic = new Image();
        canvasPic.crossOrigin = 'anonymous';
        canvasPic.src = lastStep[type];
        return new Promise((resolve) => {
            canvasPic.onload = () => {
                /* 先清空，再重绘 */
                self[type].clearRect(0, 0, self[type].canvas.width, self[type].canvas.height);
                self[type].drawImage(canvasPic, 0, 0, self[type].canvas.width, self[type].canvas.height);
                resolve({});
            }
            canvasPic.onerror = (err) => {
                console.error('canvasPic.onerror', err);
                resolve({});
            }
        })
    }

    /**
     * 修改笔刷类型
     * @param {*} e
     */
    changeErasing = (isErasing) => {
        // if (this.state.isErasing === isErasing && this.state.isClick === false) {
        //     return;
        // }
        let { mattingCursorStyle, isMoving } = this.state;
        let param = {};
        if (isMoving) {
            param.isMoving = false;
            param.mattingCursorStyle = {
                ...mattingCursorStyle,
                left: '-999px',
                top: '-999px',
                display: 'initial'
            };
            this.refs.transformOption.setState({
                isMoving: false
            });
            isMoving = false;
            this.canvas.style.cursor = 'none';
        }
        this.deleteCursorTransition();
        this.setState({
            isClick: false,
            isMoving: isMoving,
            isErasing: isErasing,
            ...param
        }, () => {
            this.eventListeners('mask');
            this.eventListeners('result');
            this.saveBodyData();
        })
    }
    /**
     * 是否为点选去除
     * @param {*} isClick
     */
    changeIsClick = (isClick) => {
        let { mattingCursorStyle, isMoving } = this.state;
        let param = {};
        if (isMoving) {
            param.isMoving = false;
            param.mattingCursorStyle = {
                ...mattingCursorStyle,
                left: '-999px',
                top: '-999px',
                display: 'initial'
            };
            this.refs.transformOption.setState({
                isMoving: false
            });
            isMoving = false;
            this.canvas.style.cursor = 'none';
        }
        this.deleteCursorTransition();
        this.setState({
            isClick: isClick,
            isMoving: false,
            ...param
        }, () => {
            this.updateCursor('body');
            this.saveBodyData();
        })
    }

    /**
     * 修改画笔大小
     * @param {*} e
     */
    changeRadius = (value, from) => {
        const radius = computeRealRadius(value, this.transformConfig.scaleRatio);
        this.drawingConfig.radius = radius;
        this.lastRadius = value;
        if (from == 'config') {
            this.showMattingCursor(() => {
                this.eventListeners('mask');
                this.eventListeners('result');
            });
        } else {
            this.eventListeners('mask');
            this.eventListeners('result');
        }
    }

    /**
     * 修改硬度
     * @param {*} e
     */
    changeHardness = (value) => {
        this.drawingConfig.hardness = value;
        this.setState({
            lastHardness: value,
            drawingConfig: this.drawingConfig
        }, () => {
            this.updateCursor();
        })
    }

    /**
     * 生成画笔的基础配置对象
     */
    generateBrushBaseConfig = () => {
        const radius = computeRealRadius(this.lastRadius, this.transformConfig.scaleRatio);
        this.clickDrawingConfig.radius = computeRealRadius(8, this.transformConfig.scaleRatio);
        const stepBase = computeStepBase(radius);
        this.clickDrawingConfig.stepBase = computeStepBase(this.clickDrawingConfig.radius);
        const step = computeStep(radius);
        this.clickDrawingConfig.step = computeStep(this.clickDrawingConfig.radius);

        this.drawingConfig.step = step;
        this.drawingConfig.stepBase = stepBase;
        this.drawingConfig.radius = radius;
        this.setState({
            drawingConfig: this.drawingConfig
        })
    }

    /**
     * 缩放和拖拽操作回调
     */
    transformOnChange = (type, info) => {
        /* 拖拽状态切换 */
        if (type === 'move') {
            let { mattingCursorStyle } = this.state;
            this.props.updateMoving(info);
            this.deleteCursorTransition();
            this.setState({
                isMoving: info,
                mattingCursorStyle: {
                    ...mattingCursorStyle,
                    display: info ? 'none' : 'initial',
                    left: '-999px',
                    top: '-999px',
                }
            }, () => {
                this.canvas.style.cursor = info ? 'grab' : 'none';
                this.updateCursor('move');
            });
            return;
        }
        /* 切换缩放比例 */
        if (type == 'ratio') {
            let { positionRange, scaleRatio } = this.transformConfig;
            if (['reload', 'resize'].includes(info)) {
                const canvasListBox = document.getElementById('eliminate-canvas-list');
                let canvasMaxWidth = (canvasListBox.clientWidth - 24) / 2;
                let canvasMaxHeight = canvasListBox.clientHeight;

                /* 适应大小 绘制原图100%大小 */
                if (info == 'resize') {
                    positionRange.minX = (canvasMaxWidth - this.imageSize.width) / 2;
                    positionRange.minY = (canvasMaxHeight - this.imageSize.height) / 2;
                    positionRange.maxX = this.targetSize.width - positionRange.minX;
                    positionRange.maxY = this.targetSize.height - positionRange.minY;
                    this.updateCanvasSize({
                        scaleRatio: 1,
                        positionRange,
                        resizeType: info,
                        canvasMaxWidth,
                        canvasMaxHeight
                    });
                } else if (info == 'reload') {
                    /* 适应画面 绘制和画布匹配的大小 */
                    let ratio = 1;
                    let imageWidth = this.imageSize.width;
                    let imageHeight = this.imageSize.height;
                    if (this.imageSize.width > canvasMaxWidth) {
                        imageWidth = canvasMaxWidth * 0.96;
                        ratio = imageWidth / this.imageSize.width;
                        imageHeight = ratio * this.imageSize.height;
                    }
                    if (imageHeight > canvasMaxHeight) {
                        imageHeight = canvasMaxHeight * 0.96;
                        ratio = imageHeight / this.imageSize.height;
                        imageWidth = ratio * this.imageSize.width;
                    }

                    positionRange.minX = (canvasMaxWidth - imageWidth) / 2;
                    positionRange.minY = (canvasMaxHeight - imageHeight) / 2;
                    positionRange.maxX = canvasMaxWidth - positionRange.minX;
                    positionRange.maxY = canvasMaxHeight - positionRange.minY;

                    this.updateCanvasSize({
                        scaleRatio: ratio,
                        positionRange,
                        resizeType: info,
                        canvasMaxWidth,
                        canvasMaxHeight
                    });
                }
                return;
            }
            let newRatio = 1;
            if (['add', 'del'].includes(info)) {
                if (info === 'add') {
                    if (scaleRatio >= 4) return;
                    [0.1, 0.2, 0.35, 0.5, 0.7, 1, 1.5, 2, 3, 4].some((num) => {
                        /* 第一个比它大的数值 */
                        if (scaleRatio < num) {
                            newRatio = num;
                            return true;
                        }
                    });

                }
                if (info === 'del') {
                    if (scaleRatio <= 0.1) return;
                    [4, 3, 2, 1.5, 1, 0.7, 0.5, 0.35, 0.2, 0.1].some((num) => {
                        /* 第一个比它小的数值 */
                        if (scaleRatio > num) {
                            newRatio = num;
                            return true;
                        }
                    })
                }
            } else {
                newRatio = info;
            }
            let cvsX = this.canvas.width / 2;
            let cvsY = this.canvas.height / 2;
            const rangeScaleRatio = computeRangeScaleRatio(newRatio, scaleRatio);
            positionRange = computeNewPositionRange(positionRange, { x: cvsX, y: cvsY }, rangeScaleRatio);
            /* 以画布中心为点进行缩放 */
            this.updateCanvasSize({
                scaleRatio: newRatio,
                positionRange
            });
        }
    }

    /**
     * 保存图片
     * @returns
     */
    saveImage = () => {
        return this.outputHiddenCtx.canvas.toDataURL();
    }

    /**
     * 点选切割图片
     */
    splitImage = async () => {
        if (this.state.isLoading) {
            return;
        }
        if (isEmpty(this.drawPositionList)) {
            await this.reverseDraw();
            return;
        }
        this.showLoading();
        let fileImg = this.splitBodyImage;
        let isBody = false;
        let bodyList = 'splitPositionList';
        /* 看看是不是在抠好的主体内 */
        if (!isEmpty(this.bodyImageData) && getPngAlphaByCoordinate(this.bodyImageData, this.drawPositionList[0][0], this.drawPositionList[0][1], this.imageSize.width, this.imageSize.height)) {
            fileImg = this.bodyImage;
            bodyList = 'bodySplitPositionList';
            isBody = true;
        }


        const file = base64ToFile(fileImg);
        let param = {
            file: file,
            points: JSON.stringify(getMainPoints(this.drawPositionList)),
            negative_input_point: JSON.stringify([]),
            return_type: 'base64'
        };
        /* 是不是反选 */
        if (this.startInBody) {
            param.is_reverse = 1;
            /* 传入的文件应该是当前所有选区的文件 */
            param.file = base64ToFile(this.outputHiddenCtx.canvas.toDataURL());
        }

        if (this.props.isLightApp) {
            // 轻应用file类型传base64
            param.file = this.startInBody ? this.outputHiddenCtx.canvas.toDataURL() : fileImg;
            param.isLightApp = this.props.isLightApp;
        }
        /**
         * 如果在一开始抠出的主体内，需要上传的是主体的图片
         */
        let res = await getImgPieceByCoordinate(param);
        await this.reverseDraw();
        if (isEmpty(res.image)) {
            this.hideLoading();
            message.error('抠图异常，请稍后重试');
            return;
        }

        let imageStr = res.image;
        if (!imageStr.includes('data:image/png;base64,')) {
            imageStr = 'data:image/png;base64,' + res.image;
        }

        await this.reloadSplitImages(imageStr, isBody, param.is_reverse);

        this.updateTipStatus(this.moveInBody ? 'del' : 'add');

        this.saveCanvas('splitImage');
        this.hideLoading();
    }

    /**
     * 去除智能优化的涂抹内容
     */
    reverseDraw = async () => {
        this.hiddenCtx.width = this.imageSize.width;
        this.hiddenCtx.height = this.imageSize.height;
        await this.imageLoadDraw({ hiddenCtx: this.lastDrawHiddenImg }, 'hiddenCtx');
        this.transformConfigChange();
        await this.saveBodyData();
    }

    /**
     * 点选后加载选区
     */
    reloadSplitImages = async (img, isBody, isReverse) => {
        // console.log('reloadSplitImages - isReverse', isReverse);
        if (isReverse) {
            const ctx = createContext2D({
                targetSize: {
                    width: this.raw.width,
                    height: this.raw.height,
                }
            });
            const outputCtx = createContext2D({
                targetSize: {
                    width: this.raw.width,
                    height: this.raw.height,
                }
            });

            ctx.drawImage(this.raw, 0, 0);

            await this.loadPngMask(img, { ctx, outputCtx });

            this.hiddenCtx.clearRect(0, 0, this.hiddenCtx.canvas.width, this.hiddenCtx.canvas.height);
            this.hiddenCtx.drawImage(ctx.canvas, 0, 0, this.hiddenCtx.canvas.width, this.hiddenCtx.canvas.height);
            this.outputHiddenCtx.globalCompositeOperation = 'source-over';
            this.outputHiddenCtx.clearRect(0, 0, this.outputHiddenCtx.canvas.width, this.outputHiddenCtx.canvas.height);
            this.outputHiddenCtx.drawImage(outputCtx.canvas, 0, 0, this.outputHiddenCtx.canvas.width, this.outputHiddenCtx.canvas.height);
            this.outputHiddenCtx.globalCompositeOperation = 'destination-out';
        } else {
            this.outputHiddenCtx.globalCompositeOperation = 'source-over';
            await this.loadPngMask(img, {
                outputHiddenCtx: this.outputHiddenCtx,
                hiddenCtx: this.hiddenCtx,
            });
        }
        this.transformConfigChange();
        await this.saveBodyData();
    }

    /**
     * 在移动时修改指针样式
     * @param {*} e
     */
    moveAndChangeCursor = (e) => {
        if (this.isMouseDown) {
            return;
        }
        const positionAndMovements = computePositionAndMovements({
            ev: e,
            scaleRatio: this.transformConfig.scaleRatio,
            positionRange: this.transformConfig.positionRange,
            left: 0,
            top: 0,
        });
        const { x, y } = positionAndMovements;
        if (x < 0 || y < 0) {
            return;
        }
        requestAnimationFrame(() => {
            let hasImageInfo = getPngAlphaByCoordinate(this.splitImageData, x, y, this.imageSize.width, this.imageSize.height);
            if (this.moveInBody !== hasImageInfo) {
                this.moveInBody = hasImageInfo;
                if (this.state.delTipVisible || this.state.addTipVisible) {
                    let tipText = '';
                    if (this.moveInBody && this.state.delTipVisible) {
                        tipText = 'del';
                    }
                    if (!this.moveInBody && this.state.addTipVisible) {
                        tipText = 'add';
                    }
                    this.setState({ tipText });
                }
                this.updateCursor('body');
            }
        })
    }


    /**
     * 加载提示信息
     * @returns
     */
    loadTips = () => {
        let res = localStorage.getItem('aiyong-ai-image-eliminate');
        if (res === '1') {
            return; /* 使用过了 */
        }
        let addRes = localStorage.getItem('aiyong-ai-image-eliminate-add');
        let delRes = localStorage.getItem('aiyong-ai-image-eliminate-del');

        let tipText = '';
        let addTipVisible = true;
        let delTipVisible = true;
        if (addRes >= 3) addTipVisible = false;
        if (delRes >= 3) delTipVisible = false;

        if (!this.moveInBody && addRes < 3) {
            tipText = 'add';
        } else if (this.moveInBody && delRes < 3) {
            tipText = 'del';
        }

        this.setState({ tipText, addTipVisible, delTipVisible });
    }

    /**
     * 点选后更新提示信息
     * @returns
     */
    updateTipStatus = (type) => {
        if (!this.state.addTipVisible && !this.state.delTipVisible) {
            return;
        }
        let addRes = localStorage.getItem('aiyong-ai-image-eliminate-add');
        let delRes = localStorage.getItem('aiyong-ai-image-eliminate-del');
        if (isEmpty(addRes)) addRes = 0;
        if (isEmpty(delRes)) delRes = 0;
        if (type == 'add' && addRes < 3) {
            addRes++;
            localStorage.setItem('aiyong-ai-image-eliminate-add', addRes);
        } else if (type == 'del' && delRes < 3) {
            delRes++;
            localStorage.setItem('aiyong-ai-image-eliminate-del', delRes);
        }
        if (addRes >= 3 && delRes >= 3) {
            localStorage.setItem('aiyong-ai-image-eliminate', '1');
        }
        let param = {
            tipText: ''
        };
        if (addRes >= 3) param.addTipVisible = false;
        if (delRes >= 3) param.delTipVisible = false;
        if (!this.moveInBody && addRes < 3) {
            param.tipText = 'add';
        } else if (this.moveInBody && delRes < 3) {
            param.tipText = 'del';
        }

        this.setState(param);
    }

    /**
     * tooltip的父元素
     * @returns
     */
    getPopupContainer = () => {
        return document.getElementById('matting-cursor-box');
    }

    /**
     * 显示、隐藏loading
     */
    showLoading = () => {
        this.setState({ isLoading: true });
    }
    hideLoading = () => {
        this.setState({ isLoading: false });
    }

    /**
     * 修改画笔配置时实时显示画笔样式
     */
    showMattingCursor = async (callback) => {
        const { mattingCursorStyle } = this.state;
        let delWidth = this.lastRadius <= 20 ? 20 : this.lastRadius;
        this.deleteCursorTransition();
        this.setState({
            mattingCursorStyle: {
                ...mattingCursorStyle,
                display: 'initial',
                left: (this.canvas.width / 2 - delWidth) + 'px',
                top: (this.canvas.height / 2 - delWidth) + 'px'
            }
        }, callback)
    }
    /**
     * 删除指针动画
     */
    deleteCursorTransition = () => {
        let cursorDiv = document.getElementById('matting-cursor');
        let outCursorDiv = document.getElementById('input-cursor');
        cursorDiv.style.opacity = '';
        cursorDiv.style.transition = '';
        outCursorDiv.style.opacity = '';
        outCursorDiv.style.transition = '';
    }
    /**
     * 隐藏指针
     */
    hideMattingCursor = () => {
        let cursorDiv = document.getElementById('matting-cursor');
        let outCursorDiv = document.getElementById('input-cursor');
        cursorDiv.style.opacity = 1;
        cursorDiv.style.transition = 'opacity 0.3s';
        cursorDiv.offsetWidth;
        cursorDiv.style.opacity = 0;

        outCursorDiv.style.opacity = 1;
        outCursorDiv.style.transition = 'opacity 0.3s';
        outCursorDiv.offsetWidth;
        outCursorDiv.style.opacity = 0;
    }

    render() {
        const { magnifierStyle, magnifierCvsStyle, needMagnifier, maxWidth, maxHeight, mattingCursorStyle, cursorImage, isClick, tipText, addTipVisible, delTipVisible, isLoading } = this.state;
        const { previewStyle } = this.props;
        let tipTitle = null;
        if (!isEmpty(tipText)) {
            if (tipText === 'add') {
                tipTitle = <div>涂抹或点击智能<span style={{ color: '#62BBE4' }}>保留</span>选区</div>
            } else {
                tipTitle = <div>涂抹或点击智能<span style={{ color: '#FA9191' }}>去除</span>选区</div>
            }
        }

        return (
            <div id='eliminate-canvas-list' className='eliminate-canvas-list' style={{ maxWidth: maxWidth, height: maxHeight }}>
                <div className='canvas-backgroud margin-right-24' style={{ height: maxHeight }}>
                    <div className='canvas-box'>
                        <canvas id="image-canvas" style={{ cursor: 'none' }}></canvas>
                        {
                            isClick ?
                                <div id='matting-cursor-box' className="matting-cursor" style={mattingCursorStyle}>
                                    {
                                        !isEmpty(tipTitle) ?
                                            <Tooltip placement="top" autoAdjustOverflow={false} getPopupContainer={this.getPopupContainer} title={tipTitle} visible={(addTipVisible || delTipVisible)} >
                                                <img
                                                    id="matting-cursor"
                                                    src={cursorImage}
                                                />
                                            </Tooltip>
                                            :
                                            <img id="matting-cursor" src={cursorImage} />
                                    }
                                </div>
                                :
                                <img
                                    className="matting-cursor"
                                    id="matting-cursor"
                                    style={mattingCursorStyle}
                                    src={cursorImage}
                                />
                        }

                        {
                            needMagnifier &&
                            <div className="magnifier" style={magnifierStyle}>
                                <canvas id="big-canvas" className='big-canvas' style={magnifierCvsStyle}></canvas>
                            </div>
                        }
                    </div>
                    <div className='corner-mark'>原图</div>
                </div>
                <div className='canvas-backgroud' style={{ height: maxHeight, ...previewStyle }}>
                    <div className='canvas-box'>
                        <canvas id="result-canvas" style={{ cursor: 'grab' }}></canvas>
                        <img
                            id="input-cursor"
                            className="matting-cursor"
                            style={mattingCursorStyle}
                            src={cursorImage}
                        />
                    </div>
                    <div className='corner-mark'>预览</div>
                    <Dropdown trigger={['hover']} overlay={(<KeyTooltip />)} placement="topRight">
                        <div className='key-tooltip-icon-box' >
                            <Iconfont type='kuaijiejian' className='key-tooltip-icon' />
                        </div>
                    </Dropdown>
                    <Loading visible={isLoading} title={'正在处理中'} />
                </div>
                {/* 放大、拖拽操作区域 */}
                <div className='transform-options-box'>
                    <TransformOption ref={'transformOption'} onChange={this.transformOnChange} />
                </div>
            </div>
        )
    }
}
