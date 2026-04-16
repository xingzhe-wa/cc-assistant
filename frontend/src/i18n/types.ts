/**
 * i18n 国际化类型定义
 */

/** 支持的语言 */
export type Locale = 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR';

/** 翻译键路径 */
export type TranslationKey = keyof typeof import('./locales/zh-CN');

/** 翻译消息结构 */
export interface LocaleMessages {
  // 通用
  common: {
    confirm: string;
    cancel: string;
    save: string;
    delete: string;
    edit: string;
    copy: string;
    copied: string;
    loading: string;
    search: string;
    clear: string;
    retry: string;
    close: string;
  };

  // 页面
  page: {
    chat: string;
    history: string;
    favorites: string;
    settings: string;
  };

  // 会话
  session: {
    newChat: string;
    rename: string;
    delete: string;
    favorite: string;
    unfavorite: string;
    deleteConfirm: string;
    restore: string;
  };

  // 消息
  message: {
    user: string;
    assistant: string;
    copy: string;
    quote: string;
    regenerate: string;
    rewind: string;
    thinking: string;
  };

  // 输入
  input: {
    placeholder: string;
    send: string;
    stop: string;
    enhance: string;
    context: string;
  };

  // 设置
  settings: {
    title: string;
    provider: string;
    model: string;
    agent: string;
    theme: string;
    language: string;
    stream: string;
    think: string;
  };

  // 提示
  toast: {
    copied: string;
    saved: string;
    deleted: string;
    error: string;
    success: string;
  };

  // 错误
  error: {
    network: string;
    unknown: string;
  };
}

/** i18n 配置 */
export interface I18nConfig {
  /** 当前语言 */
  locale: Locale;
  /** 回退语言 */
  fallbackLocale: Locale;
  /** 翻译消息 */
  messages: Record<Locale, Partial<LocaleMessages>>;
}
