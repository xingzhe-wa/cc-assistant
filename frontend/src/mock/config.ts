import type { MockConfig } from '@/types/mock';
import { mockProviders } from './providers';
import { mockAgents, mockSkills } from './agents';

export const mockConfig: MockConfig = {
  lang: 'zh-CN',
  theme: 'idea',
  chatBg: 'default',
  stream: true,
  think: false,
  provs: mockProviders,
  agents: mockAgents,
  skills: mockSkills,
  curProv: 'p0',
  curMode: 'auto',
  curModel: 'claude-4.5',
  curAgent: 'default'
};
