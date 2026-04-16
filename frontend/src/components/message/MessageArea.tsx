import React from 'react';
import { MessageList } from './MessageList';
import type { MockMessage } from '@/types/mock';
import styles from './MessageArea.module.css';

interface MessageAreaProps {
  messages: MockMessage[];
  streaming?: boolean;
  streamingContent?: string;
  onCopy?: (id: string, content: string) => void;
  onQuote?: (id: string, content: string) => void;
  onRegenerate?: (id: string) => void;
  onRewind?: (id: string) => void;
  onQuickAction?: (text: string) => void;
}

export const MessageArea: React.FC<MessageAreaProps> = (props) => {
  return (
    <div className={styles.container}>
      <MessageList {...props} />
    </div>
  );
};
