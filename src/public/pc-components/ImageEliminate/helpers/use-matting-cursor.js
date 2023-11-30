import {
    ERASE_POINT_INNER_COLOR,
    ERASE_POINT_OUTER_COLOR,
    REPAIR_POINT_INNER_COLOR,
    REPAIR_POINT_OUTER_COLOR,
    DEFUALT_HARDNESS,
    DEFUALT_RADIUS,
} from '../constants';
import { drawBrushPoint, getLoadedImage } from '../helpers/dom-helper';
import iconEraserAdd from '../assets/加.png';
import iconEraserDel from '../assets/减.png';
import { isEmpty } from './util';

export class MattingCursor {
    ctx; /* 画笔canvas2d */
    cursorImage = ''; /* 画笔图标 */
    mattingCursorStyle = {}; /* 画笔图标样式 */
    radius = DEFUALT_RADIUS; /* 半径 */
    hardness = DEFUALT_HARDNESS; /* 硬度 */

    inputCanvas = null; /* 用于涂抹的画布 */
    pointInnerColor = null; /* 画最内部的颜色 */
    pointOuterColor = null; /* 画最外部的颜色 */
    isErasing = false; /* 是否为擦除画笔 */
    isMoving = false; /* 是否为拖拽状态 */
    callback = () => { }; /* 回调 - 处理样式修改 */

    frameId = null;
    eraserIcon = null;

    constructor(props) {
        if (props.inputCtx) {
            this.inputCanvas = props.inputCtx.canvas;
        }
        if (props.callback) {
            this.callback = props.callback;
        }
        if (props.isErasing === true) {
            this.pointInnerColor = ERASE_POINT_INNER_COLOR;
            this.pointOuterColor = ERASE_POINT_OUTER_COLOR;
        } else {
            this.pointInnerColor = REPAIR_POINT_INNER_COLOR;
            this.pointOuterColor = REPAIR_POINT_OUTER_COLOR;
        }

        this.ctx = this.creatCursorCanvas();
    }

    /**
     * 创建画笔canvas
     * @returns
     */
    creatCursorCanvas = () => {
        const ctx = document.createElement('canvas').getContext('2d');
        return this.updateCtx(ctx);
    }

    /**
     * 修改画笔canvas的宽高
     * @param {*} ctx
     * @returns
     */
    updateCtx = (ctx) => {
        ctx.canvas.width = this.radius < 20 ? 40 : this.radius * 2;
        ctx.canvas.height = this.radius < 20 ? 40 : this.radius * 2;
        return ctx;
    }

    /**
     * 绘制指针画笔
     */
    createCursorImage = async () => {
        this.ctx = this.updateCtx(this.ctx);
        let xy = this.radius;
        if (this.radius < 20) {
            xy = 20;
        }
        const drawingConfig = {
            ctx: this.ctx,
            x: xy,
            y: xy,
            radius: this.radius,
            hardness: this.hardness,
            innerColor: this.pointInnerColor,
            outerColor: this.pointOuterColor,
        };

        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        drawBrushPoint(drawingConfig);
        await this.drawIcon();
        return await this.ctx.canvas.toDataURL();
    }

    /**
     * 绘制图标
     */
    drawIcon = async () => {
        let width = this.radius < 20 ? 10 : this.radius / 2;
        let xy = (this.ctx.canvas.width - width) / 2;
        this.ctx.drawImage(this.eraserIcon, xy, xy, width, width);
    }

    /**
     * 监听移动事件
     * @param {*} isMoving
     * @returns
     */
    renderOutputCursor = (isMoving) => {
        const target = this.inputCanvas;
        /* 先删除上次的兼听 */
        target.removeEventListener('mouseover', this.onShowCursor);
        target.removeEventListener('mousemove', this.onRenderOutputCursor);
        target.removeEventListener('mouseout', this.onHideCursor);
        if (isMoving) {
            return;
        }
        target.addEventListener('mouseover', this.onShowCursor, false);
        target.addEventListener('mousemove', this.onRenderOutputCursor, false);
        target.addEventListener('mouseout', this.onHideCursor, false);
    }

