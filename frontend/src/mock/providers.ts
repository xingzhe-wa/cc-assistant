import type { MockProvider } from '@/types/mock';

export const mockProviders: MockProvider[] = [
  {
    id: 'p0',
    name: 'Claude',
    url: 'https://api.anthropic.com',
    key: 'sk-ant-***',
    preset: 'default',
    st: 'ok'
  },
  {
    id: 'p1',
    name: 'GLM',
    url: 'https://open.bigmodel.cn',
    key: '***',
    preset: 'default',
    st: 'ok'
  },
  {
    id: 'p2',
    name: 'DeepSeek',
    url: 'https://api.deepseek.com',
    key: 'sk-***',
    preset: 'default',
    st: 'ok'
  },
  {
    id: 'p3',
    name: 'Gemini',
    url: 'https://generativelanguage.googleapis.com',
    key: '***',
    preset: 'default',
    st: 'off'
  },
  {
    id: 'p4',
    name: 'Kimi',
    url: 'https://api.moonshot.cn',
    key: '***',
    preset: 'default',
    st: 'err'
  },
  {
    id: 'p5',
    name: 'Qwen',
    url: 'https://dashscope.aliyuncs.com',
    key: '***',
    preset: 'default',
    st: 'ok'
  }
];

export const getMockProviderById = (id: string): MockProvider | undefined => {
  return mockProviders.find(p => p.id === id);
};
