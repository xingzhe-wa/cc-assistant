import React from 'react';
import { Icon } from '../common';
import { useI18n } from '@/hooks/useI18n';
import styles from './UserMessage.module.css';

interface UserMessageProps {
  id: string;
  content: string;
  timestamp?: string;
  onCopy?: (id: string, content: string) => void;
}

export const UserMessage: React.FC<UserMessageProps> = ({
  id,
  content,
  onCopy
}) => {
  const { t } = useI18n();

  return (
    <div id={`msg-${id}`} className={styles.container}>
      <div className={styles.bubble}>
        <pre className={styles.content}>{content}</pre>
        <button
          className={styles.copyBtn}
          onClick={() => onCopy?.(id, content)}
          title={t('message.copy')}
        >
          <Icon name="content_copy" />
        </button>
      </div>
    </div>
  );
};
