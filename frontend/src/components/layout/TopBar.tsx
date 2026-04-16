import React from 'react';
import { TabBar } from './TabBar';
import { Button } from '../common';
import type { MockSession } from '@/types/mock';
import styles from './TopBar.module.css';

interface TopBarProps {
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
}

export const TopBar: React.FC<TopBarProps> = ({
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
  onSettingsClick
}) => {
  return (
    <header className={styles.topbar}>
      <TabBar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onTabClick={onTabClick}
        onTabClose={onTabClose}
        onNewTab={onNewTab}
      />
      <div className={styles.actions}>
        <Button
          variant="ghost"
          iconOnly
          icon="add"
          onClick={onNewTab}
          title="新建会话"
        />
        <Button
          variant={historyOpen ? 'secondary' : 'ghost'}
          iconOnly
          icon="history"
          onClick={onHistoryClick}
          title="历史会话"
        />
        <Button
          variant={favoriteOpen ? 'secondary' : 'ghost'}
          iconOnly
          icon={favoriteOpen ? 'star' : 'star_outline'}
          onClick={onFavoriteClick}
          title="收藏会话"
        />
        <div className={styles.streamToggle} onClick={onStreamToggle}>
          <span className={styles.streamLabel}>Stream</span>
          <span className={`${styles.streamTrack} ${streamEnabled ? styles.on : ''}`} />
        </div>
        <Button
          variant="ghost"
          iconOnly
          icon="settings"
          onClick={onSettingsClick}
          title="设置"
        />
      </div>
    </header>
  );
};
