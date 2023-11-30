import React from 'react';
import Iconfont from '../Iconfont';
import { Slider } from 'antd';
import './index.scss';
import { isEmpty } from '../../helpers/util';
import { DEFUALT_RADIUS, DEFUALT_HARDNESS } from '../../constants/index';

export default class BrushConfigs extends React.Component {
    constructor(props) {
        super(props);
        let radius = DEFUALT_RADIUS * 2;
        let hardness = DEFUALT_HARDNESS * 10;
        if (!isEmpty(props.drawingConfig)) {
            if (!isEmpty(props.drawingConfig.radius)) radius = props.drawingConfig.radius * 2;
            if (!isEmpty(props.drawingConfig.hardness)) hardness = props.drawingConfig.hardness * 10;
        }
        this.state = {
            radius: radius,
            hardness: hardness,
        };
        this.isFirstChange = false;
    }

    componentWillReceiveProps(nextProps) {
        if (!isEmpty(this.props.drawingConfig) && !isEmpty(nextProps.drawingConfig)) {
            let updateInfo = {};
            if (!isEmpty(nextProps.drawingConfig.radius) && this.props.drawingConfig.radius != nextProps.drawingConfig.radius) {
                updateInfo.radius = nextProps.drawingConfig.radius * 2;
            }
            if (!isEmpty(nextProps.drawingConfig.hardness) && this.props.drawingConfig.hardness != nextProps.drawingConfig.hardness) {
                updateInfo.hardness = nextProps.drawingConfig.hardness * 10;
            }
            if (!isEmpty(updateInfo)) {
                this.setState({
                    ...updateInfo
                })
            }
        }
    }

    /**
     * 修改画笔大小
     * @param {*} value
     */
    radiusOnChange = (value) => {
        this.setState({
            radius: value
        }, () => {
            let isFirst = false;
            if (!this.isFirstChange) {
                this.isFirstChange = true;
                isFirst = true;
            }
            if (this.props.onChange) {
                this.props.onChange('radius', value, isFirst);
            }
        })
    }
    onRadiusAfterChange = (value) => {
        this.isFirstChange = false;
        if (this.props.onEnd) {
            this.props.onEnd('radius');
        }
    }


    /**
     * 修改画笔硬度
     * @param {*} value
     */
    hardnessOnChange = (value) => {
        this.setState({
            hardness: value
        }, () => {
            let isFirst = false;
            if (!this.isFirstChange) {
                this.isFirstChange = true;
                isFirst = true;
            }
            if (this.props.onChange) {
                this.props.onChange('hardness', value, isFirst);
            }
        })
    }
    onHardnessAfterChange = (value) => {
        this.isFirstChange = false;
        if (this.props.onEnd) {
            this.props.onEnd('hardness');
        }
    }

    render() {
        let { radius, hardness } = this.state;
        return (
            <div className='image-brush-configs'>
                {/* 画笔大小 */}
                <div className='image-brush-config-line'>
                    <span className='title'>画笔大小</span>
                    <div className='num'>{radius}</div>
                </div>
                <div className='image-brush-config-line margin-top-12'>
                    <Iconfont type='jian' className='icon' />
                    <Slider value={radius} max={100} min={1} className='slider' onChange={this.radiusOnChange} onAfterChange={this.onRadiusAfterChange} />
                    <Iconfont type='jia' className='icon' />
                </div>
                {/* 画笔硬度 */}
                <div className='image-brush-config-line margin-top-12'>
                    <span className='title'>画笔硬度</span>
                    <div className='num'>{hardness}</div>
                </div>
                <div className='image-brush-config-line margin-top-12'>
                    <Iconfont type='ruan' className='icon' />
                    <Slider value={hardness} max={10} min={1} className='slider' onChange={this.hardnessOnChange} onAfterChange={this.onHardnessAfterChange} />
                    <Iconfont type='a-zu11590' className='icon' />
                </div>
            </div>
        )
    }
}
