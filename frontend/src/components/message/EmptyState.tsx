import React from 'react';
import { Button } from '../common';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  onQuickAction: (text: string) => void;
}

const quickActions = [
  { icon: 'auto_fix_high', label: '优化代码', text: '帮我优化当前选中的代码' },
  { icon: 'psychology', label: '解释代码', text: '解释这段代码的作用' },
  { icon: 'bug_report', label: '编写测试', text: '为这个文件编写单元测试' },
  { icon: 'rate_review', label: '审查变更', text: '审查最近的代码变更' }
];

export const EmptyState: React.FC<EmptyStateProps> = ({ onQuickAction }) => {
  return (
    <div className={styles.container}>
      <div className={styles.iconWrapper}>
        <span className="material-icons-round lg">smart_toy</span>
      </div>
      <h3 className={styles.title}>CC Assistant</h3>
      <p className={styles.description}>
        Claude Code 的 IntelliJ 助手，帮你编写代码、审查变更、管理会话
      </p>
      <div className={styles.quickActions}>
        {quickActions.map((action) => (
          <Button
            key={action.label}
            variant="ghost"
            size="sm"
            icon={action.icon}
            onClick={() => onQuickAction(action.text)}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
};
