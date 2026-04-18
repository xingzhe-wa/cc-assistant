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
      const { providers, models, agents } = e.detail;
      console.log('[JCEF] Providers data:', { providers, models, agents });
      try {
        const configState = useConfigStore.getState();
        if (providers && providers.length > 0) {
          // 使用标准方法更新 providers
          configState.setProvidersFromBackend(providers);
        }
        if (models && typeof models === 'object') {
          // 将 models 存储到 configStore
          // 目前 chatStore.currentModel 由 setCurrentProvider 自动切换
          // 后续可扩展 configStore 以支持多 provider models 映射
        }
        if (agents && agents.length > 0) {
          configState.setAgentsFromBackend(agents);
        }
      } catch (err) {
        console.warn('[JCEF] Failed to update providers in store:', err);
      }
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

    // 监听 Skills+Agents 含作用域的批量更新
    const handleSkillsAndAgents = (e: CustomEvent) => {
      const { skills, agents } = e.detail;
      console.log('[JCEF] Skills+Agents update:', skills?.length, 'skills,', agents?.length, 'agents');
      // 更新 configStore 中来自后端的数据
      try {
        const configState = useConfigStore.getState();
        if (agents && agents.length > 0) {
          configState.setAgentsFromBackend(agents);
        }
        if (skills && skills.length > 0) {
          configState.setSkillsFromBackend(skills);
        }
      } catch (err) {
        console.warn('[JCEF] Failed to update skills/agents in store:', err);
      }
    };

    // 监听文件路径注入（来自 Project View 右键菜单）
    const handleFileRef = (e: CustomEvent) => {
      const { path } = e.detail;
      const { inputValue, setInputValue } = useChatStore.getState();
      const prefix = inputValue ? inputValue + '\n' : '';
      setInputValue(`${prefix}@${path}`);
    };

    // 监听代码片段注入（来自编辑器右键菜单）
    const handleCodeRef = (e: CustomEvent) => {
      const { ref } = e.detail;
      const { inputValue, setInputValue } = useChatStore.getState();
      const prefix = inputValue ? inputValue + '\n' : '';
      setInputValue(`${prefix}${ref}`);
    };

    // 监听清空输入框（来自 Java 层）
    const handleClearInput = () => {
      console.log('[JCEF] clearInput received');
      useChatStore.getState().setInputValue('');
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
    window.addEventListener('cc-skills-agents', handleSkillsAndAgents as EventListener);
    window.addEventListener('cc-file-ref', handleFileRef as EventListener);
    window.addEventListener('cc-code-ref', handleCodeRef as EventListener);
    window.addEventListener('cc-clear-input', handleClearInput as EventListener);

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
      window.removeEventListener('cc-skills-agents', handleSkillsAndAgents as EventListener);
      window.removeEventListener('cc-file-ref', handleFileRef as EventListener);
      window.removeEventListener('cc-code-ref', handleCodeRef as EventListener);
      window.removeEventListener('cc-clear-input', handleClearInput as EventListener);
    };
  }, [addMessage, setStreaming, appendStreamingContent]);
};
