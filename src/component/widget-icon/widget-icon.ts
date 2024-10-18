import { Component } from "../core/decorators";
import BaseWidget from "../earth/base-widget";
import { WidgetConfig } from "../../component/interface";
import { styleToString } from "@/base/utils/style";

// 组件的样式
import './widget-icon.scss';
// 组件的模板
import template from './widget-icon.html?raw';
import DomGeometry from "@/base/layout/DomGeometry";
import ResizeHandle from "@/base/layout/ResizeHandle";
import { mergeUrl } from "@/base/utils/loader";
import WidgetManager from "../widget-manager/widget-manager";
import { Popover } from "bootstrap";

/**
 * 组件管理器 图标
 * - 用于在组件管理器展示图标
 * - 该widget一般由widget-manager调用，不需要手动配置
 *
 * @label 主题切换
 * @tagName webgis-widget-icon
 * @inPanel false
 * @icon 不需要
 * @sample
 * 
 * @category Widget-Manager
 */
@Component({
    tagName: 'webgis-widget-icon',
    className: 'webgis-widget-icon',
    template: template,
    hasConfig: true
})
export default class WidgetIcon extends BaseWidget {
    #panel: any = null;
    #widget: BaseWidget | null = null;
    #isOpen: boolean = false;
    group: string = 'default'; // 所在组，同组互斥
    #icon: any;
    title: string = '';

    // 获取当前打开状态
    public get isOpen(): any {
        return this.#isOpen;
    }

