import React from 'react';
import { useChatStore } from '@/stores';
import { useI18n } from '@/hooks/useI18n';
import { HistoryPage } from '../HistoryPage/HistoryPage';

/**
 * FavoritesPage - 收藏会话页面
 *
 * 复用 HistoryPage 组件，传入 mode="favorite"
 */
export const FavoritesPage: React.FC = () => {
  const { t } = useI18n();
  const { sessions, toggleSessionFavorite, deleteSession, setActiveSession, addToast } = useChatStore();

  const handleSessionClick = (session: any) => {
    setActiveSession(session.id);
    addToast(t('toast.sessionLoaded'), 'success');
  };

  const handleFavoriteToggle = (id: string, fav: boolean) => {
    toggleSessionFavorite(id);
    addToast(fav ? t('toast.favoriteAdded') : t('toast.favoriteRemoved'), 'success');
  };

  const handleDeleteSession = (id: string) => {
    deleteSession(id);
    addToast(t('toast.deleted'), 'success');
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
