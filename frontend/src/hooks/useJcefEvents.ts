/**
 * JCEF 事件监听 Hook
 * 监听 Java → JS 的全局对象调用（CCChat、CCApp、CCProviders）
 */
import { useEffect } from 'react';
import { useChatStore } from '@/stores';

export const useJcefEvents = () => {
  const { addMessage, setStreaming, appendStreamingContent } = useChatStore();

  useEffect(() => {
    // 监听 CCChat.appendMessage / appendStreamingContent / finishStreaming
    const handleMessage = (e: CustomEvent) => {
      const { type, role, content, id, timestamp, thinking } = e.detail;

      switch (type) {
        case 'append': {
          // 添加完整消息
          const activeId = id || `msg-${Date.now()}`;
          const newMessage = {
            id: activeId,
            role: role as 'user' | 'assistant',
            content,
            time: timestamp || new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
            thinking
          };
          // 添加到当前活动会话
          const activeSessionId = useChatStore.getState().activeSessionId;
          if (activeSessionId) {
            useChatStore.getState().addMessage(activeSessionId, newMessage);
          }
          break;
        }
        case 'clear': {
          // 清空消息
          const activeSessionId = useChatStore.getState().activeSessionId;
          if (activeSessionId) {
            useChatStore.setState((state) => ({
              sessions: state.sessions.map((s) =>
                s.id === activeSessionId ? { ...s, msgs: [] } : s
              )
            }));
          }
          break;
        }
        case 'empty': {
          // 显示空状态
          break;
        }
      }
    };

    // 监听 CCStream 流式消息
    const handleStream = (e: CustomEvent) => {
      const { type, content, messageId } = e.detail;

      switch (type) {
        case 'append': {
          // 开始流式输出或追加内容
          if (!useChatStore.getState().streaming) {
            // 首次开始流式
            setStreaming(true, content || '');
          } else {
            // 追加内容
            appendStreamingContent(content || '');
          }
          break;
        }
        case 'finish': {
          // 完成流式输出，将内容保存为消息
          const { streamingContent } = useChatStore.getState();
          if (streamingContent) {
            const activeSessionId = useChatStore.getState().activeSessionId;
            if (activeSessionId) {
              const aiMessage = {
                id: messageId || `ai-${Date.now()}`,
                role: 'assistant' as const,
                content: streamingContent,
                time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
              };
              useChatStore.getState().addMessage(activeSessionId, aiMessage);
            }
          }
          setStreaming(false);
          break;
        }
      }
    };

    // 监听 CCApp 主题变更
    const handleTheme = (e: CustomEvent) => {
      console.log('[JCEF] Theme change:', e.detail);
      // 主题变量已在 CCApp.applyTheme 中处理
    };

    // 监听 CCProviders 数据变更
    const handleProviders = (e: CustomEvent) => {
      console.log('[JCEF] Providers data:', e.detail);
      // 可以更新 store 中的 providers 数据
    };

    // 注册事件监听
    window.addEventListener('cc-message', handleMessage as EventListener);
    window.addEventListener('cc-stream', handleStream as EventListener);
    window.addEventListener('cc-theme', handleTheme as EventListener);
    window.addEventListener('cc-providers', handleProviders as EventListener);

    // 清理
    return () => {
      window.removeEventListener('cc-message', handleMessage as EventListener);
      window.removeEventListener('cc-stream', handleStream as EventListener);
      window.removeEventListener('cc-theme', handleTheme as EventListener);
      window.removeEventListener('cc-providers', handleProviders as EventListener);
    };
  }, [addMessage, setStreaming, appendStreamingContent]);
};
