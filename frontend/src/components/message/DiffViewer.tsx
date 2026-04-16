import React, { useState } from 'react';
import { Icon } from '../common';
import { useI18n } from '@/hooks/useI18n';
import type { MockDiffFile } from '@/types/mock';
import './DiffViewer.css';

export interface DiffViewerProps {
  /** 差异文件列表 */
  diffFiles: MockDiffFile[];
  /** 是否显示标题栏 */
  showHeader?: boolean;
  /** 默认是否展开 */
  defaultExpanded?: boolean;
  /** 类名 */
  className?: string;
}

/**
 * DiffViewer - 代码差异对比查看器
 *
 * 特性：
 * - 显示文件变更统计
 * - 总览添加/删除行数
 * - 支持展开/收起
 *
 * @example
 * ```tsx
 * <DiffViewer
 *   diffFiles={[
 *     { file: 'App.kt', add: 10, del: 5 }
 *   ]}
 * />
 * ```
 */
export const DiffViewer: React.FC<DiffViewerProps> = ({
  diffFiles,
  showHeader = true,
  defaultExpanded = true,
  className = ''
}) => {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(defaultExpanded);

  // 计算总计
  const totalAdd = diffFiles.reduce((sum, f) => sum + f.add, 0);
  const totalDel = diffFiles.reduce((sum, f) => sum + f.del, 0);
  const totalFiles = diffFiles.length;

  return (
    <div className={`cc-diff-viewer ${className}`}>
      {/* 头部：标题 + 统计 + 展开/收起 */}
      {showHeader && (
        <div
          className="cc-diff-viewer__header"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="cc-diff-viewer__title">
            <Icon
              name={expanded ? 'keyboard_arrow_down' : 'keyboard_arrow_right'}
              size="md"
            />
            <span>{t('diff.title')}</span>
            <span className="cc-diff-viewer__count">
              ({totalFiles} 个文件，+{totalAdd} -{totalDel})
            </span>
          </div>
          <div className="cc-diff-viewer__actions">
            <button
              type="button"
              className="cc-diff-viewer__toggle"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
            >
              {expanded ? t('diff.collapse') : t('diff.expand')}
            </button>
          </div>
        </div>
      )}

      {/* 文件列表 */}
      {expanded && (
        <div className="cc-diff-viewer__content">
          <div className="cc-diff-viewer__files">
            {diffFiles.map((file, index) => (
              <div key={index} className="cc-diff-viewer__file">
                <div className="cc-diff-viewer__file-info">
                  <Icon name="insert_drive_file" size="sm" />
                  <span className="cc-diff-viewer__file-name">{file.file}</span>
                </div>
                <div className="cc-diff-viewer__file-stats">
                  {file.add > 0 && (
                    <span className="cc-diff-viewer__add">+{file.add}</span>
                  )}
                  {file.del > 0 && (
                    <span className="cc-diff-viewer__del">-{file.del}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DiffViewer;
