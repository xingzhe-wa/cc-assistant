import React, { useRef, useEffect, useCallback, useImperativeHandle, forwardRef, useState } from 'react';
import { Button } from '../common';
import { useI18n } from '@/hooks/useI18n';
import { FileReferencePopup } from './FileReferencePopup';
import { AttachmentPreview } from './AttachmentPreview';
import type { FileItem } from './FileReferencePopup';
import type { Attachment } from '@/types/mock';
import styles from './InputBox.module.css';

export interface InputBoxHandle {
  triggerFileInput: () => void;
  triggerImageInput: () => void;
}

interface InputBoxProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  streaming: boolean;
  placeholder?: string;
  disabled?: boolean;
  onImagePaste?: (file: File) => void;
  onFileSelect?: (files: FileList) => void;
  onImageSelect?: (files: FileList) => void;
  // Attachments
  attachments?: Attachment[];
  onRemoveAttachment?: (id: string) => void;
  // Enhance
  onEnhance?: () => void;
}

export const InputBox = forwardRef<InputBoxHandle, InputBoxProps>(({
  value,
  onChange,
  onSend,
  onStop,
  streaming,
  placeholder,
  disabled = false,
  onImagePaste,
  onFileSelect,
  onImageSelect,
  attachments = [],
  onRemoveAttachment,
  onEnhance,
}, ref) => {
  const { t } = useI18n();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // @file 引用弹窗状态
  const [showFilePopup, setShowFilePopup] = useState(false);
  const [fileQuery, setFileQuery] = useState('');
  const [atPosition, setAtPosition] = useState(-1); // @ 符号在 value 中的位置

  // Mock 文件列表（生产环境由 JCEF searchFiles 提供）
  const [mockFiles] = useState<FileItem[]>([
    { name: 'App.tsx', path: 'src/App.tsx', type: 'file' },
    { name: 'chatStore.ts', path: 'src/stores/chatStore.ts', type: 'file' },
    { name: 'InputBox.tsx', path: 'src/components/input/InputBox.tsx', type: 'file' },
    { name: 'InputArea.tsx', path: 'src/components/input/InputArea.tsx', type: 'file' },
    { name: 'JcefChatPanel.kt', path: 'src/main/kotlin/.../JcefChatPanel.kt', type: 'file' },
    { name: 'ReactChatPanel.kt', path: 'src/main/kotlin/.../ReactChatPanel.kt', type: 'file' },
    { name: 'plugin.xml', path: 'src/main/resources/META-INF/plugin.xml', type: 'file' },
    { name: 'build.gradle.kts', path: 'build.gradle.kts', type: 'file' },
    { name: 'vite.config.ts', path: 'frontend/vite.config.ts', type: 'file' },
    { name: 'global.css', path: 'frontend/src/styles/global.css', type: 'file' },
  ]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!streaming && value.trim()) {
        onSend();
      }
    }
  };

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    if (!onImagePaste) return;
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) onImagePaste(file);
        return;
      }
    }
  }, [onImagePaste]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && onFileSelect) {
      onFileSelect(files);
    }
    e.target.value = '';
  }, [onFileSelect]);

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && onImageSelect) {
      onImageSelect(files);
    }
    e.target.value = '';
  }, [onImageSelect]);

  const triggerFileInput = useCallback(() => fileInputRef.current?.click(), []);
  const triggerImageInput = useCallback(() => imageInputRef.current?.click(), []);

  useImperativeHandle(ref, () => ({
    triggerFileInput,
    triggerImageInput,
  }), [triggerFileInput, triggerImageInput]);

  // 处理输入变化，检测 @ 触发文件弹窗
  const handleChange = useCallback((newValue: string) => {
    onChange(newValue);

    // 检测 @ 引用
    const textarea = textareaRef.current;
    if (!textarea) return;
    const cursorPos = textarea.selectionStart;

    // 从光标位置向前查找 @
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@(\S*)$/);
    if (atMatch) {
      const atIdx = textBeforeCursor.lastIndexOf('@');
      // 确认 @ 前面是空格或行首（避免匹配 email）
      if (atIdx === 0 || textBeforeCursor[atIdx - 1] === ' ' || textBeforeCursor[atIdx - 1] === '\n') {
        setAtPosition(atIdx);
        setFileQuery(atMatch[1]);
        setShowFilePopup(true);
        return;
      }
    }
    setShowFilePopup(false);
  }, [onChange]);

  // 选择文件后替换 @query 为 @filename
  const handleFileSelect = useCallback((file: FileItem) => {
    const newValue = value.substring(0, atPosition) + `@${file.name} ` + value.substring(textareaRef.current?.selectionStart || value.length);
    onChange(newValue);
    setShowFilePopup(false);
    setAtPosition(-1);
  }, [value, atPosition, onChange]);

  const hasAttachments = attachments.length > 0;

  return (
    <div className={styles.container}>
      {/* @file 引用弹窗 */}
      {showFilePopup && (
        <FileReferencePopup
          query={fileQuery}
          files={mockFiles}
          onSelect={handleFileSelect}
          onClose={() => setShowFilePopup(false)}
        />
      )}
      {/* 附件预览区 (在输入框上方) */}
      {hasAttachments && (
        <div className={styles.attachmentZone}>
          <AttachmentPreview
            attachments={attachments}
            onRemove={onRemoveAttachment || (() => {})}
            onAddImage={triggerImageInput}
            onAddFile={triggerFileInput}
          />
        </div>
      )}
      <div className={styles.inputWrapper}>
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={placeholder || t('input.placeholder')}
          disabled={disabled}
          rows={1}
        />
        <div className={styles.rightColumn}>
          {onEnhance && (
            <Button
              variant="ghost"
              iconOnly
              icon="auto_fix_high"
              onClick={onEnhance}
              disabled={streaming || !value.trim()}
              className={styles.enhanceBtn}
              title={t('input.enhance')}
            />
          )}
          <Button
            variant={streaming ? 'danger' : 'primary'}
            iconOnly
            icon={streaming ? 'stop' : 'arrow_upward'}
            onClick={streaming ? onStop : onSend}
            disabled={!streaming && !value.trim()}
            className={styles.sendBtn}
            title={streaming ? t('input.stop') : `${t('input.send')} (Ctrl+Enter)`}
          />
        </div>
      </div>
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.py,.js,.ts,.tsx,.jsx,.kt,.java,.xml,.json,.yaml,.yml,.html,.css,.sql,.sh,.go,.rs,.c,.cpp,.h,.hpp,.rb,.php,.swift,.toml,.properties,.gradle,.csv,.log"
        multiple
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageChange}
        style={{ display: 'none' }}
      />
    </div>
  );
});
