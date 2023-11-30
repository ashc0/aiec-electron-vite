import React from 'react';


const prefix = 'https://q.aiyongtech.com/ai/ai-assisiant/imgs/';
const HomePage: React.FC = () => {
    /* 点击保存修改的回调 */
    const onOk = (imgInfo: any) => {
        console.log('onOk - base64img',imgInfo);
    }

    /* 点击取消按钮的回调 */
    const onCancel = () => {

    }
    return (
        <div className={'koutu'}>
            首页
        </div>
    );
};

export default HomePage;