# CC Assistant 前端优先开发计划

> **版本**: v1.2
> **日期**: 2026-04-15
> **策略**: 先完成所有前端界面，使用 Mock 数据，逐步对接后端

---

## 一、当前状态分析

### 1.1 已完成 (M0 + M1)

| 模块 | 文件 | 状态 | 说明 |
|------|------|------|------|
| CliBridgeService | `bridge/CliBridgeService.kt` | ✅ 完成 | CLI 进程管理，NDJSON 解析 |
| NdjsonParser | `bridge/NdjsonParser.kt` | ✅ 完成 | 流式输出解析 |
| CliMessage | `bridge/CliMessage.kt` | ✅ 完成 | 消息类型定义 |
| ProviderService | `model/Provider.kt` | ✅ 完成 | 6 个预置供应商 |
| ChatPanel (Swing) | `ui/ChatPanel.kt` | ✅ 完成 | 基础聊天面板 (M1 版) |
| JcefMessageRenderer | `ui/chat/JcefMessageRenderer.kt` | ⚠️ 骨架 | 仅占位，待实现 |
| AppConfigState | `config/AppConfigState.kt` | ✅ 完成 | 配置持久化 |

### 1.2 待开发 (M2-M5)

| 里程碑 | 前端任务 | 后端任务 | 优先级 |
|--------|---------|---------|--------|
| **M2** | 会话 Tab、JCEF 消息渲染、历史面板 | SessionService、RewindService | P0 |
| **M3** | MCP 工具卡片、权限弹窗 | MCPService、权限处理 | P1 |
| **M4** | 设置界面 (Basic/Provider/Appearance) | ThemeService、I18nService | P0 |
| **M5** | @file 弹窗、Slash 弹窗、动画 | FileReferenceService | P1 |

---

## 二、前端优先开发策略

### 2.1 核心原则

