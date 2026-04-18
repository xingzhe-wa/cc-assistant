/**
 * Store 扩展 - 配置相关操作
 * 这个文件包含与设置页面相关的状态和操作
 */

import { create } from 'zustand';
import type { Locale } from '@/i18n/types';
import type { ThemeId } from '@/theme/types';
import { jcefBridge } from '@/utils/jcef';

interface ConfigState {
  // CLI 配置
  cliVersion: string;
  cliAutoUpdate: boolean;

  // 国际化
  language: Locale;

  // 主题
  theme: ThemeId;
  chatBackground: 'default' | 'color' | 'image';
  messageBubbleColor: string;
  codeBlockColor: string;

  // 供应商
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

  // Agents
  agents: Array<{
    id: string;
    name: string;
    description: string;
    systemPrompt: string;
    scope?: 'global' | 'project';
  }>;

  // Skills
  skills: Array<{
    id: string;
    name: string;
    description: string;
    triggerRule: string;
    scope?: 'global' | 'project';
  }>;

  // Actions
  setCliVersion: (version: string) => void;
  setCliAutoUpdate: (enabled: boolean) => void;
  setLanguage: (lang: Locale) => void;
  setTheme: (theme: ThemeId) => void;
  setChatBackground: (bg: ConfigState['chatBackground']) => void;
  setMessageBubbleColor: (color: string) => void;
  setCodeBlockColor: (color: string) => void;

  // Provider Actions
  addProvider: (provider: Omit<ConfigState['providers'][0], 'id'>) => void;
  updateProvider: (id: string, provider: Partial<ConfigState['providers'][0]>) => void;
  deleteProvider: (id: string) => void;

  // Agent Actions
  addAgent: (agent: Omit<ConfigState['agents'][0], 'id'>) => void;
  updateAgent: (id: string, agent: Partial<ConfigState['agents'][0]>) => void;
  deleteAgent: (id: string) => void;

  // Skill Actions
  addSkill: (skill: Omit<ConfigState['skills'][0], 'id'>) => void;
  updateSkill: (id: string, skill: Partial<ConfigState['skills'][0]>) => void;
  deleteSkill: (id: string) => void;

  // Backend data injection
  setAgentsFromBackend: (agents: Array<Record<string, unknown>>) => void;
  setSkillsFromBackend: (skills: Array<Record<string, unknown>>) => void;
  setProvidersFromBackend: (providers: Array<Record<string, unknown>>) => void;
  setModelsFromBackend: (models: Record<string, Array<Record<string, unknown>>>) => void;
}

