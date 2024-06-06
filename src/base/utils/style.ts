/**
 * 从位置获取样式对象
 * 位置可以包含6个属性：左、上、右、下、宽、高
 * @param position 
 * @returns 
 * 
 * @category Util
 */
export const getPositionStyle = (ps: any): any => {
    let style: any = {};

    const keys = ['left', 'top', 'right', 'bottom', 'width', 'height',
        'margin', 'margin-left', 'margin-top', 'margin-right', 'margin-bottom',
        'padding', 'padding-left', 'padding-top', 'padding-right', 'padding-bottom',
        'z-index'
    ];

    keys.forEach(key => {
        if (typeof ps[key] === 'number') {
            style[key] = ps[key] + 'px';
        }
        else if (typeof ps[key] !== 'undefined') {
            style[key] = ps[key];
        }
    });

    // if (typeof ps.zIndex === 'undefined') {
    //     //set zindex=auto instead of 0, because inner dom of widget may need to overlay other widget
    //     //that has the same zindex.
    //     style['z-index'] = 'auto';
    // }
    return style;
};


/**
 * 样式转换成字符串
 * @param style 
 * @returns {string}
 * 
 * @category Util
 */
export const styleToString = (style: any): string => {
    let str = '';
    for (const key in style) {
        if (style.hasOwnProperty(key)) {
            str += `${key}:${style[key]};`;
        }
    }
    return str;
}


