import React from 'react';
import { Dropdown } from './Dropdown';
import { ContextBar } from './ContextBar';
import { Icon, Button } from '../common';
import { useI18n } from '@/hooks/useI18n';
import { jcefBridge } from '@/utils/jcef';
import type { Mode } from '@/types/mock';
import styles from './InputToolbar.module.css';

interface InputToolbarProps {
  // Provider
  providers: Array<{
    id: string;
    name: string;
    url: string;
    apiKey: string;
    models: { default: string; opus: string; max: string };
    status: 'ok' | 'err' | 'off';
  }>;
  currentProvider: string;
  onProviderChange: (id: string) => void;
  // Model
  models: Array<{ id: string; name: string }>;
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
  skills,
  currentSkill,
  onSkillChange,
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

  const providerOptions = [
    ...providers.map(p => ({
      id: p.id,
      name: p.name,
      icon: 'dns'
    })),
    { id: '__divider_provider__', name: '', isDivider: true },
    { id: '__configure_provider__', name: t('settings.configureNewProvider') || 'Configure new Provider', icon: 'add', isAction: true }
  ];

  const modelOptions = models.map(m => ({
    id: m.id,
    name: m.name,
    icon: 'model_training'
  }));

  const agentOptions = [
    ...agents.map(a => ({
      id: a.id,
      name: a.scope === 'global' ? `[G] ${a.name}` : a.scope === 'project' ? `[P] ${a.name}` : a.name,
      icon: 'smart_toy'
    })),
    { id: '__divider_agent__', name: '', isDivider: true },
    { id: '__configure_agent__', name: t('settings.configureNewAgent') || 'Configure new Agent', icon: 'add', isAction: true }
  ];

  const skillOptions = [
    ...skills.map(s => ({
      id: s.id,
      name: s.scope === 'global' ? `[G] ${s.name}` : s.scope === 'project' ? `[P] ${s.name}` : s.name,
      icon: 'auto_awesome'
    })),
    { id: '__divider_skill__', name: '', isDivider: true },
    { id: '__configure_skill__', name: t('settings.configureNewSkill') || 'Configure new Skill', icon: 'add', isAction: true }
  ];

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
          onChange={(id) => {
            if (id === '__configure_provider__') {
              jcefBridge.openSettings('providers');
            } else {
              onProviderChange(id);
            }
          }}
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
          onChange={(id) => {
            if (id === '__configure_agent__') {
              jcefBridge.openSettings('agents');
            } else {
              onAgentChange(id);
            }
          }}
        />

        <Dropdown
          trigger={
            <div className={styles.trigger}>
              <Icon name="auto_awesome" />
              <span>{skills.find(s => s.id === currentSkill)?.name || t('settings.skill')}</span>
              <Icon name="expand_more" size="xs" />
            </div>
          }
          options={skillOptions}
          value={currentSkill}
          onChange={(id) => {
            if (id === '__configure_skill__') {
              jcefBridge.openSettings('skills');
            } else {
              onSkillChange(id);
            }
          }}
        />
      </div>
    </div>
  );
};
