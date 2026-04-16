import React, { useCallback } from 'react';
import { AppLayout } from './components/layout';
import { MessageArea } from './components/message';
import { InputArea } from './components/input';
import { ToastContainer } from './components/common';
import { useChatStore } from './stores';
import { mockProviders, getMockModelsByProvider, mockAgents } from './mock';
import type { MockSession } from './types/mock';
import './styles/global.css';

const App: React.FC = () => {
  const {
    sessions,
    activeSessionId,
    streaming,
    streamingContent,
    streamEnabled,
    historyOpen,
    favoriteOpen,
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
    setSettingsOpen,
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
    setSettingsOpen(true);
  }, [setSettingsOpen]);

  const handleSessionClick = useCallback((session: MockSession) => {
    createSession();
    addToast(`已加载会话: ${session.title}`, 'success');
    toggleHistory();
  }, [createSession, addToast, toggleHistory]);

  const handleFavoriteToggle = useCallback((id: string) => {
    toggleSessionFavorite(id);
  }, [toggleSessionFavorite]);

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
      <AppLayout
        sessions={sessions}
        activeSessionId={activeSessionId || ''}
        streamEnabled={streamEnabled}
        historyOpen={historyOpen}
        favoriteOpen={favoriteOpen}
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
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
};

export default App;
