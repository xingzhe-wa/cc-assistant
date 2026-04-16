import React from 'react';
import { useChatStore } from '@/stores';
import { HistoryPage } from '../HistoryPage/HistoryPage';

/**
 * FavoritesPage - 收藏会话页面
 *
 * 复用 HistoryPage 组件，传入 mode="favorite"
 */
export const FavoritesPage: React.FC = () => {
  const { sessions, toggleSessionFavorite, deleteSession, setActiveSession, addToast } = useChatStore();

  const handleSessionClick = (session: any) => {
    setActiveSession(session.id);
    addToast(`已加载会话: ${session.title}`, 'success');
  };

  const handleFavoriteToggle = (id: string, fav: boolean) => {
    toggleSessionFavorite(id);
    addToast(fav ? '已添加收藏' : '已取消收藏', 'success');
  };

  const handleDeleteSession = (id: string) => {
    deleteSession(id);
    addToast('会话已删除', 'success');
  };

  const handleClose = () => {
    // 通过 store 切换回 chat 页面
    const { setCurrentPage } = useChatStore.getState();
    setCurrentPage('chat');
  };

  return (
    <HistoryPage
      mode="favorite"
      sessions={sessions}
      onSessionClick={handleSessionClick}
      onFavoriteToggle={handleFavoriteToggle}
      onDeleteSession={handleDeleteSession}
      onClose={handleClose}
    />
  );
};

export default FavoritesPage;
