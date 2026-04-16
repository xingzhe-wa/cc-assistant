import React, { useState, useCallback, useEffect } from 'react';
import { Icon } from '../common';
import { highlightCode } from '@/utils/highlight';
import { useI18n } from '@/hooks/useI18n';
import './CodeBlock.css';

export interface CodeBlockProps {
  /** 代码内容 */
  code: string;
  /** 编程语言 */
  language?: string;
  /** 是否显示复制按钮 */
  showCopyButton?: boolean;
  /** 最大高度，超过则滚动 */
  maxHeight?: string | number;
  /** 类名 */
  className?: string;
}

/**
 * CodeBlock - 代码块组件
 *
 * 特性：
 * - 语法高亮（使用 highlight.js）
 * - 一键复制代码
 * - 显示编程语言标签
 * - 支持长代码滚动
 *
 * @example
 * ```tsx
 * <CodeBlock
 *   code="const a = 1;"
 *   language="typescript"
 * />
 * ```
 */
export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = 'text',
  showCopyButton = true,
  maxHeight,
  className = ''
}) => {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const [highlightedCode, setHighlightedCode] = useState('');

  // 语法高亮
  useEffect(() => {
    const highlighted = highlightCode(code, language);
    setHighlightedCode(highlighted);
  }, [code, language]);

  // 复制到剪贴板
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, [code]);

  const containerStyle: React.CSSProperties = {};
  if (maxHeight) {
    containerStyle.maxHeight = typeof maxHeight === 'number'
      ? `${maxHeight}px`
      : maxHeight;
  }

  return (
    <div
      className={`cc-code-block ${className}`}
      style={containerStyle}
    >
      {/* 代码头部：语言标签 + 复制按钮 */}
      {(showCopyButton || language) && (
        <div className="cc-code-block__header">
          {language && (
            <span className="cc-code-block__language">{language}</span>
          )}
          {showCopyButton && (
            <button
              className="cc-code-block__copy"
              onClick={handleCopy}
              title={copied ? t('common.copied') : t('message.copyCode')}
              type="button"
            >
              <Icon name={copied ? 'check' : 'content_copy'} size="sm" />
            </button>
          )}
        </div>
      )}

      {/* 代码内容 */}
      <pre className="cc-code-block__content">
        <code
          className={`language-${language}`}
          dangerouslySetInnerHTML={{ __html: highlightedCode }}
        />
      </pre>
    </div>
  );
};

export default CodeBlock;
