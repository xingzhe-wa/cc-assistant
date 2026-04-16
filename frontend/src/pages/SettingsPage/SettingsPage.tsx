import React, { useState } from 'react';
import { useConfigStore } from '@/stores';
import { useI18n } from '@/hooks/useI18n';
import { ConfirmDialog } from '@/components/common';
import styles from './SettingsPage.module.css';
import { ProviderEditModal } from './ProviderEditModal';
import { AgentEditModal } from './AgentEditModal';
import { SkillEditModal } from './SkillEditModal';

interface SettingsPageProps {
  onClose: () => void;
}

type SettingsTab = 'basic' | 'provider' | 'agent' | 'skill';

interface SettingSection {
  id: SettingsTab;
  icon: string;
  labelKey: string;
  group: string;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onClose }) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<SettingsTab>('basic');

  // 编辑弹窗状态
  const [providerModalOpen, setProviderModalOpen] = useState(false);
  const [agentModalOpen, setAgentModalOpen] = useState(false);
  const [skillModalOpen, setSkillModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // ConfirmDialog 状态
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ open: false, title: '', message: '', onConfirm: () => {} });

  const settingsSections: SettingSection[] = [
    { id: 'basic', icon: 'tune', labelKey: 'settingsDetail.basicSettings', group: 'generalGroup' },
    { id: 'provider', icon: 'dns', labelKey: 'settingsDetail.providerManage', group: 'integrationGroup' },
    { id: 'agent', icon: 'smart_toy', labelKey: 'settingsDetail.agentManage', group: 'integrationGroup' },
    { id: 'skill', icon: 'bolt', labelKey: 'settingsDetail.skillManage', group: 'integrationGroup' }
  ];

  const handleEditProvider = (provider?: any) => {
    setEditingItem(provider || null);
    setProviderModalOpen(true);
  };

  const handleEditAgent = (agent?: any) => {
    setEditingItem(agent || null);
    setAgentModalOpen(true);
  };

  const handleEditSkill = (skill?: any) => {
    setEditingItem(skill || null);
    setSkillModalOpen(true);
  };

  const handleDeleteConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({ open: true, title, message, onConfirm });
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onClose}>
          <span className="material-icons-round">arrow_back</span>
          {t('common.back')}
        </button>
        <h1 className={styles.pageTitle}>
          <span className="material-icons-round">settings</span>
          {t('settings.title')}
        </h1>
      </header>
      <div className={styles.main}>
        <nav className={styles.nav}>
          {settingsSections.map((section) => (
            <React.Fragment key={section.id}>
              {section.group && (
                <div className={styles.navGroup}>{t(`settingsDetail.${section.group}`)}</div>
              )}
              <button
                className={`${styles.navItem} ${activeTab === section.id ? styles.active : ''}`}
                onClick={() => setActiveTab(section.id)}
              >
                <span className="material-icons-round">{section.icon}</span>
                {t(section.labelKey)}
              </button>
            </React.Fragment>
          ))}
        </nav>
        <div className={styles.content}>
          {activeTab === 'basic' && <BasicSettings />}
          {activeTab === 'provider' && (
            <ProviderSettings onEdit={handleEditProvider} onDeleteConfirm={handleDeleteConfirm} />
          )}
          {activeTab === 'agent' && (
            <AgentSettings onEdit={handleEditAgent} onDeleteConfirm={handleDeleteConfirm} />
          )}
          {activeTab === 'skill' && (
            <SkillSettings onEdit={handleEditSkill} onDeleteConfirm={handleDeleteConfirm} />
          )}
        </div>
      </div>

      {/* 编辑弹窗 */}
      <ProviderEditModal
        isOpen={providerModalOpen}
        onClose={() => setProviderModalOpen(false)}
        provider={editingItem}
      />
      <AgentEditModal
        isOpen={agentModalOpen}
        onClose={() => setAgentModalOpen(false)}
        agent={editingItem}
      />
      <SkillEditModal
        isOpen={skillModalOpen}
        onClose={() => setSkillModalOpen(false)}
        skill={editingItem}
      />

      {/* 删除确认弹窗 */}
      <ConfirmDialog
        isOpen={confirmDialog.open}
        mode="confirm"
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant="danger"
        onConfirm={() => {
          confirmDialog.onConfirm();
          setConfirmDialog({ ...confirmDialog, open: false });
        }}
        onCancel={() => setConfirmDialog({ ...confirmDialog, open: false })}
      />
    </div>
  );
};

