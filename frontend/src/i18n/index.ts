import { zhCN } from './locales/zh-CN';
import { enUS } from './locales/en-US';
import type { Locale, LocaleMessages } from './types';

// 导出类型
export type { Locale, LocaleMessages };

// 导出所有翻译消息

/**
 * i18n 国际化模块
 *
 * 提供多语言支持，支持的语言：
 * - zh-CN: 简体中文
 * - en-US: 英文
 * - ja-JP: 日文（待实现）
 * - ko-KR: 韩文（待实现）
 */

/** 所有翻译消息 */
export const messages: Record<Locale, LocaleMessages> = {
  'zh-CN': zhCN as LocaleMessages,
  'en-US': enUS as LocaleMessages,
  'ja-JP': zhCN as LocaleMessages, // 回退到中文
  'ko-KR': zhCN as LocaleMessages  // 回退到中文
};

/** 默认语言 */
export const defaultLocale: Locale = 'zh-CN';

/**
 * 获取翻译消息
 *
 * @param locale - 语言代码
 * @returns 翻译消息
 */
export function getMessages(locale: Locale): LocaleMessages {
  return messages[locale] || messages[defaultLocale];
}

/**
 * 翻译函数
 *
 * @param key - 翻译键（支持点号路径，如 'common.confirm'）
 * @param locale - 语言代码
 * @returns 翻译后的文本
 *
 * @example
 * ```ts
 * t('common.confirm', 'zh-CN') // '确定'
 * t('common.save', 'en-US')    // 'Save'
 * ```
 */
export function t(key: string, locale: Locale = defaultLocale): string {
  const msgs = getMessages(locale);
  const keys = key.split('.');
  let result: any = msgs;

  for (const k of keys) {
    if (result && typeof result === 'object' && k in result) {
      result = result[k];
    } else {
      console.warn(`[i18n] Missing translation: ${key}`);
      return key;
    }
  }

  return typeof result === 'string' ? result : key;
}

/**
 * 创建翻译函数（闭包版本）
 *
 * @param locale - 语言代码
 * @returns 翻译函数
 *
 * @example
 * ```ts
 * const translate = createTranslate('en-US');
 * translate('common.confirm') // 'Confirm'
 * ```
 */
export function createTranslate(locale: Locale) {
  return (key: string) => t(key, locale);
}
