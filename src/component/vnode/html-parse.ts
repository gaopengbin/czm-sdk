// 用于解析模板字符串并转换成AST(抽象语法树)

// 空元素（empty element） 
import lookup from 'void-elements';
/**
 * 标签正则
 */
const tagRE = /<[a-zA-Z0-9\-\!\/](?:"[^"]*"|'[^']*'|[^'">])*>/g;// 跨行注释有错误
const whitespaceRE = /^\s*$/;
const attrRE = /\s([^'"/\s><]+?)[\s/>]|([^\s=]+)=\s?(".*?"|'.*?')/g;
const commentRE = /<!--[\s\S]*?-->/g; //  注释


/**
 * 抽象语法树节点
 * 
 * @category Widget-Base
 */
export interface ASTNode {
    type: string,
    name?: string,
    voidElement?: boolean,
    attrs?: any,
    children?: ASTNode[],
    content?: string
}

/**
 * 解析标签
 * @param tag 
 * @returns 
 */
const parseTag = (tag: string) => {
    const res: ASTNode = {
        type: 'tag',
        name: '',
        voidElement: false,
        attrs: {} as any,
        children: [],
    }

    const tagMatch = tag.match(/<\/?([^\s]+?)[/\s>]/);
    if (tagMatch) {
        res.name = tagMatch[1];
        if (
            lookup[tagMatch[1]] ||
            tag.charAt(tag.length - 2) === '/'
        ) {
            res.voidElement = true;
        }

        // 注释标记
        if (res.name.startsWith('!--')) {
            const endIndex = tag.indexOf('-->');
            return {
                type: 'comment',
                comment: endIndex !== -1 ? tag.slice(4, endIndex) : '',
            }
        }
    }

    const reg = new RegExp(attrRE);
    let result = null;
    for (; ;) {
        result = reg.exec(tag);

        if (result === null) {
            break;
        }

        if (!result[0].trim()) {
            continue;
        }

        if (result[1]) {
            const attr = result[1].trim();
            let arr = [attr, ''];

            if (attr.indexOf('=') > -1) {
                arr = attr.split('=');
            }

            res.attrs[arr[0]] = arr[1];
            reg.lastIndex--;
        } else if (result[2]) {
            res.attrs[result[2]] = result[3].trim().substring(1, result[3].length - 1);
        }
    }

    return res;
}



// 用于快速查找组件的重复使用的obj
const empty = Object.create(null);

/**
 * 解析字符串模板
 * @param html html字符串模板
 * @param options 参数
 * @returns 
 * 
 * @category VNode
 */
export const parseHtml = (html: string, options: any = {}): ASTNode[] => {
    options || (options = {});
    options.components || (options.components = empty);
    const result: ASTNode[] = [];
    const arr: { children: any; }[] = [];
    let current: any;
    let level = -1;
    let inComponent = false;

    html = html.replace(commentRE, ''); // 去除注释
    html = html.replace(/\r?\n/g, ' '); // 将换行替换成空格

    // 在顶层处理文本
    if (html.indexOf('<') !== 0) {
        var end = html.indexOf('<')
        result.push({
            type: 'text',
            content: end === -1 ? html : html.substring(0, end),
        })
    }

    html.replace(tagRE, (tag: string, index: number) => {
        if (inComponent) {
            if (tag !== '</' + current.name + '>') {
                return '';
            } else {
                inComponent = false;
            }
        }
        const isOpen = tag.charAt(1) !== '/';
        const isComment = tag.startsWith('<!--');
        const start = index + tag.length;
        const nextChar = html.charAt(start);
        let parent;

        if (isComment) {
            const comment = parseTag(tag)

            // if we're at root, push new base node
            if (level < 0) {
                result.push(comment)
                return ''
            }
            parent = arr[level]
            parent.children.push(comment)
            return ''
        }

        if (isOpen) {
            level++

            current = parseTag(tag)
            if (current.type === 'tag' && options.components[current.name]) {
                current.type = 'component'
                inComponent = true
            }

            if (
                !current.voidElement &&
                !inComponent &&
                nextChar &&
                nextChar !== '<'
            ) {
                current.children.push({
                    type: 'text',
                    content: html.slice(start, html.indexOf('<', start)),
                })
            }

            // if we're at root, push new base node
            if (level === 0) {
                result.push(current)
            }

            parent = arr[level - 1]

            if (parent) {
                parent.children.push(current)
            }

            arr[level] = current
        }

        if (!isOpen || current.voidElement) {
            if (
                level > -1 &&
                (current.voidElement || current.name === tag.slice(2, -1))
            ) {
                level--
                // move current up a level to match the end tag
                current = level === -1 ? result : arr[level]
            }
            if (!inComponent && nextChar !== '<' && nextChar) {
                // trailing text node
                // if we're at the root, push a base text node. otherwise add as
                // a child to the current node.
                parent = level === -1 ? result : arr[level].children

                // calculate correct end of the content slice in case there's
                // no tag after the text node.
                const end = html.indexOf('<', start)
                let content = html.slice(start, end === -1 ? undefined : end)
                // if a node is nothing but whitespace, collapse it as the spec states:
                // https://www.w3.org/TR/html4/struct/text.html#h-9.1
                if (whitespaceRE.test(content)) {
                    content = ' '
                }
                // don't add whitespace-only text nodes if they would be trailing text nodes
                // or if they would be leading whitespace-only text nodes:
                //  * end > -1 indicates this is not a trailing text node
                //  * leading node is when level is -1 and parent has length 0
                if ((end > -1 && level + parent.length >= 0) || content !== ' ') {
                    parent.push({
                        type: 'text',
                        content: content,
                    })
                }
            }
        }
        return '';
    })

    return result;
}