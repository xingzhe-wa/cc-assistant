# CC Assistant 前端开发计划 (现代前端框架版)

> **版本**: v2.0 (2026-04-16 重大更新)
> **策略**: 现代前端框架 + JCEF 实现聊天界面，Vite 构建流程
> **技术栈**: React 18+ / Vue 3 / Svelte (三选一) + TypeScript + Tailwind CSS + shadcn/ui

---

## 一、架构更新摘要

### 1.1 重大变更 (v1.2 → v2.0)

| 变更项 | v1.2 (旧方案) | v2.0 (新方案) |
|--------|---------------|---------------|
| 前端框架 | ❌ Vanilla JS | ✅ React/Vue/Svelte |
| 构建工具 | ❌ 无构建流程 | ✅ Vite 5+ |
| 样式方案 | ❌ 原生 CSS | ✅ Tailwind CSS + shadcn/ui |
| 状态管理 | ❌ 无 | ✅ Zustand/Redux/Pinia |
| 开发体验 | ❌ 手动刷新 | ✅ HMR 热更新 |
| JCEF 范围 | 消息区仅 | 整个聊天界面 |
| 类型安全 | ❌ 无 | ✅ TypeScript |

### 1.2 技术选型 (三选一)

#### 方案 A: React 18 + TypeScript (⭐ 推荐)

**优势**:
- 生态成熟，社区活跃
- Hooks 简洁，组件化开发
- TypeScript 支持完善
- shadcn/ui 高质量组件库

**劣势**:
- 包体积较大 (需优化)
- 学习曲线较陡 (相对 Vue)

**适用场景**: 大型项目、复杂状态管理

#### 方案 B: Vue 3 + TypeScript

**优势**:
- 渐进式框架，学习曲线平缓
- 性能优秀，包体积小
- Composition API 灵活
- 中文文档完善

**劣势**:
- 生态相对较小
- TypeScript 支持稍弱

**适用场景**: 中小型项目、快速开发

#### 方案 C: Svelte + TypeScript

**优势**:
- 编译时优化，运行时性能最佳
- 包体积最小
- 语法简洁，学习成本低

**劣势**:
- 社区较小，资料少
- 生态不完善

**适用场景**: 性能敏感、小型项目

---

## 二、当前状态分析

### 2.1 已完成 (M0 + M1)

| 模块 | 文件 | 状态 | 说明 |
|------|------|------|------|
| CliBridgeService | `bridge/CliBridgeService.kt` | ✅ 完成 | CLI 进程管理，NDJSON 解析 |
| NdjsonParser | `bridge/NdjsonParser.kt` | ✅ 完成 | 流式输出解析 |
| CliMessage | `bridge/CliMessage.kt` | ✅ 完成 | 消息类型定义 |
| ProviderService | `model/Provider.kt` | ✅ 完成 | 6 个预置供应商 |
| ChatPanel (Swing) | `ui/ChatPanel.kt` | ✅ M1完成 | 基础聊天面板 (M2 切换 JCEF) |
| AppConfigState | `config/AppConfigState.kt` | ✅ 完成 | 配置持久化 |

### 2.2 待开发 (M2-M5)

| 里程碑 | 前端任务 | 后端任务 | 优先级 |
|--------|---------|---------|--------|
| **M2** | 前端框架集成、JCEF 消息渲染、多会话 | SessionService、RewindService | P0 |
| **M3** | MCP 工具卡片、权限弹窗 | MCPService、权限处理 | P1 |
| **M4** | 设置界面 (Basic/Provider/Appearance) | ThemeService、I18nService | P0 |
| **M5** | @file 弹窗、Slash 弹窗、动画 | FileReferenceService | P1 |

---

## 三、前端开发策略

### 3.1 核心原则