    // 鼠标起始点
    #startPoint: { x: number; y: number; } = { x: 0, y: 0 };
    // panel的起始位置
    #startPosition: { x: number; y: number; w: number; h: number; } = {
        x: 0,
        y: 0,
        w: 0,
        h: 0
    };
    #observer: ResizeObserver; // 观察器

    constructor() {
        super();
        this.#observer = new ResizeObserver(this.resize.bind(this));
    }

    async onInit() {
        // 设置图标
        let icon: string = this.config.icon || 'bi-stack';
        let isImg: boolean = false;
        // 判断是否是bootstrap图标
        if (!icon.startsWith('bi-')) {
            icon = mergeUrl(icon);
            isImg = true;
        }

        this.$data = {
            icon,
            isImg
        }
        this.group = this.config.group || 'default';

        // 添加默认宽高
        this.config.position = Object.assign({
            width: '300px',
            height: '300px'
        }, this.config.position);

        this.#icon = this.querySelectorAll('.widget-icon')[0];
        new Popover(this.#icon);
    }

    // 初始化Panel
    initPanel() {
        this.#widget = this.createWidget(this.config);
        this.#panel = this.querySelectorAll('.widget-panel')[0];

        // 设置样式 只需要宽高
        const { width, height } = this.config.position;
        const styleString = styleToString({
            width,
            height
        });
        this.#panel.setAttribute('style', styleString);

        let content = this.#panel.querySelectorAll('.widget-content')[0];
        content.appendChild(this.#widget);

        // 添加移动事件
        let header = this.#panel.querySelectorAll('.widget-header')[0];
        header.addEventListener('mousedown', this.onMouseDown.bind(this));

        // 添加缩放
        new ResizeHandle(this.#panel);

        // 获取panel的初始位置
        const panelP = this.getPanelXY();

        // 计算初始位置
        this.setPosition(panelP.left, panelP.top);
    }


    // 根据图标所在位置计算panel的初始位置
    // 最终的位置只要left 和 top
    getPanelXY() {
        let position = this.config.panel?.position || {};
        // 容器position
        const p = DomGeometry.getPosition(this.parentElement as HTMLElement, true);
        // 图标的位置
        const icon = this.#icon;
        const iconP = DomGeometry.getPosition(icon, true);
        // panel的宽高
        const panelP = DomGeometry.getPosition(this.#panel, true);

        // 计算left 和top
        let left, top;
        if (position.left ?? false) {
            left = parseInt(position.left);
        }
        else if (position.right ?? false) {
            left = p.w - panelP.w - parseInt(position.right);
        }
        // 如果图标的位置超过容器宽度的一半，则在左侧展示panel，否则在右侧展示
        else if (iconP.x > p.w / 2) {
            left = iconP.x - panelP.w - 5;
        }
        // 默认位置
        else {
            left = iconP.x + iconP.w + 5;
        }

        // 计算高度
        if (position.top ?? false) {
            top = parseInt(position.top);
        }
        else if (position.bottom ?? false) {
            top = p.w - panelP.h - parseInt(position.bottom);
        }
        else {
            top = iconP.y;
        }

        return {
            left: left,
            top: top
        };
    }

    iconClick() {
        this.#isOpen ? this.closeWidget() : this.openWidget();
    }

    openWidget() {
        this.closeOthers();

        this.classList.add('webgis-widget-icon-open');
        if (!this.#widget) {
            this.initPanel();
        }
        this.#widget?.onOpen();
        this.#isOpen = true;
        // 添加容器变化事件
        this.#observer.observe(this.parentElement as HTMLElement);
    }

    closeWidget() {
        this.classList.remove('webgis-widget-icon-open');
        // 取消容器变化事件
        this.#observer.unobserve(this.parentElement as HTMLElement);
        this.#widget?.onClose();
        this.#isOpen = false;
    }

    // 关闭其他同组的widget
    closeOthers() {
        const others = this.parentNode?.querySelectorAll('webgis-widget-icon');
        others?.forEach((item: any) => {
            // 防止多次关闭
            if (this.group == item.group && item.isOpen === true) {
                item.closeWidget();
            }
        });
    }

    /**
     * 创建一个widget
     * @param {WidgetConfig}_config 
     * @returns {BaseWidget}
     */
    createWidget(_config: WidgetConfig): BaseWidget {
        if (!_config.tagName) {
            throw new Error(`tagName不能为空`);
        }
        let widget = document.createElement(_config.tagName) as BaseWidget;
        if (widget.startup) {
            widget.startup({
                viewer: this.viewer,
                globalConfig: this.globalConfig,
                config: _config.config,
                mapView: this.mapView,
                widgetConfig: _config
            });
        }
        else {
            const message = `没有找到tagName为${_config.tagName}的组件，请联系技术人员处理`;
            widget = document.createElement("base-error") as BaseWidget;
            widget.$data.message = message;
            console.error(message);
        }
        this.widget = widget;
        return widget;
    }

    // 销毁
    destroy() {
        this.#observer.disconnect();
        this.remove();
    }

    // 重置位置
    resize(entries: ResizeObserverEntry[]) {
        for (const entry of entries) {
            // 判断是否是组件管理器
            if (entry.target instanceof WidgetManager) {
                // 判断是否可见
                if (entry.contentBoxSize?.length > 0 &&
                    (entry.contentBoxSize[0].blockSize > 0 && entry.contentBoxSize[0].inlineSize > 0)
                ) {
                    this.#startPosition = DomGeometry.getPosition(this.#panel, true);
                    this.setPosition(this.#startPosition.x, this.#startPosition.y);
                }
            }
        }
    }

    onMouseDown(e: MouseEvent) {
        e.preventDefault();
        this.#panel.classList.add('panel-dragging');

        this.#startPoint = { x: e.clientX, y: e.clientY };
        this.#startPosition = DomGeometry.getPosition(this.#panel, true);

        // 用于绑定和移除事件
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);

        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('mouseup', this.onMouseUp);
    }

    onMouseMove(e: MouseEvent) {
        e.preventDefault();
        let dx = this.#startPoint.x - e.clientX;
        let dy = this.#startPoint.y - e.clientY;

        let x = this.#startPosition.x - dx;
        let y = this.#startPosition.y - dy;

        this.setPosition(x, y);
    }

    setPosition(x: number, y: number) {
        let p = this.checkConstraints(x, y);
        // 获取当前组件的相对位置
        let position = DomGeometry.getPosition(this, true);
        // 设置的时候需要减去图标所在的位置
        this.#panel.style.left = (p.x - position.x) + 'px';
        this.#panel.style.top = (p.y - position.y) + 'px';
    }

    onMouseUp(e: MouseEvent) {
        e.preventDefault();
        this.#panel.classList.remove('panel-dragging');
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);
    }

    // 检查约束条件
    checkConstraints(x: number, y: number) {
        // 容器范围
        const p = DomGeometry.getPosition(this.parentElement as HTMLElement, true);
        // 要保证panel留在容器范围内
        const mixX = p.x;
        const maxX = p.w - this.#startPosition.w + p.x;
        const mixY = p.y;
        const maxY = p.h - this.#startPosition.h + p.y;
        x = Math.max(mixX, Math.min(maxX, x));
        y = Math.max(mixY, Math.min(maxY, y));
        return { x: x, y: y };
    }

    //获取当前panel的位置和大小
    getPanelPosition() {
        return DomGeometry.getPosition(this.#panel, true);
    }

}
