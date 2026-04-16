/**
 * 高对比度主题
 *
 * WCAG AAA 对比度，适合视力障碍用户
 */
import type { Theme } from '../types';

export const highContrastTheme: Theme = {
  id: 'highContrast',
  name: 'High Contrast',
  dark: true,
  variables: {
    /* 基础颜色 */
    '--bg': '#000000',
    '--sf': '#0a0a0a',
    '--el': '#1a1a1a',
    '--hov': '#2a2a2a',

    /* 强调色 - 高可见性黄色 */
    '--accent': '#ffdc00',
    '--accent-hover': '#ffe566',

    /* 状态色 */
    '--success': '#00ff00',
    '--error': '#ff4444',
    '--info': '#00ccff',
    '--warning': '#ffaa00',

    /* 文本色 - 纯白 */
    '--fg': '#ffffff',
    '--fg-sec': '#cccccc',
    '--fg-mut': '#888888',
    '--fg-dis': '#666666',

    /* 边框色 */
    '--bor': '#ffffff',
    '--bor-lt': '#cccccc',

    /* 阴影 */
    '--shadow-sm': '0 1px 2px rgba(255, 255, 255, 0.1)',
    '--shadow-md': '0 4px 6px rgba(255, 255, 255, 0.15)',
    '--shadow-lg': '0 10px 15px rgba(255, 255, 255, 0.2)',

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

export default highContrastTheme;