```
┌─────────────────────────────────────────────────────────────┐
│  前端优先开发流程 (现代框架版)                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 前端项目初始化 (Vite + 框架)                            │
│     ├── 选择框架: React/Vue/Svelte                         │
│     ├── 安装依赖: npm install                              │
│     └── 配置工具: Vite + Tailwind + TypeScript             │
│                                                             │
│  2. UI 组件开发 (Mock 数据驱动)                             │
│     ├── 使用 Mock 数据驱动界面                              │
│     ├── 验证交互流程和视觉效果                              │
│     ├── HMR 热更新，实时预览                                │
│     └── 独立于后端 API 开发                                 │
│                                                             │
│  3. JCEF 集成开发                                           │
│     ├── Java → JS: executeJavaScript()                     │
│     ├── JS → Java: JBCefJSQuery                            │
│     ├── 双向通信调试                                        │
│     └── 状态同步验证                                        │
│                                                             │
│  4. 后端 API 对接                                            │
│     ├── 替换 Mock 数据为真实 API 调用                       │
│     ├── 集成 CliBridgeService 回调                          │
│     └── 端到端测试                                          │
│                                                             │
│  5. 联调与打磨                                               │
│     ├── 修复集成问题                                        │
│     ├── 性能优化                                            │
│     └── 用户体验打磨                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Mock 数据策略

| 模块 | Mock 方式 | 数据来源 |
|------|----------|---------|
| 会话列表 | 硬编码 5-10 条示例会话 | `mockSessionData.ts` |
| 消息渲染 | 硬编码用户消息 + AI 响应 | `mockMessageData.ts` |
| Provider 列表 | 使用 `ProviderService.PRESET_PROVIDERS` | 已有 |
| MCP 工具调用 | 定时器模拟状态变化 | `mockMcpData.ts` |
| Token 统计 | 随机生成数据 | `mockUsageData.ts` |

### 3.3 架构驱动对齐基线

对齐依据来自 `CC_Assistant_Technical_Architecture.md`：
- **需求总览**: 第 2 章 (功能模块矩阵 + 功能详细说明)
- **功能概述**: 第 2.2 节 (2.2.1 ~ 2.2.10)
- **交互流程**: 第 9 章 (对话发起 / Provider 切换 / Diff 审查)
- **JCEF 集成**: 第 6 章 (JCEF + 前端框架架构)

本计划在前端优先基础上增加两条强约束：
- 每个前端交互任务至少绑定一个后端服务（BE-* 或 Service 名）
- 每条关键流程必须具备从 UI 事件到后端处理再回到 UI 状态更新的闭环验收项

---

## 四、前端开发任务拆解

### Phase 1: 前端项目初始化 (Week 1, Day 1)

#### 1.1 项目脚手架搭建

| 任务 | 文件 | 说明 | 预估 |
|------|------|------|------|
| FE-001 | `frontend/` | 创建前端项目目录 | 0.5h |
| FE-002 | `frontend/package.json` | 初始化 package.json | 0.5h |
| FE-003 | `frontend/vite.config.ts` | 配置 Vite 构建工具 | 1h |
| FE-004 | `frontend/tsconfig.json` | 配置 TypeScript | 0.5h |
| FE-005 | `frontend/tailwind.config.js` | 配置 Tailwind CSS | 1h |

**验收标准**:
- [ ] `npm run dev` 启动成功
- [ ] 访问 http://localhost:5173 显示 "Hello Vite"
- [ ] TypeScript 编译无错误
- [ ] Tailwind CSS 样式生效

**后端对接点**: 无 (纯前端任务)

---

### Phase 2: 核心聊天界面 (Week 1, Day 2-5)

#### 2.1 JCEF + 前端框架集成 (M2-A)

| 任务 | 文件 | 说明 | Mock 数据 |
|------|------|------|---------|
| FE-006 | `ui/chat/JcefChatPanel.kt` | 创建 JCEF Browser 管理器 | - |
| FE-007 | `frontend/src/main/tsx/App.tsx` | 根组件 + 路由配置 | - |
| FE-008 | `frontend/src/main/tsx/components/chat/ChatPanel.tsx` | 聊天面板组件 | `mockSessionData` |
| FE-009 | `frontend/src/main/tsx/components/chat/MessageList.tsx` | 消息列表组件 | `mockMessageData` |
| FE-010 | `frontend/src/main/tsx/components/chat/MessageBubble.tsx` | 消息气泡组件 | 用户/AI 消息 |
| FE-011 | `frontend/src/main/tsx/components/chat/InputArea.tsx` | 输入框组件 | - |
| FE-012 | `frontend/src/main/tsx/lib/jcef.ts` | JCEF 桥接服务 | Mock 回调 |

**验收标准**:
- [ ] JCEF Browser 正常加载 `index.html`
- [ ] 可以通过 `executeJavaScript()` 追加消息
- [ ] 消息气泡样式正确 (用户蓝色/AI 灰色)
- [ ] 复制按钮工作 (Java → JS 通信)
- [ ] 用户消息 hover 显示右上角复制按钮
- [ ] AI 消息头部和尾部复制按钮均可用

**后端对接点**: FE-012 完成 → 对接 `CliBridgeService` 回调

---

#### 2.2 会话 Tab 栏 (M2-B)

| 任务 | 文件 | 说明 | Mock 数据 |
|------|------|------|---------|
| FE-013 | `frontend/src/main/tsx/components/chat/SessionTabs.tsx` | Tab 新建/切换/关闭 | 3 个示例 Tab |
| FE-014 | `frontend/src/main/tsx/components/chat/HeaderToolbar.tsx` | 标题栏右侧控件区 | Header 控件联动 Mock |
| FE-015 | `frontend/src/main/tsx/components/chat/HeaderToolbar.tsx` | 流式输出开关 | 开关切换状态 Mock |

**验收标准**:
- [ ] 可以新建 Tab (标题 "新对话")
- [ ] 可以切换 Tab，消息区内容变化
- [ ] 可以关闭 Tab，至少保留一个
- [ ] Tab 样式符合设计规范
- [ ] 流式输出开关切换后有视觉反馈

**后端对接点**: FE-015 完成 → 对接 `SessionService`

---

#### 2.3 历史会话面板 (M2-C5)

| 任务 | 文件 | 说明 | Mock 数据 |
|------|------|------|---------|
| FE-016 | `frontend/src/main/tsx/components/chat/SessionHistoryPanel.tsx` | 会话列表 | 10 条含提问次数示例会话 |
| FE-017 | `frontend/src/main/tsx/components/chat/SessionHistoryPanel.tsx` | 搜索框实时过滤 | - |
| FE-018 | `frontend/src/main/tsx/components/chat/SessionHistoryPanel.tsx` | 右键菜单 (收藏/重命名/删除) | - |
| FE-019 | `frontend/src/main/tsx/components/chat/SessionHistoryPanel.tsx` | 点击会话 → 加载到新 Tab | Mock 加载效果 |

**验收标准**:
- [ ] 显示 10 条历史会话
- [ ] 每条会话显示发起时间和用户提问次数
- [ ] 搜索框可以过滤会话标题
- [ ] 右键菜单功能完整
- [ ] 点击会话创建新 Tab 并复制消息

**后端对接点**: FE-019 完成 → 对接 `SessionService.listSessions()`

---

#### 2.4 输入工具栏交互 (M2-A/M2-B)

| 任务 | 文件 | 说明 | Mock 数据 |
|------|------|------|---------|
| FE-020a | `frontend/src/main/tsx/components/chat/InputToolbar.tsx` | 附件按钮（图片/文件）+ 预览 | 文件/图片选择 Mock |
| FE-020b | `frontend/src/main/tsx/components/chat/InputToolbar.tsx` | 上下文占用比（进度条） | 固定 30% 占用 Mock |
| FE-020c | `frontend/src/main/tsx/components/chat/InputToolbar.tsx` | 供应商悬浮列表 | 3 个示例 Provider |
| FE-020d | `frontend/src/main/tsx/components/chat/InputToolbar.tsx` | 对话模式悬浮列表 | 模式切换标签 Mock |
| FE-020e | `frontend/src/main/tsx/components/chat/InputToolbar.tsx` | 思考模式开关 | 开关高亮状态 Mock |
| FE-020f | `frontend/src/main/tsx/components/chat/InputToolbar.tsx` | 智能体悬浮列表 | 3 个示例 Agent |
| FE-020g | `frontend/src/main/tsx/components/chat/InputToolbar.tsx` | 提示词强化按钮 | 点击后文本加前缀 Mock |

**验收标准**:
- [ ] 附件选择后在输入框上方显示附件预览标签
- [ ] 上下文占用比显示为数字+进度条
- [ ] 供应商/模式/智能体三个悬浮列表均可弹出并选择
- [ ] 提示词强化按钮有点击反馈
- [ ] 发送按钮支持发送中状态和主动打断

**后端对接点**: FE-020g 完成 → 对接 `ProviderService`、模式状态管理与上下文统计服务

---

### Phase 3: Markdown 渲染与代码高亮 (Week 2, Day 1-2)

#### 3.1 Markdown 渲染

| 任务 | 文件 | 说明 | Mock 数据 |
|------|------|------|---------|
| FE-021 | `frontend/src/main/tsx/lib/markdown.ts` | Markdown 渲染工具库 | 示例 Markdown 文本 |
| FE-022 | `frontend/src/main/tsx/components/markdown/MarkdownRenderer.tsx` | Markdown 渲染组件 | 多种 Markdown 语法 |
| FE-023 | `frontend/src/main/tsx/components/markdown/CodeBlock.tsx` | 代码块组件 | 示例代码块 |
| FE-024 | `frontend/src/main/tsx/components/markdown/DiffViewer.tsx` | Diff 可视化组件 | 前后对比示例 |

**验收标准**:
- [ ] Markdown 完整渲染 (标题/列表/代码块/表格/链接)
- [ ] 代码块语法高亮
- [ ] Diff 左右对比显示
- [ ] 代码块复制按钮工作

**后端对接点**: FE-024 完成 → 对接 `DiffService`

---

### Phase 4: 状态管理 (Week 2, Day 3)

#### 4.1 状态管理集成

| 任务 | 文件 | 说明 | Mock 数据 |
|------|------|------|---------|
| FE-025 | `frontend/src/main/tsx/stores/chatStore.ts` | 聊天状态管理 | Zustand/Redux/Pinia |
| FE-026 | `frontend/src/main/tsx/stores/sessionStore.ts` | 会话状态管理 | 会话列表 Mock |
| FE-027 | `frontend/src/main/tsx/stores/uiStore.ts` | UI 状态管理 | 主题/设置 Mock |

**验收标准**:
- [ ] 状态管理库配置正确
- [ ] 状态更新触发 UI 重新渲染
- [ ] 状态持久化 (localStorage)
- [ ] 跨组件状态共享正常

**后端对接点**: FE-027 完成 → 对接 `ConfigService`、`ThemeService`

---

### Phase 5: JCEF 双向通信 (Week 2, Day 4-5)

#### 5.1 Java → JavaScript 通信

| 任务 | 文件 | 说明 | Mock 数据 |
|------|------|------|---------|
| FE-028 | `ui/chat/JcefMessageRenderer.kt` | 发送消息到前端 | CliMessage Mock |
| FE-029 | `frontend/src/main/tsx/lib/jcef.ts` | 监听 Java 消息 | CustomEvent 监听 |
| FE-030 | `frontend/src/main/tsx/hooks/useJcefListener.ts` | JCEF 消息监听 Hook | 流式消息 Mock |

**验收标准**:
- [ ] Java 可以发送消息到前端
- [ ] 前端正确接收并解析消息
- [ ] 流式输出实时更新
- [ ] 错误处理正常

**后端对接点**: FE-030 完成 → 对接 `CliBridgeService` 回调

---

#### 5.2 JavaScript → Java 通信

| 任务 | 文件 | 说明 | Mock 数据 |
|------|------|------|---------|
| FE-031 | `ui/chat/JcefBridgeBindings.kt` | JBCefJSQuery 绑定 | 复制/消息/回溯 |
| FE-032 | `frontend/src/main/tsx/lib/jcef.ts` | 调用 Java 方法 | Mock 回调 |
| FE-033 | `frontend/src/main/tsx/hooks/useJcefBridge.ts` | JCEF 桥接 Hook | 复制/发送 Mock |

**验收标准**:
- [ ] 前端可以调用 Java 方法
- [ ] 复制功能正常 (剪贴板)
- [ ] 发送消息功能正常
- [ ] 回溯功能正常

**后端对接点**: FE-033 完成 → 对接 `SessionService.rewind()`

---

### Phase 6: 消息交互功能 (Week 3)

#### 6.1 消息操作 (M2-C)

| 任务 | 文件 | 说明 | Mock 数据 |
|------|------|------|---------|
| FE-034 | `frontend/src/main/tsx/components/chat/MessageMenu.tsx` | AI 消息右键菜单 | - |
| FE-035 | `frontend/src/main/tsx/components/chat/RewindMarker.tsx` | Rewind 回溯 UI | 每 3 条消息显示回溯点 |
| FE-036 | `ui/dialog/DiffReviewDialog.kt` | Diff 审查弹窗 | 前后对比示例文本 |
| FE-037 | `frontend/src/main/tsx/components/editor/SelectedTextSender.tsx` | 选中文本发送 (Ctrl+Alt+K) | 模拟编辑器选中 |

**验收标准**:
- [ ] AI 消息显示右键菜单 (复制/引用/重新生成/回溯)
- [ ] 回溯点标记显示在 AI 消息下方
- [ ] Diff 弹窗左右对比显示
- [ ] Ctrl+Alt+K 快捷键工作

**后端对接点**: FE-037 完成 → 对接 `RewindService`、`DiffService`

---

#### 6.2 消息引用 (M2-C6)

| 任务 | 文件 | 说明 | Mock 数据 |
|------|------|------|---------|
| FE-038 | `frontend/src/main/tsx/components/chat/QuoteBlock.tsx` | 引用块 UI | 示例引用文本 |
| FE-039 | `frontend/src/main/tsx/components/chat/QuoteButton.tsx` | 追加引用到输入框 | Mock 引用数据 |
| FE-040 | `service/QuoteService.kt` | Markdown stripping | Mock 格式化函数 |

**验收标准**:
- [ ] 引用块显示正确 (灰底、缩进、前缀 `>`)
- [ ] 引用时显示来源会话和时间
- [ ] Markdown 符号被正确 stripping

**后端对接点**: FE-040 完成 → 对接 `QuoteService`

---

#### 6.3 收藏会话独立界面

| 任务 | 文件 | 说明 | Mock 数据 |
|------|------|------|---------|
| FE-041 | `frontend/src/main/tsx/components/chat/FavoriteSessionPanel.tsx` | 收藏会话独立面板 | 3 条收藏会话 Mock |
| FE-042 | `frontend/src/main/tsx/components/chat/SessionHistoryPanel.tsx` | 历史会话界面右下角大按钮 | 大按钮触发 Mock |
| FE-043 | `frontend/src/main/tsx/components/chat/SessionHistoryPanel.tsx` | 历史面板与收藏面板切换 | 面板切换 Mock |

**验收标准**:
- [ ] 历史面板右下角大按钮可进入收藏面板
- [ ] 收藏面板具备独立搜索，仅显示收藏会话
- [ ] 收藏会话项显示发起时间和提问次数
- [ ] 点击收藏会话可加载到当前会话 Tab

**后端对接点**: FE-043 完成 → 对接 `SessionService` 收藏状态与会话加载接口

---

#### 6.4 状态栏与权限模式闭环

| 任务 | 文件 | 说明 | Mock 数据 |
|------|------|------|---------|
| FE-044 | `frontend/src/main/tsx/components/chat/StatusBar.tsx` | 状态栏显示 Token、成本、Provider、Agent 运行状态 | Token/成本随机值 Mock |
| FE-045 | `frontend/src/main/tsx/components/chat/PermissionModeSelector.tsx` | 权限模式选择器（default/sandbox/yolo） | 3 种模式切换 Mock |
| FE-046 | `ui/dialog/ConfirmActionDialog.kt` | 敏感操作确认弹窗（执行前二次确认） | 风险操作确认 Mock |

**验收标准**:
- [ ] 状态栏实时更新 Token 与成本
- [ ] 权限模式切换后在消息区与状态栏可见
- [ ] 敏感操作触发确认弹窗，确认后才继续

**后端对接点**: FE-046 完成 → 对接 `UsageService`、`PermissionService`

---

### Phase 7: MCP 工具显示 (Week 3)

#### 7.1 工具调用卡片 (M3-FE1)

| 任务 | 文件 | 说明 | Mock 数据 |
|------|------|------|---------|
| FE-047 | `frontend/src/main/tsx/components/mcp/ToolCallCard.tsx` | 工具调用卡片 HTML/CSS | 示例工具 (read_file, edit) |
| FE-048 | `frontend/src/main/tsx/components/mcp/ToolCallCard.tsx` | 工具状态流转动画 | 定时器模拟 PENDING → RUNNING → SUCCESS |
| FE-049 | `ui/chat/JcefMessageRenderer.kt` | Java → JS 工具状态推送 | Mock 状态变化 |

**验收标准**:
- [ ] 工具卡片显示工具名称和状态
- [ ] 状态图标正确 (○ → ⏳ → ✓ / ✗)
- [ ] 工具输入可展开查看
- [ ] 状态动画流畅

**后端对接点**: FE-049 完成 → 对接 `CliMessage.ToolUseStart`

---

#### 7.2 权限确认弹窗 (M3-FE2)

| 任务 | 文件 | 说明 | Mock 数据 |
|------|------|------|---------|
| FE-050 | `ui/dialog/PermissionDialog.kt` | Swing 审批弹窗 | 示例工具输入 JSON |
| FE-051 | `bridge/CliBridgeService.kt` | 用户响应发送到 CLI | Mock 发送批准/拒绝 |

**验收标准**:
- [ ] 弹窗显示工具名称和输入
- [ ] [批准] / [拒绝] 按钮工作
- [ ] 弹窗非阻塞 (允许用户操作其他窗口)

**后端对接点**: FE-051 完成 → 对接 CLI Permission 模式

---

### Phase 8: 设置界面 (Week 4)

#### 8.1 基础设置页 (M4-FE6)

| 任务 | 文件 | 说明 | Mock 数据 |
|------|------|------|---------|
| FE-052 | `ui/settings/BasicSettingsPanel.kt` | CLI 版本检测显示 | Mock 版本号 |
| FE-053 | `ui/settings/BasicSettingsPanel.kt` | [检测更新] 按钮 | Mock 更新提示 |
| FE-054 | `ui/settings/BasicSettingsPanel.kt` | 语言选择下拉 (4 语言) | Mock 语言切换 |

**验收标准**:
- [ ] CLI 版本显示正确 (或 "未安装")
- [ ] [检测更新] 按钮点击显示状态
- [ ] 语言下拉显示 4 个选项
- [ ] 切换语言提示 "重启后生效"

**后端对接点**: FE-054 完成 → 对接 `CliUpdateService`、`I18nService`

---

#### 8.2 外观设置页 (M4-FE7)

| 任务 | 文件 | 说明 | Mock 数据 |
|------|------|------|---------|
| FE-055 | `ui/settings/AppearanceSettingsPanel.kt` | 主题下拉 (4 主题) | - |
| FE-056 | `ui/settings/AppearanceSettingsPanel.kt` | 对话背景 (纯色/图片) | Mock 图片路径 |
| FE-057 | `ui/settings/AppearanceSettingsPanel.kt` | 消息气泡颜色选择器 | Mock 颜色值 |
| FE-058 | `ui/chat/JcefMessageRenderer.kt` | 应用主题到 JCEF CSS 变量 | Mock CSS 注入 |

**验收标准**:
- [ ] 主题下拉显示 4 个选项
- [ ] 纯色选择器打开 `JColorChooser`
- [ ] 图片选择器打开文件选择
- [ ] 气泡颜色选择器工作
- [ ] [应用] 按钮实时预览

**后端对接点**: FE-058 完成 → 对接 `ThemeService`

---

#### 8.3 Provider 设置页 (M4-FE1/2/3)

| 任务 | 文件 | 说明 | Mock 数据 |
|------|------|------|---------|
| FE-059 | `ui/settings/ProviderSettingsPanel.kt` | 左右布局 (列表 + 表单) | `ProviderService.PRESET_PROVIDERS` |
| FE-060 | `ui/settings/ProviderSettingsPanel.kt` | 新增/编辑 Provider 弹窗 | - |
| FE-061 | `ui/settings/ProviderSettingsPanel.kt` | API Key 密码输入 + 验证 | Mock 验证结果 |
| FE-062 | `ui/chat/ProviderSelector.tsx` | Header 下拉切换 Provider | - |

**验收标准**:
- [ ] Provider 列表显示 6 个预置供应商
- [ ] [新增供应商] 打开编辑弹窗
- [ ] API Key 字段为密码类型
- [ ] [验证] 按钮显示成功/失败
- [ ] Header 下拉可以切换 Provider

**后端对接点**: FE-062 完成 → 对接 `ProviderService.switchProvider()`

---

#### 8.4 Agent/Skill 设置页 (M4-FE8)

| 任务 | 文件 | 说明 | Mock 数据 |
|------|------|------|---------|
| FE-063 | `ui/settings/AgentSettingsPanel.kt` | Agent 管理页（新增按钮 + 名称列表 + 导出 JSON） | 2 条 Agent Mock |
| FE-064 | `ui/settings/SkillSettingsPanel.kt` | Skill 管理页（新增按钮 + 名称列表 + 导出 JSON） | 2 条 Skill Mock |
| FE-065 | `ui/settings/SettingsRootPanel.kt` | 设置左侧菜单新增 Agent 管理/Skill 管理入口 | 菜单切换 Mock |

**验收标准**:
- [ ] 左侧菜单可切换到 Agent 与 Skill 管理页
- [ ] 新增按钮可打开编辑弹窗（名称输入 + 保存）
- [ ] 列表项支持导出 JSON 操作

**后端对接点**: FE-065 完成 → 对接 Agent/Skill 配置读写服务

---

#### 8.5 Prompt/MCP/Dependency/Session 设置页 (M4-FE9)

| 任务 | 文件 | 说明 | Mock 数据 |
|------|------|------|---------|
| FE-066 | `ui/settings/PromptSettingsPanel.kt` | 系统提示词配置（全局/项目级） | Prompt 模板 Mock |
| FE-067 | `ui/settings/McpSettingsPanel.kt` | MCP Server 管理（新增/编辑/删除/导出） | 2 个 MCP Server Mock |
| FE-068 | `ui/settings/DependencySettingsPanel.kt` | SDK/CLI 依赖检测与更新入口 | 版本状态 Mock |
| FE-069 | `ui/settings/SessionSettingsPanel.kt` | 会话默认策略（权限模式/自动保存/恢复） | Session 策略 Mock |

**验收标准**:
- [ ] Prompt 设置支持保存全局和项目级配置
- [ ] MCP Server 配置支持增删改查与导出
- [ ] Dependency 页显示安装状态并可触发更新
- [ ] Session 设置支持默认权限模式和恢复策略

**后端对接点**: FE-069 完成 → 对接 `ConfigService`、`MCPService`、`DependencyManager`、`PermissionService`

---

### Phase 9: 高级交互 (Week 5)

#### 9.1 文件引用 (M5-FE1)

| 任务 | 文件 | 说明 | Mock 数据 |
|------|------|------|---------|
| FE-070 | `ui/chat/FileReferencePopup.kt` | @ 触发弹窗 | Mock 文件列表 |
| FE-071 | `ui/chat/FileReferencePopup.kt` | 文件搜索过滤 | - |
| FE-072 | `ui/chat/FileReferencePopup.kt` | 插入文件引用到输入框 | Mock 插入效果 |

**验收标准**:
- [ ] 输入 `@` 字符触发弹窗
- [ ] 弹窗显示项目文件列表
- [ ] 搜索框实时过滤文件名
- [ ] 选择文件插入 `@filename` 到输入框

**后端对接点**: FE-072 完成 → 对接 `FileReferenceService`

---

#### 9.2 Slash 命令 (M5-FE2)

| 任务 | 文件 | 说明 | Mock 数据 |
|------|------|------|---------|
| FE-073 | `ui/chat/SlashCommandPopup.kt` | / 触发弹窗 | Mock 命令列表 |
| FE-074 | `ui/chat/SlashCommandPopup.kt` | 命令描述显示 | - |
| FE-075 | `ui/chat/SlashCommandPopup.kt` | 插入命令到输入框 | Mock 插入效果 |

**验收标准**:
- [ ] 输入 `/` 字符触发弹窗
- [ ] 弹窗显示命令列表 (/init, /review, /commit...)
- [ ] 选择命令插入到输入框
- [ ] 命令参数可编辑

**后端对接点**: FE-075 完成 → 发送到 CLI (无需后端服务)

---

#### 9.3 动画效果 (M5-FE3)

| 任务 | 文件 | 说明 | Mock 数据 |
|------|------|------|---------|
| FE-076 | `frontend/src/main/tsx/styles/animations.css` | 流式打字机动画 | CSS animation |
| FE-077 | `frontend/src/main/tsx/components/chat/ThinkingBlock.tsx` | 思考片段折叠动画 | - |
| FE-078 | `frontend/src/main/tsx/components/chat/SessionTabs.tsx` | Tab 切换过渡动画 | - |

**验收标准**:
- [ ] 流式输出有打字机效果
- [ ] 思考片段折叠/展开动画流畅
- [ ] Tab 切换有淡入淡出效果

**后端对接点**: 无 (纯前端动画)

---

#### 9.4 架构补齐项（端到端支撑）

| 任务 | 文件 | 说明 | Mock 数据 |
|------|------|------|---------|
| FE-079 | `frontend/src/main/tsx/components/chat/ThinkingBlock.tsx` | 思考片段显示与折叠 | thinking 片段 Mock |
| FE-080 | `frontend/src/main/tsx/components/agent/AgentStatusPanel.tsx` | Agent/子Agent 状态追踪卡片 | 子 Agent 状态流转 Mock |
| FE-081 | `frontend/src/main/tsx/components/chat/AttachmentDropZone.tsx` | 图片/文件拖拽上传 | 拖拽事件 Mock |
| FE-082 | `ui/chat/SessionExportDialog.kt` | 会话导出（Markdown/JSON/纯文本） | 导出预览 Mock |
| FE-083 | `frontend/src/main/tsx/components/editor/FileNavigation.tsx` | 消息内文件路径跳转与定位 | 文件跳转 Mock |
| FE-084 | `frontend/src/main/tsx/components/editor/QuickFix.tsx` | Quick Fix 快捷修复入口（Ctrl+Shift+Q） | 修复建议 Mock |

**验收标准**:
- [ ] Thinking 片段支持折叠/展开并保留用户偏好
- [ ] Agent/子Agent 状态支持 pending/running/success/error
- [ ] 拖拽图片/文件后可进入输入上下文并显示附件标签
- [ ] 会话可导出 Markdown/JSON/纯文本
- [ ] 文件导航支持从消息跳转到编辑器位置
- [ ] Quick Fix 快捷键触发修复建议入口

**后端对接点**: FE-084 完成 → 对接 `MessageService`、`AttachmentService`、`AgentService`、`CommitGenerator`、`Editor 集成服务`

---

## 五、Mock 数据定义

### 5.1 MockSessionData

```typescript
// frontend/src/main/tsx/mock/mockSessionData.ts
export interface MockSession {
  id: string;
  sessionId: string;
  title: string;
  createdAt: Date;
  messageCount: number;
  messages: MockMessage[];
  isFavorite: boolean;
}

