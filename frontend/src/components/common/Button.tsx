import React from 'react';
import { Icon } from './Icon';
import styles from './Button.module.css';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  iconOnly?: boolean;
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  title?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconOnly = false,
  children,
  onClick,
  className = '',
  title
}) => {
  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    iconOnly ? styles.iconOnly : '',
    loading ? styles.loading : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      title={title}
      type="button"
    >
      {loading ? (
        <span className={styles.spinner} />
      ) : icon ? (
        <Icon name={icon} />
      ) : null}
      {!iconOnly && children && <span className={styles.label}>{children}</span>}
    </button>
  );
};
