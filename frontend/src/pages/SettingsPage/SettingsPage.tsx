import React, { useState } from 'react';
import { useConfigStore } from '@/stores';
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
  label: string;
  group: string;
}

const settingsSections: SettingSection[] = [
  { id: 'basic', icon: 'tune', label: '基础设置', group: '通用' },
  { id: 'provider', icon: 'dns', label: '供应商管理', group: '集成' },
  { id: 'agent', icon: 'smart_toy', label: 'Agent', group: '集成' },
  { id: 'skill', icon: 'bolt', label: 'Skill', group: '集成' }
];

export const SettingsPage: React.FC<SettingsPageProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('basic');

  // 编辑弹窗状态
  const [providerModalOpen, setProviderModalOpen] = useState(false);
  const [agentModalOpen, setAgentModalOpen] = useState(false);
  const [skillModalOpen, setSkillModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

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

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onClose}>
          <span className="material-icons-round">arrow_back</span>
          返回
        </button>
        <h1 className={styles.pageTitle}>
          <span className="material-icons-round">settings</span>
          设置
        </h1>
      </header>
      <div className={styles.main}>
        <nav className={styles.nav}>
          {settingsSections.map((section) => (
            <React.Fragment key={section.id}>
              {section.group && (
                <div className={styles.navGroup}>{section.group}</div>
              )}
              <button
                className={`${styles.navItem} ${activeTab === section.id ? styles.active : ''}`}
                onClick={() => setActiveTab(section.id)}
              >
                <span className="material-icons-round">{section.icon}</span>
                {section.label}
              </button>
            </React.Fragment>
          ))}
        </nav>
        <div className={styles.content}>
          {activeTab === 'basic' && <BasicSettings />}
          {activeTab === 'provider' && (
            <ProviderSettings onEdit={handleEditProvider} />
          )}
          {activeTab === 'agent' && (
            <AgentSettings onEdit={handleEditAgent} />
          )}
          {activeTab === 'skill' && (
            <SkillSettings onEdit={handleEditSkill} />
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
    </div>
  );
};

// 基础设置
const BasicSettings: React.FC = () => {
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
        CLI 版本
      </div>
      <div className={styles.row}>
        <div className={styles.label}>
          Claude Code CLI
          <small>当前安装版本 v{cliVersion}</small>
        </div>
        <div className={styles.ctrl}>
          <span style={{ fontSize: '11px', color: 'var(--gn)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span className="material-icons-round" style={{ fontSize: '13px' }}>check_circle</span>
            已是最新
          </span>
          <button className={styles.btn} onClick={() => console.log('检查更新')}>
            <span className="material-icons-round">sync</span>
            检查更新
          </button>
        </div>
      </div>
      <div className={styles.row}>
        <div className={styles.label}>
          自动更新
          <small>启动 IDE 时自动检测并更新 CLI</small>
        </div>
        <button
          className={`${styles.toggle} ${cliAutoUpdate ? styles.on : ''}`}
          onClick={() => setCliAutoUpdate(!cliAutoUpdate)}
        ></button>
      </div>

      <div className={styles.sectionTitle}>
        <span className="material-icons-round">language</span>
        国际化
      </div>
      <div className={styles.row}>
        <div className={styles.label}>
          界面语言
          <small>重启插件后生效</small>
        </div>
        <select
          className={styles.select}
          value={language}
          onChange={(e) => setLanguage(e.target.value as any)}
        >
          <option value="zh-CN">简体中文</option>
          <option value="zh-TW">繁體中文</option>
          <option value="en">English</option>
          <option value="ja">日本語</option>
        </select>
      </div>

      <div className={styles.sectionTitle}>
        <span className="material-icons-round">palette</span>
        主题与外观
      </div>
      <div className={styles.row}>
        <div className={styles.label}>
          界面主题
          <small>跟随 IDEA 主题自动切换</small>
        </div>
        <select
          className={styles.select}
          value={theme}
          onChange={(e) => setTheme(e.target.value as any)}
        >
          <option value="idea">跟随 IDEA</option>
          <option value="dark1">深色主题 1</option>
          <option value="dark2">深色主题 2</option>
          <option value="light">浅色主题</option>
        </select>
      </div>
    </div>
  );
};

// 供应商设置
interface ProviderSettingsProps {
  onEdit: (provider?: any) => void;
}

const ProviderSettings: React.FC<ProviderSettingsProps> = ({ onEdit }) => {
  const { providers, deleteProvider } = useConfigStore();

  const handleDelete = (id: string, name: string) => {
    if (confirm(`确定删除供应商 "${name}" 吗？`)) {
      deleteProvider(id);
    }
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle} style={{ justifyContent: 'space-between' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span className="material-icons-round">dns</span>
          供应商列表
        </span>
        <button
          className={`${styles.btn} ${styles.primary}`}
          onClick={() => onEdit()}
        >
          <span className="material-icons-round">add</span>
          新增供应商
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
            <button title="编辑" onClick={() => onEdit(provider)}>
              <span className="material-icons-round">edit</span>
            </button>
            <button title="导出 JSON">
              <span className="material-icons-round">download</span>
            </button>
            <button
              className={styles.danger}
              title="删除"
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
}

const AgentSettings: React.FC<AgentSettingsProps> = ({ onEdit }) => {
  const { agents, deleteAgent } = useConfigStore();

  const handleDelete = (id: string, name: string) => {
    if (confirm(`确定删除 Agent "${name}" 吗？`)) {
      deleteAgent(id);
    }
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle} style={{ justifyContent: 'space-between' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span className="material-icons-round">smart_toy</span>
          Agent 列表
        </span>
        <button
          className={`${styles.btn} ${styles.primary}`}
          onClick={() => onEdit()}
        >
          <span className="material-icons-round">add</span>
          新增 Agent
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
            <button title="编辑" onClick={() => onEdit(agent)}>
              <span className="material-icons-round">edit</span>
            </button>
            <button title="导出 JSON">
              <span className="material-icons-round">download</span>
            </button>
            <button
              className={styles.danger}
              title="删除"
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
}

const SkillSettings: React.FC<SkillSettingsProps> = ({ onEdit }) => {
  const { skills, deleteSkill } = useConfigStore();

  const handleDelete = (id: string, name: string) => {
    if (confirm(`确定删除 Skill "${name}" 吗？`)) {
      deleteSkill(id);
    }
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle} style={{ justifyContent: 'space-between' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span className="material-icons-round">bolt</span>
          Skill 列表
        </span>
        <button
          className={`${styles.btn} ${styles.primary}`}
          onClick={() => onEdit()}
        >
          <span className="material-icons-round">add</span>
          新增 Skill
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
            <button title="编辑" onClick={() => onEdit(skill)}>
              <span className="material-icons-round">edit</span>
            </button>
            <button title="导出 JSON">
              <span className="material-icons-round">download</span>
            </button>
            <button
              className={styles.danger}
              title="删除"
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
