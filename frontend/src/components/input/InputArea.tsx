import React from 'react';
import { InputToolbar } from './InputToolbar';
import { InputBox } from './InputBox';
import type { MockProvider, MockModel, MockAgent, Mode, SendOptions } from '@/types/mock';
import styles from './InputArea.module.css';

interface InputAreaProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (options: SendOptions) => void;
  onStop: () => void;
  streaming: boolean;
  // Provider
  providers: MockProvider[];
  currentProvider: string;
  onProviderChange: (id: string) => void;
  // Model
  models: MockModel[];
  currentModel: string;
  onModelChange: (id: string) => void;
  // Mode
  currentMode: Mode;
  onModeChange: (mode: Mode) => void;
  // Agent
  agents: MockAgent[];
  currentAgent: string;
  onAgentChange: (id: string) => void;
  // Think
  thinkEnabled: boolean;
  onThinkToggle: () => void;
  // Context
  contextUsed: number;
  // Enhance
  onEnhance: () => void;
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
  thinkEnabled,
  onThinkToggle,
  contextUsed,
  onEnhance
}) => {
  const handleSend = () => {
    if (value.trim()) {
      onSend({
        stream: true,
        think: thinkEnabled,
        mode: currentMode,
        model: currentModel,
        provider: currentProvider
      });
    }
  };

  return (
    <div className={styles.container}>
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
        thinkEnabled={thinkEnabled}
        onThinkToggle={onThinkToggle}
        contextUsed={contextUsed}
        onEnhance={onEnhance}
      />
      <InputBox
        value={value}
        onChange={onChange}
        onSend={handleSend}
        onStop={onStop}
        streaming={streaming}
      />
    </div>
  );
};