export const mockSessions: MockSession[] = [
  {
    id: 'sess-001',
    sessionId: 'cli-abc123',
    title: '代码重构讨论',
    createdAt: new Date(Date.now() - 3600000),
    messageCount: 2,
    messages: [
      { id: 'msg-001', role: 'user', content: '帮我重构这个类' },
      { id: 'msg-002', role: 'assistant', content: '建议拆分为三个服务...' }
    ],
    isFavorite: true
  },
  {
    id: 'sess-002',
    sessionId: 'cli-def456',
    title: 'Bug 分析',
    createdAt: new Date(Date.now() - 86400000),
    messageCount: 1,
    messages: [
      { id: 'msg-003', role: 'user', content: '空指针异常' }
    ],
    isFavorite: false
  }
  // ... 8 more sessions
];
```

### 5.2 MockMessageData

```typescript
export interface MockMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolCalls?: MockToolCall[];
}

export interface MockToolCall {
  id: string;
  name: string;
  input: Record<string, any>;
  status: 'pending' | 'running' | 'success' | 'error';
}

export const mockMessages: MockMessage[] = [
  {
    id: 'msg-001',
    role: 'user',
    content: '请帮我分析这段代码的性能问题',
    timestamp: new Date()
  },
  {
    id: 'msg-002',
    role: 'assistant',
    content: `
分析你的代码，发现以下性能问题：

1. 循环内创建对象
2. 未使用缓存
3. N+1 查询问题

\`\`\`kotlin
// 建议修改
val cache = mutableMapOf()
\`\`\`
    `,
    timestamp: new Date(),
    toolCalls: [
      { id: 'tool-001', name: 'read_file', input: { path: 'App.kt' }, status: 'success' }
    ]
  }
];
```

### 5.3 MockMcpData

```typescript
export function getMockToolSequence(): MockToolCall[] {
  return [
    { id: 'tool-001', name: 'read_file', input: { path: 'App.kt' }, status: 'success' },
    { id: 'tool-002', name: 'edit_file', input: { path: 'App.kt' }, status: 'running' },
    { id: 'tool-003', name: 'run_command', input: { cmd: 'gradle build' }, status: 'pending' }
  ];
}
```

---

## 六、后端对接计划

### 6.1 对接优先级

```
┌─────────────────────────────────────────────────────────────┐
│  后端对接优先级 (按依赖关系)                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  P0 (核心功能)                                              │
│  ├── SessionService → FE-019 (会话列表)                    │
│  ├── CliBridgeService → FE-030 (消息回调)                  │
│  └── RewindService → FE-035 (回溯 UI)                      │
│                                                             │
│  P1 (增强功能)                                              │
│  ├── QuoteService → FE-040 (消息引用)                      │
│  ├── DiffService → FE-036 (Diff 审查)                      │
│  └── FileReferenceService → FE-072 (@file 引用)            │
│                                                             │
│  P2 (辅助功能)                                              │
│  ├── ThemeService → FE-058 (主题切换)                      │
│  ├── I18nService → FE-054 (国际化)                         │
│  └── UsageService → FE-052 (Token 统计)                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 对接检查点

