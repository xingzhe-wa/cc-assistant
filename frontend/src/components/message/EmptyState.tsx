import React from 'react';
import { Button } from '../common';
import { useI18n } from '@/hooks/useI18n';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  onQuickAction: (text: string) => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onQuickAction }) => {
  const { t } = useI18n();

  const quickActions = [
    { icon: 'auto_fix_high', text: t('emptyState.optimizeCode'), label: t('emptyState.optimizeCode') },
    { icon: 'psychology', text: t('emptyState.explainCode'), label: t('emptyState.explainCode') },
    { icon: 'bug_report', text: t('emptyState.writeTest'), label: t('emptyState.writeTest') },
    { icon: 'rate_review', text: t('emptyState.reviewChanges'), label: t('emptyState.reviewChanges') }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.iconWrapper}>
        <span className="material-icons-round lg">smart_toy</span>
      </div>
      <h3 className={styles.title}>CC Assistant</h3>
      <p className={styles.description}>
        {t('emptyState.description')}
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
