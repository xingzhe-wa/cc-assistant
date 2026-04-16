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
}

export interface MockToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
  status: 'pending' | 'running' | 'success' | 'error';
  output?: string;
}

// ========== 供应商/模型/Agent ==========

export interface MockProvider {
  id: string;
  name: string;
  url: string;
  key?: string;
  preset: string;
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
}

export interface MockSkill {
  id: string;
  name: string;
  description?: string;
}

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

export interface SendOptions {
  stream?: boolean;
  think?: boolean;
  mode?: Mode;
  model?: string;
  provider?: string;
}

// ========== Toast ==========

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}
