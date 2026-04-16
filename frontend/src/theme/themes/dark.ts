import type { Theme } from '../types';

/**
 * 纯暗色主题
 *
 * 更深的暗色主题，适合长时间使用
 */
export const darkTheme: Theme = {
  id: 'dark',
  name: 'Dark',
  dark: true,
  variables: {
    /* 基础颜色 */
    '--bg': '#0a0a0a',
    '--sf': '#141414',
    '--el': '#1a1a1a',
    '--hov': '#252525',

    /* 强调色 */
    '--accent': '#bb86fc',
    '--accent-hover': '#9955e8',

    /* 状态色 */
    '--success': '#03dac6',
    '--error': '#cf6679',
    '--info': '#03a9f4',
    '--warning': '#ffb74d',

    /* 文本色 */
    '--fg': '#e0e0e0',
    '--fg-sec': '#a0a0a0',
    '--fg-mut': '#606060',
    '--fg-dis': '#404040',

    /* 边框色 */
    '--bor': '#2a2a2a',
    '--bor-lt': '#1f1f1f',

    /* 阴影 */
    '--shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.5)',
    '--shadow-md': '0 4px 6px rgba(0, 0, 0, 0.6)',
    '--shadow-lg': '0 10px 15px rgba(0, 0, 0, 0.7)',

    /* 圆角 */
    '--radius-sm': '4px',
    '--radius-md': '6px',
    '--radius-lg': '8px',
    '--radius-xl': '12px',

    /* 字体 */
    '--font-sans': "'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    '--font-mono': "'JetBrains Mono', 'Fira Code', Consolas, monospace"
  }
};

export default darkTheme;
