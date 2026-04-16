# CC Assistant 前端开发计划

> **版本**: v1.0
> **创建日期**: 2026-04-16
> **参考**: `docs/session.html`
> **目标**: 基于 session.html 设计，开发可交互的前端原型

---

## 一、项目概述

### 1.1 设计目标

- **交互完整性**: 复刻 session.html 的所有交互功能
- **模块化设计**: 组件拆分清晰，便于维护
- **可扩展性**: 预留国际化、主题切换接口
- **Mock 驱动**: 所有数据使用 Mock，便于独立开发

### 1.2 技术选型

| 层级 | 技术选择 | 说明 |
|------|---------|------|
| **框架** | React 18 + TypeScript | 生态成熟，类型安全 |
| **构建工具** | Vite 5+ | HMR 支持，快速构建 |
| **样式** | CSS Modules + CSS Variables | 保留 session.html 风格，支持主题切换 |
| **状态管理** | Zustand | 轻量级，简单直接 |
| **Markdown** | marked.js + highlight.js | 与 session.html 一致 |
| **图标** | Material Icons Round | 与 session.html 一致 |

### 1.3 组件层次结构

```
App
├── AppLayout
│   ├── TopBar
│   │   ├── TabBar
│   │   └── TopBarActions
│   ├── HistoryBar
│   ├── MessageArea
│   │   ├── MessageList
│   │   │   ├── UserMessage
│   │   │   ├── AIMessage
│   │   │   │   ├── MarkdownContent
│   │   │   │   ├── CodeBlock
│   │   │   │   └── DiffViewer
│   │   │   └── ThinkingBlock
│   │   └── EmptyState
│   └── InputArea
│       ├── InputToolbar
│       ├── InputBox
│       └── InputActions
├── SettingsModal
├── ProviderEditModal
└── Toast
```

---

## 二、Mock 数据模块设计

### 2.1 Mock 数据结构

```
frontend/src/mock/
├── index.ts              # 统一导出
├── sessions.ts           # 会话数据
├── messages.ts           # 消息数据
├── providers.ts          # 供应商数据
├── models.ts             # 模型数据
├── agents.ts             # Agent 数据
├── config.ts             # 配置数据
└── diffData.ts           # Diff 数据
```

### 2.2 Mock 数据接口定义

```typescript
// frontend/src/types/mock.ts
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
}

export interface MockModel {
  id: string;
  name: string;
}

export interface MockAgent {
  id: string;
  name: string;
}

export interface MockDiffFile {
  file: string;
  add: number;
  del: number;
}
```

---

## 三、国际化方案

### 3.1 国际化架构

```
frontend/src/i18n/
├── index.ts              # i18n 工厂函数
├── locales/
│   ├── zh-CN.ts          # 简体中文
│   ├── en-US.ts          # 英文
│   ├── ja-JP.ts          # 日文
│   └── ko-KR.ts          # 韩文
└── types.ts              # 类型定义
```

### 3.2 使用方式

```typescript
// frontend/src/i18n/index.ts
export const createI18n = (locale: Locale) => {
  return {
    t: (key: keyof TranslationKeys): string => {
      return locales[locale][key] || locales['zh-CN'][key];
    },
    setLocale: (newLocale: Locale) => {
      // 切换语言逻辑
    }
  };
};

// 使用
const { t } = useI18n();
<Button>{t('common.confirm')}</Button>
```

### 3.3 预留接口

```typescript
// 与 Java 层对接接口
interface JavaI18nBridge {
  applyI18n(messages: Record<string, string>): void;
  onLanguageChange(locale: string): void;
}
```

---

## 四、主题切换方案

### 4.1 主题架构

```
frontend/src/theme/
├── index.ts              # 主题工厂函数
├── themes/
│   ├── idea.ts           # IDEA 主题
│   ├── dark.ts           # 暗色主题
│   ├── light.ts          # 亮色主题
│   └── highContrast.ts   # 高对比度主题
└── types.ts              # 类型定义
```

### 4.2 CSS 变量设计

