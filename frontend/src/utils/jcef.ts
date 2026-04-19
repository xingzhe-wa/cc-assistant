/**
 * JCEF 桥接工具
 * 定义前端与 Java 层的双向通信接口
 */

import type { SendOptions } from '@/types/mock';
import { dataService } from '@/services/dataService';
import type { Provider, Model, Skill, Agent } from '@/services/dataService';

// Java Bridge 接口
export interface JavaBridge {
  // 消息操作
  appendUserMessage: (id: string, content: string, timestamp?: string) => void;
  appendAIMessage: (id: string, content: string, timestamp?: string, thinking?: string) => void;
  appendStreamingContent: (role: string, content: string, messageId: string) => void;
  finishStreaming: (messageId: string) => void;
  clearMessages: () => void;
  showEmpty: () => void;

  // 主题
  applyTheme: (variables: Record<string, string>, isDark: boolean) => void;
  setTheme: (themeId: string) => void;

  // 国际化
  applyI18n: (messages: Record<string, string>) => void;

  // Provider/Model/Agent
  setProviders: (providers: Provider[], models: Record<string, Model[]>, agents: Agent[]) => void;

  // 会话管理
  onNewSession: (sessionId: string) => void;
  onSessionList: (sessions: string) => void;

  // Provider 管理
  onProviderCreate: (provider: string) => void;
  onProviderUpdate: (provider: string) => void;
  onProviderDelete: (providerId: string) => void;

  // Agent 管理
  onAgentCreate: (agent: string) => void;
  onAgentUpdate: (agent: string) => void;
  onAgentDelete: (agentId: string) => void;

  // Skill 管理
  onSkillCreate: (skill: string) => void;
  onSkillUpdate: (skill: string) => void;
  onSkillDelete: (skillId: string) => void;

  // 设置
  onSettingsSave: (settings: string) => void;
  onClosePlugin: () => void;
  onCheckCliUpdate: () => void;
}

// JS → Java 回调
export interface JcefCallbacks {
  onCopyMessage?: (id: string, content: string) => void;
  onQuoteMessage?: (id: string, content: string) => void;
  onRegenerate?: (id: string) => void;
  onRewind?: (id: string) => void;
  onCopyCode?: (code: string) => void;
  onSendMessage?: (text: string, options: SendOptions) => void;
  onStopGeneration?: () => void;
  onThemeChange?: (themeId: string) => void;
  onLanguageChange?: (locale: string) => void;
  onProviderChange?: (providerId: string) => void;
  onModelChange?: (modelId: string) => void;
  onModeChange?: (mode: string) => void;
  onAgentChange?: (agentId: string) => void;
  onThinkChange?: (enabled: boolean) => void;
  onToggleFavorite?: (id: string, fav: boolean) => void;
  onRenameSession?: (id: string, title: string) => void;
  onDeleteSession?: (id: string) => void;
  onNewSession?: () => void;
  onOpenSettings?: () => void;
  onEnhancePrompt?: (text: string) => void;
}

// 全局变量声明
declare global {
  interface Window {
    javaBridge?: JavaBridge;
    cefQuery?: (payload: string) => void;
  }
}

// JCEF 桥接器
export const jcefBridge = {
  // 发送消息到 Java
  send: (action: string, data?: unknown) => {
    if (typeof window !== 'undefined' && window.cefQuery) {
      const payload = data !== undefined
        ? `${action}:${JSON.stringify(data)}`
        : `${action}:`;
      window.cefQuery(payload);
    }
  },

  // 消息操作
  copyMessage: (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    jcefBridge.send('copyMessage', { id, content });
  },

  quoteMessage: (id: string, content: string) => {
    jcefBridge.send('quoteMessage', { id, content });
  },

  regenerateMessage: (id: string) => {
    jcefBridge.send('regenerate', { id });
  },

  rewindTo: (id: string) => {
    jcefBridge.send('rewind', { id });
  },

  // 发送消息
  sendMessage: (text: string, options?: SendOptions) => {
    jcefBridge.send('sendMessage', { text, options });
  },

  // 停止生成
  stopGeneration: () => {
    jcefBridge.send('stopGeneration');
  },

  // 会话操作
  newSession: () => {
    jcefBridge.send('newSession');
  },

  switchSession: (sessionId: string) => {
    jcefBridge.send('switchSession', { sessionId });
  },

  deleteSession: (sessionId: string) => {
    jcefBridge.send('deleteSession', { sessionId });
  },

  toggleFavorite: (sessionId: string) => {
    jcefBridge.send('toggleFavorite', { sessionId });
  },

  renameSession: (sessionId: string, title: string) => {
    jcefBridge.send('renameSession', { sessionId, title });
  },

  // 设置操作
  themeChange: (themeId: string) => {
    jcefBridge.send('themeChange', { themeId });
  },

  languageChange: (locale: string) => {
    jcefBridge.send('languageChange', { locale });
  },

  providerChange: (providerId: string) => {
    dataService.switchProvider(providerId);
    jcefBridge.send('providerChange', { providerId });
  },

  modelChange: (modelId: string) => {
    jcefBridge.send('modelChange', { modelId });
  },

  modeChange: (mode: string) => {
    jcefBridge.send('modeChange', { mode });
  },

  agentChange: (agentId: string) => {
    jcefBridge.send('agentChange', { agentId });
  },

  thinkChange: (enabled: boolean) => {
    jcefBridge.send('thinkChange', { enabled });
  },

  // Skill 操作
  createSkill: (skill: Partial<Skill>) => {
    dataService.createSkill(skill);
  },

  updateSkill: (skill: Partial<Skill>) => {
    dataService.updateSkill(skill);
  },

  deleteSkill: (skillId: string) => {
    dataService.deleteSkill(skillId);
  },

  // Agent 操作
  createAgent: (agent: Partial<Agent>) => {
    dataService.createAgent(agent);
  },

  updateAgent: (agent: Partial<Agent>) => {
    dataService.updateAgent(agent);
  },

  deleteAgent: (agentId: string) => {
    dataService.deleteAgent(agentId);
  },

  // Provider 操作
  createProvider: (provider: Partial<Provider>) => {
    dataService.createProvider(provider);
  },

  updateProvider: (provider: Partial<Provider>) => {
    dataService.updateProvider(provider);
  },

  deleteProvider: (providerId: string) => {
    dataService.deleteProvider(providerId);
  },

  // 强化提示词
  enhancePrompt: (text: string) => {
    jcefBridge.send('enhancePrompt', { text });
  },

  // 打开设置（可选指定 tab）
  openSettings: (tab?: string) => {
    if (tab) {
      jcefBridge.send('openSettings:' + tab);
    } else {
      jcefBridge.send('openSettings');
    }
  },

  // Skill 切换
  skillChange: (skillId: string) => {
    jcefBridge.send('skillChange', skillId);
  },

  // 关闭插件窗口
  closePlugin: () => {
    jcefBridge.send('closePlugin');
  },

  // 检查 CLI 更新
  checkCliUpdate: () => {
    jcefBridge.send('checkCliUpdate');
  }
};