```
┌─────────────────────────────────────────────────────────────┐
│  前端优先开发流程                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. UI 界面开发 (Swing + JCEF)                              │
│     ├── 使用 Mock 数据驱动界面                              │
│     ├── 验证交互流程和视觉效果                              │
│     └── 独立于后端 API 开发                                 │
│                                                             │
│  2. 后端 API 对接                                            │
│     ├── 替换 Mock 数据为真实 API 调用                       │
│     ├── 集成 CliBridgeService 回调                          │
│     └── 端到端测试                                          │
│                                                             │
│  3. 联调与打磨                                               │
│     ├── 修复集成问题                                        │
│     ├── 性能优化                                            │
│     └── 用户体验打磨                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Mock 数据策略

| 模块 | Mock 方式 | 数据来源 |
|------|----------|---------|
| 会话列表 | 硬编码 5-10 条示例会话 | `MockSessionData` |
| 消息渲染 | 硬编码用户消息 + AI 响应 | `MockMessageData` |
| Provider 列表 | 使用 `ProviderService.PRESET_PROVIDERS` | 已有 |
| MCP 工具调用 | 定时器模拟状态变化 | `MockMcpData` |
| Token 统计 | 随机生成数据 | `MockUsageData` |

### 2.3 架构驱动对齐基线

对齐依据来自 `CC_Assistant_Technical_Architecture.md`：
- **需求总览**: 第 2 章 (功能模块矩阵 + 功能详细说明)
- **功能概述**: 第 2.2 节 (2.2.1 ~ 2.2.10)
- **交互流程**: 第 9 章 (对话发起 / Provider 切换 / Diff 审查)

本计划在前端优先基础上增加两条强约束：
- 每个前端交互任务至少绑定一个后端服务（BE-* 或 Service 名）
- 每条关键流程必须具备从 UI 事件到后端处理再回到 UI 状态更新的闭环验收项

---

## 三、前端开发任务拆解

### Phase 1: 核心聊天界面 (Week 1)

#### 1.1 JCEF 消息渲染区 (M2-A)

| 任务 | 文件 | 说明 | Mock 数据 |
|------|------|------|---------|
| FE-001 | `ui/chat/JcefMessageRenderer.kt` | 完善 JCEF Browser 创建 | 静态 HTML |
| FE-002 | `resources/web/chat.html` | 消息渲染 HTML 骨架 | - |
| FE-003 | `resources/web/chat.js` | 消息追加、滚动、复制 | `appendMessage()` Mock |
| FE-003a | `resources/web/chat.js` | 用户消息气泡 hover 复制按钮（右上角） | 用户消息复制交互 Mock |
| FE-003b | `resources/web/chat.js` | AI 消息头部+尾部双复制按钮，触发 Java `copyToClipboard` | AI 双复制按钮回调 Mock |
| FE-004 | `resources/web/chat.css` | 消息气泡样式 | - |
| FE-005 | `ui/chat/ChatPanel.kt` | 集成 JCEF 替换 JTextPane | 切换条件判断 |

**验收标准**:
- [ ] JCEF Browser 正常加载 `chat.html`
- [ ] 可以通过 `executeJavaScript()` 追加消息
- [ ] 消息气泡样式正确 (用户蓝色/AI 灰色)
- [ ] 复制按钮工作 (Java → JS 通信)
- [ ] 用户消息 hover 显示右上角复制按钮
- [ ] AI 消息头部和尾部复制按钮均可用

**后端对接点**: M2-A 完成 → 对接 `CliBridgeService` 回调

---

#### 1.2 会话 Tab 栏 (M2-B)

| 任务 | 文件 | 说明 | Mock 数据 |
|------|------|------|---------|
| FE-006 | `ui/chat/SessionTabBar.kt` | Tab 新建/切换/关闭 | 3 个示例 Tab |
| FE-006b | `ui/chat/HeaderToolbar.kt` | 标题栏右侧控件区：新建会话、历史会话、设置入口 | Header 控件联动 Mock |
| FE-006c | `ui/chat/HeaderToolbar.kt` | 流式输出开关（JBToggleButton） | 开关切换状态 Mock |
| FE-007 | `ui/chat/SessionTabBar.kt` | Tab 图标/标题/关闭按钮 | - |
| FE-008 | `ui/chat/SessionTabBar.kt` | Tab 选中状态样式 | - |

**验收标准**:
- [ ] 可以新建 Tab (标题 "新对话")
- [ ] 可以切换 Tab，消息区内容变化
- [ ] 可以关闭 Tab，至少保留一个
- [ ] Tab 样式符合设计规范
- [ ] 流式输出开关切换后有视觉反馈
- [ ] 历史会话按钮点击触发历史面板浮层/侧边栏

**后端对接点**: FE-008 完成 → 对接 `SessionService`

---

#### 1.3 历史会话面板 (M2-C5)

| 任务 | 文件 | 说明 | Mock 数据 |
|------|------|------|---------|
| FE-009 | `ui/chat/SessionHistoryPanel.kt` | 会话列表（标题/发起时间/用户提问次数） | 10 条含提问次数示例会话 |
| FE-010 | `ui/chat/SessionHistoryPanel.kt` | 搜索框实时过滤 | - |
| FE-011 | `ui/chat/SessionHistoryPanel.kt` | 右键菜单 (收藏/重命名/删除) | - |
| FE-012 | `ui/chat/SessionHistoryPanel.kt` | 点击会话 → 加载到新 Tab | Mock 加载效果 |

**验收标准**:
- [ ] 显示 10 条历史会话
- [ ] 每条会话显示发起时间和用户提问次数
- [ ] 搜索框可以过滤会话标题
- [ ] 右键菜单功能完整
- [ ] 点击会话创建新 Tab 并复制消息

**后端对接点**: FE-012 完成 → 对接 `SessionService.listSessions()`

---

#### 1.4 输入工具栏交互 (M2-A/M2-B)

| 任务 | 文件 | 说明 | Mock 数据 |
|------|------|------|---------|
| FE-013a | `ui/chat/InputToolbar.kt` | 附件按钮（图片/文件）+ 选择后附件标签预览 | 文件/图片选择 Mock |
| FE-013b | `ui/chat/InputToolbar.kt` | 上下文占用比（JProgressBar + 百分比） | 固定 30% 占用 Mock |
| FE-013c | `ui/chat/InputToolbar.kt` | 供应商悬浮列表（JPopupMenu） | 3 个示例 Provider |
| FE-013d | `ui/chat/InputToolbar.kt` | 对话模式悬浮列表（Auto/Plan/Agent） | 模式切换标签 Mock |
| FE-013e | `ui/chat/InputToolbar.kt` | 思考模式开关（JBToggleButton） | 开关高亮状态 Mock |
| FE-013f | `ui/chat/InputToolbar.kt` | 智能体悬浮列表（JPopupMenu） | 3 个示例 Agent |
| FE-013g | `ui/chat/InputToolbar.kt` | 提示词强化按钮 | 点击后文本加前缀 Mock |

**验收标准**:
- [ ] 附件选择后在输入框上方显示附件预览标签
- [ ] 上下文占用比显示为数字+进度条
- [ ] 供应商/模式/智能体三个悬浮列表均可弹出并选择
- [ ] 提示词强化按钮有点击反馈
- [ ] 发送按钮支持发送中状态和主动打断

**后端对接点**: FE-013g 完成 → 对接 `ProviderService`、模式状态管理与上下文统计服务

---

### Phase 2: 消息交互功能 (Week 2)

#### 2.1 消息操作 (M2-C)

| 任务 | 文件 | 说明 | Mock 数据 |
|------|------|------|---------|
| FE-013 | `resources/web/chat.js` | AI 消息右键菜单 | - |
| FE-014 | `ui/chat/ChatPanel.kt` | Rewind 回溯 UI (回溯点标记) | 每 3 条消息显示回溯点 |
| FE-015 | `ui/dialog/DiffReviewDialog.kt` | Diff 审查弹窗 | 前后对比示例文本 |
| FE-016 | `ui/chat/ChatPanel.kt` | 选中文本发送 (Ctrl+Alt+K) | 模拟编辑器选中 |

**验收标准**:
- [ ] AI 消息显示右键菜单 (复制/引用/重新生成/回溯)
- [ ] 回溯点标记显示在 AI 消息下方
- [ ] Diff 弹窗左右对比显示
- [ ] Ctrl+Alt+K 快捷键工作

**后端对接点**: FE-016 完成 → 对接 `RewindService`、`DiffService`

---

#### 2.2 消息引用 (M2-C6)

| 任务 | 文件 | 说明 | Mock 数据 |
|------|------|------|---------|
| FE-017 | `resources/web/chat.js` | 引用块 UI (Markdown 引用格式) | 示例引用文本 |
| FE-018 | `ui/chat/ChatPanel.kt` | 追加引用到输入框 | Mock 引用数据 |
| FE-019 | `service/QuoteService.kt` | Markdown stripping | Mock 格式化函数 |

**验收标准**:
- [ ] 引用块显示正确 (灰底、缩进、前缀 `>`)
- [ ] 引用时显示来源会话和时间
- [ ] Markdown 符号被正确 stripping

**后端对接点**: FE-019 完成 → 对接 `QuoteService`

---

#### 2.3 收藏会话独立界面

| 任务 | 文件 | 说明 | Mock 数据 |
|------|------|------|---------|
| FE-019a | `ui/chat/FavoriteSessionPanel.kt` | 收藏会话独立面板（搜索/列表/导出/删除） | 3 条收藏会话 Mock |
| FE-019b | `ui/chat/SessionHistoryPanel.kt` | 历史会话界面右下角大按钮，跳转收藏面板 | 大按钮触发 Mock |
| FE-019c | `ui/chat/SessionHistoryPanel.kt` | 历史面板与收藏面板 CardLayout 切换 | 面板切换 Mock |

**验收标准**:
- [ ] 历史面板右下角大按钮可进入收藏面板
- [ ] 收藏面板具备独立搜索，仅显示收藏会话
- [ ] 收藏会话项显示发起时间和提问次数
- [ ] 点击收藏会话可加载到当前会话 Tab

**后端对接点**: FE-019c 完成 → 对接 `SessionService` 收藏状态与会话加载接口

---

#### 2.4 状态栏与权限模式闭环

| 任务 | 文件 | 说明 | Mock 数据 |
|------|------|------|---------|
| FE-045 | `ui/chat/StatusBarPanel.kt` | 状态栏显示 Token、成本、Provider、Agent 运行状态 | Token/成本随机值 Mock |
| FE-046 | `ui/chat/PermissionModeSelector.kt` | 权限模式选择器（default/sandbox/yolo） | 3 种模式切换 Mock |
| FE-047 | `ui/dialog/ConfirmActionDialog.kt` | 敏感操作确认弹窗（执行前二次确认） | 风险操作确认 Mock |

**验收标准**:
- [ ] 状态栏实时更新 Token 与成本
- [ ] 权限模式切换后在消息区与状态栏可见
- [ ] 敏感操作触发确认弹窗，确认后才继续

**后端对接点**: FE-047 完成 → 对接 `UsageService`、`PermissionService`

---

### Phase 3: MCP 工具显示 (Week 2)

#### 3.1 工具调用卡片 (M3-FE1)

| 任务 | 文件 | 说明 | Mock 数据 |
|------|------|------|---------|
| FE-020 | `resources/web/chat.js` | 工具调用卡片 HTML/CSS | 示例工具 (read_file, edit) |
| FE-021 | `resources/web/chat.js` | 工具状态流转动画 | 定时器模拟 PENDING → RUNNING → SUCCESS |
| FE-022 | `ui/chat/JcefMessageRenderer.kt` | Java → JS 工具状态推送 | Mock 状态变化 |

**验收标准**:
- [ ] 工具卡片显示工具名称和状态
- [ ] 状态图标正确 (○ → ⏳ → ✓ / ✗)
- [ ] 工具输入可展开查看
- [ ] 状态动画流畅

**后端对接点**: FE-022 完成 → 对接 `CliMessage.ToolUseStart`

---

#### 3.2 权限确认弹窗 (M3-FE2)

| 任务 | 文件 | 说明 | Mock 数据 |
|------|------|------|---------|
| FE-023 | `ui/dialog/PermissionDialog.kt` | Swing 审批弹窗 | 示例工具输入 JSON |
| FE-024 | `bridge/CliBridgeService.kt` | 用户响应发送到 CLI | Mock 发送批准/拒绝 |

**验收标准**:
- [ ] 弹窗显示工具名称和输入
- [ ] [批准] / [拒绝] 按钮工作
- [ ] 弹窗非阻塞 (允许用户操作其他窗口)

**后端对接点**: FE-024 完成 → 对接 CLI Permission 模式

---

### Phase 4: 设置界面 (Week 3)

#### 4.1 基础设置页 (M4-FE6)

| 任务 | 文件 | 说明 | Mock 数据 |
|------|------|------|---------|
| FE-025 | `ui/settings/BasicSettingsPanel.kt` | CLI 版本检测显示 | Mock 版本号 |
| FE-026 | `ui/settings/BasicSettingsPanel.kt` | [检测更新] 按钮 | Mock 更新提示 |
| FE-027 | `ui/settings/BasicSettingsPanel.kt` | 语言选择下拉 (4 语言) | Mock 语言切换 |

**验收标准**:
- [ ] CLI 版本显示正确 (或 "未安装")
- [ ] [检测更新] 按钮点击显示状态
- [ ] 语言下拉显示 4 个选项
- [ ] 切换语言提示 "重启后生效"

**后端对接点**: FE-027 完成 → 对接 `CliUpdateService`、`I18nService`

---

#### 4.2 外观设置页 (M4-FE7)

| 任务 | 文件 | 说明 | Mock 数据 |
|------|------|------|---------|
| FE-028 | `ui/settings/AppearanceSettingsPanel.kt` | 主题下拉 (4 主题) | - |
| FE-029 | `ui/settings/AppearanceSettingsPanel.kt` | 对话背景 (纯色/图片) | Mock 图片路径 |
| FE-030 | `ui/settings/AppearanceSettingsPanel.kt` | 消息气泡颜色选择器 | Mock 颜色值 |
| FE-031 | `ui/chat/JcefMessageRenderer.kt` | 应用主题到 JCEF CSS 变量 | Mock CSS 注入 |

**验收标准**:
- [ ] 主题下拉显示 4 个选项
- [ ] 纯色选择器打开 `JColorChooser`
- [ ] 图片选择器打开文件选择
- [ ] 气泡颜色选择器工作
- [ ] [应用] 按钮实时预览

**后端对接点**: FE-031 完成 → 对接 `ThemeService`

---

#### 4.3 Provider 设置页 (M4-FE1/2/3)

| 任务 | 文件 | 说明 | Mock 数据 |
|------|------|------|---------|
| FE-032 | `ui/settings/ProviderSettingsPanel.kt` | 左右布局 (列表 + 表单) | `ProviderService.PRESET_PROVIDERS` |
| FE-033 | `ui/settings/ProviderSettingsPanel.kt` | 新增/编辑 Provider 弹窗 | - |
| FE-034 | `ui/settings/ProviderSettingsPanel.kt` | API Key 密码输入 + 验证 | Mock 验证结果 |
| FE-035 | `ui/chat/ProviderSelector.kt` | Header 下拉切换 Provider | - |

**验收标准**:
- [ ] Provider 列表显示 6 个预置供应商
- [ ] [新增供应商] 打开编辑弹窗
- [ ] API Key 字段为密码类型
- [ ] [验证] 按钮显示成功/失败
- [ ] Header 下拉可以切换 Provider

**后端对接点**: FE-035 完成 → 对接 `ProviderService.switchProvider()`

---

#### 4.4 Agent/Skill 设置页 (M4-FE8)

| 任务 | 文件 | 说明 | Mock 数据 |
|------|------|------|---------|
| FE-035a | `ui/settings/AgentSettingsPanel.kt` | Agent 管理页（新增按钮 + 名称列表 + 导出 JSON） | 2 条 Agent Mock |
| FE-035b | `ui/settings/SkillSettingsPanel.kt` | Skill 管理页（新增按钮 + 名称列表 + 导出 JSON） | 2 条 Skill Mock |
| FE-035c | `ui/settings/SettingsRootPanel.kt` | 设置左侧菜单新增 Agent 管理/Skill 管理入口 | 菜单切换 Mock |

**验收标准**:
- [ ] 左侧菜单可切换到 Agent 与 Skill 管理页
- [ ] 新增按钮可打开编辑弹窗（名称输入 + 保存）
- [ ] 列表项支持导出 JSON 操作

**后端对接点**: FE-035c 完成 → 对接 Agent/Skill 配置读写服务

---

#### 4.5 Prompt/MCP/Dependency/Session 设置页 (M4-FE9)

| 任务 | 文件 | 说明 | Mock 数据 |
|------|------|------|---------|
| FE-048 | `ui/settings/PromptSettingsPanel.kt` | 系统提示词配置（全局/项目级） | Prompt 模板 Mock |
| FE-049 | `ui/settings/McpSettingsPanel.kt` | MCP Server 管理（新增/编辑/删除/导出） | 2 个 MCP Server Mock |
| FE-050 | `ui/settings/DependencySettingsPanel.kt` | SDK/CLI 依赖检测与更新入口 | 版本状态 Mock |
| FE-051 | `ui/settings/SessionSettingsPanel.kt` | 会话默认策略（权限模式/自动保存/恢复） | Session 策略 Mock |

**验收标准**:
- [ ] Prompt 设置支持保存全局和项目级配置
- [ ] MCP Server 配置支持增删改查与导出
- [ ] Dependency 页显示安装状态并可触发更新
- [ ] Session 设置支持默认权限模式和恢复策略

**后端对接点**: FE-051 完成 → 对接 `ConfigService`、`MCPService`、`DependencyManager`、`PermissionService`

---

### Phase 5: 高级交互 (Week 4)

#### 5.1 文件引用 (M5-FE1)

| 任务 | 文件 | 说明 | Mock 数据 |
|------|------|------|---------|
| FE-036 | `ui/chat/FileReferencePopup.kt` | @ 触发弹窗 | Mock 文件列表 |
| FE-037 | `ui/chat/FileReferencePopup.kt` | 文件搜索过滤 | - |
| FE-038 | `ui/chat/FileReferencePopup.kt` | 插入文件引用到输入框 | Mock 插入效果 |

**验收标准**:
- [ ] 输入 `@` 字符触发弹窗
- [ ] 弹窗显示项目文件列表
- [ ] 搜索框实时过滤文件名
- [ ] 选择文件插入 `@filename` 到输入框

**后端对接点**: FE-038 完成 → 对接 `FileReferenceService`

---

#### 5.2 Slash 命令 (M5-FE2)

| 任务 | 文件 | 说明 | Mock 数据 |
|------|------|------|---------|
| FE-039 | `ui/chat/SlashCommandPopup.kt` | / 触发弹窗 | Mock 命令列表 |
| FE-040 | `ui/chat/SlashCommandPopup.kt` | 命令描述显示 | - |
| FE-041 | `ui/chat/SlashCommandPopup.kt` | 插入命令到输入框 | Mock 插入效果 |

**验收标准**:
- [ ] 输入 `/` 字符触发弹窗
- [ ] 弹窗显示命令列表 (/init, /review, /commit...)
- [ ] 选择命令插入到输入框
- [ ] 命令参数可编辑

**后端对接点**: FE-041 完成 → 发送到 CLI (无需后端服务)

---

#### 5.3 动画效果 (M5-FE3)

| 任务 | 文件 | 说明 | Mock 数据 |
|------|------|------|---------|
| FE-042 | `resources/web/chat.css` | 流式打字机动画 | CSS animation |
| FE-043 | `resources/web/chat.js` | 思考片段折叠动画 | - |
| FE-044 | `ui/chat/ChatPanel.kt` | Tab 切换过渡动画 | - |

**验收标准**:
- [ ] 流式输出有打字机效果
- [ ] 思考片段折叠/展开动画流畅
- [ ] Tab 切换有淡入淡出效果

**后端对接点**: 无 (纯前端动画)

---

#### 5.4 架构补齐项（端到端支撑）

| 任务 | 文件 | 说明 | Mock 数据 |
|------|------|------|---------|
| FE-052 | `ui/chat/ThinkingBlockView.kt` | 思考片段显示与折叠（对应 thinking_delta） | thinking 片段 Mock |
| FE-053 | `ui/chat/AgentStatusPanel.kt` | Agent/子Agent 状态追踪卡片 | 子 Agent 状态流转 Mock |
| FE-054 | `ui/chat/AttachmentDropZone.kt` | 图片/文件拖拽上传（补齐图片发送场景） | 拖拽事件 Mock |
| FE-055 | `ui/chat/SessionExportDialog.kt` | 会话导出（Markdown/JSON/纯文本） | 导出预览 Mock |
| FE-056 | `ui/chat/FileNavigationAction.kt` | 消息内文件路径跳转与定位 | 文件跳转 Mock |
| FE-057 | `ui/chat/QuickFixAction.kt` | Quick Fix 快捷修复入口（Ctrl+Shift+Q） | 修复建议 Mock |

**验收标准**:
- [ ] Thinking 片段支持折叠/展开并保留用户偏好
- [ ] Agent/子Agent 状态支持 pending/running/success/error
- [ ] 拖拽图片/文件后可进入输入上下文并显示附件标签
- [ ] 会话可导出 Markdown/JSON/纯文本
- [ ] 文件导航支持从消息跳转到编辑器位置
- [ ] Quick Fix 快捷键触发修复建议入口

**后端对接点**: FE-057 完成 → 对接 `MessageService`、`AttachmentService`、`AgentService`、`CommitGenerator`、`Editor 集成服务`

---

## 四、Mock 数据定义

### 4.1 MockSessionData

```kotlin
// src/test/kotlin/mock/MockSessionData.kt
object MockSessionData {
    val sessions = listOf(
        ChatSession(
            id = "sess-001",
            sessionId = "cli-abc123",
            title = "代码重构讨论",
            createdAt = Instant.now().minusSeconds(3600),
            messageCount = 2,
            messages = mutableListOf(
                Message(id = "msg-001", role = Role.USER, content = "帮我重构这个类"),
                Message(id = "msg-002", role = Role.ASSISTANT, content = "建议拆分为三个服务...")
            ),
            isFavorite = true
        ),
        ChatSession(
            id = "sess-002",
            sessionId = "cli-def456",
            title = "Bug 分析",
            createdAt = Instant.now().minusSeconds(86400),
            messageCount = 1,
            messages = mutableListOf(
                Message(id = "msg-003", role = Role.USER, content = "空指针异常")
            ),
            isFavorite = false
        ),
        // ... 8 more sessions
    )
}
```

### 4.2 MockMessageData

```kotlin
object MockMessageData {
    val userMessage = Message(
        id = "msg-001",
        role = Role.USER,
        content = "请帮我分析这段代码的性能问题",
        timestamp = Instant.now()
    )

