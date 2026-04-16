import React, { useState } from 'react';
import { DiffViewer } from './DiffViewer';
import { Icon } from '../common';
import type { MockDiffFile } from '@/types/mock';
import styles from './DiffSummary.module.css';

interface DiffSummaryProps {
  diffFiles: MockDiffFile[];
}

export const DiffSummary: React.FC<DiffSummaryProps> = ({ diffFiles }) => {
  const [expanded, setExpanded] = useState(false);

  const totalAdd = diffFiles.reduce((sum, f) => sum + f.add, 0);
  const totalDel = diffFiles.reduce((sum, f) => sum + f.del, 0);
  const totalFiles = diffFiles.length;

  return (
    <div className={styles.container}>
      <button
        className={styles.trigger}
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        title={expanded ? '收起变更' : '展开变更'}
      >
        <Icon
          name={expanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
          size="sm"
        />
        <span className={styles.label}>代码变更</span>
        <span className={styles.stat}>
          <span className={styles.add}>+{totalAdd}</span>
          <span className={styles.del}>-{totalDel}</span>
        </span>
        <span className={styles.fileCount}>{totalFiles} 个文件</span>
      </button>

      {expanded && (
        <div className={styles.viewer}>
          <DiffViewer diffFiles={diffFiles} showHeader={false} defaultExpanded={true} />
        </div>
      )}
    </div>
  );
};