import React from 'react';
import { MarkdownContent } from './MarkdownContent';
import { ThinkingBlock } from './ThinkingBlock';
import { Icon } from '../common';
import { useI18n } from '@/hooks/useI18n';
import styles from './AIMessage.module.css';

interface AIMessageProps {
  id: string;
  content: string;
  timestamp?: string;
  thinking?: string;
  streaming?: boolean;
  onCopy?: (id: string, content: string) => void;
  onQuote?: (id: string, content: string) => void;
  onRegenerate?: (id: string) => void;
  onRewind?: (id: string) => void;
}

export const AIMessage: React.FC<AIMessageProps> = ({
  id,
  content,
  timestamp,
  thinking,
  streaming = false,
  onCopy,
  onQuote,
  onRegenerate,
  onRewind
}) => {
  const { t } = useI18n();

  return (
    <div id={`msg-${id}`} className={styles.container}>
      <div className={styles.avatar}>
        <span className="material-icons-round">smart_toy</span>
      </div>
      <div className={styles.body}>
        <div className={styles.header}>
          <span className={styles.time}>{timestamp || '00:00'}</span>
        </div>
        {thinking && <ThinkingBlock content={thinking} />}
        <div className={`${styles.content} ${streaming ? styles.streaming : ''}`}>
          <MarkdownContent content={content} />
        </div>
        <div className={styles.footer}>
          <button
            className={styles.actionBtn}
            onClick={() => onCopy?.(id, content)}
            title={t('message.copy')}
          >
            <Icon name="content_copy" />
            <span>{t('message.copy')}</span>
          </button>
          <button
            className={styles.actionBtn}
            onClick={() => onQuote?.(id, content)}
            title={t('message.quote')}
          >
            <Icon name="format_quote" />
            <span>{t('message.quote')}</span>
          </button>
          <button
            className={styles.actionBtn}
            onClick={() => onRegenerate?.(id)}
            title={t('message.regenerate')}
          >
            <Icon name="refresh" />
            <span>{t('message.regenerate')}</span>
          </button>
          <button
            className={styles.actionBtn}
            onClick={() => onRewind?.(id)}
            title={t('message.rewind')}
          >
            <Icon name="undo" />
            <span>{t('message.rewind')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
