import React, { useState, useMemo } from 'react';
import { ConfirmDialog } from '@/components/common';
import { useI18n } from '@/hooks/useI18n';
import type { MockSession } from '@/types/mock';
import styles from './HistoryPage.module.css';

interface HistoryPageProps {
  mode: 'history' | 'favorite';
  sessions: MockSession[];
  onSessionClick: (session: MockSession) => void;
  onFavoriteToggle: (id: string, fav: boolean) => void;
  onDeleteSession: (id: string) => void;
  onClose: () => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  mode,
  sessions,
  onSessionClick,
  onFavoriteToggle,
  onDeleteSession,
  onClose
}) => {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ open: false, title: '', message: '', onConfirm: () => {} });

  const filteredSessions = useMemo(() => {
    let result = sessions;
    // 过滤掉还未发生首次交互的会话
    result = result.filter(s => s.hasFirstMessage);
    if (mode === 'favorite') {
      result = result.filter(s => s.fav);
    }
    if (searchQuery) {
      result = result.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return result;
  }, [sessions, mode, searchQuery]);

  const stats = useMemo(() => {
    const totalCount = sessions.length;
    const favoriteCount = sessions.filter(s => s.fav).length;
    const questionCount = sessions.reduce((sum, s) => sum + s.qc, 0);
    const latestSession = sessions[0];
    return { totalCount, favoriteCount, questionCount, latestSession };
  }, [sessions]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <h2>
            <span className="material-icons-round">
              {mode === 'history' ? 'history' : 'star'}
            </span>
            {mode === 'history' ? t('page.history') : t('page.favorites')}
          </h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <span className="material-icons-round">close</span>
          </button>
        </div>
        <div className={styles.search}>
          <span className="material-icons-round">search</span>
          <input
            type="text"
            placeholder={t('session.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className={styles.stats}>
          {mode === 'history' && (
            <>
              <span>
                <span className="material-icons-round">chat_bubble_outline</span>
                {t('session.sessionCount', String(stats.totalCount))}
              </span>
              <span>
                <span className="material-icons-round">help_outline</span>
                {t('session.questionCount', String(stats.questionCount))}
              </span>
              {stats.latestSession && (
                <span>
                  <span className="material-icons-round">schedule</span>
                  {t('session.latest')}{stats.latestSession.time}
                </span>
              )}
            </>
          )}
          {mode === 'favorite' && (
            <span>
              <span className="material-icons-round">star</span>
              {t('session.favoriteCount', String(stats.favoriteCount))}
            </span>
          )}
        </div>
      </header>

      <div className={styles.list}>
        {filteredSessions.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <span className="material-icons-round">
                {mode === 'history' ? 'search_off' : 'star_border'}
              </span>
            </div>
            <h3>{mode === 'history' ? t('session.emptyHistory') : t('session.emptyFavorites')}</h3>
            <p>
              {mode === 'history'
                ? t('session.searchPlaceholder')
                : t('session.favoriteHint')}
            </p>
          </div>
        ) : (
          filteredSessions.map((session) => (
            <div
              key={session.id}
              className={styles.item}
              onClick={() => onSessionClick(session)}
            >
              <div className={styles.itemIcon}>
                <span className="material-icons-round">chat_bubble_outline</span>
              </div>
              <div className={styles.itemBody}>
                <div className={styles.itemTitle}>
                  {session.fav && (
                    <span className="material-icons-round favMark">star</span>
                  )}
                  {session.title}
                </div>
                <div className={styles.itemPreview}>
                  {session.msgs[0]?.content || t('session.noMessage')}
                </div>
                <div className={styles.itemMeta}>
                  <span>
                    <span className="material-icons-round">schedule</span>
                    {session.time}
                  </span>
                  <span>
                    <span className="material-icons-round">help_outline</span>
                    {session.qc} {t('session.questionTimes')}
                  </span>
                </div>
              </div>
              <div className={styles.itemActions}>
                <button
                  className={`${styles.actionBtn} ${session.fav ? styles.favOn : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onFavoriteToggle(session.id, !session.fav);
                  }}
                  title={session.fav ? t('session.unfavorite') : t('session.favorite')}
                >
                  <span className="material-icons-round">
                    {session.fav ? 'star' : 'star_outline'}
                  </span>
                </button>
                <button
                  className={styles.actionBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: 实现重命名功能
                  }}
                  title={t('session.rename')}
                >
                  <span className="material-icons-round">edit</span>
                </button>
                <button
                  className={styles.actionBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: 实现导出功能
                  }}
                  title={t('session.exportSession')}
                >
                  <span className="material-icons-round">download</span>
                </button>
                <button
                  className={`${styles.actionBtn} ${styles.danger}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDialog({
                      open: true,
                      title: t('session.delete'),
                      message: t('session.deleteConfirm'),
                      onConfirm: () => onDeleteSession(session.id)
                    });
                  }}
                  title={t('session.delete')}
                >
                  <span className="material-icons-round">delete_outline</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 删除确认弹窗 */}
      <ConfirmDialog
        isOpen={confirmDialog.open}
        mode="confirm"
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant="danger"
        onConfirm={() => {
          confirmDialog.onConfirm();
          setConfirmDialog({ ...confirmDialog, open: false });
        }}
        onCancel={() => setConfirmDialog({ ...confirmDialog, open: false })}
      />
    </div>
  );
};
