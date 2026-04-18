import React, { useRef, useCallback } from 'react';
import { InputToolbar } from './InputToolbar';
import { InputBox } from './InputBox';
import { AIStatusBar } from './AIStatusBar';
import { Icon } from '../common';
import type { Mode, SendOptions, Attachment, AgentStatus, MockDiffFile } from '@/types/mock';
import styles from './InputArea.module.css';

interface InputAreaProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (options: SendOptions) => void;
  onStop: () => void;
  streaming: boolean;
  // Provider
  providers: Array<{
    id: string;
    name: string;
    url: string;
    apiKey: string;
    models: {
      default: string;
      opus: string;
      max: string;
    };
    status: 'ok' | 'err' | 'off';
  }>;
  currentProvider: string;
  onProviderChange: (id: string) => void;
  // Model
  models: Array<{
    id: string;
    name: string;
  }>;
  currentModel: string;
  onModelChange: (id: string) => void;
  // Mode
  currentMode: Mode;
  onModeChange: (mode: Mode) => void;
  // Agent
  agents: Array<{
    id: string;
    name: string;
    description?: string;
    scope?: 'global' | 'project';
  }>;
  currentAgent: string;
  onAgentChange: (id: string) => void;
  // Skill
  skills: Array<{
    id: string;
    name: string;
    description?: string;
    scope?: 'global' | 'project';
  }>;
  currentSkill: string;
  onSkillChange: (id: string) => void;
  // Think
  thinkEnabled: boolean;
  onThinkToggle: () => void;
  // Context
  contextUsed: number;
  // Enhance
  onEnhance: () => void;
  // AI Status
  agentStatus: AgentStatus;
  statusMessage: string;
  subAgentName: string | null;
  diffFiles: MockDiffFile[];
  // Attachments
  attachments: Attachment[];
  onAddAttachment: (file: File) => void;
  onAddAttachments: (files: File[]) => void;
  onRemoveAttachment: (id: string) => void;
}

export const InputArea: React.FC<InputAreaProps> = ({
  value,
  onChange,
  onSend,
  onStop,
  streaming,
  providers,
  currentProvider,
  onProviderChange,
  models,
  currentModel,
  onModelChange,
  currentMode,
  onModeChange,
  agents,
  currentAgent,
  onAgentChange,
  skills,
  currentSkill,
  onSkillChange,
  thinkEnabled,
  onThinkToggle,
  contextUsed,
  onEnhance,
  agentStatus,
  statusMessage,
  subAgentName,
  diffFiles,
  attachments,
  onAddAttachment,
  onAddAttachments,
  onRemoveAttachment,
}) => {
  const inputBoxRef = useRef<{ triggerFileInput: () => void; triggerImageInput: () => void } | null>(null);

  const handleSend = () => {
    if (value.trim()) {
      onSend({
        stream: true,
        think: thinkEnabled,
        mode: currentMode,
        model: currentModel,
        provider: currentProvider,
        attachments: attachments.length > 0 ? attachments : undefined,
      });
    }
  };

  const handleImagePaste = useCallback((file: File) => {
    onAddAttachment(file);
  }, [onAddAttachment]);

  const handleFileSelect = useCallback((files: FileList) => {
    onAddAttachments(Array.from(files));
  }, [onAddAttachments]);

  const handleImageSelect = useCallback((files: FileList) => {
    onAddAttachments(Array.from(files));
  }, [onAddAttachments]);

  return (
    <div className={styles.container}>
      {/* AI 状态栏 — 最顶部 */}
      <AIStatusBar
        status={agentStatus}
        statusMessage={statusMessage}
        subAgentName={subAgentName}
        diffFiles={diffFiles}
      />

      {/* 附件按钮栏 — 输入框上方 */}
      <div className={styles.attachBar}>
        <button
          className={styles.attachBtn}
          onClick={() => inputBoxRef.current?.triggerImageInput()}
          title="Attach Image"
        >
          <Icon name="image" size="sm" />
        </button>
        <button
          className={styles.attachBtn}
          onClick={() => inputBoxRef.current?.triggerFileInput()}
          title="Attach File"
        >
          <Icon name="attach_file" size="sm" />
        </button>
      </div>

      {/* 文本输入区 — 核心区域（含内部附件预览 + enhance + send） */}
      <InputBox
        ref={inputBoxRef}
        value={value}
        onChange={onChange}
        onSend={handleSend}
        onStop={onStop}
        streaming={streaming}
        onImagePaste={handleImagePaste}
        onFileSelect={handleFileSelect}
        onImageSelect={handleImageSelect}
        attachments={attachments}
        onRemoveAttachment={onRemoveAttachment}
        onEnhance={onEnhance}
      />

      {/* 功能栏 — 低调底部 */}
      <div className={styles.toolbarZone}>
        <InputToolbar
          providers={providers}
          currentProvider={currentProvider}
          onProviderChange={onProviderChange}
          models={models}
          currentModel={currentModel}
          onModelChange={onModelChange}
          currentMode={currentMode}
          onModeChange={onModeChange}
          agents={agents}
          currentAgent={currentAgent}
          onAgentChange={onAgentChange}
          skills={skills}
          currentSkill={currentSkill}
          onSkillChange={onSkillChange}
          thinkEnabled={thinkEnabled}
          onThinkToggle={onThinkToggle}
          contextUsed={contextUsed}
        />
      </div>
    </div>
  );
};
