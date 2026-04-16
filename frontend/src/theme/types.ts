/**
 * theme 主题类型定义
 */

/** 支持的主题 */
export type ThemeId = 'idea' | 'dark' | 'light' | 'highContrast';

/** CSS 变量值 */
export type ThemeVariables = Record<string, string>;

/** 主题配置 */
export interface Theme {
  /** 主题 ID */
  id: ThemeId;
  /** 主题名称 */
  name: string;
  /** 是否暗色主题 */
  dark: boolean;
  /** CSS 变量 */
  variables: ThemeVariables;
}

/** 主题配置选项 */
export interface ThemeConfig {
  /** 当前主题 */
  theme: ThemeId;
  /** 是否跟随系统 */
  followSystem: boolean;
}