import React, { useRef, useEffect } from 'react';
import { Button } from '../common';
import { useI18n } from '@/hooks/useI18n';
import styles from './InputBox.module.css';

interface InputBoxProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  streaming: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export const InputBox: React.FC<InputBoxProps> = ({
  value,
  onChange,
  onSend,
  onStop,
  streaming,
  placeholder,
  disabled = false
}) => {
  const { t } = useI18n();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 90)}px`;
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

  return (
    <div className={styles.container}>
      <div className={styles.inputWrapper}>
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || t('input.placeholder')}
          disabled={disabled}
          rows={1}
        />
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
  );
};
