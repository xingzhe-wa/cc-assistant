import React, { useState } from 'react';
import type { MockSession } from '@/types/mock';
import { Button } from '../common';
import styles from './HistoryBar.module.css';

interface HistoryBarProps {
  isOpen: boolean;
  mode: 'history' | 'favorite';
  sessions: MockSession[];
  onSearchChange: (query: string) => void;
  onSessionClick: (session: MockSession) => void;
  onFavoriteToggle: (id: string, fav: boolean) => void;
  onDeleteSession: (id: string) => void;
  onModeSwitch: () => void;
  onClose: () => void;
}

export const HistoryBar: React.FC<HistoryBarProps> = ({
  isOpen,
  mode,
  sessions,
  onSearchChange,
  onSessionClick,
  onFavoriteToggle,
  onDeleteSession,
  onModeSwitch
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSessions = sessions.filter(session => {
    if (mode === 'favorite' && !session.fav) return false;
    if (searchQuery && !session.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className={`${styles.historyBar} ${isOpen ? styles.open : ''}`}>
      <div className={styles.inner}>
        <div className={styles.searchBox}>
          <span className="material-icons-round">search</span>
          <input
            type="text"
            placeholder="搜索会话..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              onSearchChange(e.target.value);
            }}
          />
        </div>
        <div className={styles.sessionList}>
          {filteredSessions.map((session) => (
            <div key={session.id} className={styles.sessionItem}>
              <div
                className={styles.sessionContent}
                onClick={() => onSessionClick(session)}
              >
                <div className={styles.sessionTitle}>{session.title || '新对话'}</div>
                <div className={styles.sessionMeta}>
                  <span>{session.qc} 条消息</span>
                  <span>·</span>
                  <span>{session.time}</span>
                </div>
              </div>
              <div className={styles.sessionActions}>
                <button
                  className={`${styles.actionBtn} ${session.fav ? styles.favOn : ''}`}
                  onClick={() => onFavoriteToggle(session.id, !session.fav)}
                  title={session.fav ? '取消收藏' : '收藏'}
                >
                  <span className="material-icons-round">
                    {session.fav ? 'star' : 'star_outline'}
                  </span>
                </button>
                <button
                  className={styles.actionBtn}
                  onClick={() => onDeleteSession(session.id)}
                  title="删除"
                >
                  <span className="material-icons-round">delete</span>
                </button>
              </div>
            </div>
          ))}
          {filteredSessions.length === 0 && (
            <div className={styles.empty}>
              {mode === 'favorite' ? '暂无收藏会话' : '暂无会话记录'}
            </div>
          )}
        </div>
        {mode === 'history' && sessions.some(s => s.fav) && (
          <div className={styles.footer}>
            <Button
              variant="ghost"
              size="sm"
              icon="star"
              onClick={onModeSwitch}
            >
              收藏会话
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