| 检查点 | 前端任务 | 后端服务 | 验收标准 |
|--------|---------|---------|---------|
| CP-1 | FE-030 (JCEF 消息) | CliBridgeService | 流式输出正常显示 |
| CP-2 | FE-019 (Tab 切换) | SessionService | 切换 Tab 恢复消息历史 |
| CP-3 | FE-035 (Rewind) | RewindService | 回溯创建新会话并复制消息 |
| CP-4 | FE-058 (主题) | ThemeService | 切换主题实时生效 |
| CP-5 | FE-062 (Provider) | ProviderService | 切换 Provider 更新 CLI 配置 |

### 6.3 架构功能点对点对齐矩阵（FE ↔ BE ↔ 流程）

| 架构功能点 | 前端任务 | 后端服务/任务 | 交互流程节点 |
|-----------|---------|--------------|-------------|
| @file 引用 | FE-070~072 | BE-106 `FileReferenceService` | 9.1 `InputArea.onSend()` |
| 图片/文件发送 | FE-020a, FE-081 | BE-107 `AttachmentService` | 9.1 `处理附件` |
| 对话回溯 | FE-035 | BE-105 `RewindService` | 9.1 `创建回溯点` |
| 提示词增强 | FE-020g, FE-066 | BE-207 `PromptEnhancementService` | 9.1 `构建消息对象` 前 |
| 流式输出与思考片段 | FE-076, FE-079 | BE-004 `NDJSONParser` | 9.1 `onChunk/onThinking` |
| 工具调用状态 | FE-047~049 | BE-206 `MCPService` | 9.1 `onToolUse` |
| Provider 切换 | FE-020c, FE-062 | BE-201 `ProviderService` | 9.2 全流程 |
| Diff 审查 | FE-036 | BE-303 `DiffService`, BE-208 `PermissionService` | 9.3 全流程 |
| 权限模式与确认 | FE-045, FE-046, FE-069 | BE-208 `PermissionService` | 9.3 `checkPermission` |
| Token/成本统计 | FE-044 | BE-202 `UsageService` | 9.1 `onComplete` |
| Agent/子Agent 追踪 | FE-080, FE-063 | BE-204 `AgentService` | 9.1 `更新 Agent 状态` |
| 会话导出 | FE-082 | BE-102 `MessageService` | 会话管理链路 |
| Quick Fix / 选中文本发送 | FE-084, FE-037 | BE-308 `Editor集成` | IDE Action 链路 |

