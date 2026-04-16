import React from 'react';
import { Icon } from '../common';
import type { AgentStatus, MockDiffFile } from '@/types/mock';
import styles from './AIStatusBar.module.css';

interface AIStatusBarProps {
  status: AgentStatus;
  statusMessage: string;
  subAgentName: string | null;
  diffFiles: MockDiffFile[];
}

export const AIStatusBar: React.FC<AIStatusBarProps> = ({
  status,
  statusMessage,
  subAgentName,
  diffFiles,
}) => {
  const totalAdd = diffFiles.reduce((sum, f) => sum + f.add, 0);
  const totalDel = diffFiles.reduce((sum, f) => sum + f.del, 0);

  return (
    <div className={styles.statusBar}>
      <div className={styles.left}>
        <div className={`${styles.statusDot} ${styles[status]}`} />
        <span className={styles.statusText}>{statusMessage || statusLabel(status)}</span>
      </div>
      <div className={styles.center}>
        {subAgentName ? (
          <div className={styles.subAgentChip}>
            <Icon name="smart_toy" size="sm" />
            <span>{subAgentName}</span>
          </div>
        ) : (
          <span className={styles.placeholder}>—</span>
        )}
      </div>
      <div className={styles.right}>
        {diffFiles.length > 0 ? (
          <div className={styles.diffBadge}>
            <span className={styles.additions}>+{totalAdd}</span>
            <span className={styles.deletions}>-{totalDel}</span>
            <span className={styles.fileCount}>{diffFiles.length} files</span>
          </div>
        ) : (
          <span className={styles.placeholder}>—</span>
        )}
      </div>
    </div>
  );
};

function statusLabel(status: AgentStatus): string {
  switch (status) {
    case 'idle': return 'Ready';
    case 'thinking': return 'Thinking...';
    case 'working': return 'Working...';
    case 'waiting': return 'Waiting for input...';
    default: return '';
  }
}
