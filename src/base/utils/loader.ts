/**
 * 用来加载各种文件
 * 
 * @category Util
 */
export class Loader {
    /**
     * 加载js文件
     * @param src 需要加载的js的地址
     * @param isModule 是否是ES6
     * @returns Promise<any>
     */
    static loadScript(src: string, isModule = false) {
        return new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.crossOrigin = 'anonymous';
            // script.async = false; // 保证js顺序执行
            script.onload = () => {
                script.remove();
                resolve();
            };
            script.onerror = () => {
                script.remove();
                reject(new Error(`Failed to load script ${src}`));
            };
            isModule && (script.type = 'module');
            script.src = src;
            document.head.append(script);
        });
    }

    /**
     * 加载css文件
     * @param href 
     * @returns Promise<any>
     */
    static loadCSS(href: string) {
        return new Promise<void>((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = href;
            link.onload = () => {
                resolve();
            };
            link.onerror = () => {
                reject(new Error(`Failed to load CSS ${href}`));
            };
            document.head.appendChild(link);
        });
    }

    /**
     * 加载json
     * @param url 
     * @returns Promise<any>
     */
    static async loadJSON(url: string): Promise<any> {
        const response = await fetch(url);
        return response.json();
    }

    /**
     * 按顺序加载资源
     * @param resources 
     */
    static async loadResourcesInOrder(resources: { type: string, url: string }[]): Promise<void> {
        for (const resource of resources) {
            if (resource.type === 'js') {
                await this.loadScript(resource.url);
            } else if (resource.type === 'module') {
                await this.loadScript(resource.url, true);
            } else if (resource.type === 'css') {
                await this.loadCSS(resource.url);
            }
        }
    }
}

/**
 * 组合url 判断url是否是完整路径 即http[s]开头，如果是则直接返回，如果不是则增加根路径
 * @param url 
 * @returns 
 * 
 * @category Util
 */
export function mergeUrl(url: string): string {
    if (isURL(url)) {
        return url;
    }
    else {
        let baseUrl = window.__WEBGIS_CESIUM_CONFIG__?.baseUrl || '';
        // 结尾补斜杠
        if (baseUrl && !baseUrl.endsWith('/')) {
            baseUrl = baseUrl + '/';
        }
        return baseUrl + url;
    }
}

/**
 * 判断是否为url
 * @param str 
 * @returns 
 * 
 * @category Util
 */
export function isURL(str: string): boolean {
    const urlPattern = /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})(:\d{2,5})?([/?#]\S*)?$/i;
    return urlPattern.test(str);
}