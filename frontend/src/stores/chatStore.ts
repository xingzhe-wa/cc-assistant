import { create } from 'zustand';
import type { MockSession, MockMessage, Toast as ToastType, ToastType as ToastVariant, Attachment, AgentStatus } from '@/types/mock';
import type { PageType } from '@/pages/types';
import { mockSessions, createMockSession, mockDiffFiles, getMockModelsByProvider } from '@/mock';
import { jcefBridge } from '@/utils/jcef';

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
  currentProvider: 'p0',
  currentModel: 'claude-4.5',
  currentMode: 'auto',
  currentAgent: 'default',
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
      jcefBridge.toggleFavorite(id, !session.fav);
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
    set({ streaming, streamingContent: streaming ? content : '' });
  },

  appendStreamingContent: (content) => {
    set((state) => ({
      streamingContent: state.streamingContent + content
    }));
  },

  // Input Actions
  setInputValue: (value) => set({ inputValue: value }),

  sendMessage: () => {
    const { inputValue, activeSessionId, addMessage, setStreaming, appendStreamingContent, currentProvider, currentModel, currentMode, thinkEnabled, streamEnabled } = get();
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

    // Notify Java backend
    jcefBridge.sendMessage(inputValue, {
      stream: streamEnabled,
      think: thinkEnabled,
      mode: currentMode,
      model: currentModel,
      provider: currentProvider
    });

    // Mock AI response
    const mockResponses = [
      "好的，我来帮你分析这个问题。让我先看一下代码结构...\n\n根据代码分析，我发现了几个可以优化的地方：\n\n1. **性能优化**：可以在关键路径添加缓存\n2. **代码风格**：建议使用更现代的语法\n3. **错误处理**：建议增加异常捕获\n\n```kotlin\nval cache = mutableMapOf<String, Any>()\n```",
      "这是一个很好的问题！我建议从以下几个方面考虑：\n\n- 代码可读性\n- 性能表现\n- 可维护性\n\n让我给你展示一个示例实现：\n\n```typescript\nfunction optimize(data: any[]) {\n  return data.filter(item => item.active)\n}\n```\n\n还有其他需要帮助的吗？",
      "我来帮你检查一下这个问题。主要需要关注以下几点：\n\n1. 数据类型是否匹配\n2. 边界条件处理\n3. 异常情况捕获\n\n```diff\n- const result = data.map(item => item.value)\n+ const result = data\n+   .filter(item => item != null)\n+   .map(item => item.value)\n```"
    ];

    const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];

    // Simulate streaming
    let index = 0;
    const streamInterval = setInterval(() => {
      const chunk = randomResponse.slice(index, index + 5);
      if (chunk) {
        if (index === 0) {
          set({ agentStatus: 'working', statusMessage: 'Generating...' });
        }
        appendStreamingContent(chunk);
        index += 5;
      }
      if (index >= randomResponse.length) {
        clearInterval(streamInterval);
        setStreaming(false);
        set({ agentStatus: 'idle', statusMessage: '' });

        const aiMessage: MockMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: randomResponse,
          time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        };
        get().addMessage(activeSessionId, aiMessage);
      }
    }, 50);
  },

  stopGeneration: () => {
    set({ streaming: false, streamingContent: '' });
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
    const models = getMockModelsByProvider(id);
    const defaultModel = models[0]?.id || '';
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