```css
/* frontend/src/styles/theme.css */
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

### 4.3 预留接口

```typescript
// 与 Java 层对接接口
interface JavaThemeBridge {
  applyTheme(variables: Record<string, string>, isDark: boolean): void;
  onThemeChange(themeId: string): void;
}
```

---

## 五、开发阶段划分

### Phase 1: 项目初始化 (Day 1)

**任务清单**:
- [ ] 创建 Vite + React + TypeScript 项目
- [ ] 配置 Tailwind CSS (可选，主要使用 CSS Modules)
- [ ] 创建目录结构
- [ ] 配置路径别名 (@/components, @/mock, etc.)
- [ ] 配置开发服务器 (端口、代理)

**验收标准**:
- `npm run dev` 启动成功
- 访问 http://localhost:5173 显示 "Hello Frontend"
- TypeScript 编译无错误

---

### Phase 2: Mock 数据模块 (Day 1)

**任务清单**:
- [ ] 创建 Mock 数据类型定义
- [ ] 创建 Mock 数据文件
- [ ] 创建 Mock 数据导出入口
- [ ] 编写 Mock 数据测试（可选）

**验收标准**:
- `import { mockSessions } from '@/mock'` 可用
- Mock 数据结构与 session.html 一致

---

### Phase 3: 基础组件库 (Day 2)

**任务清单**:
- [ ] Button 组件
- [ ] Icon 组件 (Material Icons Round)
- [ ] ScrollArea 组件
- [ ] Modal 组件
- [ ] Toast 组件
- [ ] Dropdown 组件

**验收标准**:
- 所有基础组件可独立使用
- 支持 className 和 style 传递

---

### Phase 4: 布局组件 (Day 2-3)

**任务清单**:
- [ ] AppLayout 主布局
- [ ] TopBar 顶栏
- [ ] TabBar 标签栏
- [ ] TopBarActions 右侧操作区
- [ ] HistoryBar 历史会话栏

**验收标准**:
- 布局结构与 session.html 一致
- Tab 切换正常
- 历史会话展开/收起正常

---

### Phase 5: 消息组件 (Day 3-4)

**任务清单**:
- [ ] MessageArea 消息区域
- [ ] MessageList 消息列表
- [ ] UserMessage 用户消息
- [ ] AIMessage AI 消息
- [ ] MarkdownContent Markdown 渲染
- [ ] CodeBlock 代码块
- [ ] DiffViewer Diff 展示
- [ ] ThinkingBlock 思考片段
- [ ] EmptyState 空状态

**验收标准**:
- 消息渲染正确
- Markdown 语法完整支持
- 代码高亮正常
- Diff 可视化正常

---

### Phase 6: 输入组件 (Day 4-5)

**任务清单**:
- [ ] InputArea 输入区域
- [ ] InputToolbar 工具栏
- [ ] InputBox 输入框
- [ ] InputActions 操作按钮
- [ ] ProviderSelector 供应商选择器
- [ ] ModelSelector 模型选择器
- [ ] AgentSelector Agent 选择器
- [ ] ContextBar 上下文占用比
- [ ] DiffSummary Diff 汇总

**验收标准**:
- 输入框自动高度调整
- 快捷键支持 (Ctrl+Enter 发送)
- 悬浮框弹出正常

---

### Phase 7: 弹窗组件 (Day 5)

**任务清单**:
- [ ] SettingsModal 设置弹窗
- [ ] ProviderEditModal 供应商编辑弹窗
- [ ] SettingsNav 设置导航
- [ ] SettingsContent 设置内容区

**验收标准**:
- 弹窗打开/关闭正常
- 设置导航切换正常
- 表单验证正常

---

### Phase 8: 国际化集成 (Day 6)

**任务清单**:
- [ ] 创建 i18n 模块
- [ ] 提取所有文本到翻译文件
- [ ] 创建语言切换器
- [ ] 预留 Java 层接口

**验收标准**:
- 所有文本使用 `t()` 函数
- 语言切换实时生效
- 文本无遗漏

---

### Phase 9: 主题切换集成 (Day 6)

**任务清单**:
- [ ] 创建 theme 模块
- [ ] 提取所有颜色到 CSS 变量
- [ ] 创建主题切换器
- [ ] 预留 Java 层接口

**验收标准**:
- 主题切换实时生效
- CSS 变量完整
- 无硬编码颜色

---

### Phase 10: 状态管理 (Day 7)

**任务清单**:
- [ ] 创建 Zustand stores
- [ ] chatStore (聊天状态)
- [ ] sessionStore (会话状态)
- [ ] uiStore (UI 状态)
- [ ] configStore (配置状态)

**验收标准**:
- 状态更新触发 UI 重新渲染
- 状态持久化 (localStorage)

---

### Phase 11: 交互完善 (Day 7-8)

**任务清单**:
- [ ] 发送消息交互
- [ ] 流式输出模拟
- [ ] Tab 新建/切换/关闭
- [ ] 历史会话加载
- [ ] 设置保存
- [ ] 表单验证

**验收标准**:
- 所有交互可操作
- 流式输出流畅
- 无控制台错误

---

### Phase 12: 打磨优化 (Day 9-10)

**任务清单**:
- [ ] 性能优化 (虚拟列表、懒加载)
- [ ] 动画优化
- [ ] 无障碍访问 (ARIA)
- [ ] 浏览器兼容性测试
- [ ] 代码审查

**验收标准**:
- 首屏渲染 < 1s
- 交互响应 < 100ms
- 无明显卡顿

---

## 六、项目目录结构

```
frontend/
├── src/
│   ├── main/
│   │   ├── tsx/                 # TypeScript React 组件
│   │   │   ├── App.tsx          # 根组件
│   │   │   ├── main.tsx         # 入口文件
│   │   │   ├── components/      # UI 组件
│   │   │   │   ├── layout/      # 布局组件
│   │   │   │   │   ├── AppLayout.tsx
│   │   │   │   │   ├── TopBar.tsx
│   │   │   │   │   ├── TabBar.tsx
│   │   │   │   │   └── HistoryBar.tsx
│   │   │   │   ├── message/     # 消息组件
│   │   │   │   │   ├── MessageArea.tsx
│   │   │   │   │   ├── MessageList.tsx
│   │   │   │   │   ├── UserMessage.tsx
│   │   │   │   │   ├── AIMessage.tsx
│   │   │   │   │   ├── MarkdownContent.tsx
│   │   │   │   │   ├── CodeBlock.tsx
│   │   │   │   │   ├── DiffViewer.tsx
│   │   │   │   │   ├── ThinkingBlock.tsx
│   │   │   │   │   └── EmptyState.tsx
│   │   │   │   ├── input/       # 输入组件
│   │   │   │   │   ├── InputArea.tsx
│   │   │   │   │   ├── InputToolbar.tsx
│   │   │   │   │   ├── InputBox.tsx
│   │   │   │   │   ├── InputActions.tsx
│   │   │   │   │   ├── ProviderSelector.tsx
│   │   │   │   │   ├── ModelSelector.tsx
│   │   │   │   │   ├── AgentSelector.tsx
│   │   │   │   │   ├── ContextBar.tsx
│   │   │   │   │   └── DiffSummary.tsx
│   │   │   │   ├── modal/       # 弹窗组件
│   │   │   │   │   ├── SettingsModal.tsx
│   │   │   │   │   ├── ProviderEditModal.tsx
│   │   │   │   │   ├── SettingsNav.tsx
│   │   │   │   │   └── SettingsContent.tsx
│   │   │   │   └── common/      # 通用组件
│   │   │   │       ├── Button.tsx
│   │   │   │       ├── Icon.tsx
│   │   │   │       ├── ScrollArea.tsx
│   │   │   │       ├── Modal.tsx
│   │   │   │       ├── Toast.tsx
│   │   │   │       └── Dropdown.tsx
│   │   │   ├── hooks/           # React Hooks
│   │   │   │   ├── useI18n.ts
│   │   │   │   ├── useTheme.ts
│   │   │   │   ├── useToast.ts
│   │   │   │   └── useJcef.ts
│   │   │   ├── stores/          # Zustand 状态管理
│   │   │   │   ├── chatStore.ts
│   │   │   │   ├── sessionStore.ts
│   │   │   │   ├── uiStore.ts
│   │   │   │   └── configStore.ts
│   │   │   ├── i18n/            # 国际化
│   │   │   │   ├── index.ts
│   │   │   │   ├── locales/
│   │   │   │   │   ├── zh-CN.ts
│   │   │   │   │   ├── en-US.ts
│   │   │   │   │   ├── ja-JP.ts
│   │   │   │   │   └── ko-KR.ts
│   │   │   │   └── types.ts
│   │   │   ├── theme/           # 主题
│   │   │   │   ├── index.ts
│   │   │   │   ├── themes/
│   │   │   │   │   ├── idea.ts
│   │   │   │   │   ├── dark.ts
│   │   │   │   │   ├── light.ts
│   │   │   │   │   └── highContrast.ts
│   │   │   │   └── types.ts
│   │   │   ├── utils/           # 工具函数
│   │   │   │   ├── markdown.ts
│   │   │   │   ├── format.ts
│   │   │   │   └── jcef.ts
│   │   │   ├── types/           # 类型定义
│   │   │   │   ├── mock.ts
│   │   │   │   ├── i18n.ts
│   │   │   │   └── theme.ts
│   │   │   └── styles/          # 样式文件
│   │   │       ├── global.css
│   │   │       ├── theme.css
│   │   │       └── animations.css
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

