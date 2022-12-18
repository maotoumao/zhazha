interface IColors {
  text: string;
  activeKey: string;
  disabledKey: string;
  normalKey: string;
  background: string;
}
interface ISchema {
  /** 源名称 */
  name?: string;
  /** 主题 */
  theme?: {
    colors: IColors;
  };
  /** 键盘映射 */
  keymap: Record<
    string,
    {
      /** 展示样式 */
      display?: string;
      /** (相对)路径 */
      path: string;
    }
  >;
}
