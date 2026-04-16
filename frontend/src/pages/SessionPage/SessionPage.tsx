import React, { useCallback } from 'react';
import { AppLayout } from '@/components/layout';
import { MessageArea } from '@/components/message';
import { InputArea, PromptEnhancePanel } from '@/components/input';
import { useChatStore } from '@/stores';
import { useI18n } from '@/hooks/useI18n';
import type { MockSession } from '@/types/mock';

export interface SessionPageProps {
  /** 类名 */
  className?: string;
}

/**
 * SessionPage - 会话页面组件
 *
 * 包含完整的聊天界面：
 * - 顶部栏（TabBar + 操作按钮）
 * - 消息区域
 * - 输入区域
 * - 侧边历史栏
 */
export const SessionPage: React.FC<SessionPageProps> = ({ className = '' }) => {
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
    setCurrentPage,
    addToast,
    enhancePrompt,
    attachments,
    addAttachment,
    addAttachments,
    removeAttachment,
    enhancePanelOpen,
    setEnhancePanelOpen,
    applyPromptEnhance,
    agentStatus,
    statusMessage,
    subAgentName,
    diffFiles,
  } = useChatStore();
  const { t } = useI18n();

  const activeSession = sessions.find(s => s.id === activeSessionId);

  // Tab 操作
  const handleTabClick = useCallback((id: string) => {
    setActiveSession(id);
  }, [setActiveSession]);

  const handleTabClose = useCallback((id: string) => {
    closeSession(id);
  }, [closeSession]);

  const handleRename = useCallback((id: string, title: string) => {
    renameSession(id, title);
  }, [renameSession]);

  const handleNewTab = useCallback(() => {
    createSession();
  }, [createSession]);

  // 顶部栏操作
  const handleHistoryClick = useCallback(() => {
    toggleHistory();
  }, [toggleHistory]);

  const handleFavoriteClick = useCallback(() => {
    toggleFavoritePanel();
  }, [toggleFavoritePanel]);

  const handleSettingsClick = useCallback(() => {
    setCurrentPage('settings');
  }, [setCurrentPage]);

  // 历史会话操作
  const handleSessionClick = useCallback((session: MockSession) => {
    setActiveSession(session.id);
    addToast(`${t('toast.sessionLoaded')}: ${session.title}`, 'success');
    toggleHistory();
  }, [setActiveSession, addToast, toggleHistory, t]);

  const handleFavoriteToggle = useCallback((id: string, fav: boolean) => {
    toggleSessionFavorite(id);
    addToast(fav ? t('toast.favoriteAdded') : t('toast.favoriteRemoved'), 'success');
  }, [toggleSessionFavorite, addToast, t]);

  const handleDeleteSession = useCallback((id: string) => {
    deleteSession(id);
    addToast(t('toast.deleted'), 'success');
  }, [deleteSession, addToast, t]);

  // 消息操作
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

  // 发送消息
  const handleSend = useCallback(() => {
    sendMessage();
  }, [sendMessage]);

  return (
    <div className={className}>
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
        onRename={handleRename}
      >
        <MessageArea
          messages={activeSession?.msgs || []}
          streaming={streaming}
          streamingContent={streamingContent}
          diffFiles={diffFiles}
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
          providers={[]}
          currentProvider={currentProvider}
          onProviderChange={setCurrentProvider}
          models={[]}
          currentModel={currentModel}
          onModelChange={setCurrentModel}
          currentMode={currentMode}
          onModeChange={setCurrentMode}
          agents={[]}
          currentAgent={currentAgent}
          onAgentChange={setCurrentAgent}
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

      {enhancePanelOpen && (
        <PromptEnhancePanel
          originalText={inputValue}
          onApply={applyPromptEnhance}
          onClose={() => setEnhancePanelOpen(false)}
        />
      )}
    </div>
  );
};

export default SessionPage;
