# Mock 数据规范

> **版本**: v1.0
> **创建日期**: 2026-04-16
> **目的**: 统一 Mock 数据格式，便于后续对接真实 API

---

## 一、Mock 数据目录结构

```
frontend/src/mock/
├── index.ts              # 统一导出
├── sessions.ts           # 会话数据
├── messages.ts           # 消息数据
├── providers.ts          # 供应商数据
├── models.ts             # 模型数据
├── agents.ts             # Agent 数据
├── config.ts             # 配置数据
├── diffData.ts           # Diff 数据
└── skills.ts             # Skill 数据
```

---

## 二、Mock 数据类型定义

### 2.1 基础类型

```typescript
// frontend/src/types/mock.ts

/**
 * 会话数据
 */
export interface MockSession {
  id: string;              // 会话 ID
  title: string;           // 会话标题
  fav: boolean;            // 是否收藏
  time: string;            // 创建时间 (格式: "02-15 10:30")
  qc: number;              // 问题数量 (question count)
  msgs: MockMessage[];     // 消息列表
}

/**
 * 消息数据
 */
export interface MockMessage {
  id: string;              // 消息 ID
  role: 'user' | 'assistant';  // 角色
  content: string;         // 内容 (支持 Markdown)
  time?: string;           // 时间戳 (格式: "10:30")
  thinking?: string;       // 思考片段 (可选)
  toolCalls?: MockToolCall[];  // 工具调用 (可选)
}

/**
 * 工具调用
 */
export interface MockToolCall {
  id: string;              // 工具调用 ID
  name: string;            // 工具名称
  input: Record<string, any>;  // 工具输入
  status: 'pending' | 'running' | 'success' | 'error';  // 状态
  output?: string;         // 工具输出 (可选)
}

/**
 * 供应商数据
 */
export interface MockProvider {
  id: string;              // 供应商 ID
  name: string;            // 供应商名称
  url: string;             // API URL
  key?: string;            // API Key (脱敏显示)
  preset: string;          // 预设配置 ID
  st: 'ok' | 'err' | 'off';  // 状态
}

/**
 * 模型数据
 */
export interface MockModel {
  id: string;              // 模型 ID
  name: string;            // 模型显示名称
}

/**
 * Agent 数据
 */
export interface MockAgent {
  id: string;              // Agent ID
  name: string;            // Agent 名称
  description?: string;    // 描述 (可选)
}

/**
 * Skill 数据
 */
export interface MockSkill {
  id: string;              // Skill ID
  name: string;            // Skill 名称
  description?: string;    // 描述 (可选)
}

/**
 * Diff 文件数据
 */
export interface MockDiffFile {
  file: string;            // 文件路径
  add: number;             // 添加行数
  del: number;             // 删除行数
}

/**
 * 配置数据
 */
export interface MockConfig {
  lang: 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR';  // 语言
  theme: 'idea' | 'dark' | 'light' | 'highContrast';  // 主题
  chatBg: string;          // 聊天背景
  stream: boolean;         // 流式输出开关
  think: boolean;          // 思考模式开关
  provs: MockProvider[];   // 供应商列表
  agents: MockAgent[];     // Agent 列表
  skills: MockSkill[];     // Skill 列表
  curProv: string;         // 当前供应商 ID
  curMode: 'auto' | 'plan' | 'agent';  // 当前模式
  curModel: string;        // 当前模型 ID
  curAgent: string;        // 当前 Agent ID
}
```

---

## 三、Mock 数据实现

### 3.1 会话数据 (sessions.ts)

