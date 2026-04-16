import { useEffect, useMemo } from 'react';
import { useConfigStore } from '@/stores';
import { applyTheme, getTheme, type ThemeId } from '@/theme';

/**
 * useTheme - 主题 Hook
 *
 * 从全局 store 获取当前主题，并自动应用主题样式。
 *
 * @example
 * ```tsx
 * const { theme, setTheme, isDark } = useTheme();
 *
 * return (
 *   <div className={isDark ? 'dark' : 'light'}>
 *     内容
 *   </div>
 * );
 * ```
 */
export function useTheme() {
  // 从 useConfigStore 获取当前主题
  const themeId = useConfigStore((state) => state.theme) || 'idea' as ThemeId;

  // 获取主题配置
  const theme = useMemo(() => getTheme(themeId), [themeId]);

  // 判断是否暗色主题
  const isDark = theme.dark;

  // 应用主题（useEffect 确保在客户端执行）
  useEffect(() => {
    applyTheme(themeId);
  }, [themeId]);

  // 切换主题
  const setTheme = (newTheme: ThemeId) => {
    useConfigStore.getState().setTheme(newTheme);
  };

  return {
    /** 当前主题 ID */
    theme: themeId,
    /** 主题配置 */
    themeConfig: theme,
    /** 是否暗色主题 */
    isDark,
    /** 切换主题 */
    setTheme
  };
}

export default useTheme;
