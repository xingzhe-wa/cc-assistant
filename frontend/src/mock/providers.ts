import type { MockProvider } from '@/types/mock';

export const mockProviders: MockProvider[] = [
  {
    id: 'p0',
    name: 'Claude',
    url: 'https://api.anthropic.com',
    key: 'sk-ant-***',
    models: { default: 'claude-4.5', opus: 'claude-opus-4', max: 'claude-max' },
    st: 'ok'
  },
  {
    id: 'p1',
    name: 'GLM',
    url: 'https://open.bigmodel.cn/api/paas/v4',
    key: '***',
    models: { default: 'glm-5', opus: 'glm-5-plus', max: 'glm-5-max' },
    st: 'ok'
  },
  {
    id: 'p2',
    name: 'DeepSeek',
    url: 'https://api.deepseek.com',
    key: 'sk-***',
    models: { default: 'deepseek-reasoner', opus: 'deepseek-chat', max: 'deepseek-max' },
    st: 'ok'
  },
  {
    id: 'p3',
    name: 'Gemini',
    url: 'https://generativelanguage.googleapis.com',
    key: '***',
    models: { default: 'gemini-2.5-pro', opus: 'gemini-2.5-flash', max: 'gemini-max' },
    st: 'off'
  },
  {
    id: 'p4',
    name: 'Kimi',
    url: 'https://api.moonshot.cn',
    key: '***',
    models: { default: 'kimi-k2-turbo-preview', opus: 'kimi-k2-pro', max: 'kimi-max' },
    st: 'err'
  },
  {
    id: 'p5',
    name: 'Qwen',
    url: 'https://dashscope.aliyuncs.com',
    key: '***',
    models: { default: 'qwen3-coder-plus', opus: 'qwen3-max', max: 'qwen-max' },
    st: 'ok'
  }
];

export const getMockProviderById = (id: string): MockProvider | undefined => {
  return mockProviders.find(p => p.id === id);
};
