import { create } from 'zustand';
import type { MockSession, MockMessage, Toast as ToastType, ToastType as ToastVariant, Attachment, AgentStatus } from '@/types/mock';
import type { PageType } from '@/pages/types';
import { mockSessions, createMockSession, mockDiffFiles } from '@/mock';
import { jcefBridge } from '@/utils/jcef';
import { useConfigStore } from './chatStoreExtensions';

interface ChatState {
  // Sessions
  sessions: MockSession[];
  activeSessionId: string | null;
  // 打开的Tab列表（Tab页签中显示的会话ID）
  openTabs: string[];

  // Streaming
  streaming: boolean;
  streamingContent: string;

  // Diff
  diffFiles: typeof mockDiffFiles;

  // AI Status
  agentStatus: AgentStatus;
  statusMessage: string;
  subAgentName: string | null;

  // Toast
  toasts: ToastType[];

  // Input
  inputValue: string;

  // Attachments
  attachments: Attachment[];

  // UI State
  currentPage: PageType;
  historyOpen: boolean;
  favoriteOpen: boolean;
  settingsOpen: boolean;
  enhancePanelOpen: boolean;

  // Settings
  streamEnabled: boolean;
  thinkEnabled: boolean;
  currentProvider: string;
  currentModel: string;
  currentMode: 'auto' | 'plan' | 'agent';
  currentAgent: string;
  currentSkill: string;
  contextUsed: number;

  // Actions
  setActiveSession: (id: string) => void;
  createSession: () => void;
  closeSession: (id: string) => void;
  deleteSession: (id: string) => void;
  toggleSessionFavorite: (id: string) => void;
  renameSession: (id: string, title: string) => void;

  // Message Actions
  addMessage: (sessionId: string, message: MockMessage) => void;
  setStreaming: (streaming: boolean, content?: string) => void;
  appendStreamingContent: (content: string) => void;

  // Input Actions
  setInputValue: (value: string) => void;
  sendMessage: () => void;
  stopGeneration: () => void;

  // UI Actions
  setCurrentPage: (page: PageType) => void;
  setHistoryOpen: (open: boolean) => void;
  setFavoriteOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  toggleHistory: () => void;
  toggleFavoritePanel: () => void;
  toggleStream: () => void;
  toggleThink: () => void;

  // Settings Actions
  setCurrentProvider: (id: string) => void;
  setCurrentModel: (id: string) => void;
  setCurrentMode: (mode: 'auto' | 'plan' | 'agent') => void;
  setCurrentAgent: (id: string) => void;
  setCurrentSkill: (id: string) => void;

  // Toast Actions
  addToast: (message: string, type?: ToastVariant) => void;
  removeToast: (id: string) => void;

  // Enhance
  enhancePrompt: () => void;
  setEnhancePanelOpen: (open: boolean) => void;
  applyPromptEnhance: (enhancedText: string) => void;

  // Attachment Actions
  addAttachment: (file: File) => void;
  addAttachments: (files: File[]) => void;
  removeAttachment: (id: string) => void;
  clearAttachments: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial State
  sessions: mockSessions,
  activeSessionId: mockSessions[0]?.id || null,
  openTabs: mockSessions.map(s => s.id), // 所有会话默认显示为Tab
  streaming: false,
  streamingContent: '',
  diffFiles: mockDiffFiles,
  agentStatus: 'idle' as AgentStatus,
  statusMessage: '',
  subAgentName: null,
  toasts: [],
  inputValue: '',
  attachments: [],
  currentPage: 'chat',
  historyOpen: false,
  favoriteOpen: false,
  settingsOpen: false,
  enhancePanelOpen: false,
  streamEnabled: true,
  thinkEnabled: false,
  currentProvider: 'claude',
  currentModel: 'claude-4.5',
  currentMode: 'auto',
  currentAgent: 'default',
  currentSkill: 'default',
  contextUsed: 30,

