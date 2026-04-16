import React from 'react';
import { Icon } from '../common';
import { useI18n } from '@/hooks/useI18n';
import type { Attachment } from '@/types/mock';
import styles from './AttachmentPreview.module.css';

interface AttachmentPreviewProps {
  attachments: Attachment[];
  onRemove: (id: string) => void;
  onAddImage: () => void;
  onAddFile: () => void;
}

export const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({
  attachments,
  onRemove,
  onAddImage,
  onAddFile,
}) => {
  const { t } = useI18n();

  return (
    <div className={styles.container}>
      {attachments.map((att) => (
        <div key={att.id} className={styles.item}>
          {att.type === 'image' && att.dataUrl ? (
            <div className={styles.imageThumb}>
              <img src={att.dataUrl} alt={att.name} className={styles.thumbImg} />
            </div>
          ) : (
            <div className={styles.fileIcon}>
              <Icon name="description" size="sm" />
            </div>
          )}
          <span className={styles.name} title={att.name}>{att.name}</span>
          <button className={styles.removeBtn} onClick={() => onRemove(att.id)} title={t('input.removeAttachment')}>
            <Icon name="close" size="sm" />
          </button>
        </div>
      ))}
      <button className={styles.addBtn} onClick={onAddImage} title={t('input.attachImage')}>
        <Icon name="image" size="sm" />
      </button>
      <button className={styles.addBtn} onClick={onAddFile} title={t('input.attachFile')}>
        <Icon name="attach_file" size="sm" />
      </button>
    </div>
  );
};
