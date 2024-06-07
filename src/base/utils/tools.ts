/**
 * 立即执行 主要用于防抖
 * 将指定函数放到队列中
 * @param {Function} callback 
 * 
 * @category Util
 */
export let timerFunc = (callback: any) => {
    // 惰性函数
    if (Promise) {
        timerFunc = (callback: any) => {
            Promise.resolve().then(callback);
        }
    }
    // 使用动画执行
    else if (requestAnimationFrame) {
        timerFunc = (callback: any) => {
            requestAnimationFrame(callback);
        }
    }
    else {
        timerFunc = (callback: any) => {
            /**
             * 使用setTimeout 可能会出现延迟
             */
            setTimeout(callback, 0);
        }
    }
    timerFunc(callback);
}