    val aiResponse = Message(
        id = "msg-002",
        role = Role.ASSISTANT,
        content = """
            分析你的代码，发现以下性能问题：
            
            1. 循环内创建对象
            2. 未使用缓存
            3. N+1 查询问题
            
            ```kotlin
            // 建议修改
            val cache = mutableMapOf()
            ```
        """.trimIndent(),
        timestamp = Instant.now()
    )

    val toolUseMessage = Message(
        id = "msg-003",
        role = Role.ASSISTANT,
        content = "正在读取文件...",
        toolCalls = listOf(
            ToolCall(
                id = "tool-001",
                name = "read_file",
                input = mapOf("path" to "src/main.kt"),
                status = ToolCallStatus.SUCCESS
            )
        )
    )
}
```

### 4.3 MockMcpData

```kotlin
object MockMcpData {
    fun getToolSequence(): List<ToolCall> {
        return listOf(
            ToolCall("tool-001", "read_file", mapOf("path" to "App.kt"), ToolCallStatus.SUCCESS),
            ToolCall("tool-002", "edit_file", mapOf("path" to "App.kt"), ToolCallStatus.RUNNING),
            ToolCall("tool-003", "run_command", mapOf("cmd" to "gradle build"), ToolCallStatus.PENDING)
        )
    }
}
```

---

## 五、后端对接计划

### 5.1 对接优先级

```
┌─────────────────────────────────────────────────────────────┐
│  后端对接优先级 (按依赖关系)                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  P0 (核心功能)                                              │
│  ├── SessionService → FE-008 (Tab 切换)                    │
│  ├── CliBridgeService → FE-005 (消息回调)                  │
│  └── RewindService → FE-014 (回溯 UI)                      │
│                                                             │
│  P1 (增强功能)                                              │
│  ├── QuoteService → FE-019 (消息引用)                      │
│  ├── DiffService → FE-015 (Diff 审查)                      │
│  └── FileReferenceService → FE-038 (@file 引用)            │
│                                                             │
│  P2 (辅助功能)                                              │
│  ├── ThemeService → FE-031 (主题切换)                      │
│  ├── I18nService → FE-027 (国际化)                         │
│  └── UsageService → FE-025 (Token 统计)                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 对接检查点

