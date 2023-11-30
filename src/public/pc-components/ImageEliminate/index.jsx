import React from 'react';
import { isEmpty } from './helpers/util';
import Iconfont from './components/Iconfont';
import DrawCanvas from './components/DrawCanvas';
import { Dropdown, Button, Upload, Tooltip } from 'antd';
import BrushConfigs from './components/BrushConfigs';
import { DEFUALT_RADIUS, DEFUALT_HARDNESS } from './constants/index';
import clickImg from './assets/点选.png';
import './index.scss';

const CHOOSE_MENUS = [
    { id: 1, name: '智能优化', value: 'click', img: clickImg, isShow: true },
    { id: 3, name: '涂抹去除', value: 'drawdel', icon: 'tumoquchu1', isShow: true, hasBrushConifg: true },
    { id: 4, name: '涂抹保留', value: 'drawadd', icon: 'tumobaoliu1', isShow: true, hasBrushConifg: true },
];

const USE_KEY_CODE = [
    'Control', 'Shift', 'Alt', 'Option', 'Meta', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '+', '-', '=', '_'
];

const NUMBER_CODE = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

class ImageEliminate extends React.Component {
    canvasHistory = []; /* 绘画历史 */
    step = -1; /* 步数 用做撤销和反撤销 */
    keyState = {}; /* 键盘按钮点击状态保存 */
    constructor(props) {
        super(props);
        this.state = {
            lastTab: 'click',
            maxWidth: !isEmpty(props.maxWidth) ? props.maxWidth * 2 + 24 : 1224, /* 最大宽度 */
            maxHeight: !isEmpty(props.maxHeight) ? props.maxHeight : 700, /* 最大高度 */
            brushInfo: {
                radius: DEFUALT_RADIUS,
                hardness: DEFUALT_HARDNESS,
            },
            canUndo: false,
            canRedo: false,
            canReset: false,
            isMoving: false
        };
    };

    componentWillUnmount() {
        window.removeEventListener('wheel', this.onWheel);
        document.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('keyup', this.onKeyUp);
    }

    /**
     * 鼠标滚轮滚动事件处理
     * @param {*} e
     */
    onWheel = (e) => {
        e.preventDefault();
        /* 加上Alt/Option/Control/Meta 时是缩放操作 */
        // if (this.keyState.Alt || this.keyState.Option || this.keyState.Control || this.keyState.Meta) {
        this.refs.drawCanvas.onWheel(e);
        // } else {
        //     /* 其余为上下移动画布 又tm不要这功能了*/
        //     this.refs.drawCanvas.moveCanvasOnWheel(e);
        // }
    }

    componentDidMount() {
        window.addEventListener('wheel', this.onWheel, { passive: false });
        document.addEventListener('keydown', this.onKeyDown, { passive: false });
        document.addEventListener('keyup', this.onKeyUp, { passive: false });
    }

    /**
     * 按下按键
     * @param {*} e
     */
    onKeyDown = (e) => {
        const { lastTab } = this.state;
        // console.log('keydown - e', e);
        let code = e.code;
        if (USE_KEY_CODE.includes(e.key)) code = e.key;

        if (code === 'Space' && !this.keyState.Space) {
            e.preventDefault();
            this.refs.drawCanvas.transformOnChange('move', true);
        }

        this.keyState[code] = true;

        let { keyState } = this;
        if ((keyState.Control || keyState.Meta) && keyState.Shift && keyState.KeyZ) {
            e.preventDefault();
            this.keyState.KeyZ = false;
            this.canvasUndo('redo');
            return;
        }
        if ((keyState.Control || keyState.Meta) && keyState.KeyZ) {
            e.preventDefault();
            this.keyState.KeyZ = false;
            this.canvasUndo('undo');
            return;
        }

        /* 居中 适应屏幕大小 */
        if ((keyState.Control || keyState.Meta) && keyState['0']) {
            e.preventDefault();
            this.refs.drawCanvas.transformOnChange('ratio', 'reload');
            this.keyState['0'] = false;
            return;
        }
        /* 居中 适应实际大小 */
        if ((keyState.Control || keyState.Meta) && keyState['1']) {
            e.preventDefault();
            this.refs.drawCanvas.transformOnChange('ratio', 'resize');
            this.keyState['1'] = false;
            return;
        }
        /* 画面缩小 10% */
        if ((keyState.Control || keyState.Meta) && (keyState['-'] || keyState['_'])) {
            e.preventDefault();
            this.refs.drawCanvas.transformOnChange('ratio', 'del');
            this.keyState['-'] = false;
            this.keyState['_'] = false;
            return;
        }
        /* 画面放大 10% */
        if (((keyState.Control || keyState.Meta) && (keyState['+'] || keyState['=']))) {
            e.preventDefault();
            this.refs.drawCanvas.transformOnChange('ratio', 'add');
            this.keyState['+'] = false;
            this.keyState['='] = false;
            return;
        }

        if (lastTab !== 'click') {
            e.preventDefault();
            /* 放大、缩小笔刷 */
            this.changeRadiusByCode(code);
        }

    }

