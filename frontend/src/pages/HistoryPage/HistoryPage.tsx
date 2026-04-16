import React, { useState, useMemo } from 'react';
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
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSessions = useMemo(() => {
    let result = sessions;
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
            {mode === 'history' ? '历史会话' : '收藏会话'}
          </h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <span className="material-icons-round">close</span>
          </button>
        </div>
        <div className={styles.search}>
          <span className="material-icons-round">search</span>
          <input
            type="text"
            placeholder={`搜索${mode === 'history' ? '会话' : '收藏'}名称...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className={styles.stats}>
          {mode === 'history' && (
            <>
              <span>
                <span className="material-icons-round">chat_bubble_outline</span>
                共 {stats.totalCount} 个会话
              </span>
              <span>
                <span className="material-icons-round">help_outline</span>
                共 {stats.questionCount} 次提问
              </span>
              {stats.latestSession && (
                <span>
                  <span className="material-icons-round">schedule</span>
                  最近：{stats.latestSession.time}
                </span>
              )}
            </>
          )}
          {mode === 'favorite' && (
            <span>
              <span className="material-icons-round">star</span>
              共 {stats.favoriteCount} 个收藏
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
            <h3>未找到{mode === 'history' ? '匹配的会话' : '收藏会话'}</h3>
            <p>
              {mode === 'history'
                ? '请尝试其他搜索关键词'
                : '在历史会话中点击星标可添加收藏'}
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
                  {session.msgs[0]?.content || '暂无消息'}
                </div>
                <div className={styles.itemMeta}>
                  <span>
                    <span className="material-icons-round">schedule</span>
                    {session.time}
                  </span>
                  <span>
                    <span className="material-icons-round">help_outline</span>
                    {session.qc} 次提问
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
                  title={session.fav ? '取消收藏' : '收藏'}
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
                  title="重命名"
                >
                  <span className="material-icons-round">edit</span>
                </button>
                <button
                  className={styles.actionBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: 实现导出功能
                  }}
                  title="导出"
                >
                  <span className="material-icons-round">download</span>
                </button>
                <button
                  className={`${styles.actionBtn} ${styles.danger}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`确定删除会话 "${session.title}" 吗？`)) {
                      onDeleteSession(session.id);
                    }
                  }}
                  title="删除"
                >
                  <span className="material-icons-round">delete_outline</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
