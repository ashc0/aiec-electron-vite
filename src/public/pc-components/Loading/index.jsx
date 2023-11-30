import React from 'react';
import ReactDOM from 'react-dom';
import './index.scss';

/**
 * 相对于外壳容器的loading
 * isFixed属性可修改为全屏loading
 * @param {*} props
 * @returns
 */
export const Loading = (props) => {
    if (!props || !props.visible) {
        return null;
    }
    let maskClass = 'image-eliminate-mask';
    if (props.isFixed) {
        maskClass = 'image-eliminate-mask image-eliminate-mask-fixed';
    }

    return (
        <div className={maskClass}>
            <div className='image-eliminate-loading'>
                <div className='loading-outer'>
                    <div className='loading-inner'></div>
                </div>
                {
                    props.title && <div className='loading-text'>{props.title}</div>
                }
            </div>
        </div>
    );
}

const FULLSCREEN_ID = 'fullscreen-loading';

/**
 * 显示全屏loading
 * @param {*} props
 */
export const showLoading = (props) => {
    let div = document.createElement('div');
    div.id = FULLSCREEN_ID;
    document.getElementsByTagName('body')[0].appendChild(div);
    let moreProp = {};
    if (props.title) {
        moreProp.title = props.title;
    }
    ReactDOM.render(<Loading isFixed={true} visible={true} {...moreProp} />, document.getElementById(FULLSCREEN_ID));
}

/**
 * 隐藏全屏loading
 * @param {*} props
 */
export const hideLoading = () => {
    let element = document.getElementById(FULLSCREEN_ID);
    if (element && element.parentNode) {
        element.parentNode.removeChild(element);
    }
}
