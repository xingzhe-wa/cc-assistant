/**
 * JCEF 事件监听 Hook
 * 监听 Java → JS 的全局对象调用（CCChat、CCApp、CCProviders）
 */
import { useEffect } from 'react';
import { useChatStore, useConfigStore } from '@/stores';

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

    // 监听会话列表更新
    const handleSessionList = (e: CustomEvent) => {
      console.log('[JCEF] Session list:', e.detail);
    };

    // 监听 CLI 状态更新
    const handleCliStatus = (e: CustomEvent) => {
      console.log('[JCEF] CLI status:', e.detail);
    };

    // 监听语言变更
    const handleLocale = (e: CustomEvent) => {
      console.log('[JCEF] Locale change:', e.detail);
      const { locale } = e.detail;
      if (locale) {
        useConfigStore.getState().setLanguage(locale);
        // 强制触发 useI18n hook 的 language 依赖更新
        // 通过设置一个临时状态来强制重新渲染
        window.dispatchEvent(new CustomEvent('cc-i18n-force-update', {
          detail: { locale }
        }));
      }
    };

    // 监听 i18n 动态更新（如果 Kotlin 侧传递翻译消息）
    const handleI18nUpdate = (e: CustomEvent) => {
      console.log('[JCEF] I18n update:', e.detail);
      // 如果有动态翻译消息，可以在这里处理
      // 目前前端使用静态翻译文件，这里仅做日志
    };

    // 监听 Agents 更新
    const handleAgents = (e: CustomEvent) => {
      console.log('[JCEF] Agents:', e.detail);
    };

    // 监听 Skills 更新
    const handleSkills = (e: CustomEvent) => {
      console.log('[JCEF] Skills:', e.detail);
    };

    // 注册事件监听
    window.addEventListener('cc-message', handleMessage as EventListener);
    window.addEventListener('cc-stream', handleStream as EventListener);
    window.addEventListener('cc-theme', handleTheme as EventListener);
    window.addEventListener('cc-providers', handleProviders as EventListener);
    window.addEventListener('cc-session-list', handleSessionList as EventListener);
    window.addEventListener('cc-cli-status', handleCliStatus as EventListener);
    window.addEventListener('cc-locale', handleLocale as EventListener);
    window.addEventListener('cc-i18n', handleI18nUpdate as EventListener);
    window.addEventListener('cc-agents', handleAgents as EventListener);
    window.addEventListener('cc-skills', handleSkills as EventListener);

    // 清理
    return () => {
      window.removeEventListener('cc-message', handleMessage as EventListener);
      window.removeEventListener('cc-stream', handleStream as EventListener);
      window.removeEventListener('cc-theme', handleTheme as EventListener);
      window.removeEventListener('cc-providers', handleProviders as EventListener);
      window.removeEventListener('cc-session-list', handleSessionList as EventListener);
      window.removeEventListener('cc-cli-status', handleCliStatus as EventListener);
      window.removeEventListener('cc-locale', handleLocale as EventListener);
      window.removeEventListener('cc-i18n', handleI18nUpdate as EventListener);
      window.removeEventListener('cc-agents', handleAgents as EventListener);
      window.removeEventListener('cc-skills', handleSkills as EventListener);
    };
  }, [addMessage, setStreaming, appendStreamingContent]);
};
