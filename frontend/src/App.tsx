import React, { useCallback, useEffect, useState } from 'react';
import { AppLayout } from './components/layout';
import { MessageArea } from './components/message';
import { InputArea } from './components/input';
import { ToastContainer } from './components/common';
import { useChatStore, useConfigStore } from './stores';
import { getMockModelsByProvider } from './mock';
import { useJcefEvents } from './hooks/useJcefEvents';
import { useI18n } from './hooks/useI18n';
import { useTheme } from './hooks/useTheme';
import type { MockSession } from './types/mock';
import { SettingsPage } from './pages/SettingsPage/SettingsPage';
import { HistoryPage } from './pages/HistoryPage/HistoryPage';
import './styles/global.css';

const App: React.FC = () => {
  // 监听 JCEF 全局对象事件
  useJcefEvents();
  // 应用主题
  useTheme();

  // 监听 Java 层打开设置页面事件
  const [settingsTab, setSettingsTab] = useState<'basic' | 'provider' | 'agent' | 'skill'>('basic');
  // 用于强制重新渲染设置页面
  const [settingsKey, setSettingsKey] = useState(0);

  // 从 store 获取需要的状态（提前获取，供 useEffect 使用）
  const storeForEffect = useChatStore(state => ({ setCurrentPage: state.setCurrentPage, currentPage: state.currentPage }));

  useEffect(() => {
    const handleOpenSettings = (e: Event) => {
      const customEvent = e as CustomEvent<{ tab: string | null }>;
      const tab = customEvent.detail?.tab;
      console.log('[App] openSettings event received, tab:', tab);
      // 根据 tab 参数设置跳转目标
      let targetTab: 'basic' | 'provider' | 'agent' | 'skill' = 'basic';
      if (tab === 'providers' || tab === 'provider') {
        targetTab = 'provider';
      } else if (tab === 'agents' || tab === 'agent') {
        targetTab = 'agent';
      } else if (tab === 'skills' || tab === 'skill') {
        targetTab = 'skill';
      }
      setSettingsTab(targetTab);
      // 强制重新渲染设置页面：如果已在设置页面，强制重新挂载
      if (storeForEffect.currentPage !== 'settings') {
        storeForEffect.setCurrentPage('settings');
      } else {
        // 通过 key 机制强制重新渲染 SettingsPage
        setSettingsKey(prev => prev + 1);
      }
    };
    window.addEventListener('cc-open-settings', handleOpenSettings);
    return () => window.removeEventListener('cc-open-settings', handleOpenSettings);
  }, [storeForEffect.setCurrentPage, storeForEffect.currentPage]);

  const { t } = useI18n();
  const {
    sessions,
    activeSessionId,
    openTabs,
    streamEnabled,
    currentPage,
    inputValue,
    currentProvider,
    currentModel,
    currentMode,
    currentAgent,
    currentSkill,
    thinkEnabled,
    contextUsed,
    toasts,
    setActiveSession,
    createSession,
    closeSession,
    deleteSession,
    toggleSessionFavorite,
    renameSession,
    setInputValue,
    sendMessage,
    stopGeneration,
    toggleHistory,
    toggleFavoritePanel,
    toggleStream,
    toggleThink,
    setCurrentProvider,
    setCurrentModel,
    setCurrentMode,
    setCurrentAgent,
    setCurrentSkill,
    setCurrentPage,
    addToast,
    removeToast,
    enhancePrompt,
    attachments,
    addAttachment,
    addAttachments,
    removeAttachment,
    agentStatus,
    statusMessage,
    subAgentName,
    diffFiles,
  } = useChatStore();

  // 从 configStore 获取 providers、skills（来自后端）
  const { providers, agents: configAgents, skills } = useConfigStore();

  const activeSession = sessions.find(s => s.id === activeSessionId);
  // 会话级别隔离的 streaming 状态
  const sessionStreaming = activeSession?.streaming || false;
  const sessionStreamingContent = activeSession?.streamingContent || '';
  // 从当前 provider 获取模型列表
  const currentProvData = providers.find(p => p.id === currentProvider);
  const models = currentProvData?.models
    ? Object.entries(currentProvData.models).map(([key, value]) => ({
        id: key,
        name: value || key
      }))
    : getMockModelsByProvider(currentProvider);
  // 只显示在Tab栏中打开的会话
  const openTabSessions = sessions.filter(s => openTabs.includes(s.id));

  const handleTabClick = useCallback((id: string) => {
    setActiveSession(id);
  }, [setActiveSession]);

  const handleTabClose = useCallback((id: string) => {
    closeSession(id);
  }, [closeSession]);

  // 从历史/收藏加载会话到新Tab
  const handleSessionClick = useCallback((session: MockSession) => {
    const { openTabs: currentOpenTabs } = useChatStore.getState();
    // 如果会话不在Tab列表中，则添加
    if (!currentOpenTabs.includes(session.id)) {
      const { openTabs: currentTabs } = useChatStore.getState();
      useChatStore.setState({
        openTabs: [...currentTabs, session.id],
        activeSessionId: session.id
      });
    } else {
      // 如果已打开，直接切换
      setActiveSession(session.id);
    }
    addToast(t('toast.sessionLoaded'), 'success');
    toggleHistory();
  }, [setActiveSession, addToast, toggleHistory, t]);

  const handleRename = useCallback((id: string, title: string) => {
    renameSession(id, title);
    addToast(t('toast.renamed'), 'success');
  }, [renameSession, addToast, t]);

  const handleNewTab = useCallback(() => {
    createSession();
  }, [createSession]);

  const handleHistoryClick = useCallback(() => {
    toggleHistory();
  }, [toggleHistory]);

  const handleFavoriteClick = useCallback(() => {
    toggleFavoritePanel();
  }, [toggleFavoritePanel]);

  const handleSettingsClick = useCallback(() => {
    setCurrentPage('settings');
  }, [setCurrentPage]);

  const handleFavoriteToggle = useCallback((id: string, fav: boolean) => {
    toggleSessionFavorite(id);
    addToast(fav ? t('toast.favoriteAdded') : t('toast.favoriteRemoved'), 'success');
  }, [toggleSessionFavorite, addToast, t]);

  const handleDeleteSession = useCallback((id: string) => {
    deleteSession(id);
    addToast(t('toast.deleted'), 'success');
  }, [deleteSession, addToast, t]);

  const handleCopy = useCallback((_id: string, content: string) => {
    navigator.clipboard.writeText(content);
    addToast(t('toast.copied'), 'success');
  }, [addToast, t]);

  const handleQuote = useCallback((_id: string, content: string) => {
    const quoted = content.split('\n').map(line => `> ${line}`).join('\n');
    setInputValue(`${quoted}\n\n${inputValue}`);
    addToast(t('toast.quoteAdded'), 'info');
  }, [inputValue, setInputValue, addToast, t]);

  const handleQuickAction = useCallback((text: string) => {
    setInputValue(text);
    sendMessage();
  }, [setInputValue, sendMessage]);

  const handleSend = useCallback(() => {
    sendMessage();
  }, [sendMessage]);

  return (
    <>
      {currentPage === 'chat' && (
        <AppLayout
          sessions={openTabSessions}
          activeSessionId={activeSessionId || ''}
          streamEnabled={streamEnabled}
          historyOpen={false}
          favoriteOpen={false}
          onTabClick={handleTabClick}
          onTabClose={handleTabClose}
          onNewTab={handleNewTab}
          onHistoryClick={handleHistoryClick}
          onFavoriteClick={handleFavoriteClick}
          onStreamToggle={toggleStream}
          onSettingsClick={handleSettingsClick}
          onSearchChange={() => {}}
          onSessionClick={handleSessionClick}
          onFavoriteToggle={handleFavoriteToggle}
          onDeleteSession={handleDeleteSession}
          onRename={handleRename}
        >
          <MessageArea
            messages={activeSession?.msgs || []}
            streaming={sessionStreaming}
            streamingContent={sessionStreamingContent}
            onCopy={handleCopy}
            onQuote={handleQuote}
            onQuickAction={handleQuickAction}
          />
          <InputArea
            value={inputValue}
            onChange={setInputValue}
            onSend={handleSend}
            onStop={stopGeneration}
            streaming={sessionStreaming}
            providers={providers}
            currentProvider={currentProvider}
            onProviderChange={setCurrentProvider}
            models={models}
            currentModel={currentModel}
            onModelChange={setCurrentModel}
            currentMode={currentMode}
            onModeChange={setCurrentMode}
            agents={configAgents}
            currentAgent={currentAgent}
            onAgentChange={setCurrentAgent}
            skills={skills}
            currentSkill={currentSkill}
            onSkillChange={setCurrentSkill}
            thinkEnabled={thinkEnabled}
            onThinkToggle={toggleThink}
            contextUsed={contextUsed}
            onEnhance={enhancePrompt}
            agentStatus={agentStatus}
            statusMessage={statusMessage}
            subAgentName={subAgentName}
            diffFiles={diffFiles}
            attachments={attachments}
            onAddAttachment={addAttachment}
            onAddAttachments={addAttachments}
            onRemoveAttachment={removeAttachment}
          />
        </AppLayout>
      )}
      {currentPage === 'history' && (
        <HistoryPage
          mode="history"
          sessions={sessions}
          onSessionClick={handleSessionClick}
          onFavoriteToggle={handleFavoriteToggle}
          onDeleteSession={handleDeleteSession}
          onClose={handleHistoryClick}
        />
      )}
      {currentPage === 'favorite' && (
        <HistoryPage
          mode="favorite"
          sessions={sessions}
          onSessionClick={handleSessionClick}
          onFavoriteToggle={handleFavoriteToggle}
          onDeleteSession={handleDeleteSession}
          onClose={handleFavoriteClick}
        />
      )}
      {currentPage === 'settings' && (
        <SettingsPage key={settingsKey} onClose={() => setCurrentPage('chat')} initialTab={settingsTab} />
      )}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
};

export default App;
