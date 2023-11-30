import React from 'react';
import Iconfont from '../Iconfont';
import './index.scss';
import { Tooltip, Dropdown } from 'antd';

export default class TransformOption extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            persent: 100, /* 缩放比例 */
            isMoving: false,
            transformList: [
                { id: 1, name: '400%', value: 4 },
                { id: 2, name: '200%', value: 2 },
                { id: 3, name: '125%', value: 1.25 },
                { id: 4, name: '100%', value: 1 },
                { id: 5, name: '75%', value: 0.75 },
                { id: 6, name: '50%', value: 0.5 },
                { id: 7, name: '10%', value: 0.1 },
                { id: 8, name: '适应画面', value: 'reload' },
                { id: 9, name: '适应大小', value: 'resize' },
            ],
        };
    }

    /**
     * 切换可移动图片的状态
     */
    transToMove = () => {
        const { isMoving } = this.state;
        this.setState({
            isMoving: !isMoving
        }, () => {
            if (this.props.onChange) {
                this.props.onChange('move', this.state.isMoving);
            }
        })
    }

    /**
     * 修改放大比例
     * @param {*} item
     */
    changeRatio = (item) => {
        if (this.props.onChange) {
            this.props.onChange('ratio', item.value);
        }

    }

    /**
     * 比例减少10% - 0.1
     */
    delScale = () => {
        const { persent } = this.state;
        if (persent <= 10) {
            console.log('不能再减少了');
            return;
        }
        this.props.onChange('ratio', (persent - 10) >= 10 ? (persent - 10) / 100 : 0.1);
    }

    /**
     * 比例增加10% - 0.1
     */
    addScale = () => {
        const { persent } = this.state;
        if (persent >= 400) {
            console.log('不能再增加了');
            return;
        }
        this.props.onChange('ratio', (parseInt(persent) + 10) <= 400 ? (parseInt(persent) + 10) / 100 : 4);
    }
    render() {
        const { persent, isMoving, transformList } = this.state;
        const menuList = (
            <div className='transform-menus'>
                {
                    transformList.map((item) => {
                        return <div key={item.id} className='transform-menu-item' onClick={this.changeRatio.bind(this, item)}>{item.name}</div>
                    })
                }
            </div>
        );
        return (
            <div className='transform-options'>
                {/* 抓手 */}
                <Tooltip placement="top" title={'抓手'}>
                    <div className={isMoving ? 'icon-box icon-box-active' : 'icon-box'} onClick={this.transToMove}>
                        <Iconfont type='a-shoushouzhangbazhang' className='icon' />
                    </div>
                </Tooltip>

                {/* 分割条 */}
                <div className='divider'></div>
                {/* 缩放区域 */}
                <div className='icon-list'>
                    <Tooltip placement="top" title={'缩小'}>
                        <div className='icon-box' onClick={this.delScale}>
                            <Iconfont type='a-suoxiao1' className='icon' />
                        </div>
                    </Tooltip>
                    <Dropdown overlay={menuList} placement="bottomCenter">
                        <span className='persent-text'>{persent}%</span>
                    </Dropdown>
                    <Tooltip placement="top" title={'放大'}>
                        <div className='icon-box' onClick={this.addScale}>
                            <Iconfont type='sousuofangda' className='icon' />
                        </div>
                    </Tooltip>
                </div>
            </div>
        )
    }
}