| 检查点 | 前端任务 | 后端服务 | 验收标准 |
|--------|---------|---------|---------|
| CP-1 | FE-005 (JCEF 消息) | CliBridgeService | 流式输出正常显示 |
| CP-2 | FE-008 (Tab 切换) | SessionService | 切换 Tab 恢复消息历史 |
| CP-3 | FE-014 (Rewind) | RewindService | 回溯创建新会话并复制消息 |
| CP-4 | FE-031 (主题) | ThemeService | 切换主题实时生效 |
| CP-5 | FE-035 (Provider) | ProviderService | 切换 Provider 更新 CLI 配置 |

### 5.3 架构功能点对点对齐矩阵（FE ↔ BE ↔ 流程）

| 架构功能点 | 前端任务 | 后端服务/任务 | 交互流程节点 |
|-----------|---------|--------------|-------------|
| @file 引用 | FE-036~038 | BE-106 `FileReferenceService` | 9.1 `InputArea.onSend()` |
| 图片/文件发送 | FE-013a, FE-054 | BE-107 `AttachmentService` | 9.1 `处理附件` |
| 对话回溯 | FE-014 | BE-105 `RewindService` | 9.1 `创建回溯点` |
| 提示词增强 | FE-013g, FE-048 | BE-207 `PromptEnhancementService` | 9.1 `构建消息对象` 前 |
| 流式输出与思考片段 | FE-042, FE-052 | BE-004 `NDJSONParser` | 9.1 `onChunk/onThinking` |
| 工具调用状态 | FE-020~022 | BE-206 `MCPService` | 9.1 `onToolUse` |
| Provider 切换 | FE-013c, FE-035 | BE-201 `ProviderService` | 9.2 全流程 |
| Diff 审查 | FE-015 | BE-303 `DiffService`, BE-208 `PermissionService` | 9.3 全流程 |
| 权限模式与确认 | FE-046, FE-047, FE-051 | BE-208 `PermissionService` | 9.3 `checkPermission` |
| Token/成本统计 | FE-045 | BE-202 `UsageService` | 9.1 `onComplete` |
| Agent/子Agent 追踪 | FE-053, FE-035a | BE-204 `AgentService` | 9.1 `更新 Agent 状态` |
| 会话导出 | FE-055 | BE-102 `MessageService` | 会话管理链路 |
| Quick Fix / 选中文本发送 | FE-057, FE-016 | BE-308 `Editor集成` | IDE Action 链路 |