### 6.4 关键交互流程端到端验收

#### Flow-A: 对话发起（9.1）
- UI 触发：输入框发送 / @file / 附件
- 中间层：`SessionService.addMessage` + `ContextService.buildContext`
- Bridge：`CliBridgeService.sendMessage`
- 回调渲染：Chunk / Thinking / ToolUse / Complete
- 验收闭环：消息入库、Token 记录、状态栏更新、会话持久化

#### Flow-B: Provider 切换（9.2）
- UI 触发：ProviderSelector 选择项变更
- 服务处理：`ProviderService.switchProvider`
- Bridge 同步：CLI 配置切换生效
- UI 回写：Header、Model 列表、StatusBar 同步刷新
- 验收闭环：下一次请求使用新 Provider 生效且可观测

#### Flow-C: Diff 审查（9.3）
- 触发：AI 产生修改建议
- 权限判定：`PermissionService.checkPermission`
- 审查执行：`DiffViewerDialog` 接受/拒绝/逐块审查
- 落盘：写文件 + 刷新编辑器 + 记录日志
- 验收闭环：不同权限模式行为一致且可追踪

---

## 七、开发时间表

### Week 1: 前端项目初始化 + 核心聊天界面

| 天 | 任务 | 产出 |
|----|------|------|
| Day 1 | FE-001 ~ FE-005 (前端项目初始化) | Vite + React/Vue/Svelte 项目 |
| Day 2-3 | FE-006 ~ FE-012 (JCEF + 前端框架集成) | JCEF 消息区 + 复制交互 |
| Day 4 | FE-013 ~ FE-015 (会话 Tab + Header) | Tab 新建/切换/关闭 |
| Day 5 | FE-016 ~ FE-020g (历史面板 + 输入工具栏 + 状态栏) | 历史/输入/状态栏三线闭环 |

