# 前端组件开发规范

> **版本**: v1.0
> **创建日期**: 2026-04-16
> **参考**: `docs/session.html`

---

## 一、组件开发规范

### 1.1 命名规范

| 类型 | 命名规则 | 示例 |
|------|---------|------|
| 组件文件 | PascalCase | `UserMessage.tsx` |
| 组件导出 | PascalCase | `export const UserMessage: React.FC<Props>` |
| Hook 文件 | use 开头 camelCase | `useI18n.ts` |
| Store 文件 | camelCase + Store 后缀 | `chatStore.ts` |
| 类型文件 | camelCase + .types | `message.types.ts` |

### 1.2 组件模板

```typescript
// frontend/src/main/tsx/components/message/UserMessage.tsx
import React from 'react';
import styles from './UserMessage.module.css';

export interface UserMessageProps {
  id: string;
  content: string;
  timestamp?: string;
  onCopy?: (id: string, content: string) => void;
}

export const UserMessage: React.FC<UserMessageProps> = ({
  id,
  content,
  timestamp,
  onCopy
}) => {
  const handleCopy = () => {
    onCopy?.(id, content);
  };

  return (
    <div className={styles.container}>
      <div className={styles.bubble}>
        {content}
        <button className={styles.copyBtn} onClick={handleCopy}>
          <span className="material-icons-round">content_copy</span>
        </button>
      </div>
    </div>
  );
};
```

### 1.3 CSS Modules 模板