```typescript
// frontend/src/mock/sessions.ts
import type { MockSession } from '@/types/mock';

export const mockSessions: MockSession[] = [
  {
    id: 's0',
    title: '实现 SessionService 会话管理',
    fav: true,
    time: '02-15 10:30',
    qc: 3,
    msgs: [
      {
        id: 'm0',
        role: 'user',
        content: '帮我实现 SessionService，支持会话的创建、保存、获取、删除和列表功能。',
        time: '10:30'
      },
      {
        id: 'm1',
        role: 'assistant',
        content: `好的，下面是 \`SessionService\` 的完整实现：

### 数据模型

\`\`\`kotlin
data class ChatSession(
    val id: String = UUID.randomUUID().toString(),
    val sessionId: String? = null,
    var title: String = "",
    val createdAt: Instant = Clock.System.now(),
    var updatedAt: Instant = Clock.System.now(),
    val workingDir: String,
    val messages: MutableList<Message> = mutableListOf(),
    var isFavorite: Boolean = false
)
\`\`\`

### 核心实现

\`\`\`kotlin
class SessionService {
    private val sessionsDir = Path(
        System.getProperty("user.home"), ".claude", "sessions"
    )
    init { sessionsDir.createDirectories() }

    fun createSession(workingDir: String): ChatSession {
        val s = ChatSession(workingDir = workingDir)
        saveSession(s)
        return s
    }

    fun saveSession(session: ChatSession) {
        session.updatedAt = Clock.System.now()
        sessionsDir.resolve("\${session.id}.json")
            .writeText(Json.encodeToString(session))
    }

    fun getSession(id: String): ChatSession? {
        val f = sessionsDir.resolve("$id.json")
        if (!f.exists()) return null
        return Json.decodeFromString(f.readText())
    }

    fun deleteSession(id: String) =
        sessionsDir.resolve("$id.json").deleteIfExists()

    fun listSessions(): List<ChatSession> =
        sessionsDir.listDirectoryEntries()
            .filter { it.extension == "json" }
            .map { Json.decodeFromString<ChatSession>(it.readText()) }
            .sortedByDescending { it.updatedAt }
}
\`\`\`

存储路径 \`~/.claude/sessions/{id}.json\`，每次保存自动更新时间戳。`,
        time: '10:31'
      }
    ]
  },
  {
    id: 's1',
    title: '修复 Tab 栏滚动问题',
    fav: false,
    time: '02-14 16:20',
    qc: 2,
    msgs: [
      {
        id: 'm4',
        role: 'user',
        content: 'Tab 栏超出时没有滚动条，帮我修复',
        time: '16:20'
      },
      {
        id: 'm5',
        role: 'assistant',
        content: `使用 \`SCROLL_TAB_LAYOUT\` 策略即可：

\`\`\`java
JTabbedPane tabs = new JTabbedPane(
    JTabbedPane.TOP,
    JTabbedPane.SCROLL_TAB_LAYOUT
);
\`\`\`

如果需要自定义 Tab 样式，可以用 \`JScrollPane\` 包裹水平容器。`,
        time: '16:22'
      }
    ]
  },
  {
    id: 's2',
    title: '性能优化建议',
    fav: false,
    time: '02-13 09:10',
    qc: 0,
    msgs: []
  }
];

export const getMockSessionById = (id: string): MockSession | undefined => {
  return mockSessions.find(s => s.id === id);
};

export const createMockSession = (title: string): MockSession => {
  return {
    id: `s${Date.now()}`,
    title,
    fav: false,
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    qc: 0,
    msgs: []
  };
};
```

---

### 3.2 消息数据 (messages.ts)

```typescript
// frontend/src/mock/messages.ts
import type { MockMessage } from '@/types/mock';

export const mockMessages: MockMessage[] = [
  {
    id: 'msg-welcome',
    role: 'assistant',
    content: `# CC Assistant

欢迎使用 **CC Assistant**！

我是基于 Claude Code CLI 的 JetBrains IDE 助手，可以帮你：

- 🔧 **编写代码** - 生成、优化、重构代码
- 🧠 **解释代码** - 分析代码逻辑和设计
- 🧪 **编写测试** - 生成单元测试和集成测试
- 📋 **审查变更** - Code Review 和 Diff 分析
- 🐛 **调试问题** - 定位和修复 Bug

### 快捷操作

试试点击下方的快捷按钮开始：

> 💡 提示：使用 \`Ctrl+Enter\` 快速发送消息`,
    time: '10:00'
  }
];

export const createStreamingChunks = (content: string): string[] => {
  // 将内容按字符分割，模拟流式输出
  const chunkSize = 5;
  const chunks: string[] = [];
  for (let i = 0; i < content.length; i += chunkSize) {
    chunks.push(content.slice(i, i + chunkSize));
  }
  return chunks;
};
```

---

### 3.3 供应商数据 (providers.ts)

```typescript
// frontend/src/mock/providers.ts
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
```

---

### 3.4 模型数据 (models.ts)

```typescript
// frontend/src/mock/models.ts
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
```

---

### 3.5 Agent 数据 (agents.ts)

```typescript
// frontend/src/mock/agents.ts
import type { MockAgent } from '@/types/mock';

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
```

---

### 3.6 Diff 数据 (diffData.ts)

```typescript
// frontend/src/mock/diffData.ts
import type { MockDiffFile } from '@/types/mock';

export const mockDiffFiles: MockDiffFile[] = [
  {
    file: 'SessionService.kt',
    add: 4,
    del: 0
  },
  {
    file: 'ChatSession.kt',
    add: 2,
    del: 1
  },
  {
    file: 'RepoManager.kt',
    add: 6,
    del: 3
  }
];

