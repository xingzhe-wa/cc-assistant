import React from 'react';
import { MarkdownContent } from './MarkdownContent';
import { Icon } from '../common';
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
  return (
    <div className={styles.container}>
      <div className={styles.avatar}>
        <span className="material-icons-round">smart_toy</span>
      </div>
      <div className={styles.body}>
        <div className={styles.header}>
          <span className={styles.time}>{timestamp || '00:00'}</span>
          {thinking && (
            <>
              <span className={styles.dot} />
              <span className={styles.thinkingBadge}>思考中</span>
            </>
          )}
        </div>
        <div className={`${styles.content} ${streaming ? styles.streaming : ''}`}>
          <MarkdownContent content={content} />
        </div>
        <div className={styles.footer}>
          <button
            className={styles.actionBtn}
            onClick={() => onCopy?.(id, content)}
            title="复制"
          >
            <Icon name="content_copy" />
            <span>复制</span>
          </button>
          <button
            className={styles.actionBtn}
            onClick={() => onQuote?.(id, content)}
            title="引用"
          >
            <Icon name="format_quote" />
            <span>引用</span>
          </button>
          <button
            className={styles.actionBtn}
            onClick={() => onRegenerate?.(id)}
            title="重新生成"
          >
            <Icon name="refresh" />
            <span>重新生成</span>
          </button>
          <button
            className={styles.actionBtn}
            onClick={() => onRewind?.(id)}
            title="回溯"
          >
            <Icon name="undo" />
            <span>回溯</span>
          </button>
        </div>
      </div>
    </div>
  );
};
