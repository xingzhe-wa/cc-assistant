import React, { useCallback } from 'react';
import { AppLayout } from './components/layout';
import { MessageArea } from './components/message';
import { InputArea } from './components/input';
import { ToastContainer } from './components/common';
import { SettingsPage, HistoryPage } from './pages';
import { useChatStore } from './stores';
import { mockProviders, getMockModelsByProvider, mockAgents } from './mock';
import { useJcefEvents } from './hooks/useJcefEvents';
import type { MockSession } from './types/mock';
import './styles/global.css';

const App: React.FC = () => {
  // 监听 JCEF 全局对象事件
  useJcefEvents();
  const {
    sessions,
    activeSessionId,
    streaming,
    streamingContent,
    streamEnabled,
    currentPage,
    inputValue,
    currentProvider,
    currentModel,
    currentMode,
    currentAgent,
    thinkEnabled,
    contextUsed,
    toasts,
    setActiveSession,
    createSession,
    closeSession,
    deleteSession,
    toggleSessionFavorite,
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
    setCurrentPage,
    addToast,
    removeToast,
    enhancePrompt
  } = useChatStore();

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const models = getMockModelsByProvider(currentProvider);

  const handleTabClick = useCallback((id: string) => {
    setActiveSession(id);
  }, [setActiveSession]);

  const handleTabClose = useCallback((id: string) => {
    closeSession(id);
  }, [closeSession]);

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

  const handleSessionClick = useCallback((session: MockSession) => {
    setActiveSession(session.id);
    addToast(`已加载会话: ${session.title}`, 'success');
    toggleHistory();
  }, [setActiveSession, addToast, toggleHistory]);

  const handleFavoriteToggle = useCallback((id: string, fav: boolean) => {
    toggleSessionFavorite(id);
    addToast(fav ? '已添加收藏' : '已取消收藏', 'success');
  }, [toggleSessionFavorite, addToast]);

  const handleDeleteSession = useCallback((id: string) => {
    deleteSession(id);
    addToast('会话已删除', 'success');
  }, [deleteSession, addToast]);

  const handleCopy = useCallback((_id: string, content: string) => {
    navigator.clipboard.writeText(content);
    addToast('已复制到剪贴板', 'success');
  }, [addToast]);

  const handleQuote = useCallback((_id: string, content: string) => {
    const quoted = content.split('\n').map(line => `> ${line}`).join('\n');
    setInputValue(`${quoted}\n\n${inputValue}`);
    addToast('已添加到输入框', 'info');
  }, [inputValue, setInputValue, addToast]);

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
          sessions={sessions}
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
        >
          <MessageArea
            messages={activeSession?.msgs || []}
            streaming={streaming}
            streamingContent={streamingContent}
            onCopy={handleCopy}
            onQuote={handleQuote}
            onQuickAction={handleQuickAction}
          />
          <InputArea
            value={inputValue}
            onChange={setInputValue}
            onSend={handleSend}
            onStop={stopGeneration}
            streaming={streaming}
            providers={mockProviders}
            currentProvider={currentProvider}
            onProviderChange={setCurrentProvider}
            models={models}
            currentModel={currentModel}
            onModelChange={setCurrentModel}
            currentMode={currentMode}
            onModeChange={setCurrentMode}
            agents={mockAgents}
            currentAgent={currentAgent}
            onAgentChange={setCurrentAgent}
            thinkEnabled={thinkEnabled}
            onThinkToggle={toggleThink}
            contextUsed={contextUsed}
            onEnhance={enhancePrompt}
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
        <SettingsPage onClose={() => setCurrentPage('chat')} />
      )}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
};

export default App;