**里程碑 M1-FE**: 核心聊天界面完成，可以使用 Mock 数据演示完整流程

---

### Week 2: Markdown 渲染 + 状态管理 + JCEF 通信

| 天 | 任务 | 产出 |
|----|------|------|
| Day 1-2 | FE-021 ~ FE-024 (Markdown 渲染 + 代码高亮 + Diff) | Markdown 完整渲染能力 |
| Day 3 | FE-025 ~ FE-027 (状态管理) | Zustand/Redux/Pinia 状态管理 |
| Day 4-5 | FE-028 ~ FE-033 (JCEF 双向通信) | Java ↔ JavaScript 双向通信 |

**里程碑 M2-FE**: JCEF 集成完成，支持双向通信

---

### Week 3: 消息交互 + MCP

| 天 | 任务 | 产出 |
|----|------|------|
| Day 1-2 | FE-034 ~ FE-037 (消息操作) | 右键菜单、Rewind、Diff |
| Day 3 | FE-038 ~ FE-043 (消息引用 + 收藏会话) | Quote 功能 + 收藏会话界面 |
| Day 4 | FE-044 ~ FE-046 (状态栏 + 权限模式) | 状态栏 + 权限模式闭环 |
| Day 5 | FE-047 ~ FE-051 (MCP + Thinking + 附件拖拽) | 工具卡片、思考片段、附件流 |

