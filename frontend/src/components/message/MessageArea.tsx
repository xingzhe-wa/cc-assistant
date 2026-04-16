import React, { useRef, useState, useCallback } from 'react';
import { MessageList, type MessageListHandle } from './MessageList';
import { ScrollButtons } from './ScrollButtons';
import { MessageTimeline } from './MessageTimeline';
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
  const listRef = useRef<MessageListHandle>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showScrollUp, setShowScrollUp] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [buttonsVisible, setButtonsVisible] = useState(false);
  const [scrollHeight, setScrollHeight] = useState(0);
  const [activeUserMsgId, setActiveUserMsgId] = useState<string | null>(null);
  const [messagePositions, setMessagePositions] = useState<Array<{ id: string; content: string; offsetTop: number }>>([]);

  const handleScroll = useCallback((sTop: number, sHeight: number, cHeight: number) => {
    setScrollHeight(sHeight);

    const nearTop = sTop < 60;
    const nearBottom = sHeight - sTop - cHeight < 80;

    setShowScrollUp(!nearTop);
    setShowScrollDown(!nearBottom);

    // Show buttons and reset hide timer
    setButtonsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setButtonsVisible(false), 2000);

    // Find nearest user message to viewport center + collect offset positions
    const userMessages = props.messages.filter(m => m.role === 'user');
    const positions: Array<{ id: string; content: string; offsetTop: number }> = [];
    let nearestId: string | null = null;
    let nearestDist = Infinity;

    for (const msg of userMessages) {
      const el = document.getElementById(`msg-${msg.id}`);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      const parent = el.closest(`.${styles.container}`);
      if (!parent) continue;
      const parentRect = parent.getBoundingClientRect();
      const offsetTop = rect.top - parentRect.top;
      const msgCenter = offsetTop + rect.height / 2;
      positions.push({ id: msg.id, content: msg.content, offsetTop });

      const dist = Math.abs(msgCenter - cHeight / 2);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestId = msg.id;
      }
    }
    setMessagePositions(positions);
    setActiveUserMsgId(nearestId);
  }, [props.messages]);

  const handleNavigate = useCallback((messageId: string) => {
    listRef.current?.scrollToMessage(messageId);
  }, []);

  const handleScrollUp = useCallback(() => {
    listRef.current?.scrollToTop();
  }, []);

  const handleScrollDown = useCallback(() => {
    listRef.current?.scrollToBottom();
  }, []);

  return (
    <div className={styles.container}>
      <MessageList
        ref={listRef}
        {...props}
        onScroll={handleScroll}
      />
      <MessageTimeline
        messages={props.messages}
        activeMessageId={activeUserMsgId}
        onNavigate={handleNavigate}
        messagePositions={messagePositions}
        totalScrollableHeight={scrollHeight}
      />
      <ScrollButtons
        showUp={showScrollUp}
        showDown={showScrollDown}
        visible={buttonsVisible}
        onScrollUp={handleScrollUp}
        onScrollDown={handleScrollDown}
      />
    </div>
  );
};
