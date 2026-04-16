import { useMemo } from 'react';
import type { MockMessage } from '@/types/mock';
import styles from './MessageTimeline.module.css';

interface MessagePosition {
  id: string;
  content: string;
  offsetTop: number;
}

interface MessageTimelineProps {
  messages: MockMessage[];
  activeMessageId: string | null;
  onNavigate: (messageId: string) => void;
  messagePositions: MessagePosition[];
  totalScrollableHeight: number;
}

export const MessageTimeline: React.FC<MessageTimelineProps> = ({
  messages,
  activeMessageId,
  onNavigate,
  messagePositions,
  totalScrollableHeight,
}) => {
  const userPositions = useMemo(
    () => messagePositions.filter(p => messages.find(m => m.id === p.id && m.role === 'user')),
    [messagePositions, messages]
  );

  if (userPositions.length <= 1) return null;

  // Position nodes as percentage of total scrollable height
  const nodePositions = useMemo(() => {
    if (totalScrollableHeight === 0) return [];
    return userPositions.map((pos) => ({
      id: pos.id,
      content: pos.content.slice(0, 30),
      percent: (pos.offsetTop / totalScrollableHeight) * 100,
    }));
  }, [userPositions, totalScrollableHeight]);

  return (
    <div className={styles.timeline}>
      <div className={styles.track}>
        {nodePositions.map((node) => (
          <div
            key={node.id}
            className={`${styles.node} ${node.id === activeMessageId ? styles.active : ''}`}
            style={{ top: `${node.percent}%` }}
            onClick={() => onNavigate(node.id)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onNavigate(node.id); }}
            tabIndex={0}
            role="button"
            aria-label={`Jump to: ${node.content}`}
          >
            <div className={styles.tooltip}>{node.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