```css
/* frontend/src/main/tsx/components/message/UserMessage.module.css */
.container {
  display: flex;
  justify-content: flex-end;
  padding: 5px 18px;
  animation: messageIn 0.2s ease;
}

.bubble {
  max-width: 70%;
  padding: 8px 12px;
  background: rgba(201, 135, 58, 0.08);
  border: 1px solid rgba(201, 135, 58, 0.1);
  border-radius: 10px 10px 3px 10px;
  font-size: 13px;
  line-height: 1.6;
  word-break: break-word;
  position: relative;
}

.copyBtn {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 22px;
  height: 22px;
  border-radius: 3px;
  border: none;
  background: var(--bg-element);
  color: var(--fg-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.1s;
}

.bubble:hover .copyBtn {
  opacity: 1;
}

.copyBtn:hover {
  color: var(--fg-primary);
  background: var(--bg-hover);
}

@keyframes messageIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

## 二、组件开发优先级

### P0 (核心组件) - Day 1-3

| 组件 | 文件路径 | 依赖 | 预估 |
|------|---------|------|------|
| AppLayout | `layout/AppLayout.tsx` | 无 | 2h |
| TopBar | `layout/TopBar.tsx` | AppLayout | 2h |
| TabBar | `layout/TabBar.tsx` | TopBar | 3h |
| MessageArea | `message/MessageArea.tsx` | AppLayout | 2h |
| MessageList | `message/MessageList.tsx` | MessageArea | 3h |
| UserMessage | `message/UserMessage.tsx` | MessageList | 2h |
| AIMessage | `message/AIMessage.tsx` | MessageList | 3h |
| InputArea | `input/InputArea.tsx` | AppLayout | 3h |

### P1 (功能组件) - Day 4-5

| 组件 | 文件路径 | 依赖 | 预估 |
|------|---------|------|------|
| HistoryBar | `layout/HistoryBar.tsx` | TopBar | 3h |
| MarkdownContent | `message/MarkdownContent.tsx` | AIMessage | 4h |
| CodeBlock | `message/CodeBlock.tsx` | MarkdownContent | 3h |
| InputToolbar | `input/InputToolbar.tsx` | InputArea | 3h |
| InputBox | `input/InputBox.tsx` | InputArea | 2h |
| ProviderSelector | `input/ProviderSelector.tsx` | InputToolbar | 2h |

### P2 (增强组件) - Day 6-7

| 组件 | 文件路径 | 依赖 | 预估 |
|------|---------|------|------|
| DiffViewer | `message/DiffViewer.tsx` | AIMessage | 4h |
| ThinkingBlock | `message/ThinkingBlock.tsx` | AIMessage | 2h |
| EmptyState | `message/EmptyState.tsx` | MessageArea | 2h |
| ModelSelector | `input/ModelSelector.tsx` | InputToolbar | 2h |
| AgentSelector | `input/AgentSelector.tsx` | InputToolbar | 2h |
| ContextBar | `input/ContextBar.tsx` | InputArea | 1h |
| DiffSummary | `input/DiffSummary.tsx` | InputToolbar | 2h |

### P3 (弹窗组件) - Day 8

| 组件 | 文件路径 | 依赖 | 预估 |
|------|---------|------|------|
| SettingsModal | `modal/SettingsModal.tsx` | 无 | 4h |
| ProviderEditModal | `modal/ProviderEditModal.tsx` | SettingsModal | 3h |
| SettingsNav | `modal/SettingsNav.tsx` | SettingsModal | 2h |
| SettingsContent | `modal/SettingsContent.tsx` | SettingsModal | 3h |

---

## 三、详细组件规范

### 3.1 AppLayout (主布局)

**职责**: 容器组件，组织整体布局

**Props**:
```typescript
export interface AppLayoutProps {
  children?: React.ReactNode;
}
```

**结构**:
```
┌─────────────────────────────────────┐
│ TopBar                              │
├─────────────────────────────────────┤
│ HistoryBar (可展开)                 │
├─────────────────────────────────────┤
│                                     │
│ Content Area (children)             │
│                                     │
├─────────────────────────────────────┤
│ InputArea                           │
└─────────────────────────────────────┘
```

**实现要点**:
- 使用 Flexbox 布局
- HistoryBar 使用 max-height + overflow 实现展开/收起动画
- 固定高度 100vh，内部使用 flex: 1 实现自适应

---

### 3.2 TopBar (顶栏)

**职责**: 顶部操作栏

**Props**:
```typescript
export interface TopBarProps {
  streamEnabled: boolean;
  onStreamToggle: () => void;
  onHistoryClick: () => void;
  onFavoriteClick: () => void;
  onSettingsClick: () => void;
}
```

**结构**:
```
┌────────────────────────────────────────┐
│ [Tab 1] [Tab 2] [Tab 3] ...  [🕾][⭐][🔄][⚙] │
└────────────────────────────────────────┘
```

**实现要点**:
- Tab 栏使用 overflow-x: auto 实现横向滚动
- 右侧按钮固定宽度，使用 gap 分隔
- 流式开关使用 CSS 动画过渡

---

### 3.3 TabBar (标签栏)

**职责**: 会话标签管理

**Props**:
```typescript
export interface TabBarProps {
  sessions: Session[];
  activeSessionId: string;
  onTabClick: (id: string) => void;
  onTabClose: (id: string) => void;
  onTabDoubleClick: (id: string) => void;
}
```

**交互**:
- 单击切换 Tab
- 双击重命名 Tab
- 悬浮显示关闭按钮
- 至少保留一个 Tab

**实现要点**:
- 活跃 Tab 添加 `on` class
- 关闭按钮使用 `opacity: 0` → `opacity: 1` 过渡
- Tab 标题使用 `text-overflow: ellipsis` 截断

---

### 3.4 HistoryBar (历史会话栏)

**职责**: 历史会话/收藏会话列表

**Props**:
```typescript
export interface HistoryBarProps {
  isOpen: boolean;
  mode: 'history' | 'favorite';
  sessions: Session[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSessionClick: (session: Session) => void;
  onFavoriteToggle: (id: string, fav: boolean) => void;
  onModeSwitch: () => void;
}
```

**结构**:
```
┌─────────────────────────────────────┐
│ [🔍] 搜索会话...              [收藏→] │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ 会话 1        [⭐][✏️][🗑️]      │ │
│ │ 2 questions · 02-15 10:30      │ │
│ ├─────────────────────────────────┤ │
│ │ 会话 2        [☆][✏️][🗑️]      │ │
│ │ 5 questions · 02-14 16:20      │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**实现要点**:
- 使用 max-height + transition 实现展开/收起
- 搜索框实时过滤
- 卡片网格布局 (grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)))

---

### 3.5 MessageArea (消息区域)

**职责**: 消息容器，管理滚动

**Props**:
```typescript
export interface MessageAreaProps {
  messages: Message[];
  streaming: boolean;
  onCopy: (id: string, content: string) => void;
  onQuote: (id: string, content: string) => void;
}
```

**实现要点**:
- 使用 `overflow-y: auto` 管理滚动
- 新消息追加时自动滚动到底部
- 使用 `scrollIntoView` 平滑滚动

---

### 3.6 MessageList (消息列表)

**职责**: 渲染消息列表

**Props**:
```typescript
export interface MessageListProps {
  messages: Message[];
  streaming: boolean;
  streamingMessageId?: string;
  onCopy: (id: string, content: string) => void;
  onQuote: (id: string, content: string) => void;
}
```

**实现要点**:
- 根据 `role` 区分 UserMessage / AIMessage
- 流式消息添加 `cur-b` class（光标动画）
- 空列表显示 EmptyState

---

### 3.7 UserMessage (用户消息)

**职责**: 渲染用户消息

**Props**:
```typescript
export interface UserMessageProps {
  id: string;
  content: string;
  timestamp?: string;
  onCopy?: (id: string, content: string) => void;
}
```

