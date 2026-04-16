import { ideaTheme } from './themes/idea';
import { darkTheme } from './themes/dark';
import { lightTheme } from './themes/light';
import type { Theme, ThemeId, ThemeVariables, ThemeConfig } from './types';

// 导出类型
export type { Theme, ThemeId, ThemeVariables, ThemeConfig };

/**
 * theme 主题模块
 *
 * 提供主题切换功能，支持的主题：
 * - idea: IDEA 默认暗色主题
 * - dark: 纯暗色主题
 * - light: 亮色主题
 * - highContrast: 高对比度主题（待实现）
 */

/** 所有主题 */
export const themes: Record<ThemeId, Theme> = {
  idea: ideaTheme,
  dark: darkTheme,
  light: lightTheme,
  highContrast: ideaTheme // 回退到 IDEA 主题
};

/** 默认主题 */
export const defaultTheme: ThemeId = 'idea';

/**
 * 获取主题
 *
 * @param themeId - 主题 ID
 * @returns 主题配置
 */
export function getTheme(themeId: ThemeId): Theme {
  return themes[themeId] || themes[defaultTheme];
}

/**
 * 应用主题
 *
 * 将主题 CSS 变量应用到 document.documentElement
 *
 * @param themeId - 主题 ID
 */
export function applyTheme(themeId: ThemeId): void {
  const theme = getTheme(themeId);
  const root = document.documentElement;

  // 设置 CSS 变量
  Object.entries(theme.variables).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  // 设置 data-theme 属性
  root.setAttribute('data-theme', themeId);
  root.setAttribute('data-dark', String(theme.dark));
}

/**
 * 移除主题
 *
 * 清除所有主题 CSS 变量
 */
export function removeTheme(): void {
  const root = document.documentElement;
  root.removeAttribute('data-theme');
  root.removeAttribute('data-dark');

  // 清除 CSS 变量（可选）
  Object.keys(themes[defaultTheme].variables).forEach((key) => {
    root.style.removeProperty(key);
  });
}

/**
 * 创建主题转换函数
 *
 * @param initialTheme - 初始主题
 * @returns 主题转换函数
 *
 * @example
 * ```ts
 * const switchTheme = createThemeSwitcher('idea');
 * switchTheme('dark');  // 切换到暗色主题
 * ```
 */
export function createThemeSwitcher(initialTheme: ThemeId = defaultTheme) {
  let currentTheme = initialTheme;

  return {
    /** 切换主题 */
    switch: (themeId: ThemeId) => {
      currentTheme = themeId;
      applyTheme(themeId);
    },
    /** 获取当前主题 */
    getCurrent: () => currentTheme,
    /** 初始化主题 */
    init: (themeId?: ThemeId) => {
      currentTheme = themeId || initialTheme;
      applyTheme(currentTheme);
    }
  };
}
