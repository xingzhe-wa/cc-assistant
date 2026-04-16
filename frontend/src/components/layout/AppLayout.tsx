import React from 'react';
import { TopBar } from './TopBar';
import { HistoryBar } from './HistoryBar';
import type { MockSession } from '@/types/mock';
import styles from './AppLayout.module.css';

interface AppLayoutProps {
  children: React.ReactNode;
  sessions: MockSession[];
  activeSessionId: string;
  streamEnabled: boolean;
  historyOpen: boolean;
  favoriteOpen: boolean;
  onTabClick: (id: string) => void;
  onTabClose: (id: string) => void;
  onNewTab: () => void;
  onHistoryClick: () => void;
  onFavoriteClick: () => void;
  onStreamToggle: () => void;
  onSettingsClick: () => void;
  onSearchChange: (query: string) => void;
  onSessionClick: (session: MockSession) => void;
  onFavoriteToggle: (id: string, fav: boolean) => void;
  onDeleteSession: (id: string) => void;
  onRename: (id: string, title: string) => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  sessions,
  activeSessionId,
  streamEnabled,
  historyOpen,
  favoriteOpen,
  onTabClick,
  onTabClose,
  onNewTab,
  onHistoryClick,
  onFavoriteClick,
  onStreamToggle,
  onSettingsClick,
  onSearchChange,
  onSessionClick,
  onFavoriteToggle,
  onDeleteSession,
  onRename
}) => {
  return (
    <div className={styles.layout}>
      <TopBar
        sessions={sessions}
        activeSessionId={activeSessionId}
        streamEnabled={streamEnabled}
        historyOpen={historyOpen}
        favoriteOpen={favoriteOpen}
        onTabClick={onTabClick}
        onTabClose={onTabClose}
        onNewTab={onNewTab}
        onHistoryClick={onHistoryClick}
        onFavoriteClick={onFavoriteClick}
        onStreamToggle={onStreamToggle}
        onSettingsClick={onSettingsClick}
        onRename={onRename}
      />
      <HistoryBar
        isOpen={historyOpen || favoriteOpen}
        mode={favoriteOpen ? 'favorite' : 'history'}
        sessions={sessions}
        onSearchChange={onSearchChange}
        onSessionClick={onSessionClick}
        onFavoriteToggle={onFavoriteToggle}
        onDeleteSession={onDeleteSession}
        onModeSwitch={onFavoriteClick}
        onClose={() => {
          if (historyOpen) onHistoryClick();
          if (favoriteOpen) onFavoriteClick();
        }}
      />
      <main className={styles.content}>
        {children}
      </main>
    </div>
  );
};
