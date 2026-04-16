/**
 * Store 扩展 - 配置相关操作
 * 这个文件包含与设置页面相关的状态和操作
 */

import { create } from 'zustand';

interface ConfigState {
  // CLI 配置
  cliVersion: string;
  cliAutoUpdate: boolean;

  // 国际化
  language: 'zh-CN' | 'zh-TW' | 'en' | 'ja';

  // 主题
  theme: 'idea' | 'dark1' | 'dark2' | 'light';
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
  }>;

  // Skills
  skills: Array<{
    id: string;
    name: string;
    description: string;
    triggerRule: string;
  }>;

  // Actions
  setCliVersion: (version: string) => void;
  setCliAutoUpdate: (enabled: boolean) => void;
  setLanguage: (lang: ConfigState['language']) => void;
  setTheme: (theme: ConfigState['theme']) => void;
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
  setLanguage: (lang) => set({ language: lang }),
  setTheme: (theme) => set({ theme }),
  setChatBackground: (bg) => set({ chatBackground: bg }),
  setMessageBubbleColor: (color) => set({ messageBubbleColor: color }),
  setCodeBlockColor: (color) => set({ codeBlockColor: color }),

  addProvider: (provider) => set((state) => ({
    providers: [...state.providers, { ...provider, id: `p${Date.now()}` }]
  })),

  updateProvider: (id, provider) => set((state) => ({
    providers: state.providers.map((p) => (p.id === id ? { ...p, ...provider } : p))
  })),

  deleteProvider: (id) => set((state) => ({
    providers: state.providers.filter((p) => p.id !== id)
  })),

  addAgent: (agent) => set((state) => ({
    agents: [...state.agents, { ...agent, id: `a${Date.now()}` }]
  })),

  updateAgent: (id, agent) => set((state) => ({
    agents: state.agents.map((a) => (a.id === id ? { ...a, ...agent } : a))
  })),

  deleteAgent: (id) => set((state) => ({
    agents: state.agents.filter((a) => a.id !== id)
  })),

  addSkill: (skill) => set((state) => ({
    skills: [...state.skills, { ...skill, id: `sk${Date.now()}` }]
  })),

  updateSkill: (id, skill) => set((state) => ({
    skills: state.skills.map((s) => (s.id === id ? { ...s, ...skill } : s))
  })),

  deleteSkill: (id) => set((state) => ({
    skills: state.skills.filter((s) => s.id !== id)
  }))
}));
