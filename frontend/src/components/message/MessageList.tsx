import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { UserMessage } from './UserMessage';
import { AIMessage } from './AIMessage';
import { EmptyState } from './EmptyState';
import type { MockMessage } from '@/types/mock';
import styles from './MessageList.module.css';

export interface MessageListHandle {
  scrollToMessage: (messageId: string) => void;
  scrollToTop: () => void;
  scrollToBottom: () => void;
  isNearBottom: () => boolean;
}

interface MessageListProps {
  messages: MockMessage[];
  streaming?: boolean;
  streamingContent?: string;
  onCopy?: (id: string, content: string) => void;
  onQuote?: (id: string, content: string) => void;
  onRegenerate?: (id: string) => void;
  onRewind?: (id: string) => void;
  onQuickAction?: (text: string) => void;
  onScroll?: (scrollTop: number, scrollHeight: number, clientHeight: number) => void;
}

const BOTTOM_THRESHOLD = 80;

export const MessageList = forwardRef<MessageListHandle, MessageListProps>(({
  messages,
  streaming = false,
  streamingContent = '',
  onCopy,
  onQuote,
  onRegenerate,
  onRewind,
  onQuickAction,
  onScroll,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isAutoScrolling = useRef(false);

  const checkNearBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < BOTTOM_THRESHOLD;
  }, []);

  const scrollToMessage = useCallback((messageId: string) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      isAutoScrolling.current = true;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      requestAnimationFrame(() => { isAutoScrolling.current = false; });
    }
  }, []);

  const scrollToTop = useCallback(() => {
    const el = containerRef.current;
    if (el) {
      isAutoScrolling.current = true;
      el.scrollTo({ top: 0, behavior: 'smooth' });
      requestAnimationFrame(() => { isAutoScrolling.current = false; });
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    const el = containerRef.current;
    if (el) {
      isAutoScrolling.current = true;
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      requestAnimationFrame(() => { isAutoScrolling.current = false; });
    }
  }, []);

  useImperativeHandle(ref, () => ({
    scrollToMessage,
    scrollToTop,
    scrollToBottom,
    isNearBottom: checkNearBottom,
  }), [scrollToMessage, scrollToTop, scrollToBottom, checkNearBottom]);

  // Smart auto-scroll: only when already near bottom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (checkNearBottom()) {
      isAutoScrolling.current = true;
      el.scrollTop = el.scrollHeight;
      requestAnimationFrame(() => { isAutoScrolling.current = false; });
    }
  }, [messages, streaming, streamingContent, checkNearBottom]);

  const handleScroll = useCallback(() => {
    if (isAutoScrolling.current) return;
    const el = containerRef.current;
    if (!el) return;
    onScroll?.(el.scrollTop, el.scrollHeight, el.clientHeight);
  }, [onScroll]);

  if (messages.length === 0 && !streaming) {
    return (
      <div className={styles.empty}>
        <EmptyState onQuickAction={onQuickAction || (() => {})} />
      </div>
    );
  }

  return (
    <div ref={containerRef} className={styles.container} onScroll={handleScroll}>
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
});
