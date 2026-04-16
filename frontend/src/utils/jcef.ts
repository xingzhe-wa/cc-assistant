/**
 * JCEF 桥接工具
 * 定义前端与 Java 层的双向通信接口
 */

import type { MockProvider, MockModel, MockAgent, SendOptions } from '@/types/mock';

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
  setProviders: (providers: MockProvider[], models: Record<string, MockModel[]>, agents: MockAgent[]) => void;
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
    cefQuery?: {
      inject: (payload: string) => void;
    };
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
      window.cefQuery.inject(payload);
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

  sendMessage: (text: string, options: SendOptions) => {
    jcefBridge.send('sendMessage', { text, options });
  },

  stopGeneration: () => {
    jcefBridge.send('stopGeneration');
  },

  // 主题
  themeChange: (themeId: string) => {
    jcefBridge.send('themeChange', themeId);
  },

  // 语言
  languageChange: (locale: string) => {
    jcefBridge.send('languageChange', locale);
  },

  // 设置
  providerChange: (providerId: string) => {
    jcefBridge.send('providerChange', providerId);
  },

  modelChange: (modelId: string) => {
    jcefBridge.send('modelChange', modelId);
  },

  modeChange: (mode: string) => {
    jcefBridge.send('modeChange', mode);
  },

  agentChange: (agentId: string) => {
    jcefBridge.send('agentChange', agentId);
  },

  thinkChange: (enabled: boolean) => {
    jcefBridge.send('thinkChange', enabled);
  },

  // 会话
  toggleFavorite: (id: string, fav: boolean) => {
    jcefBridge.send('toggleFavorite', { id, fav });
  },

  renameSession: (id: string, title: string) => {
    jcefBridge.send('renameSession', { id, title });
  },

  deleteSession: (id: string) => {
    jcefBridge.send('deleteSession', id);
  },

  newSession: () => {
    jcefBridge.send('newSession');
  },

  // 增强
  enhancePrompt: (text: string) => {
    jcefBridge.send('enhancePrompt', text);
  }
};

// 检查是否在 JCEF 环境中
export const isInJcefEnvironment = (): boolean => {
  return typeof window !== 'undefined' && !!window.javaBridge;
};
