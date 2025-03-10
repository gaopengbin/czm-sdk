export class TreeSelect {
    private element: HTMLElement;
    private input: HTMLInputElement = document.createElement('input');
    dropdown: HTMLElement = document.createElement('div');
    treeData: any[] = [];
    private onSelectCallback: (item: any) => void;
    private onDropdownToggleCallback: (isOpen: boolean) => void;

    constructor(element: HTMLElement, onSelectCallback?: (item: any) => void, onDropdownToggleCallback?: (isOpen: boolean) => void) {
        this.element = element;
        this.onSelectCallback = onSelectCallback || (() => { });
        this.onDropdownToggleCallback = onDropdownToggleCallback || (() => { });
        this.createInput();
        this.createDropdown();
        this.addEventListeners();
        this.buildTree();
    }

    private createInput() {
        this.input = document.createElement('input');
        this.input.classList.add('form-control', 'form-control-sm');
        this.input.type = 'text';
        this.input.value = '根节点';
        this.element.appendChild(this.input);
    }

    private createDropdown() {
        this.dropdown = document.createElement('div');
        this.dropdown.classList.add('dropdown');
        this.dropdown.style.display = 'none';
        this.dropdown.style.position = 'absolute';
        this.dropdown.style.border = '1px solid #ccc';
        this.dropdown.style.backgroundColor = '#fff';
        this.element.appendChild(this.dropdown);
    }

    private addEventListeners() {
        this.input.addEventListener('click', () => {
            this.toggleDropdown();
        });
        document.addEventListener('click', (event) => {
            if (!this.element.contains(event.target as Node)) {
                this.hideDropdown();
            }
        });
    }

    private toggleDropdown() {
        if (this.dropdown.style.display === 'none') {
            this.showDropdown();
        } else {
            this.hideDropdown();
        }
    }

    private showDropdown() {
        this.dropdown.style.display = 'block';
        this.onDropdownToggleCallback(true);
    }

    private hideDropdown() {
        this.dropdown.style.display = 'none';
        this.onDropdownToggleCallback(false);
    }

    buildTree() {
        // 清空下拉菜单内容
        this.dropdown.innerHTML = '';
        // 构建树形菜单
        const ul = document.createElement('ul');
        const rootLi = document.createElement('li');
        const span = document.createElement('span');
        span.textContent = '根节点';
        rootLi.appendChild(span);
        rootLi.addEventListener('mouseover', (event) => {
            event.stopPropagation();
            // li.style.backgroundColor = '#f5f5f5';
            // li.style.color = '#007bff';
            rootLi.getElementsByTagName('span')[0].style.backgroundColor = '#f5f5f5';
            rootLi.getElementsByTagName('span')[0].style.color = '#007bff';
        });
        rootLi.addEventListener('mouseout', (event) => {
            event.stopPropagation();
            rootLi.getElementsByTagName('span')[0].style.backgroundColor = '';
            rootLi.getElementsByTagName('span')[0].style.color = '';
        });
        rootLi.addEventListener('click', () => this.handleSelect(null));
        ul.appendChild(rootLi);
        this.treeData.forEach(item => {
            if (item.children) {
                const li = this.createTreeNode(item);
                ul.appendChild(li);
            }
        });
        this.dropdown.appendChild(ul);
    }

    private createTreeNode(item: any): HTMLLIElement {
        const li = document.createElement('li');
        const span = document.createElement('span');
        span.textContent = item.name;
        li.appendChild(span);
        li.addEventListener('click', (event) => {
            event.stopPropagation();
            this.handleSelect(item);
        });
        li.addEventListener('mouseover', (event) => {
            event.stopPropagation();
            // li.style.backgroundColor = '#f5f5f5';
            // li.style.color = '#007bff';
            li.getElementsByTagName('span')[0].style.backgroundColor = '#f5f5f5';
            li.getElementsByTagName('span')[0].style.color = '#007bff';
        });
        li.addEventListener('mouseout', (event) => {
            event.stopPropagation();
            li.getElementsByTagName('span')[0].style.backgroundColor = '';
            li.getElementsByTagName('span')[0].style.color = '';
        });
        if (item.children) {
            const ul = document.createElement('ul');
            item.children.forEach((child: any) => {
                if (child.children) {
                    const childLi = this.createTreeNode(child);
                    ul.appendChild(childLi);
                }
            });
            li.appendChild(ul);
        }
        return li;
    }

    private handleSelect(item: any) {
        if (item) {
            this.input.value = item.name;
        } else {
            this.input.value = '根节点';
        }
        if (this.onSelectCallback) {
            this.onSelectCallback(item);
        }
        this.hideDropdown();
    }

    public updateTree(treeData: any[]) {
        this.treeData = treeData;
        this.buildTree();
    }
}