### 5.4 关键交互流程端到端验收

#### Flow-A: 对话发起（9.1）
- UI 触发：输入框发送 / @file / 附件
- 中间层：`SessionService.addMessage` + `ContextService.buildContext`
- Bridge：`DaemonBridgeService.sendMessage`（当前可先兼容 `CliBridgeService`）
- 回调渲染：Chunk / Thinking / ToolUse / Complete
- 验收闭环：消息入库、Token 记录、状态栏更新、会话持久化

#### Flow-B: Provider 切换（9.2）
- UI 触发：ProviderSelector 选择项变更
- 服务处理：`ProviderService.switchProvider`
- Bridge 同步：`sendCommand(switch_provider)` 或 settings 切换生效
- UI 回写：Header、Model 列表、StatusBar 同步刷新
- 验收闭环：下一次请求使用新 Provider 生效且可观测

#### Flow-C: Diff 审查（9.3）
- 触发：AI 产生修改建议
- 权限判定：`PermissionService.checkPermission`
- 审查执行：`DiffViewerDialog` 接受/拒绝/逐块审查
- 落盘：写文件 + 刷新编辑器 + 记录日志
- 验收闭环：不同权限模式行为一致且可追踪

---

## 六、开发时间表

### Week 1: 核心聊天界面

| 天 | 任务 | 产出 |
|----|------|------|
| Day 1-2 | FE-001 ~ FE-005 + FE-003a/b (JCEF 消息渲染与复制交互) | JCEF 消息区 + 复制交互可用 |
| Day 3-4 | FE-006 ~ FE-008 + FE-006b/c (会话 Tab + Header) | Tab 新建/切换/关闭 + 标题栏控件 |
| Day 5 | FE-009 ~ FE-012 + FE-013a~g + FE-045~047 (历史面板 + 输入工具栏 + 状态栏权限) | 历史/输入/状态栏三线闭环 |

