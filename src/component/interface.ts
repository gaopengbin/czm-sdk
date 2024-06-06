/**
 * widget创建的基本参数
 * 
 * @category Widget-Manager
 */
export interface WidgetConfig {
    /**
     * 别名
     */
    label?: string;
    /**
     * 组件的标签名称
     */
    tagName: string;
    /**
     * 定位参数：左、上、下、右、宽和高
     * 默认为 left=0, top=0, width=300, height=300
     * 如果使用Panel，则为图标的定位和Panel的宽高
     */
    position: {
        left?: number;
        top?: number;
        right?: number;
        bottom?: number;
        width?: number;
        height?: number;
    },
    /**
     * 是否使用Panel，默认为false
     */
    inPanel?: boolean;
    /**
     * 图标，默认指向 icons/default.png
     */
    icon?: string;

    /**
     * 可选。对象或url。如果是object，则表示widget的配置对象；
     * 如果是url，则表示配置文件的位置。
     * 如果未设置，框架将检查“hasConfig”属性以决定小部件配置。
     */
    config: any;
}