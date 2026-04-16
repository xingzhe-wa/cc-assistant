import React, { useState, useRef, useEffect } from 'react';
import type { MockSession } from '@/types/mock';
import { useI18n } from '@/hooks/useI18n';
import styles from './TabBar.module.css';

interface TabBarProps {
  sessions: MockSession[];
  activeSessionId: string;
  onTabClick: (id: string) => void;
  onTabClose: (id: string) => void;
  onNewTab: () => void;
  onRename: (id: string, title: string) => void;
}

export const TabBar: React.FC<TabBarProps> = ({
  sessions,
  activeSessionId,
  onTabClick,
  onTabClose,
  onRename
}) => {
  const { t } = useI18n();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const handleDoubleClick = (session: MockSession) => {
    setEditingId(session.id);
    setEditValue(session.title || '');
  };

  const handleConfirm = () => {
    if (editingId && editValue.trim()) {
      onRename(editingId, editValue.trim());
    }
    setEditingId(null);
    setEditValue('');
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.tabs}>
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`${styles.tab} ${session.id === activeSessionId ? styles.active : ''}`}
            onClick={() => !editingId && onTabClick(session.id)}
            onDoubleClick={() => handleDoubleClick(session)}
          >
            {editingId === session.id ? (
              <input
                ref={inputRef}
                className={styles.renameInput}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleConfirm}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className={styles.title}>
                {session.title || t('session.newChat')}
              </span>
            )}
            {sessions.length > 1 && !editingId && (
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
