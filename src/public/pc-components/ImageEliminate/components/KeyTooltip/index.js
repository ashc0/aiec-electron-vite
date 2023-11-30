import React from 'react';
import { isEmpty } from '../../helpers/util';
import './index.scss';

/**
 * 快捷键提示框
 * @returns
 */
export default function KeyTooltip() {
    let system = '';
    let platform = '';
    if (!isEmpty(navigator)) {
        if (!isEmpty(navigator.userAgent)) platform = navigator.userAgent;
        if (!isEmpty(navigator.platform)) platform = navigator.platform;
        if (!isEmpty(navigator.appVersion)) platform = navigator.appVersion;
    }
    if (platform.includes('Mac')) {
        system = 'MacOS';
    } else if (platform.includes('Windows')) {
        system = 'Windows';
    }
    let keyName = system === 'MacOS' ? 'Cmd' : 'Ctrl';
    return (
        <div className='image-eliminate-key-tooltip'>
            <div className='title'>快捷键</div>
            <div className='line'><span>放大/缩小图片</span><span>鼠标滚轮</span></div>
            <div className='line'><span>移动画布</span><span>空格 + 鼠标左键拖拽</span></div>
            <div className='line'><span>图片适应画布</span><span>{keyName} + 0</span></div>
            <div className='line'><span>图片实际大小/100%</span><span>{keyName} + 1</span></div>
            <div className='line'><span>上一步</span><span>{keyName} + Z</span></div>
            <div className='line'><span>下一步</span><span>{keyName} + Shift + Z</span></div>
        </div>
    );
}
