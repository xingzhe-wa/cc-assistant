import React, { useState } from 'react';
import { Icon } from '../common';
import { useI18n } from '@/hooks/useI18n';
import styles from './ThinkingBlock.module.css';

interface ThinkingBlockProps {
  /** 思考内容 */
  content: string;
}

export const ThinkingBlock: React.FC<ThinkingBlockProps> = ({ content }) => {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={styles.container}>
      <button
        className={styles.header}
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <Icon
          name={expanded ? 'expand_less' : 'expand_more'}
          size="sm"
        />
        <span className={styles.label}>{t('message.thinking')}</span>
      </button>
      {expanded && (
        <div className={styles.content}>
          <pre className={styles.pre}>{content}</pre>
        </div>
      )}
    </div>
  );
};