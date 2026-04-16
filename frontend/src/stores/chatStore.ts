import { create } from 'zustand';
import type { MockSession, MockMessage, Toast as ToastType, ToastType as ToastVariant } from '@/types/mock';
import { mockSessions, createMockSession, mockDiffFiles } from '@/mock';

interface ChatState {
  // Sessions
  sessions: MockSession[];
  activeSessionId: string | null;

  // Streaming
  streaming: boolean;
  streamingContent: string;

  // Diff
  diffFiles: typeof mockDiffFiles;

  // Toast
  toasts: ToastType[];

  // Input
  inputValue: string;

  // UI State
  historyOpen: boolean;
  favoriteOpen: boolean;
  settingsOpen: boolean;

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

  // Message Actions
  addMessage: (sessionId: string, message: MockMessage) => void;
  setStreaming: (streaming: boolean, content?: string) => void;
  appendStreamingContent: (content: string) => void;

  // Input Actions
  setInputValue: (value: string) => void;
  sendMessage: () => void;
  stopGeneration: () => void;

  // UI Actions
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
}

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial State
  sessions: mockSessions,
  activeSessionId: mockSessions[0]?.id || null,
  streaming: false,
  streamingContent: '',
  diffFiles: mockDiffFiles,
  toasts: [],
  inputValue: '',
  historyOpen: false,
  favoriteOpen: false,
  settingsOpen: false,
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
      activeSessionId: newSession.id
    }));
  },

  closeSession: (id) => {
    const { sessions, activeSessionId } = get();
    if (sessions.length <= 1) return;

    const newSessions = sessions.filter((s) => s.id !== id);
    const newActiveId = activeSessionId === id
      ? newSessions[0]?.id || null
      : activeSessionId;

    set({ sessions: newSessions, activeSessionId: newActiveId });
  },

  deleteSession: (id) => {
    const { sessions, activeSessionId } = get();
    if (sessions.length <= 1) return;

    const newSessions = sessions.filter((s) => s.id !== id);
    const newActiveId = activeSessionId === id
      ? newSessions[0]?.id || null
      : activeSessionId;

    set({ sessions: newSessions, activeSessionId: newActiveId });
  },

  toggleSessionFavorite: (id) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, fav: !s.fav } : s
      )
    }));
  },

  // Message Actions
  addMessage: (sessionId, message) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId
          ? { ...s, msgs: [...s.msgs, message], qc: s.qc + (message.role === 'user' ? 1 : 0) }
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
    const { inputValue, activeSessionId, addMessage, setStreaming, appendStreamingContent } = get();
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
        appendStreamingContent(chunk);
        index += 5;
      }
      if (index >= randomResponse.length) {
        clearInterval(streamInterval);
        setStreaming(false);

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
  setHistoryOpen: (open) => set({ historyOpen: open }),
  setFavoriteOpen: (open) => set({ favoriteOpen: open }),
  setSettingsOpen: (open) => set({ settingsOpen: open }),

  toggleHistory: () => set((state) => ({
    historyOpen: !state.historyOpen,
    favoriteOpen: false
  })),

  toggleFavoritePanel: () => set((state) => ({
    favoriteOpen: !state.favoriteOpen,
    historyOpen: false
  })),

  toggleStream: () => set((state) => ({ streamEnabled: !state.streamEnabled })),
  toggleThink: () => set((state) => ({ thinkEnabled: !state.thinkEnabled })),

  // Settings Actions
  setCurrentProvider: (id) => set({ currentProvider: id }),
  setCurrentModel: (id) => set({ currentModel: id }),
  setCurrentMode: (mode) => set({ currentMode: mode }),
  setCurrentAgent: (id) => set({ currentAgent: id }),

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

  // Enhance
  enhancePrompt: () => {
    const { inputValue, setInputValue, addToast } = get();
    if (!inputValue.trim()) {
      addToast('请先输入内容', 'error');
      return;
    }
    setInputValue(`请优化以下代码：\n${inputValue}`);
    addToast('提示词已强化', 'success');
  }
}));
