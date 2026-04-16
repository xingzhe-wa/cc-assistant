import { useMemo } from 'react';
import { useConfigStore } from '@/stores';
import { t, createTranslate, type Locale } from '@/i18n';

/**
 * useI18n - 国际化 Hook
 *
 * 从全局 store 获取当前语言，返回翻译函数。
 *
 * @example
 * ```tsx
 * const { t, locale } = useI18n();
 *
 * return <button>{t('common.confirm')}</button>;
 * ```
 */
export function useI18n() {
  // 从 useConfigStore 获取当前语言
  const language = useConfigStore((state) => state.language) || 'zh-CN' as Locale;

  // 创建翻译函数（使用 useMemo 避免重复创建）
  const translate = useMemo(() => createTranslate(language), [language]);

  return {
    /** 翻译函数 */
    t: translate,
    /** 当前语言 */
    locale: language,
    /** 直接使用 t 函数（便捷访问） */
    T: t
  };
}

export default useI18n;