  // Session Actions
  setActiveSession: (id) => set({ activeSessionId: id }),

  createSession: () => {
    const newSession = createMockSession('新对话');
    set((state) => ({
      sessions: [...state.sessions, newSession],
      openTabs: [...state.openTabs, newSession.id],
      activeSessionId: newSession.id
    }));
    jcefBridge.newSession();
  },

  closeSession: (id) => {
    const { openTabs, activeSessionId } = get();

    // 如果只剩最后一个Tab，通知Java关闭/收起插件
    if (openTabs.length <= 1) {
      jcefBridge.closePlugin();
      return;
    }

    // 从Tab列表中移除，不删除会话记录
    const newOpenTabs = openTabs.filter(tabId => tabId !== id);
    const currentIndex = openTabs.findIndex(tabId => tabId === id);
    const newActiveId = activeSessionId === id
      ? (newOpenTabs[currentIndex] || newOpenTabs[currentIndex - 1] || null)
      : activeSessionId;

    set({ openTabs: newOpenTabs, activeSessionId: newActiveId });
  },

  deleteSession: (id) => {
    const { sessions, activeSessionId } = get();
    if (sessions.length <= 1) return;

    const newSessions = sessions.filter((s) => s.id !== id);
    const newActiveId = activeSessionId === id
      ? newSessions[0]?.id || null
      : activeSessionId;

    set({ sessions: newSessions, activeSessionId: newActiveId });
    jcefBridge.deleteSession(id);
  },

