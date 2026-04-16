import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';
import styles from './Toast.module.css';
import type { ToastType } from '@/types/mock';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  duration = 3000,
  onClose
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const iconName = {
    success: 'check_circle',
    error: 'error',
    info: 'info',
    warning: 'warning'
  }[type];

  return createPortal(
    <div className={`${styles.toast} ${styles[type]}`}>
      <Icon name={iconName} />
      <span>{message}</span>
    </div>,
    document.body
  );
};

// Toast 容器
interface ToastContainerProps {
  toasts: Array<{
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
  }>;
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onRemove
}) => {
  return createPortal(
    <div className={styles.container}>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>,
    document.body
  );
};