**里程碑 M1-FE**: 核心聊天界面完成，可以使用 Mock 数据演示完整流程

---

### Week 2: 消息交互 + MCP

| 天 | 任务 | 产出 |
|----|------|------|
| Day 1-2 | FE-013 ~ FE-016 (消息操作) | 右键菜单、Rewind、Diff |
| Day 3 | FE-017 ~ FE-019 + FE-019a~c (消息引用 + 收藏会话独立界面) | Quote 功能 + 收藏会话界面 |
| Day 4-5 | FE-020 ~ FE-024 + FE-052~054 (MCP + Thinking + 附件拖拽) | 工具卡片、思考片段、附件流 |

**里程碑 M2-FE**: 消息交互完成，支持所有消息操作

---

### Week 3: 设置界面

| 天 | 任务 | 产出 |
|----|------|------|
| Day 1-2 | FE-025 ~ FE-027 (基础设置) | CLI 检测、语言选择 |
| Day 3-4 | FE-028 ~ FE-031 (外观设置) | 主题、背景、气泡色 |
| Day 5 | FE-032 ~ FE-035 + FE-035a~c + FE-048~051 (Provider/Agent/Skill + Prompt/MCP/Dependency/Session) | 设置全菜单 + 后端配置预埋 |

**里程碑 M3-FE**: 设置界面完成，所有配置项可操作