// 基础设置
const BasicSettings: React.FC = () => {
  const { t } = useI18n();
  const {
    cliVersion,
    cliAutoUpdate,
    language,
    theme,
    setCliAutoUpdate,
    setLanguage,
    setTheme
  } = useConfigStore();

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>
        <span className="material-icons-round">terminal</span>
        {t('settingsDetail.cliVersion')}
      </div>
      <div className={styles.row}>
        <div className={styles.label}>
          {t('settingsDetail.cliName')}
          <small>{t('settingsDetail.currentVersion')} v{cliVersion}</small>
        </div>
        <div className={styles.ctrl}>
          <span style={{ fontSize: '11px', color: 'var(--gn)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span className="material-icons-round" style={{ fontSize: '13px' }}>check_circle</span>
            {t('settingsDetail.latestVersion')}
          </span>
          <button className={styles.btn} onClick={() => console.log('检查更新')}>
            <span className="material-icons-round">sync</span>
            {t('settingsDetail.checkUpdate')}
          </button>
        </div>
      </div>
      <div className={styles.row}>
        <div className={styles.label}>
          {t('settingsDetail.autoUpdate')}
          <small>{t('settingsDetail.autoUpdateDesc')}</small>
        </div>
        <button
          className={`${styles.toggle} ${cliAutoUpdate ? styles.on : ''}`}
          onClick={() => setCliAutoUpdate(!cliAutoUpdate)}
        ></button>
      </div>

      <div className={styles.sectionTitle}>
        <span className="material-icons-round">language</span>
        {t('settings.language')}
      </div>
      <div className={styles.row}>
        <div className={styles.label}>
          {t('settingsDetail.languageLabel')}
          <small>{t('settingsDetail.languageDesc')}</small>
        </div>
        <select
          className={styles.select}
          value={language}
          onChange={(e) => setLanguage(e.target.value as any)}
        >
          <option value="zh-CN">简体中文</option>
          <option value="zh-TW">繁體中文</option>
          <option value="en-US">English</option>
          <option value="ja-JP">日本語</option>
          <option value="ko-KR">한국어</option>
        </select>
      </div>

      <div className={styles.sectionTitle}>
        <span className="material-icons-round">palette</span>
        {t('settings.theme')}
      </div>
      <div className={styles.row}>
        <div className={styles.label}>
          {t('settingsDetail.themeLabel')}
          <small>{t('settingsDetail.themeDesc')}</small>
        </div>
        <select
          className={styles.select}
          value={theme}
          onChange={(e) => setTheme(e.target.value as any)}
        >
          <option value="idea">{t('settingsDetail.themeFollowIdea')}</option>
          <option value="dark">{t('settingsDetail.themeDark')}</option>
          <option value="light">{t('settingsDetail.themeLight')}</option>
          <option value="highContrast">{t('settingsDetail.themeHighContrast')}</option>
        </select>
      </div>
    </div>
  );
};

// 供应商设置
interface ProviderSettingsProps {
  onEdit: (provider?: any) => void;
  onDeleteConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

const ProviderSettings: React.FC<ProviderSettingsProps> = ({ onEdit, onDeleteConfirm }) => {
  const { t } = useI18n();
  const { providers, deleteProvider } = useConfigStore();

  const handleDelete = (id: string, name: string) => {
    onDeleteConfirm(
      t('provider.deleteProvider'),
      t('provider.deleteConfirm', name),
      () => deleteProvider(id)
    );
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle} style={{ justifyContent: 'space-between' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span className="material-icons-round">dns</span>
          {t('settingsDetail.providerList')}
        </span>
        <button
          className={`${styles.btn} ${styles.primary}`}
          onClick={() => onEdit()}
        >
          <span className="material-icons-round">add</span>
          {t('provider.addProvider')}
        </button>
      </div>
      {providers.map((provider) => (
        <div key={provider.id} className={styles.providerCard}>
          <div className={styles.providerInfo}>
            <span className={`${styles.providerDot} ${styles[provider.status]}`}></span>
            <div>
              <div className={styles.providerName}>{provider.name}</div>
              <div className={styles.providerUrl}>{provider.url}</div>
            </div>
          </div>
          <div className={styles.providerActions}>
            <button title={t('common.edit')} onClick={() => onEdit(provider)}>
              <span className="material-icons-round">edit</span>
            </button>
            <button title={t('common.exportJson')}>
              <span className="material-icons-round">download</span>
            </button>
            <button
              className={styles.danger}
              title={t('common.delete')}
              onClick={() => handleDelete(provider.id, provider.name)}
            >
              <span className="material-icons-round">delete_outline</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// Agent 设置
interface AgentSettingsProps {
  onEdit: (agent?: any) => void;
  onDeleteConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

const AgentSettings: React.FC<AgentSettingsProps> = ({ onEdit, onDeleteConfirm }) => {
  const { t } = useI18n();
  const { agents, deleteAgent } = useConfigStore();

  const handleDelete = (id: string, name: string) => {
    onDeleteConfirm(
      t('agent.deleteAgent'),
      t('agent.deleteConfirm', name),
      () => deleteAgent(id)
    );
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle} style={{ justifyContent: 'space-between' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span className="material-icons-round">smart_toy</span>
          {t('settingsDetail.agentList')}
        </span>
        <button
          className={`${styles.btn} ${styles.primary}`}
          onClick={() => onEdit()}
        >
          <span className="material-icons-round">add</span>
          {t('agent.addAgent')}
        </button>
      </div>
      {agents.map((agent) => (
        <div key={agent.id} className={styles.listCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
            <div className={styles.listCardIcon}>
              <span className="material-icons-round">smart_toy</span>
            </div>
            <div style={{ flex: 1, marginLeft: '10px' }}>
              <div className={styles.listCardName}>{agent.name}</div>
              <div className={styles.listCardDesc}>{agent.description}</div>
            </div>
          </div>
          <div className={styles.providerActions}>
            <button title={t('common.edit')} onClick={() => onEdit(agent)}>
              <span className="material-icons-round">edit</span>
            </button>
            <button title={t('common.exportJson')}>
              <span className="material-icons-round">download</span>
            </button>
            <button
              className={styles.danger}
              title={t('common.delete')}
              onClick={() => handleDelete(agent.id, agent.name)}
            >
              <span className="material-icons-round">delete_outline</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// Skill 设置
interface SkillSettingsProps {
  onEdit: (skill?: any) => void;
  onDeleteConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

const SkillSettings: React.FC<SkillSettingsProps> = ({ onEdit, onDeleteConfirm }) => {
  const { t } = useI18n();
  const { skills, deleteSkill } = useConfigStore();

  const handleDelete = (id: string, name: string) => {
    onDeleteConfirm(
      t('skill.deleteSkill'),
      t('skill.deleteConfirm', name),
      () => deleteSkill(id)
    );
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle} style={{ justifyContent: 'space-between' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span className="material-icons-round">bolt</span>
          {t('settingsDetail.skillList')}
        </span>
        <button
          className={`${styles.btn} ${styles.primary}`}
          onClick={() => onEdit()}
        >
          <span className="material-icons-round">add</span>
          {t('skill.addSkill')}
        </button>
      </div>
      {skills.map((skill) => (
        <div key={skill.id} className={styles.listCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
            <div className={styles.listCardIcon}>
              <span className="material-icons-round">bolt</span>
            </div>
            <div style={{ flex: 1, marginLeft: '10px' }}>
              <div className={styles.listCardName}>{skill.name}</div>
              <div className={styles.listCardDesc}>{skill.description}</div>
            </div>
          </div>
          <div className={styles.providerActions}>
            <button title={t('common.edit')} onClick={() => onEdit(skill)}>
              <span className="material-icons-round">edit</span>
            </button>
            <button title={t('common.exportJson')}>
              <span className="material-icons-round">download</span>
            </button>
            <button
              className={styles.danger}
              title={t('common.delete')}
              onClick={() => handleDelete(skill.id, skill.name)}
            >
              <span className="material-icons-round">delete_outline</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
