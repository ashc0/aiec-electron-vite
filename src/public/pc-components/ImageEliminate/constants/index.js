/* 画笔绘制点最小半径像素 */
export const MIN_RADIUS = 1;
export const DEFUALT_RADIUS = 25;
export const DEFUALT_HARDNESS = 0.9;

/* 默认的缩放比例 */
export const INITIAL_SCALE_RATIO = 1;

/**
 * 画板的间隙对象-----默认不留白
 * （已修改为画布与图片一致大小，此内容保留不作废）
 */
export const INITIAL_GAP_SIZE = {
    horizontal: 0,
    vertical: 0,
};

/* 隐藏画板的间隙对象—----隐藏画板不需要留白 */
export const HIDDEN_BOARD_GAP_SIZE = {
    horizontal: 0,
    vertical: 0,
};
/* 隐藏画板的最大尺寸—----—默认情况下与图片原始尺寸一致，但不能超过2000px，超过2000px会进行缩放以免影响性能 */
export const HIDDEN_BOARD_MAX_SIZE = {
    width: 5000,
    height: 5000,
};

/* 默认的图像平滑选项值 */
export const DEFAULT_IMAGE_SMOOTH_CHOICE = false;

/* 计算stepBase(绘制补帧线条的迭代中的增量，基于真实尺寸的半径得到)的系数的倒数 */
export const DRAWING_STEP_BASE_BASE = 20;
/* 计算绘制圆点的节流步长的系数的倒数 */
export const DRAWING_STEP_BASE = 3.5;

/* 计算绘制补帧线条的节流步长的系数的倒数 */
export const DRAW_INTERPOLATION_STEP_BASE = 2.5;
/* 绘制补帧线条的画笔半径阈值 */
export const DRAW_INTERPOLATION_RADIUS_THRESHOLD = 1;
/* 放大的系数 */
export const ZOOM_IN_COEFFICIENT = 1;
/* 缩小的系数 */
export const ZOOM_OUT_COEFFICIENT = -1;
/* 缩放比率变化的步长 */
export const SCALE_STEP = 0.04;
export const MIN_SCALE_RATIO = 0.1;
export const MAX_SCALE_RATIO = 4;

/* 蒙版的颜色 */
export const MASK_INNER_COLOR = 'rgba(66,69,252,0.4)';

/* 修补渐变开始的颜色 */
export const REPAIR_INNER_COLOR = 'rgba(66,69,252,1)';
/* 修补渐变结束的颜色 */
export const REPAIR_OUTER_COLOR = 'rgba(66,69,252,0)';

/* 擦除渐变开始的颜色 */
export const ERASE_INNER_COLOR = 'rgba(255,255,255,1)';
/* 擦除结束的颜色 */
export const ERASE_OUTER_COLOR = 'rgba(255,255,255,0)';

/* 修补画笔渐变开始的颜色 */
export const REPAIR_POINT_INNER_COLOR = 'rgba(116,221,208,1)';
/* 修补画笔结束的颜色 */
export const REPAIR_POINT_OUTER_COLOR = 'rgba(116,221,208,0)';

/* 擦除画笔渐变开始的颜色 */
export const ERASE_POINT_INNER_COLOR = 'rgba(255,172,186,1)';
/* 擦除画笔结束的颜色 */
export const ERASE_POINT_OUTER_COLOR = 'rgba(255,172,186,0)';
