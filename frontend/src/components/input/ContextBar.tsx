import React from 'react';
import styles from './ContextBar.module.css';

interface ContextBarProps {
  used: number;
  total?: number;
}

export const ContextBar: React.FC<ContextBarProps> = ({
  used,
  total = 100
}) => {
  const percentage = Math.min(100, Math.round((used / total) * 100));
  const color = percentage < 50
    ? 'var(--color-success)'
    : percentage < 80
      ? 'var(--color-warning)'
      : 'var(--color-error)';

  return (
    <div className={styles.container}>
      <span className={styles.label}>上下文</span>
      <div className={styles.bar}>
        <div
          className={styles.fill}
          style={{ width: `${percentage}%`, background: color }}
        />
      </div>
      <span className={styles.percentage}>{percentage}%</span>
    </div>
  );
};