**里程碑 M3-FE**: 消息交互完成，支持所有消息操作

---

### Week 4: 设置界面

| 天 | 任务 | 产出 |
|----|------|------|
| Day 1-2 | FE-052 ~ FE-054 (基础设置) | CLI 检测、语言选择 |
| Day 3-4 | FE-055 ~ FE-058 (外观设置) | 主题、背景、气泡色 |
| Day 5 | FE-059 ~ FE-069 (Provider/Agent/Skill + Prompt/MCP/Dependency/Session) | 设置全菜单 + 后端配置预埋 |

**里程碑 M4-FE**: 设置界面完成，所有配置项可操作

---

### Week 5: 高级交互 + 打磨

| 天 | 任务 | 产出 |
|----|------|------|
| Day 1-2 | FE-070 ~ FE-075 (file 引用 + Slash 命令) | 文件引用与 Slash 命令能力 |
| Day 2-3 | FE-076 ~ FE-084 (动画 + 架构补齐) | 流式输出、折叠动画 + 端到端支撑 |
| Day 4 | UI 打磨、Bug 修复 | 体验优化 |
| Day 5 | 性能优化、代码审查 | 准备后端对接 |

**里程碑 M5-FE**: 前端全部完成，准备后端对接

---

### Week 6-7: 后端对接

