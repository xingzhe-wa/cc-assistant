/**
 * Mock 数据类型定义
 */

// ========== 会话 ==========

export interface MockSession {
  id: string;
  title: string;
  fav: boolean;
  time: string;
  qc: number;
  msgs: MockMessage[];
  /** 会话是否已有首次交互，用于控制是否计入历史 */
  hasFirstMessage: boolean;
  /** 流式输出状态（会话级别隔离） */
  streaming?: boolean;
  /** 流式输出内容（会话级别隔离） */
  streamingContent?: string;
}

// ========== 消息 ==========

export type MessageRole = 'user' | 'assistant';

export interface MockMessage {
  id: string;
  role: MessageRole;
  content: string;
  time?: string;
  thinking?: string;
  toolCalls?: MockToolCall[];
  diffFiles?: MockDiffFile[];
}

export interface MockToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
  status: 'pending' | 'running' | 'success' | 'error';
  output?: string;
}

// ========== 供应商/模型/Agent ==========

export interface MockProviderModels {
  default: string;
  opus: string;
  max: string;
}

export interface MockProvider {
  id: string;
  name: string;
  url: string;
  key?: string;
  models: MockProviderModels;
  st: 'ok' | 'err' | 'off';
}

export interface MockModel {
  id: string;
  name: string;
}

export interface MockAgent {
  id: string;
  name: string;
  description?: string;
  scope?: ItemScope;
}

export interface MockSkill {
  id: string;
  name: string;
  description?: string;
  scope?: ItemScope;
  trigger?: string;
}

// ========== AI Status ==========

export type AgentStatus = 'idle' | 'thinking' | 'working' | 'waiting';

// ========== Diff ==========

export interface MockDiffFile {
  file: string;
  add: number;
  del: number;
}

// ========== 配置 ==========

export type Locale = 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR';
export type Theme = 'idea' | 'dark' | 'light' | 'highContrast';
export type Mode = 'auto' | 'plan' | 'agent';
export type ItemScope = 'global' | 'project';

export interface MockConfig {
  lang: Locale;
  theme: Theme;
  chatBg: string;
  stream: boolean;
  think: boolean;
  provs: MockProvider[];
  agents: MockAgent[];
  skills: MockSkill[];
  curProv: string;
  curMode: Mode;
  curModel: string;
  curAgent: string;
}

// ========== 发送选项 ==========

export interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'file';
  path?: string;
  dataUrl?: string;
  size?: number;
}

export interface SendOptions {
  stream?: boolean;
  think?: boolean;
  mode?: Mode;
  model?: string;
  provider?: string;
  agent?: string;
  attachments?: Attachment[];
}

// ========== Toast ==========

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}
