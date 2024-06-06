import './css/resizeHandle.scss';
import DomGeometry from './DomGeometry';

/**
 * ResizeHandle的配置项
 * 
 * @category Layout
 */
export interface ResizeHandleOptions {
    /**最小尺寸 */
    minSize?: { w: number; h: number; };
    /**最大尺寸 */
    maxSize?: { w: number; h: number; };
    /** 切换此小部件是否关心maxHeight和maxWidth */
    constrainMax?: boolean;
    /** 是否固定宽高比 */
    fixedAspect?: boolean;
    /** ResizeHandle的模式 */
    mode?: Mode
}

/**
 * ResizeHandle的模式
 * 
 * @category Layout
 */
export enum Mode {
    /** 不支持任何方向 */
    none,
    /** 只支持水平方向 */
    horizontal,
    /** 只支持垂直方向 */
    vertical,
    /** 默认 支持水平方向和垂直方向 */
    always
}

/**
 * 可调整大小的控件，可以拖拽改变宿主dom的大小
 * 
 * @sample
 * ```ts
const container: any = this.querySelector('#tree-container');
// 添加缩放
new ResizeHandle(container, {
    mode: Mode.vertical
});

// 或

new ResizeHandle(container);
 * ```
 * 
 * @category Layout
 */
export default class ResizeHandle {

    // 拖拽控件的dom节点
    #domNode: HTMLElement | undefined;

    // 拖拽控件的容器 
    #container: HTMLElement;