**样式**:
- 右对齐
- 橙色背景 (`rgba(201, 135, 58, 0.08)`)
- 圆角 `10px 10px 3px 10px`（右下角直角）
- 悬浮显示复制按钮

---

### 3.8 AIMessage (AI 消息)

**职责**: 渲染 AI 消息

**Props**:
```typescript
export interface AIMessageProps {
  id: string;
  content: string;
  timestamp?: string;
  thinking?: string;
  onCopy?: (id: string, content: string) => void;
  onQuote?: (id: string, content: string) => void;
  onRegenerate?: (id: string) => void;
  onRewind?: (id: string) => void;
}
```

**结构**:
```
┌─ ┌───┐ ┌─────────────────────────────┐
│  │AI │ │ 10:31 • thinking            │
│  └───┘ ├─────────────────────────────┤
│        │ Content (Markdown)          │
│        │ - Code Block                │
│        │ - Diff                      │
│        ├─────────────────────────────┤
│        │ [📋][💬][🔄][⏪]            │
│        └─────────────────────────────┘
└─ (左侧对齐，灰色背景)
```

**实现要点**:
- 左对齐
- 头部：时间 + thinking 标记
- 内容区：MarkdownContent
- 底部操作栏：复制、引用、重新生成、回溯

---

### 3.9 MarkdownContent (Markdown 渲染)

**职责**: 渲染 Markdown 内容

**Props**:
```typescript
export interface MarkdownContentProps {
  content: string;
  className?: string;
}
```

**实现要点**:
- 使用 `marked.js` 解析 Markdown
- 使用 `DOMPurify` 清理 HTML（安全）
- 使用 `highlight.js` 高亮代码
- 自定义渲染规则处理 Diff

---

### 3.10 CodeBlock (代码块)

**职责**: 渲染代码块

**Props**:
```typescript
export interface CodeBlockProps {
  language: string;
  code: string;
  onCopy?: (code: string) => void;
}
```

**结构**:
```
┌─────────────────────────────────┐
│ KOTLIN                  [📋]    │
├─────────────────────────────────┤
│ val x = 1                       │
│ fun hello() {                   │
│   println("world")              │
│ }                               │
└─────────────────────────────────┘
```

**实现要点**:
- 头部显示语言 + 复制按钮
- 使用 `highlight.js` 高亮
- 行号可选显示

---

### 3.11 DiffViewer (Diff 可视化)

**职责**: 渲染 Diff 内容

**Props**:
```typescript
export interface DiffViewerProps {
  file: string;
  additions: number;
  deletions: number;
  onAccept?: () => void;
  onReject?: () => void;
}
```

**结构**:
```
┌────────────────────────────────────┐
│ [📄] SessionService.kt    [+4][-0] │
├────────────────────────────────────┤
│ 1 │  │ class SessionService {      │
│ 2 │  │   fun create() {            │
│ 3 │ -│   }                         │
│ 4 │ +│   fun createSession() {     │
│ 5 │ +│     return Session()        │
│ 6 │ +│   }                         │
├────────────────────────────────────┤
│         [✓接受] [✗拒绝]            │
└────────────────────────────────────┘
```

**实现要点**:
- 绿色背景显示添加行
- 红色背景显示删除行
- 底部操作按钮

---

### 3.12 ThinkingBlock (思考片段)

**职责**: 渲染思考片段

**Props**:
```typescript
export interface ThinkingBlockProps {
  content: string;
  defaultExpanded?: boolean;
}
```

**结构**:
```
┌─────────────────────────────────┐
│ [🧠] 思考...              [▾]   │
├─────────────────────────────────┤
│ (展开/折叠状态)                  │
│ 让我分析这个问题的核心...        │
└─────────────────────────────────┘
```

**实现要点**:
- 默认折叠状态
- 点击展开/折叠
- 灰色字体表示思考内容

---

### 3.13 EmptyState (空状态)

**职责**: 空消息列表提示

**Props**:
```typescript
export interface EmptyStateProps {
  onCreateClick?: () => void;
}
```

**结构**:
```
┌─────────────────────────────────┐
│         [🤖 AI 助手]            │
│                                 │
│   CC Assistant                  │
│   帮你编写代码、审查变更...      │
│                                 │
│ [🔧] 优化代码 [🧠] 解释代码      │
│ [🧪] 编写测试 [📋] 审查变更      │
└─────────────────────────────────┘
```

---

### 3.14 InputArea (输入区域)

**职责**: 输入容器

**Props**:
```typescript
export interface InputAreaProps {
  streaming: boolean;
  onSend: (text: string, options: SendOptions) => void;
  onStop: () => void;
}
```

