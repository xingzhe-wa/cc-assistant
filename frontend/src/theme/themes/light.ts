import type { Theme } from '../types';

/**
 * 亮色主题
 *
 * 适合白天使用
 */
export const lightTheme: Theme = {
  id: 'light',
  name: 'Light',
  dark: false,
  variables: {
    /* 基础颜色 */
    '--bg': '#ffffff',
    '--sf': '#f5f5f5',
    '--el': '#e8e8e8',
    '--hov': '#dddddd',

    /* 强调色 */
    '--accent': '#6200ee',
    '--accent-hover': '#7c4dff',

    /* 状态色 */
    '--success': '#4caf50',
    '--error': '#f44336',
    '--info': '#2196f3',
    '--warning': '#ff9800',

    /* 文本色 */
    '--fg': '#202124',
    '--fg-sec': '#5f6368',
    '--fg-mut': '#9aa0a6',
    '--fg-dis': '#bdc1c6',

    /* 边框色 */
    '--bor': '#dadce0',
    '--bor-lt': '#e8eaed',

    /* 阴影 */
    '--shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.1)',
    '--shadow-md': '0 4px 6px rgba(0, 0, 0, 0.12)',
    '--shadow-lg': '0 10px 15px rgba(0, 0, 0, 0.15)',

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

export default lightTheme;
