import React from 'react';
import type { MockSession } from '@/types/mock';
import styles from './TabBar.module.css';

interface TabBarProps {
  sessions: MockSession[];
  activeSessionId: string;
  onTabClick: (id: string) => void;
  onTabClose: (id: string) => void;
  onNewTab: () => void;
}

export const TabBar: React.FC<TabBarProps> = ({
  sessions,
  activeSessionId,
  onTabClick,
  onTabClose
}) => {
  return (
    <div className={styles.container}>
      <div className={styles.tabs}>
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`${styles.tab} ${session.id === activeSessionId ? styles.active : ''}`}
            onClick={() => onTabClick(session.id)}
            onDoubleClick={() => {
              // TODO: 重命名功能
            }}
          >
            <span className={styles.title}>
              {session.title || '新对话'}
            </span>
            {sessions.length > 1 && (
              <button
                className={styles.closeBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(session.id);
                }}
              >
                <span className="material-icons-round">close</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
