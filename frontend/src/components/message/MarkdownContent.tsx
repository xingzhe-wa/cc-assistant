import React, { useEffect, useRef } from 'react';
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

  useEffect(() => {
    if (containerRef.current) {
      // 处理代码块复制功能
      const codeBlocks = containerRef.current.querySelectorAll('pre code');
      codeBlocks.forEach((block) => {
        const pre = block.parentElement;
        if (pre && !pre.querySelector('.copy-code-btn')) {
          const copyBtn = document.createElement('button');
          copyBtn.className = 'copy-code-btn';
          copyBtn.innerHTML = '<span class="material-icons-round">content_copy</span>';
          copyBtn.title = t('message.copyCode');
          copyBtn.onclick = () => {
            const code = block.textContent || '';
            navigator.clipboard.writeText(code);
          };
          pre.style.position = 'relative';
          pre.appendChild(copyBtn);
        }
      });
    }
  }, [content, t]);

  return (
    <div
      ref={containerRef}
      className={`${styles.content} ${className}`}
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  );
};
