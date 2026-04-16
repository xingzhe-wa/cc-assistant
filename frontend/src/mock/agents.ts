import type { MockAgent, MockSkill } from '@/types/mock';

export const mockAgents: MockAgent[] = [
  {
    id: 'default',
    name: '默认',
    description: '通用 AI 助手'
  },
  {
    id: 'coder',
    name: '代码助手',
    description: '专注于代码编写和优化'
  },
  {
    id: 'reviewer',
    name: '代码审查',
    description: '专注于 Code Review'
  },
  {
    id: 'tester',
    name: '测试生成',
    description: '专注于生成测试用例'
  },
  {
    id: 'doc-writer',
    name: '文档生成',
    description: '专注于编写技术文档'
  }
];

export const mockSkills: MockSkill[] = [
  {
    id: 'sk-init',
    name: '项目初始化',
    description: '初始化项目结构和配置'
  },
  {
    id: 'sk-review',
    name: '代码审查',
    description: '审查代码质量和潜在问题'
  },
  {
    id: 'sk-commit',
    name: '生成提交',
    description: '生成规范的 Git 提交信息'
  },
  {
    id: 'sk-refactor',
    name: '代码重构',
    description: '重构和优化代码结构'
  },
  {
    id: 'sk-test',
    name: '生成测试',
    description: '生成单元测试和集成测试'
  },
  {
    id: 'sk-doc',
    name: '生成文档',
    description: '生成代码文档和技术说明'
  }
];
