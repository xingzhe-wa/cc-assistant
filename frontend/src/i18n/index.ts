import { zhCN } from './locales/zh-CN';
import { enUS } from './locales/en-US';
import { jaJP } from './locales/ja-JP';
import { koKR } from './locales/ko-KR';
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
  'ja-JP': jaJP as LocaleMessages,
  'ko-KR': koKR as LocaleMessages
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
 * @param params - 可选参数，用于插值
 * @returns 翻译后的文本
 *
 * @example
 * ```ts
 * t('common.confirm', 'zh-CN') // '确定'
 * t('common.save', 'en-US')    // 'Save'
 * t('provider.deleteConfirm', 'zh-CN', 'MyProvider') // '确定删除供应商 "MyProvider" 吗？'
 * ```
 */
export function t(key: string, locale: Locale = defaultLocale, ...params: string[]): string {
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

  if (typeof result !== 'string') return key;

  // 插值：替换 {name}, {0}, {1} 等占位符
  return params.reduce((str, param, index) => {
    return str
      .replace(new RegExp(`\\{${index}\\}`, 'g'), param)
      .replace(new RegExp(`\\{${index}=\\w+\\}`, 'g'), param);
  }, result);
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
 * translate('provider.deleteConfirm', 'MyProvider') // 'Are you sure you want to delete provider "MyProvider"?'
 * ```
 */
export function createTranslate(locale: Locale) {
  return (key: string, ...params: string[]) => t(key, locale, ...params);
}
