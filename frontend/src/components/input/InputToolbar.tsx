import React from 'react';
import { Dropdown } from './Dropdown';
import { ContextBar } from './ContextBar';
import { Icon, Button } from '../common';
import { useI18n } from '@/hooks/useI18n';
import type { MockProvider, MockModel, MockAgent, Mode } from '@/types/mock';
import styles from './InputToolbar.module.css';

interface InputToolbarProps {
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
}

export const InputToolbar: React.FC<InputToolbarProps> = ({
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
}) => {
  const { t } = useI18n();

  const modeOptions = [
    { id: 'auto', name: t('modes.auto'), icon: 'auto_mode' },
    { id: 'plan', name: t('modes.plan'), icon: 'account_tree' },
    { id: 'agent', name: t('modes.agent'), icon: 'smart_toy' }
  ] as const;

  const providerOptions = providers.map(p => ({
    id: p.id,
    name: p.name,
    icon: 'dns'
  }));

  const modelOptions = models.map(m => ({
    id: m.id,
    name: m.name,
    icon: 'model_training'
  }));

  const agentOptions = agents.map(a => ({
    id: a.id,
    name: a.name,
    icon: 'smart_toy'
  }));

  const currentProv = providers.find(p => p.id === currentProvider);

  return (
    <div className={styles.toolbar}>
      <div className={styles.left}>
        <ContextBar used={contextUsed} />
      </div>
      <div className={styles.right}>
        <Dropdown
          trigger={
            <div className={styles.trigger}>
              <Icon name="dns" />
              <span>{currentProv?.name || t('settings.provider')}</span>
              <Icon name="expand_more" size="xs" />
            </div>
          }
          options={providerOptions}
          value={currentProvider}
          onChange={onProviderChange}
        />

        <Dropdown
          trigger={
            <div className={styles.trigger}>
              <Icon name="auto_mode" />
              <span>{t(`modes.${currentMode}`)}</span>
              <Icon name="expand_more" size="xs" />
            </div>
          }
          options={modeOptions.map(o => ({ ...o, id: o.id as string }))}
          value={currentMode}
          onChange={(id) => onModeChange(id as Mode)}
        />

        <Dropdown
          trigger={
            <div className={styles.trigger}>
              <Icon name="model_training" />
              <span>{models.find(m => m.id === currentModel)?.name || currentModel}</span>
              <Icon name="expand_more" size="xs" />
            </div>
          }
          options={modelOptions}
          value={currentModel}
          onChange={onModelChange}
        />

        <div className={styles.divider} />

        <Button
          variant={thinkEnabled ? 'secondary' : 'ghost'}
          icon="psychology"
          size="sm"
          onClick={onThinkToggle}
        >
          {t('modes.thinking')}
        </Button>

        <Dropdown
          trigger={
            <div className={styles.trigger}>
              <Icon name="smart_toy" />
              <span>{agents.find(a => a.id === currentAgent)?.name || t('settings.agent')}</span>
              <Icon name="expand_more" size="xs" />
            </div>
          }
          options={agentOptions}
          value={currentAgent}
          onChange={onAgentChange}
        />
      </div>
    </div>
  );
};