## 七、关键交互流程

### 7.1 发送消息流程

```
1. 用户在 InputBox 输入文本
2. 点击发送按钮 / 按 Ctrl+Enter
3. 创建用户消息对象
4. 更新 chatStore (追加用户消息)
5. 模拟 AI 思考延迟
6. 创建 AI 消息对象
7. 流式追加 AI 响应 (每 50ms 追加一段文本)
8. 完成流式输出
9. 更新会话标题 (取用户消息前 20 字)
```

### 7.2 Tab 切换流程

```
1. 用户点击 Tab
2. 更新 activeSessionId
3. 重新渲染 MessageList
4. 滚动到消息底部
5. 更新 InputArea 状态
```

### 7.3 历史会话加载流程

```
1. 用户点击历史会话按钮
2. HistoryBar 展开显示
3. 用户搜索/浏览会话
4. 点击会话项
5. 创建新 Tab
6. 复制会话消息到新 Tab
7. 切换到新 Tab
```

---

## 八、与 Java 层对接接口

### 8.1 Java → JavaScript

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

### 8.2 JavaScript → Java

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

---

## 九、开发环境配置

### 9.1 创建项目

```bash
cd D:\WorkFile\ai\cc-assistant
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
```

### 9.2 安装依赖

```bash
# 核心依赖
npm install zustand marked highlight.js

# 图标库 (Material Icons Round 通过 CDN 引入)
# npm install @mui/icons-material

# 可选：Tailwind CSS
# npm install -D tailwindcss postcss autoprefixer
# npx tailwindcss init -p
```

### 9.3 配置 Vite

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
  }
});
```

### 9.4 配置 TypeScript

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

---

## 十、交付标准

### 10.1 功能完整性

- [ ] 所有 UI 组件已实现
- [ ] 所有交互可操作
- [ ] Mock 数据完整
- [ ] 国际化接口预留
- [ ] 主题切换接口预留

### 10.2 代码质量

- [ ] TypeScript 类型完整
- [ ] 无 `any` 类型
- [ ] 组件单一职责
- [ ] 代码注释完整

### 10.3 性能指标

- [ ] 首屏渲染 < 1.5s
- [ ] 交互响应 < 100ms
- [ ] 消息追加 < 50ms

### 10.4 兼容性

- [ ] Chrome 90+ (JCEF 内核)
- [ ] 无控制台错误
- [ ] 无内存泄漏

---

*文档版本: v1.0*
*最后更新: 2026-04-16*
