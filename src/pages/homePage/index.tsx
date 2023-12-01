import React from 'react';
// @ts-ignore
import ImageEliminate from '@/public/pc-components/ImageEliminate/index';


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
            <ImageEliminate
                image={"https://q.aiyongtech.com/ai/ai-assisiant/imgs/aikou2K.jpg"}
                bodyImage={"https://q.aiyongtech.com/ai/ai-assisiant/imgs/aikou2K.jpg"} /*  */
                maxWidth={800} /*  */
                maxHeight={800} /*  */
                onOk={onOk}
                onCancel={onCancel}
            />
        </div>
    );
};

export default HomePage;