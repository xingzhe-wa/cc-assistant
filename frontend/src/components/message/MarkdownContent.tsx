import React, { useEffect, useRef, useCallback } from 'react';
import DOMPurify from 'dompurify';
import { renderMarkdown } from '@/utils/markdown';
import { useI18n } from '@/hooks/useI18n';
import styles from './MarkdownContent.module.css';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export const MarkdownContent: React.FC<MarkdownContentProps> = ({
  content,
  className = ''
}) => {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);

  // 处理复制按钮点击 - 使用事件委托
  const handleContainerClick = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const copyBtn = target.closest('.copy-code-btn');
    if (copyBtn) {
      const pre = copyBtn.closest('pre');
      const code = pre?.querySelector('code');
      if (code) {
        navigator.clipboard.writeText(code.textContent || '');
      }
    }
  }, []);

  useEffect(() => {
    // 使用事件委托处理复制按钮
    const container = containerRef.current;
    if (container) {
      container.addEventListener('click', handleContainerClick);
      return () => container.removeEventListener('click', handleContainerClick);
    }
  }, [handleContainerClick]);

  useEffect(() => {
    if (containerRef.current) {
      // 为代码块添加复制按钮
      const codeBlocks = containerRef.current.querySelectorAll('pre code');
      codeBlocks.forEach((block) => {
        const pre = block.parentElement;
        if (pre && !pre.querySelector('.copy-code-btn')) {
          const copyBtn = document.createElement('button');
          copyBtn.className = 'copy-code-btn';
          copyBtn.innerHTML = '<span class="material-icons-round">content_copy</span>';
          copyBtn.title = t('message.copyCode');
          pre.style.position = 'relative';
          pre.appendChild(copyBtn);
        }
      });
    }
  }, [content, t]);

  // 使用 DOMPurify 消毒 HTML，防止 XSS 攻击
  const sanitizedHtml = DOMPurify.sanitize(renderMarkdown(content), {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'code', 'pre', 'ul', 'ol', 'li',
                   'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'table',
                   'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div'],
    ALLOWED_ATTR: ['href', 'class', 'title', 'target', 'rel'],
  });

  return (
    <div
      ref={containerRef}
      className={`${styles.content} ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
};
