/**
 * 页面类型定义
 */

export type PageType = 'chat' | 'history' | 'favorite' | 'settings';

export interface PageConfig {
  type: PageType;
  title: string;
  icon: string;
}
