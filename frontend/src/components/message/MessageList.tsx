import React, { useRef, useEffect } from 'react';
import { UserMessage } from './UserMessage';
import { AIMessage } from './AIMessage';
import { EmptyState } from './EmptyState';
import type { MockMessage } from '@/types/mock';
import styles from './MessageList.module.css';

interface MessageListProps {
  messages: MockMessage[];
  streaming?: boolean;
  streamingContent?: string;
  onCopy?: (id: string, content: string) => void;
  onQuote?: (id: string, content: string) => void;
  onRegenerate?: (id: string) => void;
  onRewind?: (id: string) => void;
  onQuickAction?: (text: string) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  streaming = false,
  streamingContent = '',
  onCopy,
  onQuote,
  onRegenerate,
  onRewind,
  onQuickAction
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, streaming, streamingContent]);

  if (messages.length === 0 && !streaming) {
    return (
      <div className={styles.empty}>
        <EmptyState onQuickAction={onQuickAction || (() => {})} />
      </div>
    );
  }

  return (
    <div ref={containerRef} className={styles.container}>
      {messages.map((message) => {
        if (message.role === 'user') {
          return (
            <UserMessage
              key={message.id}
              id={message.id}
              content={message.content}
              timestamp={message.time}
              onCopy={onCopy}
            />
          );
        }
        return (
          <AIMessage
            key={message.id}
            id={message.id}
            content={message.content}
            timestamp={message.time}
            thinking={message.thinking}
            onCopy={onCopy}
            onQuote={onQuote}
            onRegenerate={onRegenerate}
            onRewind={onRewind}
          />
        );
      })}
      {streaming && streamingContent && (
        <AIMessage
          id="streaming"
          content={streamingContent}
          streaming
        />
      )}
    </div>
  );
};
