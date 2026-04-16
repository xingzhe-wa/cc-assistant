import React, { useState } from 'react';
import type { MockSession } from '@/types/mock';
import { Button } from '../common';
import { useI18n } from '@/hooks/useI18n';
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
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSessions = sessions.filter(session => {
    // 过滤掉还未发生首次交互的会话
    if (!session.hasFirstMessage) return false;
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
            placeholder={t('session.searchPlaceholder')}
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
                <div className={styles.sessionTitle}>{session.title || t('session.newChat')}</div>
                <div className={styles.sessionMeta}>
                  <span>{session.qc} {t('session.questionTimes')}</span>
                  <span>·</span>
                  <span>{session.time}</span>
                </div>
              </div>
              <div className={styles.sessionActions}>
                <button
                  className={`${styles.actionBtn} ${session.fav ? styles.favOn : ''}`}
                  onClick={() => onFavoriteToggle(session.id, !session.fav)}
                  title={session.fav ? t('session.unfavorite') : t('session.favorite')}
                >
                  <span className="material-icons-round">
                    {session.fav ? 'star' : 'star_outline'}
                  </span>
                </button>
                <button
                  className={styles.actionBtn}
                  onClick={() => onDeleteSession(session.id)}
                  title={t('session.delete')}
                >
                  <span className="material-icons-round">delete</span>
                </button>
              </div>
            </div>
          ))}
          {filteredSessions.length === 0 && (
            <div className={styles.empty}>
              {mode === 'favorite' ? t('session.emptyFavorites') : t('session.emptyHistory')}
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
              {t('page.favorites')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
