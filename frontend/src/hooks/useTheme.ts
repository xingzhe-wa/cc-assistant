import { useEffect, useMemo } from 'react';
import { useChatStore } from '@/stores';
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
  // 从全局 store 获取当前主题
  // 注意：需要确保 chatStore 有 theme 字段
  const themeId = useChatStore((state) => (state as any).theme) || 'idea' as ThemeId;

  // 获取主题配置
  const theme = useMemo(() => getTheme(themeId), [themeId]);

  // 判断是否暗色主题
  const isDark = theme.dark;

  // 应用主题（useEffect 确保在客户端执行）
  useEffect(() => {
    applyTheme(themeId);
  }, [themeId]);

  // 切换主题（需要 store 支持）
  const setTheme = (newTheme: ThemeId) => {
    const store = useChatStore.getState() as any;
    if (store.setTheme) {
      store.setTheme(newTheme);
    }
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