export const useConfigStore = create<ConfigState>((set) => ({
  // Initial State
  cliVersion: '1.0.28',
  cliAutoUpdate: true,
  language: 'zh-CN',
  theme: 'idea',
  chatBackground: 'default',
  messageBubbleColor: '#1a1b20',
  codeBlockColor: '#111214',
  providers: [
    {
      id: 'p0',
      name: 'Claude',
      url: 'https://api.anthropic.com',
      apiKey: 'sk-ant-***',
      models: {
        default: 'claude-4.5',
        opus: 'claude-opus-4',
        max: 'claude-max'
      },
      status: 'ok'
    }
  ],
  agents: [
    {
      id: 'a0',
      name: '代码助手',
      description: '专注于代码编写、优化和调试',
      systemPrompt: '你是一个代码助手。'
    }
  ],
  skills: [
    {
      id: 'sk0',
      name: '代码审查',
      description: '对代码进行静态分析和质量评估',
      triggerRule: '关键词触发'
    }
  ],

  // Actions
  setCliVersion: (version) => set({ cliVersion: version }),
  setCliAutoUpdate: (enabled) => set({ cliAutoUpdate: enabled }),
  setLanguage: (lang) => {
    set({ language: lang });
    jcefBridge.languageChange(lang);
  },
  setTheme: (theme) => {
    set({ theme });
    jcefBridge.themeChange(theme);
  },
  setChatBackground: (bg) => set({ chatBackground: bg }),
  setMessageBubbleColor: (color) => set({ messageBubbleColor: color }),
  setCodeBlockColor: (color) => set({ codeBlockColor: color }),

  addProvider: (provider) => {
    const newProvider = { ...provider, id: `p${Date.now()}` };
    set((state) => ({
      providers: [...state.providers, newProvider]
    }));
    jcefBridge.send('providerCreate', newProvider);
  },

  updateProvider: (id, provider) => {
    set((state) => ({
      providers: state.providers.map((p) => (p.id === id ? { ...p, ...provider } : p))
    }));
    const updated = { ...provider, id };
    jcefBridge.send('providerUpdate', updated);
  },

  deleteProvider: (id) => {
    set((state) => ({
      providers: state.providers.filter((p) => p.id !== id)
    }));
    jcefBridge.send('providerDelete', id);
  },

  addAgent: (agent) => {
    const newAgent = { ...agent, id: `a${Date.now()}` };
    set((state) => ({
      agents: [...state.agents, newAgent]
    }));
    jcefBridge.send('agentCreate', newAgent);
  },

  updateAgent: (id, agent) => {
    set((state) => ({
      agents: state.agents.map((a) => (a.id === id ? { ...a, ...agent } : a))
    }));
    const updated = { ...agent, id };
    jcefBridge.send('agentUpdate', updated);
  },

  deleteAgent: (id) => {
    set((state) => ({
      agents: state.agents.filter((a) => a.id !== id)
    }));
    jcefBridge.send('agentDelete', id);
  },

  addSkill: (skill) => {
    const newSkill = { ...skill, id: `sk${Date.now()}` };
    set((state) => ({
      skills: [...state.skills, newSkill]
    }));
    jcefBridge.send('skillCreate', newSkill);
  },

  updateSkill: (id, skill) => {
    set((state) => ({
      skills: state.skills.map((s) => (s.id === id ? { ...s, ...skill } : s))
    }));
    const updated = { ...skill, id };
    jcefBridge.send('skillUpdate', updated);
  },

  deleteSkill: (id) => {
    set((state) => ({
      skills: state.skills.filter((s) => s.id !== id)
    }));
    jcefBridge.send('skillDelete', id);
  },

  // Backend data injection — merge scanned skills/agents into store
  setAgentsFromBackend: (backendAgents) => {
    set((state) => {
      const mapped = backendAgents.map((a: Record<string, unknown>): ConfigState['agents'][0] => ({
        id: String(a.id || ''),
        name: String(a.name || ''),
        description: String(a.description || ''),
        systemPrompt: String(a.description || ''),
        scope: (a.scope === 'global' || a.scope === 'project') ? a.scope : undefined,
      }));
      const existingIds = new Set(mapped.map(a => a.id));
      const merged: ConfigState['agents'] = [
        ...state.agents.filter(a => !existingIds.has(a.id)),
        ...mapped,
      ];
      return { agents: merged };
    });
  },

  setSkillsFromBackend: (backendSkills) => {
    set((state) => {
      const mapped = backendSkills.map((s: Record<string, unknown>): ConfigState['skills'][0] => ({
        id: String(s.id || ''),
        name: String(s.name || ''),
        description: String(s.description || ''),
        triggerRule: String(s.trigger || ''),
        scope: (s.scope === 'global' || s.scope === 'project') ? s.scope : undefined,
      }));
      const existingIds = new Set(mapped.map(s => s.id));
      const merged: ConfigState['skills'] = [
        ...state.skills.filter(s => !existingIds.has(s.id)),
        ...mapped,
      ];
      return { skills: merged };
    });
  },

  setProvidersFromBackend: (backendProviders) => {
    set((state) => {
      const mapped = backendProviders.map((p: Record<string, unknown>): ConfigState['providers'][0] => ({
        id: String(p.id || ''),
        name: String(p.name || ''),
        url: String(p.url || ''),
        apiKey: String(p.key || ''),
        models: {
          default: '',
          opus: '',
          max: '',
        },
        status: (p.st === 'ok' || p.st === 'err' || p.st === 'off') ? p.st : 'ok',
      }));
      const existingIds = new Set(mapped.map(p => p.id));
      const merged: ConfigState['providers'] = [
        ...state.providers.filter(p => !existingIds.has(p.id)),
        ...mapped,
      ];
      return { providers: merged };
    });
  },

  setModelsFromBackend: (_models) => {
    // Models are stored per-provider in configStore as part of provider.models
    // The current model is selected in chatStore.currentModel
    // This method can be extended if models need separate tracking
  }
}));