    /**
     * 松开按键
     * @param {*} e
     */
    onKeyUp = (e) => {
        e.preventDefault();
        let code = e.code;
        if (USE_KEY_CODE.includes(e.key)) code = e.key;
        this.keyState[code] = false;
        if (code === 'Space') {
            this.refs.drawCanvas.transformOnChange('move', false);
        }
    };
    /**
     * 按下[]和数字键修改画笔大小
     * @param {*} code
     */
    changeRadiusByCode = (code) => {
        const { brushInfo: { radius } } = this.state;
        if (code === 'BracketLeft') {
            if (radius * 2 > 2 && radius * 2 <= 100) {
                this.brushOnChange('radius', (radius * 2) - 2);
            }
        }
        if (code === 'BracketRight') {
            if (radius * 2 >= 2 && radius * 2 < 100) {
                this.brushOnChange('radius', (radius * 2) + 2);
            }
        }
        if (NUMBER_CODE.includes(code)) {
            if (code === '0') {
                this.brushOnChange('radius', 100);
            } else {
                this.brushOnChange('radius', code * 10);
            }
            this.keyState[code] = false;
        }
    }

    /**
     * 保存图片
     */
    saveImage = () => {
        let res = this.refs.drawCanvas.saveImage();
        if (this.props.onOk) {
            this.props.onOk(res);
        }
    }

    /**
     * 取消
     */
    cancel = () => {
        if (this.props.onCancel) {
            this.props.onCancel(this.step);
        }
    }

    /**
     * 修改当前的功能类型
     */
    changeTab = (item) => {
        if (!this.state.isMoving && this.state.lastTab === item.value) {
            return;
        }
        this.setState({
            lastTab: item.value,
            isMoving: false
        }, () => {
            this.props.tabOnChange && this.props.tabOnChange(item.name);
            if (['drawdel', 'drawadd'].includes(item.value)) {
                this.refs.drawCanvas.changeErasing(item.value === 'drawdel')
            } else {
                this.refs.drawCanvas.changeIsClick(true);
            }
        })
    }

