import React from 'react';
import './ScrollArea.css';

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 滚动方向 */
  orientation?: 'vertical' | 'horizontal' | 'both';
  /** 是否显示滚动条 */
  showScrollbar?: boolean | 'auto' | 'always';
  /** 滚动条颜色主题 */
  scrollbarTheme?: 'light' | 'dark';
}

/**
 * ScrollArea - 自定义滚动区域组件
 *
 * 特性：
 * - 自定义滚动条样式，匹配 IDEA 风格
 * - 支持垂直/水平/双向滚动
 * - 支持多种滚动条显示模式
 *
 * @example
 * ```tsx
 * <ScrollArea className="h-64">
 *   <div>内容...</div>
 * </ScrollArea>
 * ```
 */
export const ScrollArea: React.FC<ScrollAreaProps> = ({
  children,
  className = '',
  orientation = 'vertical',
  showScrollbar = 'auto',
  scrollbarTheme = 'dark',
  ...props
}) => {
  const scrollAreaClass = [
    'cc-scroll-area',
    `cc-scroll-area--${orientation}`,
    `cc-scroll-area--scrollbar-${showScrollbar}`,
    `cc-scroll-area--theme-${scrollbarTheme}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={scrollAreaClass} {...props}>
      {children}
    </div>
  );
};

export default ScrollArea;
