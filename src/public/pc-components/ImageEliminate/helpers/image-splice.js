const HOST = 'https://ai.aiyongtech.com/';
import axios from 'axios';
/**
 * 图片分割切片
 * @param {*} args
 * @returns
 */
export const getImgPiece = (args) => {
    return new Promise((resolve, reject) => {
        api({
            // method: 'image/imageSliceGenerate',
            host: 'http://region-101.seetacloud.com:14055/generate_all_mask',
            args,
            callback: (res) => {
                resolve(res);
            },
        });
    });
};

/**
 * 根据坐标切割图片，只返回一个图片
 * @param {*} args
 * @returns
 */
export const getImgPieceByCoordinate = (args) => {
    return new Promise((resolve, reject) => {
        api({
            method: 'image/imageSliceByPointPipe',
            // host: 'http://region-101.seetacloud.com:14055/generate_mask',
            isTransformResponse: false,
            args,
            callback: (res) => {
                resolve(res);
            },
        });
    });
};


/**
 * form-data post api
 * @param {*} param0
 */
export const api = ({ method = '', host = HOST, isTransformResponse = true, args = {}, callback = () => { } }) => {
    const url = host + method;

    const formData = new FormData();
    for (const key in args) {
        const item = args[key];
        formData.append(key, item);
    }
    const config = { headers: { token: 'uMg2TYFr0NTQdbqL' } };

    if (args.isLightApp) {
        // 是否是1688爱用商品轻应用端
        const randomNumber = Math.floor(Math.random() * 1000000);
        config.headers = {
            'X-Proxy-user-id': randomNumber,
            'X-Proxy-nick': randomNumber,
            'X-Proxy-storeid': 1688,
            'X-Proxy-product': 'item',
        };
        delete args.isLightApp;
        window.bridge.call('open.api.proxy', {
            url: 'https://aiaaliyunpre.aiyongtech.com/aigc/getImageBody',
            method: 'POST',
            ...config,
            body: {
                ...args,
                linkName: method,
                baseUrl: host,
                resultNeedChangeBase64: 'false',
                fileDirectTransmission: 'false',
            },
        }, (res) => {
            if (res.result && res.result.body) {
                callback(res.result.body.data);
            } else {
                callback({});
            }
        }, () => {
            callback({});
        });
        return;
    }
    axios.post(url, formData, config).then(({ data }) => {
        isTransformResponse ? callback(data?.data) : callback(data);
    }).catch((error) => {
        callback({});
    });
};

/**
 * base64图片转换为file
 * @param {*} data
 * @param {*} filename
 * @returns
 */
export const base64ToFile = (data, filename = 'file') => {
    const arr = data.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    // suffix是该文件的后缀
    const suffix = mime.split('/')[1];
    // atob 对经过 base-64 编码的字符串进行解码
    const bstr = atob(arr[1]);
    // n 是解码后的长度
    let n = bstr.length;
    // Uint8Array 数组类型表示一个 8 位无符号整型数组 初始值都是 数子0
    const u8arr = new Uint8Array(n);
    // charCodeAt() 方法可返回指定位置的字符的 Unicode 编码。这个返回值是 0 - 65535 之间的整数
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    // new File返回File对象 第一个参数是 ArraryBuffer 或 Bolb 或Arrary 第二个参数是文件名
    // 第三个参数是 要放到文件中的内容的 MIME 类型
    return new File([u8arr], `${filename}.${suffix}`, { type: mime });
};

/**
 * file转换为base64
 * @param {*} data
 * @param {*} filename
 * @returns
 */
export const fileToBase64 = (file) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    return new Promise((resolve) => {
        reader.addEventListener('load', (e) => {
            const base64 = e.target.result;
            resolve(base64);
        });
    });
};