    /**
     * 显示画笔
     */
    onShowCursor = () => {
        this.mattingCursorStyle = {
            ...this.mattingCursorStyle,
            display: 'initial',
            left: '-999px',
            top: '-999px'
        };
        this.callback({
            mattingCursorStyle: this.mattingCursorStyle
        })
    }

    /**
     * 隐藏画笔
     */
    onHideCursor = () => {
        this.mattingCursorStyle = {
            ...this.mattingCursorStyle,
            display: 'none',
            left: '-999px',
            top: '-999px'
        };
        this.callback({
            mattingCursorStyle: this.mattingCursorStyle
        })
    }

    /**
     * 修改画笔的位置
     * @param {*} e
     */
    onRenderOutputCursor = (e) => {
        if (this.frameId) cancelAnimationFrame(this.frameId)
        this.frameId = requestAnimationFrame(() => {
            let left = e.offsetX - this.radius;
            let top = e.offsetY - this.radius;
            if (this.radius <= 20) {
                left = e.offsetX - 20;
                top = e.offsetY - 20;
            }
            this.mattingCursorStyle = {
                ...this.mattingCursorStyle,
                left: left + 'px',
                top: top + 'px'
            };
            this.callback({
                mattingCursorStyle: this.mattingCursorStyle
            })
        })
    }

    /**
     * 移动时的画笔样式
     * @param {*} isMoving
     */
    changeOutputCursorByDrag = (isMoving) => {
        if (this.isMoving === isMoving) {
            return;
        }
        this.isMoving = isMoving;
        if (isMoving) {
            this.onHideCursor();
        } else {
            this.onShowCursor();
        }
    }

    /**
     * 修改画笔配置
     * @param {*} currHardness
     * @param {*} currRadius
     * @param {*} isErasing
     */
    updateCursorParams = async (currHardness, currRadius, isErasing) => {
        this.hardness = currHardness;
        this.radius = currRadius;

        this.isErasing = isErasing;
        if (isErasing === true) {
            this.pointInnerColor = ERASE_POINT_INNER_COLOR;
            this.pointOuterColor = ERASE_POINT_OUTER_COLOR;
        } else {
            this.pointInnerColor = REPAIR_POINT_INNER_COLOR;
            this.pointOuterColor = REPAIR_POINT_OUTER_COLOR;
        }
        this.eraserIcon = await getLoadedImage(isErasing ? iconEraserDel : iconEraserAdd);
    }
}

/**
 * 初次创建画笔图标使用
 * @param {*} config
 * @returns
 */
export const useMattingCursor = async (config) => {
    const { inputCtx, isMoving, isErasing, hardness, radius, callback } = config;
    const mattingCursor = new MattingCursor({ inputCtx, isErasing, callback });
    let { cursorImage, mattingCursorStyle, renderOutputCursor } = mattingCursor;

    await mattingCursor.updateCursorParams(hardness, radius, isErasing);
    cursorImage = await mattingCursor.createCursorImage();
    mattingCursor.changeOutputCursorByDrag(isMoving);
    mattingCursor.renderOutputCursor(isMoving);

    return {
        mattingCursor,
        mattingCursorStyle,
        cursorImage,
        renderOutputCursor,
    };
}
/**
 * 更新画笔图标（useMattingCursor中返回的mattingCursor做为参数回传）
 * @param {*} config
 * @returns
 */
export const updateCursorInfo = async (config) => {
    let { mattingCursor, hardness, radius, isMoving, isErasing } = config;

    let { cursorImage } = mattingCursor;
    if (!isEmpty(config.radius) && !isEmpty(config.hardness) && !isEmpty(config.isErasing)) {
        await mattingCursor.updateCursorParams(hardness, radius, isErasing);
        cursorImage = await mattingCursor.createCursorImage();
    }

    if (!isEmpty(config.isMoving)) {

        mattingCursor.changeOutputCursorByDrag(isMoving);
        mattingCursor.renderOutputCursor(isMoving);
    }
    return { cursorImage };
}