  toggleSessionFavorite: (id) => {
    const session = get().sessions.find((s) => s.id === id);
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, fav: !s.fav } : s
      )
    }));
    if (session) {
      jcefBridge.toggleFavorite(id);
    }
  },

  renameSession: (id, title) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, title } : s
      )
    }));
    jcefBridge.renameSession(id, title);
  },

  // Message Actions
  addMessage: (sessionId, message) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              msgs: [...s.msgs, message],
              qc: s.qc + (message.role === 'user' ? 1 : 0),
              hasFirstMessage: true
            }
          : s
      )
    }));
  },

  setStreaming: (streaming, content = '') => {
    // 会话级别隔离：只在当前活动会话上设置 streaming 状态
    const { activeSessionId } = get();
    if (!activeSessionId) return;

    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === activeSessionId
          ? { ...s, streaming: streaming, streamingContent: streaming ? content : '' }
          : s
      )
    }));
  },

  appendStreamingContent: (content) => {
    // 会话级别隔离：追加到当前活动会话
    const { activeSessionId } = get();
    if (!activeSessionId) return;

    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === activeSessionId
          ? { ...s, streamingContent: (s.streamingContent || '') + content }
          : s
      )
    }));
  },

  // Input Actions
  setInputValue: (value) => set({ inputValue: value }),

  sendMessage: () => {
    const { inputValue, activeSessionId, addMessage, setStreaming, currentProvider, currentModel, currentMode, currentAgent, thinkEnabled, streamEnabled } = get();
    if (!inputValue.trim() || !activeSessionId) return;

    const userMessage: MockMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    };

    addMessage(activeSessionId, userMessage);
    set({ inputValue: '' });
    setStreaming(true, '');
    set({ agentStatus: 'thinking', statusMessage: 'Analyzing...' });

    // 通知 Java 后端处理消息
    // AI 响应将通过 JCEF 回调返回，不会在这里 mock
    jcefBridge.sendMessage(inputValue, {
      stream: streamEnabled,
      think: thinkEnabled,
      mode: currentMode,
      model: currentModel,
      provider: currentProvider,
      agent: currentAgent
    });
  },

  stopGeneration: () => {
    // 会话级别隔离：停止当前活动会话的流式输出
    const { activeSessionId } = get();
    if (!activeSessionId) return;

    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === activeSessionId
          ? { ...s, streaming: false, streamingContent: '' }
          : s
      )
    }));
  },

  // UI Actions
  setCurrentPage: (page) => set({ currentPage: page }),
  setHistoryOpen: (open) => set({ historyOpen: open }),
  setFavoriteOpen: (open) => set({ favoriteOpen: open }),
  setSettingsOpen: (open) => set({ settingsOpen: open, currentPage: open ? 'settings' : 'chat' }),

  toggleHistory: () => set((state) => ({
    currentPage: state.currentPage === 'history' ? 'chat' : 'history',
    historyOpen: state.currentPage !== 'history',
    favoriteOpen: false
  })),

  toggleFavoritePanel: () => set((state) => ({
    currentPage: state.currentPage === 'favorite' ? 'chat' : 'favorite',
    favoriteOpen: state.currentPage !== 'favorite',
    historyOpen: false
  })),

  toggleStream: () => {
    const newValue = !get().streamEnabled;
    set({ streamEnabled: newValue });
  },
  toggleThink: () => {
    const newValue = !get().thinkEnabled;
    set({ thinkEnabled: newValue });
    jcefBridge.thinkChange(newValue);
  },

  // Settings Actions
  setCurrentProvider: (id) => {
    // 从 configStore 获取 provider 的 models
    const { providers } = useConfigStore.getState();
    const provider = providers.find(p => p.id === id);
    const models = provider?.models;
    // 优先使用 provider 配置的 default model，否则使用第一个可用 model
    let defaultModel = '';
    if (models) {
      if (models.default) defaultModel = models.default;
      else if (models.opus) defaultModel = models.opus;
      else if (models.max) defaultModel = models.max;
    }
    set({ currentProvider: id, currentModel: defaultModel });
    jcefBridge.providerChange(id);
  },
  setCurrentModel: (id) => {
    set({ currentModel: id });
    jcefBridge.modelChange(id);
  },
  setCurrentMode: (mode) => {
    set({ currentMode: mode });
    jcefBridge.modeChange(mode);
  },
  setCurrentAgent: (id) => {
    set({ currentAgent: id });
    jcefBridge.agentChange(id);
  },
  setCurrentSkill: (id) => {
    set({ currentSkill: id });
    jcefBridge.skillChange(id);
  },

  // Toast Actions
  addToast: (message, type = 'info') => {
    const id = `toast-${Date.now()}`;
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }]
    }));
    setTimeout(() => get().removeToast(id), 3000);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    }));
  },

  // Attachment Actions
  addAttachment: (file: File) => {
    const id = `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const isImage = file.type.startsWith('image/');

    if (isImage) {
      const reader = new FileReader();
      reader.onload = () => {
        const attachment: Attachment = {
          id,
          name: file.name,
          type: 'image',
          dataUrl: reader.result as string,
          size: file.size,
        };
        set((state) => ({ attachments: [...state.attachments, attachment] }));
      };
      reader.readAsDataURL(file);
    } else {
      const attachment: Attachment = {
        id,
        name: file.name,
        type: 'file',
        size: file.size,
      };
      set((state) => ({ attachments: [...state.attachments, attachment] }));
    }
  },

  addAttachments: (files: File[]) => {
    files.forEach((file) => get().addAttachment(file));
  },

  removeAttachment: (id: string) => {
    set((state) => ({
      attachments: state.attachments.filter((a) => a.id !== id),
    }));
  },

  clearAttachments: () => {
    set({ attachments: [] });
  },

  // Enhance
  enhancePrompt: () => {
    const { inputValue, addToast } = get();
    if (!inputValue.trim()) {
      addToast('请先输入内容', 'error');
      return;
    }
    set({ enhancePanelOpen: true });
  },

  setEnhancePanelOpen: (open: boolean) => {
    set({ enhancePanelOpen: open });
  },

  applyPromptEnhance: (enhancedText: string) => {
    set({ inputValue: enhancedText, enhancePanelOpen: false });
    jcefBridge.enhancePrompt(enhancedText);
  }
}));
