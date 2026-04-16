# CC Assistant 前端开发规划

> **版本**: v2.0 (统一整合版)
> **创建日期**: 2026-04-16
> **开发周期**: 10 个工作日
> **参考原型**: `docs/session.html`, `docs/setting.html`

---

## 目录

1. [项目概述](#一项目概述)
2. [架构设计](#二架构设计)
3. [组件设计](#三组件设计)
4. [详细时间表](#四详细时间表)
5. [技术实现难点](#五技术实现难点)
6. [验收标准](#六验收标准)
7. [开发环境配置](#七开发环境配置)

---

## 一、项目概述

### 1.1 设计目标

- **交互完整性**: 复刻 session.html 和 setting.html 的所有交互功能
- **模块化设计**: 组件拆分清晰，便于维护
- **可扩展性**: 预留国际化、主题切换接口
- **JCEF 深度集成**: Java ↔ JavaScript 双向通信

### 1.2 功能模块

| 模块 | 页面 | 说明 |
|------|------|------|
| **会话界面** | SessionPage | 对话消息展示、输入框、Tab 切换、历史按钮跳转 |
| **历史/收藏页面** | HistoryPage / FavoritesPage | 从 setting.html 拆分，独立页面 |
| **设置页面** | SettingsPage | 供应商/Agent/Skill 管理、主题配置 |
| **页面路由** | Router | 三大页面间路由跳转，状态一致性 |
| **全局状态** | Global Stores | 配置数据全局共享与持久化 |

### 1.3 技术选型

| 层级 | 技术选择 | 理由 |
|------|---------|------|
| **框架** | React 18 + TypeScript | 生态成熟，类型安全 |
| **构建工具** | Vite 5+ | HMR 支持，快速构建 |
| **状态管理** | Zustand | 轻量级，简单直接 |
| **样式** | CSS Modules + CSS Variables | 保留原型风格，支持主题切换 |
| **Markdown** | marked.js + highlight.js | 与原型一致 |
| **图标** | Material Icons Round | 与原型一致 |

### 1.4 项目目录结构

```
frontend/
├── src/
│   ├── main/
│   │   ├── tsx/                 # TypeScript React 组件
│   │   │   ├── App.tsx          # 根组件
│   │   │   ├── main.tsx         # 入口文件
│   │   │   ├── components/      # UI 组件
│   │   │   │   ├── layout/      # 布局组件 (AppLayout, TopBar, TabBar, HistoryBar)
│   │   │   │   ├── message/     # 消息组件 (MessageArea, AIMessage, CodeBlock, DiffViewer)
│   │   │   │   ├── input/       # 输入组件 (InputArea, InputToolbar, ProviderSelector)
│   │   │   │   ├── modal/       # 弹窗组件 (SettingsModal, ProviderEditModal)
│   │   │   │   └── common/      # 通用组件 (Button, Icon, ScrollArea, Modal, Toast, Dropdown)
│   │   │   ├── pages/           # 页面组件 (SessionPage, HistoryPage, SettingsPage)
│   │   │   ├── hooks/           # React Hooks (useI18n, useTheme, useToast, useJcef)
│   │   │   ├── stores/          # Zustand 状态管理 (chatStore, sessionStore, uiStore, configStore)
│   │   │   ├── i18n/            # 国际化 (zh-CN, en-US, ja-JP, ko-KR)
│   │   │   ├── theme/           # 主题 (idea, dark, light, highContrast)
│   │   │   ├── utils/           # 工具函数 (markdown, format, jcef)
│   │   │   ├── types/           # 类型定义 (mock, i18n, theme)
│   │   │   └── styles/          # 样式文件 (global.css, theme.css, animations.css)
│   │   └── index.html           # HTML 入口
│   └── api/                     # API 定义
│       └── jcef-types.ts        # JCEF 类型定义
├── mock/                        # Mock 数据
│   ├── index.ts
│   ├── sessions.ts
│   ├── messages.ts
│   ├── providers.ts
│   ├── models.ts
│   ├── agents.ts
│   ├── config.ts
│   └── diffData.ts
├── public/                      # 静态资源
├── vite.config.ts               # Vite 配置
├── tsconfig.json                # TypeScript 配置
├── tailwind.config.js           # Tailwind 配置
├── package.json
└── README.md
```

---

## 二、架构设计

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Kotlin Layer (Java Side)                 │
│  ConfigService → ProviderService → SessionService           │
└──────────────────────────┬──────────────────────────────────┘
                           │ JBCefJSQuery 双向通信
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                   TypeScript Layer (Web Side)                │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Global State (Zustand)                                 ││
│  │  ├── configStore: 供应商/模型/主题/语言                  ││
│  │  ├── sessionStore: 会话列表/当前会话/Tab管理             ││
│  │  ├── chatStore: 消息列表/流式状态                        ││
│  │  └── uiStore: 页面路由/弹窗状态/Toast                    ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Router (自定义实现)                                    ││
│  │  ├── SessionPage: /session (会话界面)                   ││
│  │  ├── HistoryPage: /history (历史会话)                   ││
│  │  ├── FavoritesPage: /favorites (收藏会话)               ││
│  │  └── SettingsPage: /settings (设置)                     ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Components (Vite构建后集成到插件)                       ││
│  │  ├── layout/: AppLayout/TopBar/TabBar/HistBar          ││
│  │  ├── message/: MessageArea/UserMessage/AIMessage       ││
│  │  ├── input/: InputBox/InputToolbar/FloatingPopover     ││
│  │  ├── pages/: SessionPage/HistoryPage/SettingsPage      ││
│  │  └── common/: MarkdownRenderer/DiffRenderer/Modal      ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### 2.2 JCEF 通信架构

**Java ↔ JavaScript 职责划分**:

| 层级 | 职责 | 技术方案 |
|------|------|----------|
| **Java层** | - 配置持久化（PersistentStateComponent）<br>- CLI进程管理（CliBridgeService）<br>- 会话存储（SessionService）<br>- Provider管理 | 使用 `JBCefJSQuery` 注入Java回调到JS |
| **JS层** | - UI渲染（React组件）<br>- 用户交互处理<br>- 状态管理（Zustand）<br>- Markdown/Diff渲染 | 通过 `window.javaBridge` 对象调用Java |
| **通信总线** | - JS → Java: 用户发送消息、切换Provider<br>- Java → JS: CLI流式响应、配置变更 | 防抖处理（100ms）避免频繁调用 |

**Java → JavaScript 接口**:
```typescript
window.javaBridge = {
  // 消息操作
  appendUserMessage: (id: string, content: string, timestamp?: string) => void;
  appendAIMessage: (id: string, content: string, timestamp?: string, thinking?: string) => void;
  appendStreamingContent: (role: string, content: string, messageId: string) => void;
  finishStreaming: (messageId: string) => void;

  // 主题
  applyTheme: (variables: Record<string, string>, isDark: boolean) => void;
  setTheme: (themeId: string) => void;

  // 国际化
  applyI18n: (messages: Record<string, string>) => void;

  // Provider
  setProviders: (providers: Provider[], models: Record<string, Model[]>, agents: Agent[]) => void;
}
```

**JavaScript → Java 接口**:
```typescript
window.javaBridge = {
  // 消息操作
  onCopyMessage: (id: string, content: string) => void;
  onQuoteMessage: (id: string, content: string) => void;
  onRegenerate: (id: string) => void;
  onRewind: (id: string) => void;
  onCopyCode: (code: string) => void;

  // 发送消息
  onSendMessage: (text: string, options: MessageOptions) => void;

  // 主题/语言
  onThemeChange: (themeId: string) => void;
  onLanguageChange: (locale: string) => void;

  // 设置
  onProviderChange: (providerId: string) => void;
  onModelChange: (modelId: string) => void;
  onAgentChange: (agentId: string) => void;

  // 会话
  onToggleFavorite: (id: string, fav: boolean) => void;
  onRenameSession: (id: string, title: string) => void;
  onDeleteSession: (id: string) => void;
}
```

### 2.3 Zustand 状态管理

**Store 设计**:

```typescript
// stores/configStore.ts
interface ConfigState {
  // 供应商
  providers: Provider[];
  currentProvider: string;
  // 模型
  models: Record<string, Model[]>; // 按 providerId 分组
  currentModel: string;
  // 主题
  theme: 'idea' | 'dark' | 'light';
  // 国际化
  language: 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR';
  // 操作
  setProvider: (id: string) => void;
  setModel: (id: string) => void;
  setTheme: (theme: string) => void;
  setLanguage: (lang: string) => void;
  saveConfig: () => void;
}

// stores/sessionStore.ts
interface SessionState {
  // 会话列表
  sessions: Session[];
  // 当前会话
  currentSessionId: string | null;
  // Tab 列表
  tabs: Tab[];
  // 操作
  createSession: () => void;
  switchSession: (id: string) => void;
  closeSession: (id: string) => void;
  renameSession: (id: string, title: string) => void;
  toggleFavorite: (id: string) => void;
  deleteSession: (id: string) => void;
}

// stores/chatStore.ts
interface ChatState {
  // 消息列表
  messages: Record<string, Message[]>; // 按 sessionId 分组
  // 流式状态
  streaming: Set<string>;
  // 操作
  appendMessage: (sessionId: string, message: Message) => void;
  appendStreamContent: (sessionId: string, messageId: string, content: string) => void;
  finishStream: (sessionId: string, messageId: string) => void;
  clearMessages: (sessionId: string) => void;
}

// stores/uiStore.ts
interface UIState {
  // 路由
  currentPage: 'session' | 'history' | 'favorites' | 'settings';
  // 弹窗
  modals: {
    settings: boolean;
    providerEdit: boolean;
  };
  // Toast 队列
  toasts: Toast[];
  // HistoryBar 状态
  historyBarOpen: boolean;
  historyBarMode: 'history' | 'favorites';
  // 操作
  navigateTo: (page: string) => void;
  openModal: (modal: string) => void;
  closeModal: (modal: string) => void;
  showToast: (toast: Omit<Toast, 'id'>) => void;
  toggleHistoryBar: (open: boolean) => void;
  setHistoryBarMode: (mode: 'history' | 'favorites') => void;
}
```

---

## 三、组件设计

### 3.1 组件层次结构

```
App
├── Router (根据 currentPage 渲染)
│   ├── SessionPage
│   │   ├── AppLayout
│   │   │   ├── TopBar
│   │   │   │   ├── TabBar
│   │   │   │   └── TopBarActions
│   │   │   ├── HistoryBar
│   │   │   ├── MessageArea
│   │   │   │   ├── MessageList
│   │   │   │   │   ├── UserMessage
│   │   │   │   │   ├── AIMessage
│   │   │   │   │   │   ├── MarkdownContent
│   │   │   │   │   │   ├── CodeBlock
│   │   │   │   │   │   ├── DiffViewer
│   │   │   │   │   │   └── ThinkingBlock
│   │   │   │   │   └── EmptyState
│   │   │   │   └── DiffSummary
│   │   │   └── InputArea
│   │   │       ├── InputToolbar
│   │   │       ├── InputBox
│   │   │       └── InputActions
│   │   └── SettingsModal (overlay)
│   ├── HistoryPage
│   │   ├── HistoryHeader
│   │   ├── HistorySearch
│   │   ├── HistoryStats
│   │   └── HistoryList
│   ├── FavoritesPage
│   │   ├── FavoritesHeader
│   │   ├── FavoritesSearch
│   │   └── FavoritesList
│   └── SettingsPage
│       ├── SettingsNav
│       └── SettingsContent
│           ├── BasicSettings
│           ├── ProviderSettings
│           ├── AgentSettings
│           └── SkillSettings
├── ProviderEditModal (overlay)
└── Toast
```

### 3.2 Mock 数据结构

```typescript
// types/mock.ts
export interface MockSession {
  id: string;
  title: string;
  fav: boolean;
  time: string;
  qc: number;  // question count
  msgs: MockMessage[];
}

export interface MockMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time?: string;
  thinking?: string;
}

export interface MockProvider {
  id: string;
  name: string;
  url: string;
  key?: string;
  preset: string;
  st: 'ok' | 'err' | 'off';
  models: {
    default: string;
    opus: string;
    max: string;
  };
}

export interface MockModel {
  id: string;
  name: string;
}

export interface MockAgent {
  id: string;
  name: string;
  desc: string;
}

export interface MockDiffFile {
  file: string;
  add: number;
  del: number;
}
```

### 3.3 国际化方案

**目录结构**:
```
src/i18n/
├── index.ts              # i18n 工厂函数
├── locales/
│   ├── zh-CN.ts          # 简体中文
│   ├── en-US.ts          # 英文
│   ├── ja-JP.ts          # 日文
│   └── ko-KR.ts          # 韩文
└── types.ts              # 类型定义
```

**使用方式**:
```typescript
// hooks/useI18n.ts
export const useI18n = () => {
  const { language } = useConfigStore();
  const t = (key: string) => {
    return locales[language][key] || locales['zh-CN'][key];
  };
  return { t, language };
};

// 组件中使用
const { t } = useI18n();
<Button>{t('common.confirm')}</Button>
```

### 3.4 主题切换方案

**目录结构**:
```
src/theme/
├── index.ts              # 主题工厂函数
├── themes/
│   ├── idea.ts           # IDEA 主题
│   ├── dark.ts           # 暗色主题
│   ├── light.ts          # 亮色主题
│   └── highContrast.ts   # 高对比度主题
└── types.ts              # 类型定义
```

**CSS 变量设计**:
```css
/* styles/theme.css */
:root {
  /* 基础颜色 */
  --bg-primary: #111214;
  --bg-secondary: #17181d;
  --bg-element: #1e2028;
  --bg-hover: #272933;

  /* 强调色 */
  --accent-primary: #c9873a;
  --accent-secondary: #daa04e;

  /* 状态色 */
  --color-success: #50b85e;
  --color-error: #d95555;
  --color-info: #4db8cc;

  /* 文本色 */
  --fg-primary: #d0d1d8;
  --fg-secondary: #87899a;
  --fg-muted: #494b5a;
  --fg-disabled: #31333d;

  /* 边框色 */
  --border-default: #23252e;
  --border-light: #1b1d24;
}
```

---

## 四、详细时间表

### Phase 1: 项目初始化 + Mock 数据 (Day 1)

**目标**: 创建可运行的前端项目

#### 上午 (4h)

| 任务 | 预估 | 备注 |
|------|------|------|
| 创建 Vite + React + TypeScript 项目 | 1h | `npm create vite@latest frontend -- --template react-ts` |
| 安装依赖 (zustand, marked, highlight.js) | 0.5h | |
| 配置 Vite (别名、端口、代理) | 0.5h | |
| 配置 TypeScript (路径别名) | 0.5h | |
| 创建目录结构 | 0.5h | 参考章节 1.4 |
| 验证项目运行 | 1h | `npm run dev` |

#### 下午 (4h)

| 任务 | 预估 | 备注 |
|------|------|------|
| 创建 Mock 类型定义 | 1h | `src/types/mock.ts` |
| 创建 Mock 会话数据 | 1h | `mock/sessions.ts` |
| 创建 Mock 供应商/模型数据 | 1h | `mock/providers.ts`, `models.ts` |
| 创建 Mock 配置数据 | 0.5h | `mock/config.ts` |
| 创建 Mock 统一导出 | 0.5h | `mock/index.ts` |

**Day 1 产出**:
- [ ] 可运行的前端项目 (`npm run dev`)
- [ ] Mock 数据模块 (可 import 使用)

---

### Phase 2: 基础组件 + 布局组件 (Day 2-3)

**目标**: 完成 UI 骨架

#### Day 2 上午 (4h)

| 任务 | 预估 | 备注 |
|------|------|------|
| 创建基础组件: Button | 1h | primary/secondary/ghost 变体 |
| 创建基础组件: Icon | 0.5h | Material Icons Round |
| 创建基础组件: ScrollArea | 0.5h | 自定义滚动条样式 |
| 创建基础组件: Modal | 1h | Portal 渲染 |
| 创建基础组件: Toast | 0.5h | success/error/info 类型 |
| 创建基础组件: Dropdown | 0.5h | 悬浮菜单 |

#### Day 2 下午 (4h)

| 任务 | 预估 | 备注 |
|------|------|------|
| 创建 AppLayout | 1h | 主布局容器 |
| 创建 TopBar | 1h | 顶栏 |
| 创建 TabBar | 2h | 会话标签管理 |

#### Day 3 上午 (4h)

| 任务 | 预估 | 备注 |
|------|------|------|
| 创建 HistoryBar | 2h | 历史会话列表 |
| 创建 EmptyState | 1h | 空状态 |
| 集成 TabBar + HistoryBar | 1h | 交互联调 |

**Day 2-3 产出**:
- [ ] 6 个基础组件
- [ ] AppLayout、TopBar、TabBar、HistoryBar

---

### Phase 3: 消息组件 + 输入组件 (Day 4-5)

**目标**: 完成核心功能

#### Day 3 下午 (4h)

| 任务 | 预估 | 备注 |
|------|------|------|
| 创建 MessageArea | 1h | 消息容器 |
| 创建 MessageList | 1.5h | 消息列表 |
| 创建 UserMessage | 0.5h | 用户消息 |
| 创建 DiffSummary | 1h | Diff 汇总 |

#### Day 4 上午 (4h)

| 任务 | 预估 | 备注 |
|------|------|------|
| 创建 AIMessage | 2h | AI 消息 (头部/内容/底部操作) |
| 创建 MarkdownContent | 1.5h | Markdown 渲染 |
| 创建 markdown 工具函数 | 0.5h | marked + highlight.js |

#### Day 4 下午 (4h)

| 任务 | 预估 | 备注 |
|------|------|------|
| 创建 CodeBlock | 1.5h | 代码块 + 复制按钮 |
| 创建 ThinkingBlock | 1h | 思考片段 (折叠/展开) |
| 创建 DiffViewer | 1.5h | Diff 可视化 |

#### Day 5 上午 (4h)

| 任务 | 预估 | 备注 |
|------|------|------|
| 创建 InputBox | 1h | 多行输入框 |
| 创建 InputArea | 1h | 输入区域容器 |
| 创建 InputToolbar | 1h | 工具栏 |
| 创建 ContextBar | 0.5h | 上下文占用比 |

#### Day 5 下午 (4h)

| 任务 | 预估 | 备注 |
|------|------|------|
| 创建 ProviderSelector | 1h | 供应商选择器 |
| 创建 ModelSelector | 0.5h | 模型选择器 |
| 创建 AgentSelector | 0.5h | Agent 选择器 |
| 创建 ModeSelector | 0.5h | 模式选择器 |
| 集成 InputArea 交互 | 1h | 发送/停止 |

**Day 3-5 产出**:
- [ ] 完整的消息组件
- [ ] 完整的输入组件

---

### Phase 4: 国际化 + 主题切换 (Day 6)

**目标**: 完成可配置功能

#### Day 6 上午 (4h)

| 任务 | 预估 | 备注 |
|------|------|------|
| 创建 i18n 模块结构 | 1h | `src/i18n/` |
| 创建 zh-CN 翻译文件 | 1h | 提取所有文本 |
| 创建 en-US 翻译文件 | 0.5h | 英文翻译 |
| 创建 useI18n Hook | 0.5h | 切换语言 |
| 创建 i18n 类型定义 | 1h | `src/i18n/types.ts` |

#### Day 6 下午 (4h)

| 任务 | 预估 | 备注 |
|------|------|------|
| 创建 theme 模块结构 | 1h | `src/theme/` |
| 创建 IDEA 主题变量 | 1h | CSS 变量定义 |
| 创建 dark/light 主题 | 0.5h | 主题切换 |
| 创建 useTheme Hook | 0.5h | 切换主题 |
| 创建语言/主题切换器 | 0.5h | UI 组件 |
| 创建 theme 类型定义 | 0.5h | `src/theme/types.ts` |

**Day 6 产出**:
- [ ] i18n 模块 (zh-CN, en-US)
- [ ] theme 模块 (idea, dark, light)
- [ ] 语言/主题切换 Hook

---

### Phase 5: 状态管理 + 交互完善 (Day 7-8)

**目标**: 完成可交互原型

#### Day 7 上午 (4h)

| 任务 | 预估 | 备注 |
|------|------|------|
| 创建 chatStore | 1.5h | 聊天状态 |
| 创建 sessionStore | 1h | 会话状态 |
| 创建 uiStore | 0.5h | UI 状态 |
| 创建 configStore | 1h | 配置状态 |

#### Day 7 下午 (4h)

| 任务 | 预估 | 备注 |
|------|------|------|
| 创建 useJcef Hook | 1h | JCEF 桥接 |
| 实现 Mock 发送交互 | 2h | 模拟 AI 响应 |
| 实现 Tab 新建/切换/关闭 | 1h | Store 联调 |

#### Day 8 上午 (4h)

| 任务 | 预估 | 备注 |
|------|------|------|
| 创建 SettingsModal | 2h | 设置弹窗 |
| 创建 SettingsNav | 0.5h | 设置导航 |
| 创建 SettingsContent | 1.5h | 设置内容 |

#### Day 8 下午 (4h)

| 任务 | 预估 | 备注 |
|------|------|------|
| 创建 ProviderEditModal | 1.5h | 供应商编辑 |
| 集成设置保存逻辑 | 1h | Store 联调 |
| 实现表单验证 | 1h | 必填项检查 |
| 实现 Toast 提示 | 0.5h | 操作反馈 |

**Day 7-8 产出**:
- [ ] 4 个 Zustand Store
- [ ] useJcef Hook
- [ ] Mock 交互
- [ ] SettingsModal + ProviderEditModal

---

### Phase 6: 页面组件 + 路由 (Day 9 上午)

**目标**: 完成独立页面

| 任务 | 预估 | 备注 |
|------|------|------|
| 创建 SessionPage | 1.5h | 整合会话界面组件 |
| 创建 HistoryPage | 1.5h | 从 setting.html 拆分 |
| 创建 FavoritesPage | 1h | 从 setting.html 拆分 |
| 实现页面路由 | 1h | 自定义路由 |

---

### Phase 7: 打磨优化 + 测试 (Day 9 下午 - Day 10)

**目标**: 完成交付版本

#### Day 9 下午 (4h)

| 任务 | 预估 | 备注 |
|------|------|------|
| 实现虚拟列表 | 2h | 长消息列表优化 |
| 优化动画 | 1h | CSS 动画优化 |
| 优化首屏渲染 | 1h | 懒加载 |

#### Day 10 上午 (4h)

| 任务 | 预估 | 备注 |
|------|------|------|
| 添加加载状态 | 0.5h | skeleton |
| 优化错误处理 | 1h | try/catch |
| 添加空状态 | 0.5h | 各组件空状态 |
| 功能测试 | 1h | 手动测试所有功能 |
| 浏览器兼容性测试 | 1h | Chrome 兼容性 |

#### Day 10 下午 (4h)

| 任务 | 预估 | 备注 |
|------|------|------|
| Bug 修复 | 2h | 测试发现的问题 |
| 构建测试 | 1h | `npm run build` |
| 文档更新 | 1h | README |
| 代码审查 | 0h | 已在前几天持续进行 |

**Day 9-10 产出**:
- [ ] 性能优化
- [ ] 动画优化
- [ ] 测试通过
- [ ] 构建成功

---

## 五、技术实现难点

### 5.1 JCEF双向通信频率过高导致IDE卡顿

**问题表现**: 用户快速输入时，每个字符都触发同步到Java，导致IDE主线程阻塞。

**攻克思路**:
```typescript
// lib/java-bridge.ts
const sendMessageDebounced = debounce((content: string) => {
  window.javaBridge?.sendMessage(content);
}, 150); // 防抖150ms

// 仅在用户停止输入150ms后才发送
```

```kotlin
// JcefChatPanel.kt
val messageQuery = JBCefJSQuery.create(browser) { json ->
    // 使用后台线程处理，避免阻塞EDT
    ApplicationManager.getApplication().executeOnPooledThread {
        val data = Gson().fromJson(json, MessageData::class.java)
        // 处理消息...
    }
    null
}
```

### 5.2 JCEF实例在IDEA低版本兼容性崩溃

**问题表现**: 在旧版本IDEA中，`JBCefBrowser` 构造函数抛出 `NoSuchMethodError`。

**攻克思路**:
```kotlin
// JcefChatPanel.kt
fun createBrowser(): JBCefBrowser? {
    return try {
        // 动态检测JCEF是否可用
        if (JBCefApp.isSupported()) {
            JBCefBrowser()
        } else {
            // 降级为Swing纯文本提示
            showFallbackPanel()
            null
        }
    } catch (e: Throwable) {
        logger.error("JCEF初始化失败", e)
        showFallbackPanel()
        null
    }
}
```

```typescript
// lib/jcef-detect.ts
export const isJcefSupported = () => {
    return typeof window !== 'undefined' &&
           (window as any).javaBridge !== undefined;
};

// 在组件中检测
if (!isJcefSupported()) {
    return <div>JCEF不支持，请升级IDEA版本</div>;
}
```

### 5.3 Web面板高频刷新导致IDE内存泄漏

**问题表现**: 长时间使用后，IDE内存占用持续增长，最终OOM。

**攻克思路**:
```kotlin
// JcefChatPanel.kt
override fun dispose() {
    // 主动释放JCEF资源
    browser?.dispose()
    // 清理回调
    messageQuery?.handlers?.clear()
    super.dispose()
}
```

```typescript
// components/MessageArea.tsx
useEffect(() => {
    return () => {
        // 组件卸载时清理定时器
        if (typingTimer) clearTimeout(typingTimer);
        // 取消pending的网络请求
        abortController.abort();
    };
}, []);
```

### 5.4 长消息列表渲染性能问题

**问题表现**: 会话包含100+消息时，滚动卡顿。

**攻克思路**:
```typescript
// 使用虚拟滚动（仅渲染可见区域）
import { useVirtualizer } from '@tanstack/react-virtual';

const MessageList = ({ messages }) => {
    const parentRef = useRef(null);

    const virtualizer = useVirtualizer({
        count: messages.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 100,
        overscan: 5
    });

    return (
        <div ref={parentRef} style={{ height: '100%', overflow: 'auto' }}>
            {virtualizer.getVirtualItems().map((virtualItem) => (
                <MessageItem
                    key={virtualItem.key}
                    message={messages[virtualItem.index]}
                    style={{ transform: `translateY(${virtualItem.start}px)` }}
                />
            ))}
        </div>
    );
};
```

### 5.5 配置变更后所有页面实时同步

**问题表现**: 修改主题后，会话界面、历史页面、设置页面颜色未同步更新。

**攻克思路**:
```typescript
// stores/configStore.ts
import { subscribeWithSelector } from 'zustand/middleware';

export const useConfigStore = create(
    subscribeWithSelector((set, get) => ({
        theme: 'idea',
        providers: [],
        setTheme: (theme) => {
            set({ theme });
            // 通知Java保存配置
            window.javaBridge?.saveConfig(get());
            // 通知所有订阅者
            emitConfigChanged('theme', theme);
        }
    }))
);

// 在组件中监听
useEffect(() => {
    const unsub = useConfigStore.subscribe(
        (state) => state.theme,
        (theme) => {
            document.documentElement.setAttribute('data-theme', theme);
        }
    );
    return unsub;
}, []);
```

---

## 六、验收标准

### 6.1 功能验收

**会话界面**:
- [ ] Tab切换正常，关闭Tab后自动切换到下一个
- [ ] 双击Tab可重命名，ESC取消、Enter确认
- [ ] 历史按钮展开HistBar，再次点击收起
- [ ] 点击历史会话卡片跳转到会话界面并加载消息
- [ ] 输入框自适应高度，Shift+Enter换行、Enter发送
- [ ] 供应商切换后，模型悬浮框动态更新模型列表
- [ ] Stream开关切换后，立即生效

**历史/收藏页面**:
- [ ] 搜索框实时过滤会话列表
- [ ] 收藏/取消收藏按钮正常工作，Badge数量同步更新
- [ ] 删除会话有淡出动画
- [ ] 点击会话卡片跳转到会话界面

**设置页面**:
- [ ] 供应商列表显示状态指示灯（正常/异常/未检测）
- [ ] 新增供应商弹窗中，表单↔JSON双向同步
- [ ] 快捷填充按钮点击后，表单自动填充
- [ ] 修改主题后，所有页面颜色立即变化
- [ ] 修改语言后，界面文本切换语言（需刷新）

### 6.2 性能验收

- [ ] JCEF面板首次渲染时间 < 1.5s
- [ ] Java与JS通信延迟 < 50ms（从用户操作到Java收到）
- [ ] 消息追加延迟 < 100ms（流式输出每帧）
- [ ] 100条消息列表滚动帧率 > 30fps
- [ ] Markdown渲染（10KB文档）< 300ms
- [ ] 长时间运行（1小时）内存增长 < 50MB

### 6.3 兼容性验收

- [ ] 兼容 IDEA 2024.1+（JCEF内置）
- [ ] 兼容 Windows 11 / macOS 14 / Ubuntu 22.04
- [ ] JCEF不支持时，显示友好降级提示
- [ ] 暗色/亮色主题切换正常
- [ ] 高DPI屏幕（2x/3x）显示正常

### 6.4 代码质量验收

- [ ] TypeScript 类型完整
- [ ] 无 `any` 类型
- [ ] 组件单一职责
- [ ] 代码注释完整
- [ ] 无控制台错误

---

## 七、开发环境配置

### 7.1 创建项目

```bash
cd D:\WorkFile\ai\cc-assistant
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
```

### 7.2 安装依赖

```bash
# 核心依赖
npm install zustand marked highlight.js

# 可选：虚拟滚动
npm install @tanstack/react-virtual

# 图标库 (Material Icons Round 通过 CDN 引入)
```

### 7.3 配置 Vite

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/main/tsx'),
      '@/components': path.resolve(__dirname, './src/main/tsx/components'),
      '@/hooks': path.resolve(__dirname, './src/main/tsx/hooks'),
      '@/stores': path.resolve(__dirname, './src/main/tsx/stores'),
      '@/i18n': path.resolve(__dirname, './src/main/tsx/i18n'),
      '@/theme': path.resolve(__dirname, './src/main/tsx/theme'),
      '@/utils': path.resolve(__dirname, './src/main/tsx/utils'),
      '@/types': path.resolve(__dirname, './src/main/tsx/types'),
      '@/styles': path.resolve(__dirname, './src/main/tsx/styles'),
    }
  },
  server: {
    port: 5173,
    strictPort: true
  },
  build: {
    outDir: '../src/main/resources/web',
    emptyOutDir: true
  }
});
```

### 7.4 配置 TypeScript

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/main/tsx/*"],
      "@/components/*": ["./src/main/tsx/components/*"],
      "@/hooks/*": ["./src/main/tsx/hooks/*"],
      "@/stores/*": ["./src/main/tsx/stores/*"],
      "@/i18n/*": ["./src/main/tsx/i18n/*"],
      "@/theme/*": ["./src/main/tsx/theme/*"],
      "@/utils/*": ["./src/main/tsx/utils/*"],
      "@/types/*": ["./src/main/tsx/types/*"],
      "@/styles/*": ["./src/main/tsx/styles/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 7.5 每日检查清单

**Day 1 结束检查**:
```markdown
- [ ] npm run dev 启动成功
- [ ] TypeScript 无编译错误
- [ ] Mock 数据可 import
- [ ] 目录结构符合规范
```

**Day 3 结束检查**:
```markdown
- [ ] TabBar 可切换 Tab
- [ ] Tab 可关闭 (至少保留一个)
- [ ] HistoryBar 可展开/收起
- [ ] MessageList 可显示消息
```

**Day 5 结束检查**:
```markdown
- [ ] InputArea 可输入文本
- [ ] Ctrl+Enter 发送
- [ ] Provider/Model/Agent 选择器可用
- [ ] ContextBar 显示正确
```

**Day 7 结束检查**:
```markdown
- [ ] 状态管理正常工作
- [ ] Mock 发送消息正常
- [ ] Mock AI 响应正常
- [ ] Tab 操作正常
```

**Day 10 结束检查**:
```markdown
- [ ] npm run build 成功
- [ ] 所有功能可操作
- [ ] 无控制台错误
- [ ] 文档完整
```

---

## 里程碑

| 里程碑 | 时间 | 完成标准 |
|--------|------|---------|
| M1-FE | Day 1 | 可运行项目 + Mock 数据 |
| M2-FE | Day 3 | 布局组件完成 |
| M3-FE | Day 5 | 消息/输入组件完成 |
| M4-FE | Day 6 | 国际化/主题完成 |
| M5-FE | Day 8 | 可交互原型 |
| M6-FE | Day 10 | 交付版本 |

---

## 风险管理

| 风险 | 影响 | 应对 |
|------|------|------|
| JCEF 集成复杂度 | 中 | 参考现有 JcefChatPanel.kt 实现 |
| 性能问题 | 中 | 预留 Day 9-10 优化 |
| 国际化遗漏 | 低 | Day 6 集中处理 |
| 主题切换不完整 | 低 | CSS 变量预定义 |

---

*文档版本: v2.0 (统一整合版)*
*最后更新: 2026-04-16*
