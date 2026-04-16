import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Icon } from '../common';
import { useI18n } from '@/hooks/useI18n';
import styles from './FileReferencePopup.module.css';

export interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
}

interface FileReferencePopupProps {
  query: string;
  files: FileItem[];
  onSelect: (file: FileItem) => void;
  onClose: () => void;
}

/**
 * @file 引用弹窗
 * 当用户在输入框输入 @ 时弹出，展示匹配的文件列表
 */
export const FileReferencePopup: React.FC<FileReferencePopupProps> = ({
  query,
  files,
  onSelect,
  onClose,
}) => {
  const { t } = useI18n();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  // 过滤文件列表
  const filteredFiles = files.filter(f =>
    f.name.toLowerCase().includes(query.toLowerCase()) ||
    f.path.toLowerCase().includes(query.toLowerCase())
  );

  // 搜索变化时重置选中索引
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // 键盘导航
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filteredFiles.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredFiles[selectedIndex]) {
          onSelect(filteredFiles[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [filteredFiles, selectedIndex, onSelect, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [handleKeyDown]);

  // 滚动到选中项
  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  // 点击外部关闭
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const popup = listRef.current?.parentElement;
      if (popup && !popup.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  if (filteredFiles.length === 0) return null;

  const getFileIcon = (file: FileItem): string => {
    if (file.type === 'directory') return 'folder';
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const iconMap: Record<string, string> = {
      ts: 'javascript', tsx: 'javascript', js: 'javascript', jsx: 'javascript',
      kt: 'code', java: 'code', py: 'code', go: 'code', rs: 'code',
      html: 'html', css: 'css',
      json: 'data_object', yaml: 'data_object', yml: 'data_object', toml: 'data_object',
      md: 'description', txt: 'description',
      xml: 'code_blocks', gradle: 'code_blocks', properties: 'code_blocks',
    };
    return iconMap[ext] || 'insert_drive_file';
  };

  return (
    <div className={styles.popup}>
      <div className={styles.header}>
        <Icon name="search" size="sm" />
        <span>{t('enhance.preview')}: {query || '...'}</span>
        <span className={styles.count}>{filteredFiles.length}</span>
      </div>
      <div className={styles.list} ref={listRef}>
        {filteredFiles.map((file, idx) => (
          <button
            key={file.path}
            className={`${styles.item} ${idx === selectedIndex ? styles.selected : ''}`}
            onClick={() => onSelect(file)}
            onMouseEnter={() => setSelectedIndex(idx)}
          >
            <Icon name={getFileIcon(file)} size="sm" />
            <div className={styles.fileInfo}>
              <span className={styles.fileName}>{file.name}</span>
              <span className={styles.filePath}>{file.path}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