**结构**:
```
┌─────────────────────────────────────┐
│ [📷][📎] [+0 -0] | 上下文 30% [▾]   │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ 输入消息...               [↑]   │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ [DNS▼] [Auto▼] [4.5▼] [🧀][🔧] [▓]  │
└─────────────────────────────────────┘
```

---

### 3.15 InputBox (输入框)

**职责**: 多行文本输入

**Props**:
```typescript
export interface InputBoxProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  streaming: boolean;
  placeholder?: string;
}
```

**实现要点**:
- 使用 `textarea` + 自动高度调整
- 支持 Ctrl+Enter 发送
- 流式输入时显示停止按钮

---

### 3.16 ProviderSelector (供应商选择器)

**职责**: 供应商下拉选择

**Props**:
```typescript
export interface ProviderSelectorProps {
  providers: Provider[];
  currentProvider: string;
  onChange: (id: string) => void;
}
```

**结构**:
```
┌───────────────┐
│ [🌐] Claude ▾ │
│  ├─ Claude    │
│  ├─ GLM       │
│  └─ DeepSeek  │
└───────────────┘
```

---

### 3.17 ModelSelector (模型选择器)

**职责**: 模型下拉选择（根据供应商动态变化）

**Props**:
```typescript
export interface ModelSelectorProps {
  models: Model[];
  currentModel: string;
  onChange: (id: string) => void;
}
```

---

### 3.18 AgentSelector (Agent 选择器)

**职责**: Agent 下拉选择

**Props**:
```typescript
export interface AgentSelectorProps {
  agents: Agent[];
  currentAgent: string;
  onChange: (id: string) => void;
}
```

---

### 3.19 ContextBar (上下文占用比)

**职责**: 显示上下文使用情况

**Props**:
```typescript
export interface ContextBarProps {
  used: number;
  total: number;
}
```

**结构**:
```
上下文 [████░░░░░░] 30%
```

---

### 3.20 DiffSummary (Diff 汇总)

**职责**: 显示本次会话的 Diff 汇总

**Props**:
```typescript
export interface DiffSummaryProps {
  files: DiffFile[];
  onFileClick?: (file: string) => void;
}
```

**结构**:
```
┌──────────────────────┐
│ [≡] +15 -3      [▾] │
│  ├─ File1.kt  +5 -0 │
│  ├─ File2.kt +10 -3 │
│  └─ ...             │
└──────────────────────┘
```

---

### 3.21 SettingsModal (设置弹窗)

**职责**: 设置弹窗容器

**Props**:
```typescript
export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}
```

**结构**:
```
┌─────────────────────────────────────┐
│ 设置                    [✕]         │
├──────┬──────────────────────────────┤
│ 基础 │ CLI 版本: 0.5.0              │
│ 外观 │ 主题: [IDEA ▾]               │
│ 供应 │ ┌─────────────────────────┐ │
│ 商   │ │ Claude      [✓][✏️][🗑️]│ │
│      │ │ GLM         [✓][✏️][🗑️]│ │
│      │ └─────────────────────────┘ │
└──────┴──────────────────────────────┘
```

---

### 3.22 ProviderEditModal (供应商编辑弹窗)

**职责**: 新增/编辑供应商

**Props**:
```typescript
export interface ProviderEditModalProps {
  isOpen: boolean;
  provider?: Provider;
  onClose: () => void;
  onSave: (provider: Provider) => void;
}
```

**结构**:
```
┌─────────────────────────────────────┐
│ 新增供应商              [✕]         │
├─────────────────────────────────────┤
│ 名称: [_______________]             │
│ URL:  [_______________]             │
│ Key:  [_______________]             │
│                                      │
│              [取消] [保存]          │
└─────────────────────────────────────┘
```

---

## 四、通用组件规范

### 4.1 Button (按钮)

**Props**:
```typescript
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  children: React.ReactNode;
  onClick?: () => void;
}
```

**样式**:
- Primary: 橙色背景
- Secondary: 灰色背景
- Ghost: 透明背景 + 边框
- Danger: 红色背景

---

### 4.2 Icon (图标)

**Props**:
```typescript
export interface IconProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  color?: string;
}
```

**实现**:
- 使用 Material Icons Round
- 通过 CDN 引入
- 使用 `<span class="material-icons-round">` 渲染

---

### 4.3 Modal (弹窗)

**Props**:
```typescript
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}
```

**实现要点**:
- 使用 Portal 渲染到 body
- 点击遮罩关闭
- ESC 键关闭

---

### 4.4 Toast (提示)

**Props**:
```typescript
export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
}
```

**实现要点**:
- 固定定位在底部中央
- 自动消失（默认 3s）
- 动画进出

---

### 4.5 Dropdown (下拉框)

**Props**:
```typescript
export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
}
```

---

*文档版本: v1.0*
*最后更新: 2026-04-16*
