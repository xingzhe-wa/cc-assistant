/**
 * 确认弹窗组件 — JCEF 安全替代 alert()/confirm()
 */

import React from 'react';
import { Modal } from './Modal';
import { useI18n } from '@/hooks/useI18n';
import styles from './ConfirmDialog.module.css';

interface ConfirmDialogProps {
  isOpen: boolean;
  mode: 'alert' | 'confirm';
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  mode,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = 'default',
  onConfirm,
  onCancel
}) => {
  const { t } = useI18n();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <div className={styles.footer}>
          {mode === 'confirm' && (
            <button className={styles.cancelBtn} onClick={onCancel}>
              {cancelLabel || t('common.cancel')}
            </button>
          )}
          <button
            className={`${styles.confirmBtn} ${variant === 'danger' ? styles.danger : ''}`}
            onClick={onConfirm}
          >
            {confirmLabel || (mode === 'alert' ? t('common.confirm') : t('common.confirm'))}
          </button>
        </div>
      }
    >
      <div className={styles.message}>{message}</div>
    </Modal>
  );
};
