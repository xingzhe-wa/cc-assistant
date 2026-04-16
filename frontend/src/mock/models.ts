import type { MockModel } from '@/types/mock';

// 按供应商分组的模型
export const mockModelsByProvider: Record<string, MockModel[]> = {
  'p0': [  // Claude
    { id: 'claude-4.5', name: 'claude-4.5' },
    { id: 'claude-4.1', name: 'claude-4.1' },
    { id: 'claude-opus', name: 'claude-opus' },
    { id: 'claude-sonnet', name: 'claude-sonnet' },
    { id: 'claude-haiku', name: 'claude-haiku' }
  ],
  'p1': [  // GLM
    { id: 'glm-5.1', name: 'glm-5.1' },
    { id: 'glm-5', name: 'glm-5' },
    { id: 'glm-4', name: 'glm-4' },
    { id: 'glm-4-air', name: 'glm-4-air' }
  ],
  'p2': [  // DeepSeek
    { id: 'deepseek-reasoner', name: 'deepseek-reasoner' },
    { id: 'deepseek-chat', name: 'deepseek-chat' }
  ],
  'p3': [  // Gemini
    { id: 'gemini-2.5', name: 'gemini-2.5-pro' },
    { id: 'gemini-2.0', name: 'gemini-2.0-flash' }
  ],
  'p4': [  // Kimi
    { id: 'kimi-k2', name: 'kimi-k2-turbo-preview' }
  ],
  'p5': [  // Qwen
    { id: 'qwen-3', name: 'qwen3-coder-plus' },
    { id: 'qwen-2.5', name: 'qwen-2.5-coder' }
  ]
};

export const getMockModelsByProvider = (providerId: string): MockModel[] => {
  return mockModelsByProvider[providerId] || [];
};
