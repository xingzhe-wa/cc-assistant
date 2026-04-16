import type { Theme } from '../types';

/**
 * IDEA 默认主题（暗色）
 *
 * 匹配 IntelliJ IDEA 默认暗色主题
 */
export const ideaTheme: Theme = {
  id: 'idea',
  name: 'IDEA Dark',
  dark: true,
  variables: {
    /* 基础颜色 */
    '--bg': '#111214',
    '--sf': '#17181d',
    '--el': '#1e2028',
    '--hov': '#272933',

    /* 强调色 */
    '--accent': '#c9873a',
    '--accent-hover': '#daa04e',

    /* 状态色 */
    '--success': '#50b85e',
    '--error': '#d95555',
    '--info': '#4db8cc',
    '--warning': '#d9a055',

    /* 文本色 */
    '--fg': '#d0d1d8',
    '--fg-sec': '#87899a',
    '--fg-mut': '#494b5a',
    '--fg-dis': '#31333d',

    /* 边框色 */
    '--bor': '#23252e',
    '--bor-lt': '#1b1d24',

    /* 阴影 */
    '--shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.3)',
    '--shadow-md': '0 4px 6px rgba(0, 0, 0, 0.4)',
    '--shadow-lg': '0 10px 15px rgba(0, 0, 0, 0.5)',

    /* 圆角 */
    '--radius-sm': '3px',
    '--radius-md': '5px',
    '--radius-lg': '7px',
    '--radius-xl': '10px',

    /* 字体 */
    '--font-sans': "'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    '--font-mono': "'JetBrains Mono', 'Fira Code', Consolas, monospace"
  }
};

export default ideaTheme;