export const getMockDiffSummary = () => {
  const totalAdd = mockDiffFiles.reduce((sum, f) => sum + f.add, 0);
  const totalDel = mockDiffFiles.reduce((sum, f) => sum + f.del, 0);
  return { files: mockDiffFiles, totalAdd, totalDel };
};
```

---

### 3.7 配置数据 (config.ts)

```typescript
// frontend/src/mock/config.ts
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
```

---

### 3.8 统一导出 (index.ts)

```typescript
// frontend/src/mock/index.ts

// 会话
export * from './sessions';
export { mockSessions, getMockSessionById, createMockSession } from './sessions';

// 消息
export * from './messages';
export { mockMessages, createStreamingChunks } from './messages';

// 供应商
export * from './providers';
export { mockProviders, getMockProviderById } from './providers';

// 模型
export * from './models';
export { mockModelsByProvider, getMockModelsByProvider } from './models';

// Agent/Skill
export * from './agents';
export { mockAgents, mockSkills } from './agents';

// Diff
export * from './diffData';
export { mockDiffFiles, getMockDiffSummary } from './diffData';

// 配置
export * from './config';
export { mockConfig } from './config';
```

---

## 四、Mock 数据使用示例

### 4.1 在组件中使用

```typescript
// frontend/src/main/tsx/components/layout/TabBar.tsx
import { mockSessions } from '@/mock';
import type { MockSession } from '@/types/mock';

export const TabBar: React.FC<TabBarProps> = ({
  activeSessionId,
  onTabClick,
  onTabClose
}) => {
  return (
    <div className={styles.container}>
      {mockSessions.map((session: MockSession) => (
        <Tab
          key={session.id}
          session={session}
          active={session.id === activeSessionId}
          onClick={() => onTabClick(session.id)}
          onClose={() => onTabClose(session.id)}
        />
      ))}
    </div>
  );
};
```

### 4.2 在 Store 中使用

```typescript
// frontend/src/main/tsx/stores/chatStore.ts
import { create } from 'zustand';
import { mockSessions, createMockSession } from '@/mock';
import type { MockSession } from '@/types/mock';

interface ChatState {
  sessions: MockSession[];
  activeSessionId: string | null;

  // Actions
  setActiveSession: (id: string) => void;
  createSession: (title: string) => void;
  deleteSession: (id: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  sessions: mockSessions,
  activeSessionId: mockSessions[0]?.id || null,

  setActiveSession: (id) => set({ activeSessionId: id }),

  createSession: (title) => set((state) => {
    const newSession = createMockSession(title);
    return {
      sessions: [...state.sessions, newSession],
      activeSessionId: newSession.id
    };
  }),

  deleteSession: (id) => set((state) => ({
    sessions: state.sessions.filter(s => s.id !== id),
    activeSessionId: state.activeSessionId === id
      ? state.sessions[0]?.id || null
      : state.activeSessionId
  }))
}));
```

---

## 五、Mock 数据更新策略

### 5.1 对接真实 API 时

1. **保留 Mock 模块**：用于开发测试
2. **添加 API 模块**：`src/api/` 目录
3. **环境变量切换**：`VITE_USE_MOCK=true/false`

```typescript
// vite.config.ts
export default defineConfig({
  define: {
    __USE_MOCK__: process.env.VITE_USE_MOCK === 'true'
  }
});

// src/api/index.ts
import { mockSessions } from '@/mock';
import { getSessionsFromAPI } from './sessions';

export const getSessions = __USE_MOCK__
  ? async () => mockSessions
  : getSessionsFromAPI;
```

### 5.2 Mock 数据更新

- 添加新字段：更新类型定义 + Mock 数据
- 修改数据结构：同步更新所有引用
- 删除废弃字段：更新类型定义 + Mock 数据

---

## 六、Mock 数据测试

### 6.1 类型检查

```typescript
// frontend/src/mock/__tests__/sessions.test.ts
import { mockSessions } from '../sessions';
import type { MockSession } from '@/types/mock';

describe('Mock Sessions', () => {
  it('should have correct type', () => {
    mockSessions.forEach((session: MockSession) => {
      expect(session).toHaveProperty('id');
      expect(session).toHaveProperty('title');
      expect(session).toHaveProperty('fav');
      expect(session).toHaveProperty('time');
      expect(session).toHaveProperty('qc');
      expect(session).toHaveProperty('msgs');
      expect(Array.isArray(session.msgs)).toBe(true);
    });
  });

  it('should have at least one session', () => {
    expect(mockSessions.length).toBeGreaterThan(0);
  });
});
```

---

*文档版本: v1.0*
*最后更新: 2026-04-16*
