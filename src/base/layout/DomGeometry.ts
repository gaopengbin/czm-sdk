
/**
 * 提供一些功能函数来计算元素的位置，宽高等信息
 * 
 * @category Layout
 */
export default class DomGeometry {

    /**
     * 获取传递的元素相对于视口的位置和大小（如果includeScroll==false），或相对于文档根的位置和尺寸（如果includeScroll==true）。
     * - 返回一个形式为“｛x:100，y:300，w:20，h:15｝”的对象。
     * - 如果includeCroll==true，则x和y值将包括可能影响相对于视口的位置的任何文档偏移。使用边框模型（包括边框和填充，但不包括边距）。
     * 
     * @param node 
     * @param includeScroll 
     * @returns 
     */
    static getPosition(node: HTMLElement | Element, includeScroll: boolean) {
        var ret = this.getBoundingClientRect(node);
        ret = { x: ret.left, y: ret.top, w: ret.right - ret.left, h: ret.bottom - ret.top }

        // account for document scrolling
        // if offsetParent is used, ret value already includes scroll position
        // so we may have to actually remove that value if !includeScroll
        if (includeScroll) {
            var scroll = this.docScroll(node.ownerDocument);
            ret.x += scroll.x;
            ret.y += scroll.y;
        }

        return ret;
    };

    /**
     * 获取dom节点的边界矩形
     * - 如果节点在dom中，则返回node.getBoundingClientRect的结果；
     * - 如果抛出错误或节点不在dom上，则返回{x:0，y:0，width:0，height:0，top:0，right:0，bottom:0，left:0}。
     * - 当节点不在dom上时，将处理IE抛出错误或Edge返回空对象
     * 
     * @param node 
     * @returns 
     */
    static getBoundingClientRect(/*DomNode*/ node: HTMLElement | Element): any {
        var retEmpty = { x: 0, y: 0, width: 0, height: 0, top: 0, right: 0, bottom: 0, left: 0 },
            ret: any;

        try {
            ret = node.getBoundingClientRect();
        } catch (e) {
            // IE throws an Unspecified Error if the node is not in the dom. Handle this by returning an object with 0 values
            return retEmpty;
        }

        // Edge returns an empty object if the node is not in the dom. Handle this by returning an object with 0 values
        if (typeof ret.left === "undefined") { return retEmpty; }

        return ret;
    }

    /**
     * 获取文档滚动位置的函数
     * 
     * @param doc 
     * @returns 
     */
    static docScroll(/*Document?*/ doc: any) {
        var node = doc.parentWindow || doc.defaultView;

        if ("pageXOffset" in node) {
            return { x: node.pageXOffset, y: node.pageYOffset };
        }
        else if (doc.documentElement) {
            return { x: doc.documentElement.scrollLeft, y: doc.documentElement.scrollTop };
        }
        return { x: 0, y: 0 };
    };


    /**
     * 函数来获取DOM节点的填充和边界范围
     * 
     * @param node 
     * @returns 
     */
    static getPadBorderExtents(/*DomNode*/ node: HTMLElement) {
        let style = window.getComputedStyle(node);
        return {
            l: parseInt(style.paddingLeft) + parseInt(style.borderLeft),
            t: parseInt(style.paddingTop) + parseInt(style.borderTop),
            r: parseInt(style.paddingRight) + parseInt(style.borderRight),
            b: parseInt(style.paddingBottom) + parseInt(style.borderBottom),
            w: parseInt(style.paddingLeft) + parseInt(style.borderLeft) + parseInt(style.paddingRight) + parseInt(style.borderRight),
            h: parseInt(style.paddingTop) + parseInt(style.borderTop) + parseInt(style.paddingBottom) + parseInt(style.borderBottom)
        };
    };

    /**
     * 函数来获取DOM节点的边距范围
     * 
     * @param node 
     * @returns 
     */
    static getMarginExtents(/*DomNode*/ node: HTMLElement) {
        let style = window.getComputedStyle(node);
        return {
            l: parseInt(style.marginLeft),
            t: parseInt(style.marginTop),
            r: parseInt(style.marginRight),
            b: parseInt(style.marginBottom),
            w: parseInt(style.marginLeft) + parseInt(style.marginRight),
            h: parseInt(style.marginTop) + parseInt(style.marginBottom)
        };
    }
}