    // 最小尺寸
    #minSize = {
        w: 20,
        h: 20
    }

    // 切换此小部件是否关心maxHeight和maxWidth
    #constrainMax: boolean = false;
    // 最大尺寸
    #maxSize = {
        w: 0,
        h: 0
    }

    // 是否固定宽高比
    #fixedAspect: boolean = false;

    // 类型 横向 竖向 还是两个方向支持
    #mode: Mode = Mode.always;

    // 开始的尺寸
    #startSize: {
        w: any;
        h: any;
        pbw: any;
        pbh: any;
        mw: any;
        mh: any;
    } | undefined;

    // 是否允许修改 x y 尺寸
    #resizeX: boolean = true;
    #resizeY: boolean = true;

    // 鼠标起始点
    #startPoint: { x: number; y: number; } = { x: 0, y: 0 };
    // #domNode的起始位置
    #startPosition: { l: any; t: any; } | undefined;
    #isSizing: boolean = false;

    /**
     * 可调整大小的控件，可以拖拽改变宿主dom的大小
     * @param container 需要添加resizeHandle的容器
     * @param options ResizeHandle的配置项
     */
    constructor(container: HTMLElement, options?: ResizeHandleOptions) {
        this.#container = container;
        if (options) {
            this.#minSize = options.minSize || this.#minSize;
            this.#maxSize = options.maxSize || this.#maxSize;
            this.#constrainMax = options.constrainMax || this.#constrainMax;
            this.#fixedAspect = options.fixedAspect || this.#fixedAspect;
            this.#mode = options.mode || Mode.always;
        }
        this.#init();
    }

    #init() {
        this.#domNode = document.createElement('div');
        this.#domNode.className = 'resize-handle';
        if (this.#mode == Mode.horizontal) {
            this.#domNode.classList.add('resize-handle-horizontal');
        }
        else if (this.#mode == Mode.vertical) {
            this.#domNode.classList.add('resize-handle-vertical');
        }
        else {
            this.#domNode.classList.add('resize-handle-normal');
        }

        this.#container.appendChild(this.#domNode);

        this.#domNode.addEventListener('mousedown', (event) => this.#beginSizing(event));
    }

    #beginSizing(e: MouseEvent) {
        e.preventDefault();
        if (this.#isSizing) { return; }
        this.#startPoint = { x: e.clientX, y: e.clientY };

        let p = DomGeometry.getPosition(this.#container, true);
        this.#startPosition = { l: p.x, t: p.y };

        let padborder = DomGeometry.getPadBorderExtents(this.#container);
        let margin = DomGeometry.getMarginExtents(this.#container);

        this.#startSize = {
            w: this.#container.offsetWidth,
            h: this.#container.offsetHeight,
            //ResizeHelper.resize expects a bounding box of the
            //border box, so let's keep track of padding/border
            //width/height as well
            pbw: padborder.w, pbh: padborder.h,
            mw: margin.w, mh: margin.h
        };

        this.#isSizing = true;

        // 用于绑定和移除事件
        document.addEventListener('mouseup', (event) => this.#endSizing(event));
        document.addEventListener('mousemove', (event) => this.#updateSizing(event));
        e.stopPropagation();
    }

    #updateSizing(e: MouseEvent) {
        e.preventDefault();
        if (this.#isSizing) {
            let box = this.#getNewCoords(e, this.#startPosition);
            let w = box.w, h = box.h;
            if (w >= 0) {
                w = Math.max(w - this.#startSize?.pbw - this.#startSize?.mw, 0);
            }
            if (h >= 0) {
                h = Math.max(h - this.#startSize?.pbh - this.#startSize?.mh, 0);
            }


            if ((this.#mode & Mode.horizontal) == Mode.horizontal) { // 二进制比较 判断是否需要 横向拖动
                this.#container.style.width = w + 'px';
            }

            if ((this.#mode & Mode.vertical) == Mode.vertical) { // 二进制比较 判断是否需要 竖向拖动
                this.#container.style.height = h + 'px';
            }

        }
    }

    #endSizing(e: MouseEvent) {
        e.preventDefault();
        this.#isSizing = false;
        document.removeEventListener('mouseup', this.#endSizing);
        document.removeEventListener('mousemove', this.#updateSizing);
    }

    #getNewCoords(e: MouseEvent, _startPosition: any) {

        // On IE, if you move the mouse above/to the left of the object being resized,
        // sometimes clientX/Y aren't set, apparently.  Just ignore the event.
        try {
            if (!e.clientX || !e.clientY) { return false; }
        } catch (err) {
            // sometimes you get an exception accessing above fields...
            return false;
        }

        var dx = this.#startPoint?.x - e.clientX,
            dy = this.#startPoint?.y - e.clientY,
            newW = this.#startSize?.w - (this.#resizeX ? dx : 0),
            newH = this.#startSize?.h - (this.#resizeY ? dy : 0),
            r = this.#checkConstraints(newW, newH);

        _startPosition = (_startPosition || this.#startPosition);
        if (_startPosition && this.#resizeX) {
            // adjust x position for RtoL
            r.l = _startPosition.l + dx;
            if (r.w != newW) {
                r.l += (newW - r.w);
            }
            r.t = _startPosition.t;
        }

        r.w += this.#startSize?.pbw;
        r.h += this.#startSize?.pbh;

        return r; // Object
    }

    // 检查尺寸是否超出最大值和最小值
    #checkConstraints(newW: number, newH: number): any {
        // summary:
        //		filter through the various possible constaint possibilities.

        // minimum size check
        if (this.#minSize) {
            var tm = this.#minSize;
            if (newW < tm.w) {
                newW = tm.w;
            }
            if (newH < tm.h) {
                newH = tm.h;
            }
        }

        // maximum size check:
        if (this.#constrainMax && this.#maxSize) {
            var ms = this.#maxSize;
            if (newW > ms.w) {
                newW = ms.w;
            }
            if (newH > ms.h) {
                newH = ms.h;
            }
        }

        if (this.#fixedAspect) {
            var w = this.#startSize?.w, h = this.#startSize?.h,
                delta = w * newH - h * newW;
            if (delta < 0) {
                newW = newH * w / h;
            } else if (delta > 0) {
                newH = newW * h / w;
            }
        }

        return { w: newW, h: newH }; // Object
    }

}