import React from 'react';
import { TabBar } from './TabBar';
import { Button } from '../common';
import { useI18n } from '@/hooks/useI18n';
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
  onRename: (id: string, title: string) => void;
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
  onSettingsClick,
  onRename
}) => {
  const { t } = useI18n();

  return (
    <header className={styles.topbar}>
      <TabBar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onTabClick={onTabClick}
        onTabClose={onTabClose}
        onNewTab={onNewTab}
        onRename={onRename}
      />
      <div className={styles.actions}>
        <Button
          variant="ghost"
          iconOnly
          icon="add"
          onClick={onNewTab}
          title={t('toolbar.newSession')}
        />
        <Button
          variant={historyOpen ? 'secondary' : 'ghost'}
          iconOnly
          icon="history"
          onClick={onHistoryClick}
          title={t('toolbar.history')}
        />
        <Button
          variant={favoriteOpen ? 'secondary' : 'ghost'}
          iconOnly
          icon={favoriteOpen ? 'star' : 'star_outline'}
          onClick={onFavoriteClick}
          title={t('toolbar.favorites')}
        />
        <div className={styles.streamToggle} onClick={onStreamToggle}>
          <span className={styles.streamLabel}>{t('toolbar.stream')}</span>
          <span className={`${styles.streamTrack} ${streamEnabled ? styles.on : ''}`} />
        </div>
        <Button
          variant="ghost"
          iconOnly
          icon="settings"
          onClick={onSettingsClick}
          title={t('toolbar.settings')}
        />
      </div>
    </header>
  );
};
