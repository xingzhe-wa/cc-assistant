/**
 * 模拟数据 - 用于无后端连接时
 * 后续替换为实际数据加载
 */

import type { MockSession, MockProvider, MockModel, MockAgent, MockDiffFile } from '@/types/mock';

// ========== 会话数据 ==========

export const mockSessions: MockSession[] = [
  {
    id: 'demo-session',
    title: '演示对话',
    fav: false,
    time: new Date().toLocaleTimeString(),
    qc: 0,
    hasFirstMessage: false,
    msgs: []
  }
];

export function createMockSession(title: string): MockSession {
  return {
    id: `session-${Date.now()}`,
    title,
    fav: false,
    time: new Date().toLocaleTimeString(),
    qc: 0,
    hasFirstMessage: false,
    msgs: []
  };
}

// ========== Diff 文件数据 ==========

export const mockDiffFiles: MockDiffFile[] = [
  { file: 'src/main/kotlin/.../model/Provider.kt', add: 45, del: 12 },
  { file: 'src/main/kotlin/.../bridge/CliBridgeService.kt', add: 23, del: 5 },
  { file: 'src/main/kotlin/.../services/ConfigService.kt', add: 8, del: 2 }
];

// ========== 供应商配置 ==========

export const mockProviders: MockProvider[] = [
  {
    id: 'claude',
    name: 'Claude (Anthropic)',
    url: 'https://api.anthropic.com',
    models: { default: 'claude-sonnet-4-20250514', opus: 'claude-opus-4-20250514', max: 'claude-4.5' },
    st: 'ok'
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    url: 'https://api.deepseek.com/anthropic',
    models: { default: 'deepseek-reasoner', opus: '', max: '' },
    st: 'ok'
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    url: 'https://generativelanguage.googleapis.com/v1beta/openai',
    models: { default: 'gemini-2.5-pro', opus: '', max: '' },
    st: 'ok'
  },
  {
    id: 'glm',
    name: 'GLM (智谱)',
    url: 'https://open.bigmodel.cn/api/anthropic',
    models: { default: 'GLM-4.7', opus: '', max: '' },
    st: 'ok'
  },
  {
    id: 'kimi',
    name: 'Moonshot Kimi',
    url: 'https://api.moonshot.cn/anthropic',
    models: { default: 'kimi-k2-turbo-preview', opus: '', max: '' },
    st: 'ok'
  },
  {
    id: 'qwen',
    name: '阿里百炼 Qwen',
    url: 'https://dashscope.aliyuncs.com/api/v2/apps/claude-code-proxy',
    models: { default: 'qwen3-coder-plus', opus: '', max: '' },
    st: 'ok'
  }
];

export function getMockModelsByProvider(providerId: string): MockModel[] {
  const provider = mockProviders.find(p => p.id === providerId);
  if (!provider) return [];

  const modelMap: Record<string, MockModel[]> = {
    claude: [
      { id: 'claude-opus-4-20250514', name: 'Claude Opus 4' },
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude Haiku 3.5' }
    ],
    deepseek: [
      { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner' },
      { id: 'deepseek-chat', name: 'DeepSeek Chat' }
    ],
    gemini: [
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' }
    ],
    glm: [
      { id: 'GLM-4.7', name: 'GLM-4.7' },
      { id: 'GLM-4.5-flash', name: 'GLM-4.5 Flash' },
      { id: 'glm-4.5-air', name: 'GLM-4.5 Air' }
    ],
    kimi: [
      { id: 'kimi-k2-turbo-preview', name: 'Kimi K2 Turbo' }
    ],
    qwen: [
      { id: 'qwen3-coder-plus', name: 'Qwen3 Coder Plus' },
      { id: 'qwen3-coder', name: 'Qwen3 Coder' }
    ]
  };

  return modelMap[providerId] || [];
}

// ========== Agents ==========

export const mockAgents: MockAgent[] = [
  { id: 'general', name: 'General', description: '通用助手', scope: 'global' },
  { id: 'review', name: 'Review', description: '代码审查', scope: 'global' },
  { id: 'codegen', name: 'Code', description: '代码生成', scope: 'global' }
];