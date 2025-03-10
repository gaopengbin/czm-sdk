class Popover {
    triggerElement: HTMLElement;
    popoverElement: HTMLElement;
    isVisible: boolean;

    constructor(trigger: string | HTMLElement, popoverContent: string | HTMLElement | { content: string | HTMLElement, className?: string }) {
        this.triggerElement = typeof trigger === 'string' ? document.querySelector(trigger) as HTMLElement : trigger;
        
        // 检查并移除之前绑定的 popover
        if (this.triggerElement.dataset.popoverInstance) {
            const previousPopover = (window as any)[this.triggerElement.dataset.popoverInstance];
            if (previousPopover) {
                previousPopover.destroy();
            }
        }

        this.popoverElement = this.createPopoverElement(popoverContent);
        this.isVisible = false;

        // 保存实例引用
        const instanceId = `popover_${Date.now()}`;
        this.triggerElement.dataset.popoverInstance = instanceId;
        (window as any)[instanceId] = this;

        this.init();
    }

    createPopoverElement(content: string | HTMLElement | Node | { content: string | HTMLElement | Node, className?: string }): HTMLElement {
        const popover = document.createElement('div');
        popover.classList.add('my-popover');
        if (typeof content === 'string' || content instanceof HTMLElement || content instanceof Node) {
            if (typeof content === 'string') {
                popover.innerHTML = content;
            } else {
                popover.appendChild(content);
            }
        } else {
            if (typeof content.content === 'string') {
                popover.innerHTML = content.content;
            } else {
                popover.appendChild(content.content);
            }
            if (content.className) {
                popover.classList.add(content.className);
            }
        }
        document.body.appendChild(popover);
        return popover;
    }

    init() {
        this.triggerElement.addEventListener('click', (event) => {
            this.togglePopover();
        });
        document.addEventListener('click', (event) => this.handleDocumentClick(event));
    }

    togglePopover() {
        if (this.isVisible) {
            this.hidePopover();
        } else {
            this.showPopover();
        }
    }

    showPopover() {
        const rect = this.triggerElement.getBoundingClientRect();
        this.popoverElement.style.display = 'block';
        const popoverRect = this.popoverElement.getBoundingClientRect();
        let top, left;

        if (rect.bottom + popoverRect.height + 10 > window.innerHeight) {
            top = rect.top + window.scrollY - popoverRect.height - 10; /* 显示在元素上方 */
            this.popoverElement.classList.add('my-popover-top');
        } else {
            top = rect.bottom + window.scrollY + 10; /* 显示在元素下方 */
            this.popoverElement.classList.remove('my-popover-top');
        }

        left = rect.left + window.scrollX + (rect.width / 2) - (popoverRect.width / 2); /* 居中对齐 */

        // 检查是否超出屏幕边界
        if (left < 0) {
            left = 0;
        } else if (left + popoverRect.width > window.innerWidth) {
            left = window.innerWidth - popoverRect.width;
        }

        this.popoverElement.style.top = `${top}px`;
        this.popoverElement.style.left = `${left}px`;

        // 如果之前有箭头，先移除
        const oldArrow = this.popoverElement.querySelector('.my-popover-arrow');
        if (oldArrow) {
            oldArrow.remove();
        }

        // 调整箭头位置
        const arrow = document.createElement('div');
        arrow.className = 'my-popover-arrow';
        arrow.style.top = this.popoverElement.classList.contains('my-popover-top') ? 'auto' : '-10px';
        arrow.style.bottom = this.popoverElement.classList.contains('my-popover-top') ? '-10px' : 'auto';
        arrow.style.left = `${rect.left + window.scrollX + (rect.width / 2) - left}px`;
        arrow.style.transform = 'translateX(-50%)';
        arrow.style.borderWidth = this.popoverElement.classList.contains('my-popover-top') ? '10px 10px 0 10px' : '0 10px 10px 10px';
        arrow.style.borderColor = this.popoverElement.classList.contains('my-popover-top') ? '#007bff transparent transparent transparent' : 'transparent transparent #007bff transparent';
        this.popoverElement.appendChild(arrow);

        this.isVisible = true;
    }

    hidePopover() {
        this.popoverElement.style.display = 'none';
        this.isVisible = false;
        const arrow = this.popoverElement.querySelector('.popover-arrow');
        if (arrow) {
            arrow.remove();
        }
    }

    handleDocumentClick(event: MouseEvent) {
        if (this.isVisible && !this.popoverElement.contains(event.target as Node) && !this.triggerElement.contains(event.target as Node)) {
            this.hidePopover();
        }
    }

    destroy() {
        this.hidePopover();
        this.triggerElement.removeEventListener('click', () => this.togglePopover());
        document.removeEventListener('click', (event) => this.handleDocumentClick(event));
        this.popoverElement.remove();
        delete (window as any)[this.triggerElement.dataset.popoverInstance!];
        delete this.triggerElement.dataset.popoverInstance;
    }
}

export default Popover;