    /**
     * 上一步、下一步、重置
     * @param {*} type
     */
    canvasUndo = (type) => {
        let needRedo = false;
        let param = {};
        /* 撤销 */
        if (type === 'undo') {
            if (!this.state.canUndo) return;
            this.props.onUndo && this.props.onUndo();
            if (this.step > 0) {
                this.step--;
                needRedo = true;
            } else {
                param.canUndo = false;
                console.log('不能再继续撤销了', this.step, this.canvasHistory.length);
            }
        }
        /* 反撤销 */
        if (type === 'redo') {
            if (!this.state.canRedo) return;
            this.props.onRedo && this.props.onRedo();
            if (this.step < this.canvasHistory.length - 1) {
                this.step++;
                needRedo = true;
            } else {
                console.log('已经是最新的记录了', this.step, this.canvasHistory.length);
                param.canRedo = false;
            }
        }
        /* 重置 */
        if (type === 'reset') {
            if (!this.state.canReset) return;
            this.props.onReset && this.props.onReset();
            if (this.canvasHistory.length > 1) {
                this.step = 0;
                needRedo = true;
                this.canvasHistory = this.canvasHistory.slice(0, 1);
            } else {
                console.log('没有产生修改', this.step, this.canvasHistory.length);
                param.canReset = false;
            }
        }
        if (!needRedo) {
            if (!isEmpty(param)) {
                this.setState({ ...param });
            }
            return;
        }

        let { canUndo, canRedo, canReset } = this.state;
        if (this.canvasHistory.length > 1 && this.step > 0 && canUndo === false) {
            param.canUndo = true;
        } else if (this.canvasHistory.length <= 1 && this.step <= 0 && canUndo === true) {
            param.canUndo = false;
        }
        if (canRedo === false && this.step < this.canvasHistory.length - 1) {
            param.canRedo = true;
        } else if (canRedo === true && this.step >= this.canvasHistory.length - 1) {
            param.canRedo = false;
        }
        if (this.canvasHistory.length > 1 && canReset === false) {
            param.canReset = true;
        } else if (this.canvasHistory.length <= 1 && canReset === true) {
            param.canReset = false;
        }
        if (!isEmpty(param)) {
            this.setState({
                ...param
            })
        }

        // 还原canvas
        let lastStep = this.canvasHistory[this.step];
        this.refs.drawCanvas.canvasUndo(lastStep);
    }

    /**
     * 画笔配置有修改
     * @param {*} type
     * @param {*} value
     */
    brushOnChange = async (type, value, isFirst) => {
        let { brushInfo } = this.state;
        let updateInfo = {};
        if (type === 'radius') {
            updateInfo = {
                radius: value / 2
            }
        }
        if (type === 'hardness') {
            updateInfo = {
                hardness: value / 10
            }
        }
        this.setState({
            brushInfo: {
                ...brushInfo,
                ...updateInfo
            }
        })
        if (isFirst) {
            this.refs.drawCanvas.showMattingCursor(() => {
                if (updateInfo.radius) this.refs.drawCanvas.changeRadius(updateInfo.radius, 'config');
                if (updateInfo.hardness) this.refs.drawCanvas.changeHardness(updateInfo.hardness, 'config');
            });
        } else {
            if (updateInfo.radius) this.refs.drawCanvas.changeRadius(updateInfo.radius, 'config');
            if (updateInfo.hardness) this.refs.drawCanvas.changeHardness(updateInfo.hardness, 'config');
        }

    }
    /**
     * 画笔修改结束
     */
    brushChangeOnEnd = (type) => {
        setTimeout(() => {
            this.refs.drawCanvas.hideMattingCursor();
        }, 200);
    }
    beforeUpload = () => {
        return false;
    }

    fileOnChange = async (value) => {
        if (isEmpty(value.file) || value.file.status == 'removed') {
            return;
        }
        this.step = -1;
        this.canvasHistory = [];
        this.refs.drawCanvas.reloadImg({ image: value.file });
    }

    /**
     * 获取canvas历史
     * @returns
     */
    getHistory = () => {
        return {
            historyInfo: this.canvasHistory,
            step: this.step
        }
    }

    /**
     * 保存历史数据
     */
    saveHistory = ({ historyInfo, step }) => {
        let { canUndo, canRedo, canReset } = this.state;
        let param = {};
        if (historyInfo.length > 1 && canUndo === false) {
            param.canUndo = true;
        } else if (historyInfo.length <= 1 && canUndo === true) {
            param.canUndo = false;
        }

        if (canRedo === false && step < historyInfo.length - 1) {
            param.canRedo = true;
        } else if (canRedo === true && step >= historyInfo.length - 1) {
            param.canRedo = false;
        }

        if (historyInfo.length > 1 && canReset === false) {
            param.canReset = true;
        } else if (historyInfo.length <= 1 && canReset === true) {
            param.canReset = false;
        }
        if (!isEmpty(param)) {
            this.setState({
                ...param
            })
        }
        this.canvasHistory = historyInfo;
        this.step = step;
    }