---

### Week 4: 高级交互 + 打磨

| 天 | 任务 | 产出 |
|----|------|------|
| Day 1-2 | FE-036 ~ FE-038 + FE-055 (file 引用 + 会话导出) | 文件引用与导出能力 |
| Day 2-3 | FE-039 ~ FE-041 + FE-056~057 (Slash + 文件导航 + Quick Fix) | 命令弹窗与编辑器联动 |
| Day 4 | FE-042 ~ FE-044 (动画) | 流式输出、折叠动画 |
| Day 5 | UI 打磨、Bug 修复 | 体验优化 |

**里程碑 M4-FE**: 前端全部完成，准备后端对接

---

### Week 5-6: 后端对接

| 天 | 任务 | 产出 |
|----|------|------|
| Day 1-2 | CP-1 ~ CP-2 (核心功能对接) | SessionService + CliBridgeService |
| Day 3-4 | CP-3 ~ CP-5 (增强功能对接) | RewindService + DiffService |
| Day 5-8 | 其他服务对接 + Bug 修复 | 完整功能 |

**里程碑 M5-INT**: 端到端功能可用

---

## 七、技术栈确认

### 7.1 前端技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 容器 | Swing (JPanel, JDialog) | 对话框、设置界面 |
| 消息区 | JCEF (JBCefBrowser) | 强制要求，HC-009 |
| HTML | HTML5 + CSS3 | 消息渲染结构 |
| JS | Vanilla JS (marked.js, highlight.js, diff2html) | Markdown 渲染、代码高亮、Diff |
| 组件库 | IntelliJ Platform UI | JBPanel, JBScrollPane, JBCefBrowser |

### 7.2 后端技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 进程管理 | ProcessBuilder | CLI 进程启动 |
| 数据解析 | Gson | NDJSON 解析 |
| 配置持久化 | PersistentStateComponent | Settings JSON |
| 服务注册 | @Service (APP/PROJECT) | 单例服务管理 |

---

## 八、风险与注意事项

### 8.1 前端风险

| 风险 | 影响 | 解决方案 |
|------|------|---------|
| JCEF 不兼容 | 高 | 检测 `JBCefApp.isSupported()`，降级 Swing |
| Mock 数据不真实 | 中 | 使用真实场景数据，定期更新 |
| 交互流程遗漏 | 中 | 严格按照 API_Design.md 验证 |

### 8.2 后端对接风险

| 风险 | 影响 | 解决方案 |
|------|------|---------|
| API 不匹配 | 高 | 前端开发前先确认 API 定义 |
| 回调线程问题 | 中 | JS 回调不在 EDT，需 `invokeLater` |
| 数据格式不一致 | 中 | 使用统一的 CliMessage 类型 |

---

*文档版本: v1.2*
*最后更新: 2026-04-16*