| 天 | 任务 | 产出 |
|----|------|------|
| Day 1-2 | CP-1 ~ CP-2 (核心功能对接) | SessionService + CliBridgeService |
| Day 3-4 | CP-3 ~ CP-5 (增强功能对接) | RewindService + DiffService |
| Day 5-8 | 其他服务对接 + Bug 修复 | 完整功能 |

**里程碑 M6-INT**: 端到端功能可用

---

## 八、技术栈确认

### 8.1 前端技术栈 (2026-04-16 更新)

| 层级 | 技术 | 说明 |
|------|------|------|
| 框架 | React 18+ / Vue 3 / Svelte | 三选一，推荐 React 18 + TypeScript |
| 构建工具 | Vite 5+ | 开发服务器 + 生产构建 |
| 语言 | TypeScript 5+ | 类型安全 |
| 样式 | Tailwind CSS + shadcn/ui | 原子化 CSS + 高质量组件库 |
| 状态管理 | Zustand / Redux Toolkit / Pinia | 轻量级状态管理 |
| Markdown | marked.js + highlight.js + diff2html | Markdown 渲染、代码高亮、Diff 可视化 |
| 路由 | React Router / Vue Router | 路由管理 (可选) |
| 组件库 | shadcn/ui / Radix UI | 无障碍访问组件库 |
| 双向通信 | JBCefJSQuery | Java ↔ JavaScript 双向通信 |

### 8.2 后端技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 进程管理 | ProcessBuilder | CLI 进程启动 |
| 数据解析 | Gson | NDJSON 解析 |
| 配置持久化 | PersistentStateComponent | Settings JSON |
| 服务注册 | @Service (APP/PROJECT) | 单例服务管理 |

---

## 九、风险与注意事项

### 9.1 前端风险

| 风险 | 影响 | 解决方案 | 验证方法 |
|------|------|---------|---------|
| JCEF 不兼容 | 高 | 检测 `JBCefApp.isSupported()`，降级 Swing | `JBCefApp.isSupported()` |
| 前端构建失败 | 中 | 确保 Node.js 版本兼容，依赖安装完整 | `npm run build` |
| Mock 数据不真实 | 中 | 使用真实场景数据，定期更新 | 前端开发前确认 API 定义 |
| 交互流程遗漏 | 中 | 严格按照 API_Design.md 验证 | 功能测试 |
| 双向通信失败 | 高 | JBCefJSQuery 绑定正确，线程安全处理 | JCEF 通信测试 |
| 性能问题 | 中 | 代码分割、懒加载、虚拟列表 | 性能测试 |
| 依赖更新风险 | 低 | 锁定版本号，定期更新测试 | `npm audit` |

### 9.2 后端对接风险

| 风险 | 影响 | 解决方案 | 验证方法 |
|------|------|---------|---------|
| API 不匹配 | 高 | 前端开发前先确认 API 定义 | API 文档审查 |
| 回调线程问题 | 中 | JS 回调不在 EDT，需 `invokeLater` | 多线程测试 |
| 数据格式不一致 | 中 | 使用统一的 CliMessage 类型 | 数据格式验证 |
| 状态同步问题 | 中 | 状态管理 + 轮询机制 | 状态同步测试 |

### 9.3 开发流程风险

| 风险 | 影响 | 解决方案 | 验证方法 |
|------|------|---------|---------|
| 前后端并行开发冲突 | 中 | 使用 Mock 数据，API 定义先行 | 集成测试 |
| 版本管理混乱 | 低 | 使用语义化版本，Git 分支管理 | Code Review |
| 构建流程复杂 | 中 | 自动化 Gradle 任务，文档完善 | 构建测试 |

---

## 十、附录

### 10.1 前端项目脚手架

```bash
# React 18 + TypeScript
npm create vite@latest frontend -- --template react-ts

# Vue 3 + TypeScript
npm create vite@latest frontend -- --template vue-ts

# Svelte + TypeScript
npm create vite@latest frontend -- --template svelte-ts

# 安装依赖
cd frontend
npm install

# 安装 Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 安装其他依赖 (React 示例)
npm install zustand @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install marked highlight.js diff2html
```

### 10.2 Vite 配置示例

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'markdown': ['marked', 'highlight.js', 'diff2html'],
          'ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu']
        }
      }
    }
  },
  server: {
    port: 5173,
    strictPort: true
  }
});
```

### 10.3 Tailwind CSS 配置示例

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#1E1E1E',
        foreground: '#FFFFFF',
        primary: '#3B82F6',
        secondary: '#6B7280',
        muted: '#2D2D30',
        accent: '#D97706'
      }
    },
  },
  plugins: [],
}
```

### 10.4 Gradle 集成示例

```kotlin
// build.gradle.kts
tasks.register<Copy>("copyFrontendResources") {
    group = "frontend"
    description = "Copy frontend build output to resources"
    
    dependsOn(":frontend:build")
    
    from(file("${projectDir}/frontend/dist"))
    into(file("${projectDir}/src/main/resources/web"))
}

tasks.named("buildPlugin") {
    dependsOn("copyFrontendResources")
}

tasks.named("runIde") {
    dependsOn("copyFrontendResources")
}
```

---

*文档版本: v2.0*
*最后更新: 2026-04-16*
*重大更新: 从 Vanilla JS 迁移到 React/Vue/Svelte + Vite 工作流*