    /**
     * 更新抓手状态
     */
    updateMoving = (isMoving) => {
        this.setState({
            isMoving
        })
    }
    render() {
        const { canUndo, canRedo, canReset } = this.state;
        const { maxWidth, lastTab, brushInfo, isMoving } = this.state;
        const { props } = this;

        const brushConfig = (
            <BrushConfigs onChange={this.brushOnChange} onEnd={this.brushChangeOnEnd} drawingConfig={brushInfo} />
        );
        return (
            <div className='image-eliminate'>
                {/* 操作区域 */}
                <div className='image-eliminate-options' style={{ maxWidth: maxWidth }}>
                    <div className='option-left'>
                        {
                            CHOOSE_MENUS.map((item) => {
                                if (item.hasBrushConifg) {
                                    return (
                                        <Dropdown key={item.id} trigger={['click']} overlay={brushConfig} placement="bottomCenter">
                                            <div
                                                className={lastTab == item.value && !isMoving ? 'option-box option-box-active' : 'option-box'}
                                                onClick={this.changeTab.bind(this, item)}
                                            >
                                                {
                                                    !isEmpty(item.img) ?
                                                        <img src={item.img} className='option-img' draggable="false" />
                                                        :
                                                        <Iconfont type={item.icon} className='option-icon' />
                                                }
                                                <div className='option-text'>
                                                    <span>{item.name}</span>
                                                    <Iconfont type="a-duobianxing2" className='option-down' />
                                                </div>
                                            </div>
                                        </Dropdown>
                                    )
                                }
                                return (
                                    <div
                                        key={item.id}
                                        className={lastTab == item.value && !isMoving ? 'option-box option-box-active' : 'option-box'}
                                        onClick={this.changeTab.bind(this, item)}
                                    >
                                        {
                                            !isEmpty(item.img) ?
                                                <img src={item.img} className='option-img' draggable="false" />
                                                :
                                                <Iconfont type={item.icon} className='option-icon' />
                                        }
                                        <div className='option-text'>{item.name}</div>
                                    </div>
                                )
                            })
                        }
                    </div>
                    <div className='option-middle'>
                        <Tooltip placement="bottom" title={'上一步'}>
                            <div className={canUndo ? 'option-icon-box' : 'option-icon-box-gray'}>
                                <Iconfont type="shangyibu1" className={canUndo ? 'option-icon' : 'option-icon-gray'} onClick={this.canvasUndo.bind(this, 'undo')} />
                            </div>
                        </Tooltip>
                        <Tooltip placement="bottom" title={'下一步'}>
                            <div className={canRedo ? 'option-icon-box' : 'option-icon-box-gray'}>
                                <Iconfont type="a-zu11776" className={canRedo ? 'option-icon' : 'option-icon-gray'} onClick={this.canvasUndo.bind(this, 'redo')} />
                            </div>
                        </Tooltip>
                        <Tooltip placement="bottom" title={'重置'}>
                            <div className={canReset ? 'option-icon-box margin-right-0' : 'option-icon-box-gray margin-right-0'}>
                                <Iconfont type="zhongxin1" className={canReset ? 'option-icon' : 'option-icon-gray'} onClick={this.canvasUndo.bind(this, 'reset')} />
                            </div>
                        </Tooltip>
                    </div>
                    <div className='option-right'>
                        {/* 上传文件 组件测试用 */}
                        {/* <Upload
                            name={'file'}
                            onRemove={this.onRemove}
                            beforeUpload={this.beforeUpload}
                            onChange={this.fileOnChange}
                            showUploadList={false}
                        >
                            <Button type="primary" className='option-btn margin-right-12' ghost onClick={this.cancel}>上传文件</Button>
                        </Upload> */}
                        <Button type="primary" className='option-btn margin-right-12' onClick={this.saveImage}>{ props.okText || '完成修改' }</Button>
                        <Button type="primary" className='option-btn' ghost onClick={this.cancel}>{ props.cancelText || '取消' }</Button>
                    </div>
                </div>
                {/* canvas区域 */}
                <DrawCanvas
                    ref='drawCanvas'
                    {...props}
                    drawingConfig={brushInfo}
                    saveHistory={this.saveHistory}
                    getHistory={this.getHistory}
                    updateMoving={this.updateMoving}
                />
            </div>
        );

    }
}
export default ImageEliminate;
