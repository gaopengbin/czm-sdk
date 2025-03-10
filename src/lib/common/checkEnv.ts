// 获取当前浏览器及版本号
export const getBrowserInfo = () => {
    const ua = navigator.userAgent;
    const isIE = ua.indexOf('compatible') > -1 && ua.indexOf('MSIE') > -1;
    const isEdge = ua.indexOf('Edg') > -1 && !isIE;
    const isIE11 = ua.indexOf('Trident') > -1 && ua.indexOf('rv:11.0') > -1;
    const isFF = ua.indexOf('Firefox') > -1;
    const isOpera = ua.indexOf('Opera') > -1;
    const isSafari = ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1;
    const isChrome = ua.indexOf('Chrome') > -1 && ua.indexOf('Safari') > -1;
    const isQax = ua.indexOf('Qaxbrowser') > -1;
    let browser = '';
    if (isIE) {
        const reIE = new RegExp('MSIE (\\d+\\.\\d+);');
        reIE.test(ua);
        browser = `IE: ${RegExp['$1']}`;
    }
    if (isIE11) {
        browser = 'IE 11';
    }
    if (isFF) {
        const reFF = new RegExp('Firefox/(\\d+\\.\\d+)');
        reFF.test(ua);
        browser = `Firefox: ${RegExp['$1']}`;
    }
    if (isOpera) {
        const reOpera = new RegExp('Opera/(\\d+\\.\\d+)');
        reOpera.test(ua);
        browser = `Opera: ${RegExp['$1']}`;
    }
    if (isSafari) {
        const reSafari = new RegExp('Version/(\\d+\\.\\d+)');
        reSafari.test(ua);
        browser = `Safari: ${RegExp['$1']}`;
    }
    if (isChrome) {
        const reChrome = new RegExp('Chrome/(\\d+\\.\\d+)');
        reChrome.test(ua);
        browser = `Chrome: ${RegExp['$1']}`;
    }
    if (isEdge) {
        const reEdge = new RegExp('Edge/(\\d+\\.\\d+)');
        reEdge.test(ua);
        browser = `Edge: ${RegExp['$1']}`;
    }
    if (isQax) {
        // const reQax = new RegExp('Qaxbrowser/(\\d+\\.\\d+)');
        // reQax.test(ua);
        browser = `Qax`;
    }
    return browser;
};

export const isWebGL2Supported = () => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!!gl) {
        const browser = getBrowserInfo();
        const [name, version] = browser.split(': ');
        const versionNumber = parseFloat(version);
        if (name === 'IE') {
            return false;
        }
        if (name === 'Edg' && versionNumber < 79) {
            return false;
        }
        if (name === 'Firefox' && versionNumber < 51) {
            return false;
        }
        if (name === 'Opera' && versionNumber < 43) {
            return false;
        }
        if (name === 'Safari' && versionNumber < 15) {
            return false;
        }
        if (name === 'Chrome' && versionNumber < 56) {
            return false;
        }
        if (name === 'Qax') {
            return false;
        }
        return true;
    }
    return false;
}