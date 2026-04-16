# CC Assistant 开发规划文档

> **版本**: v5.2 (与 API_Design.md v5.2、CC_Assistant_Technical_Architecture.md v5.2 对齐)
> **日期**: 2026-04-15
> **当前里程碑**: M1 (极简对话) 已完成基础框架
> **下一步**: M2 (多会话 + JCEF 切换)

---

## 一、项目总览

### 1.1 产品定位
CC Assistant 是 Claude Code CLI 的 JetBrains IDE UI 壳子，提供内嵌对话界面。不自行封装 SDK，所有 AI 能力通过 CLI 直连。

### 1.2 核心架构决策
| 决策项 | 结论 | 理由 |
|--------|------|------|
| AI 能力来源 | Claude Code CLI 直连 | CLI 是 SDK 的封装，开箱即用 |
| 对话区 UI | JCEF (M2 引入) | Markdown/Diff/流式渲染需要前端能力 |
| 非对话区 UI | Swing 原生 | 轻量、与 IDE 深度集成、零启动开销 |
| 供应商切换 | 覆写 ~/.claude/settings.json | CLI 原生读取该文件 |
| 通信协议 | NDJSON (stream-json) | CLI `--output-format stream-json` 原生支持 |

### 1.3 UI 技术栈策略

```
┌─ ToolWindow (Swing 容器) ──────────────────────────┐
│ 标题栏 + 会话 Tab (Swing)                           │
├────────────────────────────────────────────────────┤
│                                                     │
│  消息渲染区 (JCEF)          ← M2 引入               │
│  HTML/CSS/JS: Markdown + Diff + 流式 + 复制按钮     │
│  JBCefJSQuery: 与 Java 层双向通信                   │
│                                                     │
│  当前 (M1): JTextPane 占位，仅验证 CLI 链路         │
│                                                     │
├────────────────────────────────────────────────────┤
│ 输入框 + 工具栏 (Swing)                             │
│ [供应商▼] [模式▼] [思考🔄] [Agent▼]       [发送]   │
└────────────────────────────────────────────────────┘

设置界面 (Swing Configurable)    ← M4 实现
File → Settings → Tools → CC Assistant
├── 供应商管理 (列表 + 表单 + JSON 编辑器)
├── Agent 管理
└── Skill 管理
```

**选型原则**:
- **对话消息区 (M2+)**: **强制使用 JCEF**，Markdown/Diff/流式渲染需要前端能力
- **其余所有区域**: 使用 Swing 原生组件
- **降级条件**: 仅在 `JBCefApp.isSupported() = false` 时降级为纯文本

### 1.4 开发策略

**前端优先开发** 📋

> 详细计划见: [frontend-first-plan.md](./frontend-first-plan.md)

**策略**: 先完成所有前端界面，使用 Mock 数据驱动开发，逐步对接后端服务

```
前端界面开发 (Mock) → 后端 API 对接 → 联调打磨
     4 周              1-2 周           1 周
```

**核心优势**:
- ✅ 前端团队独立工作，不阻塞后端开发
- ✅ 先验证 UI/UX 设计，快速迭代
- ✅ 后端 API 设计更清晰（基于前端需求）
- ✅ 并行开发，缩短整体交付周期

---

## 二、里程碑规划

### 总览

| 里程碑 | 周期 | 核心交付物 | 任务数 | 状态 |
|--------|------|------------|--------|------|
| **M0** | Day 1 | CLI 链路验证 | 5 文件 | ✅ 完成 |
| **M1** | Week 1 | 极简对话 (Swing) | 6 文件 + 1 任务 | ✅ 完成 |
| **M2** | Week 2-3 | 多会话 + JCEF 切换 | 15 任务 | 🔲 待开始 |
| **M3** | Week 4 | MCP 支持 | 6 任务 | 🔲 待开始 |
| **M4** | Week 5-6 | 设置 + 供应商 UI | 14 任务 | 🔲 待开始 |
| **M5** | Week 7-8 | 打磨上线 | 10 任务 | 🔲 待开始 |

---

### M0: CLI 链路验证 ✅

**目标**: 验证 Claude Code CLI 能被 Kotlin 代码调用

**已完成交付物**:
| 文件 | 说明 |
|------|------|
| `bridge/CliMessage.kt` | NDJSON 消息类型 (TextDelta/Thinking/ToolUse/Result/Error) |
| `bridge/CliBridgeService.kt` | CLI 进程管理 (检测/启动/中断/回调分发) |
| `bridge/NdjsonParser.kt` | NDJSON 解析器 (stream_event/result/assistant/error) |
| `test/bridge/NdjsonParserTest.kt` | 16 个解析测试用例 |
| `test/bridge/CliBridgeServiceTest.kt` | CLI 检测/回调/生命周期测试 |

**验证结果**: 全部测试通过，插件构建成功 (60KB)

---

### M1: 极简对话 ✅

**目标**: 最基本的对话功能，纯 Swing 实现，验证 CLI 通信链路

**已完成交付物**:
| 文件 | 说明 |
|------|------|
| `ui/ChatPanel.kt` | Swing 聊天面板 (消息气泡/输入框/流式渲染) |
| `toolWindow/MyToolWindowFactory.kt` | ToolWindow 入口，加载 ChatPanel |
| `bridge/CliBridgeService.kt` | 新增 `getInstance()` 单例获取 |
| `resources/providers/*.json` | 6 个预置供应商模板 (无 API Key) |
| `model/Provider.kt` | 更新 `switchProvider()` 使用资源模板 |

**M1 待补充**:
| ID | 任务 | 技术 | 预估 | API 接口 |
|----|------|------|------|---------|
| M1-4 | CLI 安装引导 | Swing Dialog + BrowserUtil | 0.5天 | M1-004 |

**M1-4 任务详情**:
```
前置条件: CliBridgeService.getInstance().isCliAvailable() == false

交互流程:
1. 用户打开 ToolWindow
2. CliBridgeService 检测到 CLI 未安装
3. 弹出 CliInstallGuideDialog
   ├── 显示警告: "Claude Code CLI 未安装"
   ├── [访问 Claude Code 官网] → BrowserUtil.open()
   └── [重新检测] → 再次调用 isCliAvailable()
4. 用户安装完成后点击 [重新检测]
5. 检测成功 → 关闭弹窗 → 进入正常对话界面

文件:
- ui/dialog/CliInstallGuideDialog.kt (新建)
- bridge/CliBridgeService.kt (新增 checkAndPromptCliInstallation())
```

**M1 局限性** (M2 解决):
- 消息渲染用 JTextPane HTML，无完整 Markdown 支持
- 无代码块语法高亮
- 无 Diff 展示
- 单会话，无持久化

---

### M2: 多会话 + JCEF + 前端框架切换 🔲

**目标**:
1. 会话持久化，能新建/切换/删除
2. 消息渲染区从 Swing 切换到 JCEF + React/Vue/Svelte
3. 前端独立构建流程 (Vite)

> 前端优先开发详见 [frontend-first-plan.md](./frontend-first-plan.md)（v2.0，2026-04-16 更新）
> 所有前端任务已更新为 React/Vue/Svelte + Vite 工作流

#### M2 任务拆解

**M2-A: 前端框架 + JCEF 集成 (优先)**

| ID | 任务 | 技术 | 预估 |
|----|------|------|------|
| M2-A1 | 前端项目初始化 (React/Vue/Svelte 三选一) | Vite + TypeScript | 0.5天 |
| M2-A2 | Tailwind CSS + shadcn/ui 环境配置 | Tailwind + PostCSS | 0.5天 |
| M2-A3 | JCEF Browser 管理器创建 | JCEF + JBPanel | 0.5天 |
| M2-A4 | 前端消息渲染组件实现 | React/Vue/Svelte | 1天 |
| M2-A5 | Java → JS 双向通信 (JBCefJSQuery) | JBCefJSQuery | 1天 |
| M2-A6 | Markdown 渲染 (marked.js + highlight.js) | marked + highlight.js | 0.5天 |
| M2-A7 | Diff 可视化 (diff2html) | diff2html | 0.5天 |
| M2-A8 | 状态管理 (Zustand/Redux/Pinia) | 状态管理库 | 0.5天 |
| M2-A9 | 流式输出适配 (增量渲染) | React/Vue/Svelte | 0.5天 |
| M2-A10 | ChatPanel 集成 JCEF (替换 JTextPane) | Swing + JCEF | 1天 |
| M2-A11 | Vite 构建配置 + Gradle 集成 | Vite + Gradle | 1天 |

**M2-A1 任务详情**:
```
前端项目初始化:
├── 选择框架: React 18+ / Vue 3 / Svelte
├── 创建项目: npm create vite@latest frontend -- --template react-ts
├── 安装依赖:
│   ├── 核心框架: react/vue/svelte
│   ├── TypeScript: @types/react (React)
│   ├── 路由: react-router / vue-router
│   ├── 状态管理: zustand / redux-toolkit / pinia
│   ├── 样式: tailwindcss + postcss + autoprefixer
│   ├── UI 组件: @radix-ui/* (React) / element-plus (Vue)
│   ├── Markdown: marked + highlight.js + diff2html
│   └── 工具: axios (可选)
└── 配置文件:
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── tsconfig.json
    └── package.json
```

**M2-A11 任务详情**:
```
Vite 构建配置 + Gradle 集成:
├── Vite 配置:
│   ├── 开发服务器: localhost:5173
│   ├── 生产构建: frontend/dist/
│   ├── 代码分割: React/Vue/Markdown 分离打包
│   └── HMR 配置: 热模块替换
├── Gradle 任务:
│   ├── copyFrontendResources: 复制 dist → resources/web/
│   ├── buildPlugin 依赖: 前端构建先执行
│   └── runIde 依赖: 前端构建先执行
└── 开发工作流:
    ├── 前端开发: cd frontend && npm run dev
    ├── 前端构建: npm run build
    ├── 插件构建: ./gradlew buildPlugin
    └── 插件运行: ./gradlew runIde
```

**M2-B: 多会话管理**

| ID | 任务 | 技术 | 预估 | API 接口 |
|----|------|------|------|---------|
| M2-B1 | SessionService (会话 CRUD) | Kotlin + JSON | 1天 | M2-004 |
| M2-B2 | 会话持久化 (~/.claude/sessions/) | JSON 文件存储 | 0.5天 | M2-004 |
| M2-B3 | 会话 Tab 栏 UI | Swing JTabbedPane | 1天 | M2-001~003 |
| M2-B4 | 新建/切换/删除会话交互 | Swing | 0.5天 | M2-001~003 |
| M2-B5 | 会话标题自动生成 (取首条 prompt) | Kotlin | 0.5天 | M2-005 |
| M2-B6 | 重启 IDE 后会话恢复 | PersistentStateComponent | 0.5天 | M2-004 |

**M2-B 任务详情**:
```
M2-B1 SessionService:
├── createSession(workingDir): ChatSession
├── saveSession(session: ChatSession)
├── getSession(sessionId: String): ChatSession?
├── deleteSession(sessionId: String)
└── listSessions(): List<ChatSession>

数据模型 ChatSession:
├── id: String (插件内部 UUID)
├── sessionId: String? (CLI 返回的 session_id，用于 --resume)
├── title: String (自动生成或用户重命名)
├── createdAt: Instant
├── updatedAt: Instant
├── workingDir: String (持久化工作目录)
├── messages: MutableList<Message>
└── isFavorite: Boolean

存储位置: ~/.claude/sessions/{id}.json
```

**M2-C: 核心体验功能 (M2 新增)**

| ID | 任务 | 技术 | 预估 | API 接口 |
|----|------|------|------|---------|
| M2-C1 | Rewind 回溯 UI | JCEF + JS | 1天 | M2-012 |
| M2-C2 | RewindService | Kotlin | 0.5天 | M2-012 |
| M2-C3 | 选中文本发送 | EditorAction + AnActionHandler | 1天 | M2-013 |
| M2-C4 | Diff 审查弹窗 | Swing + DiffViewer | 1.5天 | M2-014 |
| M2-C5 | 历史会话加载 | Swing JList + SessionService | 1天 | M2-006 |
| M2-C6 | 消息引用 (Quote) | JCEF JS + SessionService | 1天 | M2-015 |

**M2-C 任务详情**:
```
M2-C1 Rewind 回溯 UI:
├── 在每条 AI 消息下方显示回溯点标记 (○)
├── 点击回溯点 → 显示确认对话框
├── 确认后 → 创建新会话，复制回溯点之前的消息
└── JS 回调: window.rewindCallback.invoke(pointId)

M2-C2 RewindService:
├── getRewindPoints(sessionId): List<RewindPoint>
│   └── 返回每条 AI 消息作为可回溯点
├── rewind(sessionId, rewindPointId): String
│   ├── 创建新会话
│   ├── 复制回溯点之前的消息
│   └── 返回新会话 ID (CLI session_id 后续异步更新)
└── RewindPoint(id, index, preview, timestamp)

M2-C3 选中文本发送 (Ctrl+Alt+K):
├── 创建 SelectedTextHandler extends AnActionHandler
├── 拦截 Ctrl+Alt+K 快捷键
├── 获取编辑器选中的文本
├── 打开/激活 CC Assistant ToolWindow
└── 追加 "[选中代码]\n{selectedText}\n[/选中代码]" 到输入框

M2-C4 Diff 审查弹窗:
├── DiffReviewDialog(project, filePath, original, suggested, onAccept, onReject)
├── 使用 IntelliJ DiffManager 创建对比视图
├── 左侧: 原始内容 (只读)
├── 右侧: 建议修改 (只读)
├── 底部按钮: [拒绝] [应用修改]
└── onAccept → 调用 FileDocumentManager 写入文件

M2-C5 历史会话加载:
├── 触发: 在历史会话面板点击某个会话项
├── 行为: 新建 Tab，加载该会话的完整历史消息
│   └── 注意: 是复制 (copy)，不是移动 (move)，原会话保留在历史列表
├── 实现步骤
│   ├── 1. SessionService.getSession(sessionId) 读取会话 JSON
│   ├── 2. SessionService.createSession() 创建新会话 Tab
│   ├── 3. 遍历原会话 messages，逐条 append 到 JCEF
│   └── 4. currentSessionId = 原 sessionId (用于 --resume)
└── 区分: "切换会话" (M2-B4) vs "加载历史" (M2-C5)
    ├── 切换: 已有 Tab，直接切换，当前编辑内容可能丢失
    └── 加载: 新建 Tab，复制历史，可在新建 Tab 继续对话

M2-C6 消息引用 (Quote):
├── 场景: 用户在对话中想引用某历史会话的某条消息
│   └── 类似 Email 引用回复，但这里是跨会话引用
├── 数据模型
│   ├── MessageQuote(sessionId: String, messageId: String)
│   └── 引用时存储: sessionId (哪个会话) + messageId (哪条消息)
├── 引用格式 (显示在消息区域内)
│   └── ┌─────────────────────────────────────────┐
│       │ ↩ 引用自「会话标题」10:30              │
│       │ "这是被引用的消息内容..."               │
│       └─────────────────────────────────────────┘
├── 实现步骤
│   ├── 1. 长按/右键 AI 消息 → 显示 "引用此消息"
│   ├── 2. 点击后，消息标记为 MessageQuote
│   ├── 3. 发送时，CLI prompt 包含引用上下文
│   │   └── "引用自 [会话A - 10:30]: 消息内容..."
│   └── 4. JCEF 渲染时，遇到 MessageQuote 显示引用块
├── 与 Rewind 的区别
│   ├── Rewind: 回溯后丢弃后续消息，从头生成
│   └── Quote: 保留当前对话，附加引用上下文
└── API: SessionService.quoteMessage(sessionId, messageId): Message
```

**JCEF 技术方案**:
```
Java 层 (CliBridgeService)
    │  onMessage(CliMessage.TextDelta)
    ▼
ChatPanel (Swing 容器)
    │  jbCefBrowser.loadHTML(...)
    │  jbCefJSQuery → JS: appendMessage(text)
    ▼
JCEF Browser (内嵌 Chromium)
    │  index.html + marked.js + highlight.js
    │  渲染 Markdown / Diff / 流式文本
    │  复制按钮 → jbCefJSQuery → Java: copyToClipboard()
    ▼
用户看到的对话内容
```

**验收标准**:
- [ ] Markdown 完整渲染 (标题/列表/代码块/表格/链接)
- [ ] 代码块语法高亮
- [ ] 流式输出打字机效果
- [ ] 消息复制按钮工作
- [ ] 新建/切换/删除会话
- [ ] 重启 IDE 后会话恢复
- [ ] CLI 未安装时显示引导弹窗
- [ ] Ctrl+Alt+K 发送选中文本
- [ ] 回溯点可点击，创建新会话
- [ ] Diff 审查弹窗可查看差异并应用/拒绝
- [ ] 历史会话面板点击会话 → 新建 Tab 加载历史
- [ ] AI 消息可引用 → 显示引用块，发送时附加上下文

---

### M3: MCP 支持 🔲

**目标**: MCP 工具调用显示，权限确认，Plan 模式审批

**前置依赖**: M2 (JCEF 消息渲染)

| ID | 任务 | 技术 | 预估 | API 接口 |
|----|------|------|------|---------|
| M3-FE1 | 工具调用状态卡片 (JCEF) | HTML/CSS/JS | 1天 | M3-001 |
| M3-FE2 | 权限确认弹窗 (Plan 模式) | Swing JDialog | 1天 | M5-003 |
| M3-FE3 | 工具结果详情展开 | JCEF JS | 0.5天 | M3-001 |
| M3-BE1 | MCP 工具列表解析 | CliMessage 扩展 | 0.5天 | M3-001 |
| M3-BE2 | 工具状态流转处理 | Kotlin | 0.5天 | M3-001 |
| M3-BE3 | MCP 服务器配置 | Kotlin | 1天 | M3-002 |

**M3 任务详情**:
```
M3-FE1 工具调用状态卡片:
├── HTML 结构
│   ├── 工具调用卡片 (.tool-use-card)
│   ├── 工具名称 + 状态图标
│   ├── 状态: ○ 待执行 → ⏳ 执行中 → ✓ 成功 / ✗ 失败
│   └── 工具输入预览 (可展开)
├── JS 交互
│   ├── appendToolUse(toolName, status)
│   ├── updateToolStatus(toolName, status)
│   └── expandToolInput(toolName)
└── 回调 Java
    └── JBCefJSQuery: onToolUseExpand(toolName)

M3-FE2 权限确认弹窗 (Plan 模式):
├── 触发条件: CLI 不传 --permission-mode，CLI 暂停并等待确认
├── 显示内容
│   ├── 工具名称
│   ├── 工具输入 JSON
│   └── 预估影响
├── 用户操作
│   ├── [批准] → 发送 "approve" → CLI 继续执行
│   └── [拒绝] → 发送 "reject" → CLI 中断执行
└── 实现
    ├── PermissionDialog(project, toolName, toolInput, onApprove)
    └── bridge/CliBridgeService.sendPermissionResponse(approve: Boolean)

M3-BE1 MCP 工具列表解析:
├── CliMessage.ToolUseStart(name, input, status)
├── CliMessage.ToolUseInputDelta(name, delta)
├── ToolUseStatus: PENDING, RUNNING, SUCCESS, ERROR
└── 解析 CLI NDJSON 中的 tool_use 类型消息

M3-BE3 MCP 服务器配置:
├── MCPServer(id, name, command, args, env)
├── MCPService.addServer(config: MCPServer)
├── MCPService.removeServer(serverId: String)
├── MCPService.listServers(): List<MCPServer>
└── 配置存储: AppConfigState.mcpServers
```

**M3 验收标准**:
- [ ] 工具调用 (Read/Edit/Bash) 在 UI 显示 pending/running/success/error 状态
- [ ] Plan 模式权限确认弹窗工作
- [ ] 工具输入可展开查看详情
- [ ] 批准/拒绝操作正确传递给 CLI
- [ ] MCP 服务器可添加/删除/列表

---

### M4: 设置 + 供应商管理 UI 🔲

**目标**: 完整配置系统，供应商切换 UI

**参照 ui.md 第 4 节设计**:

```
Settings → Tools → CC Assistant (Swing Configurable)
├── 左侧菜单
│   ├── 供应商管理
│   ├── Agent 管理
│   └── Skill 管理
│
└── 右侧配置区
    ├── 供应商列表页
    │   ├── [新增供应商] 按钮
    │   └── 列表: 名称 | 状态 | 修改 | 导出JSON | 删除
    │
    └── 新增/编辑供应商页
        ├── 快捷配置: [Claude] [GLM] [DeepSeek] ... (自动填充)
        ├── 供应商名称: [________]
        ├── URL: [________]
        ├── API Key: [________]
        ├── 模型预设: [默认 ▼]
        └── JSON 编辑器: (与表单双向同步)
            ~/.claude/settings.json 格式
```

| ID | 任务 | 技术 | 预估 | API 接口 |
|----|------|------|------|---------|
| M4-FE1 | Settings Configurable (左右布局) | Swing JDialog | 0.5天 | M4-001 |
| M4-FE2 | 供应商列表页 (表格 + 操作按钮) | Swing JTable | 1天 | M4-001 |
| M4-FE3 | 供应商编辑页 (表单 + JSON 双向编辑) | Swing Form | 1.5天 | M4-001, M4-003 |
| M4-FE4 | 对话区工具栏集成供应商下拉 | Swing JComboBox | 0.5天 | M4-002 |
| M4-FE5 | Token 统计面板 | Swing JPanel | 0.5天 | M4-005 |
| M4-FE6 | 基础设置页 (CLI 检测/更新 + 语言) | Swing Form | 1天 | M4-006 |
| M4-FE7 | 外观设置页 (主题/对话背景/气泡背景) | Swing Form + JColorChooser | 1.5天 | M4-007 |
| M4-BE1 | ProviderService UI 接入 (读取/写入) | Kotlin | 0.5天 | M4-001~004 |
| M4-BE2 | Token 统计 (UsageService) | Kotlin | 0.5天 | M4-005 |
| M4-BE3 | API Key 安全存储 | IDE PasswordSafe | 0.5天 | M4-003 |
| M4-BE4 | Provider 配置导出/导入 | Kotlin | 0.5天 | M4-004 |
| M4-BE5 | CLI 版本检测 + 自动更新服务 | Kotlin + ProcessBuilder | 1天 | M4-006 |
| M4-BE6 | 主题服务 (多主题 + IDE 跟随) | Kotlin + LaF Listener | 1天 | M4-007 |
| M4-BE7 | 国际化服务 (简中/繁中/英/日) | MyBundle 扩展 | 1天 | M4-006 |

**M4 任务详情**:
```
M4-FE1 Settings Configurable:
├── 实现 Configurable 接口
├── createComponent(): JComponent
│   └── 左右 SplitPane 布局
├── isModified(): Boolean
├── apply() → 保存配置
└── reset() → 重置表单

M4-FE2 供应商列表页:
├── JTable 显示: 名称 | API Key (脱敏) | 状态 | 操作
├── 操作按钮: [编辑] [导出 JSON] [删除]
├── [新增供应商] 按钮 → 打开编辑页
└── 右键菜单: [设为默认] [复制配置] [删除]

M4-FE3 供应商编辑页 (表单 + JSON):
├── 快捷配置按钮: [Claude] [DeepSeek] [Gemini] [GLM] [Kimi] [Qwen]
│   └── 点击后自动填充 URL + 模型预设
├── 表单字段
│   ├── 供应商名称 (必填)
│   ├── API Endpoint URL
│   ├── API Key (PasswordField)
│   └── 默认模型
├── JSON 编辑器 (与表单双向同步)
│   ├── 表单变更 → 更新 JSON
│   └── JSON 变更 → 解析并更新表单
└── 按钮: [取消] [保存]

M4-FE4 供应商下拉选择器:
├── 位置: 对话区 Header
├── JComboBox<ProviderConfig>
├── 切换时调用 ProviderService.switchProvider()
└── 显示当前 Provider 图标 + 名称

M4-BE3 API Key 安全存储:
├── PasswordSafeUtil.saveApiKey(providerId, apiKey)
├── PasswordSafeUtil.getApiKey(providerId): String?
├── 存储位置: IDE PasswordSafe (非 settings.json)
└── settings.json 只存储 providerId 和 endpoint

M4-BE4 Provider 导出/导入:
├── exportProviderConfig(providerId): String
│   └── 返回 JSON 格式配置（不含 API Key）
├── importProviderConfig(configJson): ProviderConfig?
│   └── 解析 JSON 创建 ProviderConfig
└── 用于用户备份/迁移配置

M4-FE6 基础设置页:
├── CLI 版本检测
│   ├── 显示当前 CLI 版本: "Claude Code CLI v1.x.x ✅"
│   ├── [检测更新] 按钮 → 调用 M4-BE5.checkForUpdate()
│   ├── 有更新时显示: "发现新版本 v1.x.x [立即更新]"
│   └── 未安装时显示: "未安装 [前往安装]" (跳转 M1-4)
├── 自动更新开关
│   ├── ☑ 启动时自动检测 CLI 更新
│   └── 有更新时 Notification 提示 (非阻塞)
├── 国际化语言配置
│   ├── JComboBox<Locale>: 简体中文(默认) | 繁体中文 | English | 日本語
│   ├── 切换后提示: "语言将在重启后生效"
│   └── 保存到 AppConfigState.locale
└── 工作目录配置
    └── 默认使用 project.basePath

M4-FE7 外观设置页:
├── 主题切换
│   ├── JComboBox: 跟随 IDE (默认) | 暗色经典 | 暗色护眼 | 浅色经典
│   ├── "跟随 IDE" 模式: 监听 LafManagerListener 自动同步
│   └── 自定义主题: 影响对话区 JCEF CSS 变量
├── 对话背景
│   ├── 选项: 跟随主题 (默认) | 纯色 | 图片
│   ├── 纯色: JColorChooser 选择颜色
│   ├── 图片: [选择图片] → 文件选择器 → 预览
│   └── 存储到 AppConfigState.chatBackground
└── 消息气泡背景
    ├── 用户气泡: JColorChooser (默认 #3B82F6)
    ├── AI 气泡: JColorChooser (默认 #2D2D30)
    └── [恢复默认] 按钮

M4-BE5 CLI 版本检测 + 自动更新:
├── getCliVersion(): String? (已存在于 M0-001)
├── getLatestCliVersion(): String?
│   └── 执行: claude --version 或 npm view @anthropic-ai/claude-code version
├── checkForUpdate(): UpdateResult
│   ├── currentVersion: String
│   ├── latestVersion: String
│   └── hasUpdate: Boolean
├── performUpdate(): Boolean
│   └── 执行: npm update -g @anthropic-ai/claude-code
└── 自动检测: 项目启动时检查 (可配置开关)

M4-BE6 主题服务:
├── ThemeService (APP Service)
├── getActiveTheme(): ThemeConfig
│   ├── name: String (跟随IDE / 暗色经典 / ...)
│   ├── chatBackground: BackgroundConfig (跟随主题 / 纯色 / 图片)
│   ├── userBubbleColor: String (#RRGGBB)
│   └── aiBubbleColor: String (#RRGGBB)
├── applyTheme(themeConfig: ThemeConfig)
│   ├── 更新 JCEF CSS 变量 (browser.executeJavaScript)
│   └── 更新 Swing 组件颜色
├── 监听 IDE 主题变更
│   └── LafManagerListener.onLookAndFeelChanged()
└── 持久化: AppConfigState.themeConfig

M4-BE7 国际化服务 (4 语言):
├── I18nService (APP Service)
├── 支持语言: zh_CN, zh_TW, en, ja
├── getCurrentLocale(): Locale
├── setLocale(locale: Locale)
│   └── 保存到 AppConfigState.locale
├── getMessage(key: String): String
│   └── MyBundle.message(key) 自动选择语言包
└── 资源文件
    ├── MyBundle.properties (en)
    ├── MyBundle_zh_CN.properties (简中, 默认)
    ├── MyBundle_zh_TW.properties (繁中)
    └── MyBundle_ja.properties (日文)
```

**M4 验收标准**:
- [ ] Settings 界面能打开，左右布局正确
- [ ] 基础设置页: CLI 版本显示正确，可检测更新
- [ ] 基础设置页: 语言切换保存正确（重启后生效）
- [ ] 外观设置页: 主题切换即时生效（含 IDE 跟随模式）
- [ ] 外观设置页: 对话背景可设置为纯色或图片
- [ ] 外观设置页: 消息气泡颜色可自定义
- [ ] 能新增/编辑/删除供应商
- [ ] 快捷配置自动填充 URL 和模型
- [ ] JSON 编辑器与表单双向同步
- [ ] 对话区下拉切换供应商生效
- [ ] API Key 使用 PasswordSafe 存储
- [ ] Token 统计面板显示今日/会话统计
- [ ] Provider 配置可导出/导入

---

### M5: 打磨上线 🔲

**目标**: 稳定性，细节打磨，发布准备

**前置依赖**: M2 (JCEF) + M3 (MCP) + M4 (Settings)

| ID | 任务 | 技术 | 预估 | API 接口 |
|----|------|------|------|---------|
| M5-FE1 | @file 引用弹窗 | Swing JWindow + FileIndex | 1天 | M5-001 |
| M5-FE2 | Slash 命令弹窗 | Swing JWindow | 1天 | M5-002 |
| M5-FE3 | 思考片段折叠/展开 | JCEF JS | 0.5天 | - |
| M5-FE4 | 历史会话面板 (搜索 + 收藏) | Swing JList | 1天 | M2-006, M2-007 |
| M5-FE5 | 会话导出功能 | Kotlin | 0.5天 | M2-009 |
| M5-BE1 | 错误处理 + 自动重试 | Kotlin | 1天 | - |
| M5-BE2 | 内存泄漏检查 (JCEF dispose) | - | 0.5天 | - |
| M5-BE3 | 单元测试覆盖率 >70% | JUnit + MockK | 2天 | - |
| M5-BE4 | 国际化 (简中/繁中/英/日) | MyBundle 扩展 | 2天 | - |
| M5-BE5 | 插件发布配置 | Gradle | 0.5天 | - |

**M5 任务详情**:
```
M5-FE1 @file 引用弹窗:
├── 触发: 输入 @ 字符
├── 位置: 输入框上方
├── 文件搜索
│   ├── 使用 ProjectFileIndex 搜索项目内文件
│   ├── 按文件名模糊匹配
│   └── 显示文件路径 + 最近修改时间
├── 键盘导航
│   ├── ↑/↓ 选择文件
│   ├── Enter 确认
│   └── Esc 关闭
├── 选中后
│   └── 输入框显示: @filename (蓝色高亮标签)
└── 支持多文件引用

M5-FE2 Slash 命令弹窗:
├── 触发: 输入 / 字符
├── 命令列表
│   ├── /init       初始化项目
│   ├── /review     代码审查
│   ├── /commit     生成提交信息
│   ├── /clear      清除会话
│   ├── /compact    压缩上下文
│   ├── /cost       显示成本统计
│   └── /mcp        MCP 服务器管理
├── 键盘导航: 同 @file 弹窗
└── 选中后追加到输入框，用户可修改后发送

M5-FE3 思考片段折叠/展开:
├── 默认折叠状态
├── 显示: "💭 思考过程 (已折叠) [▼]"
├── 点击展开 → 显示完整思考内容
├── 再次点击 → 折叠
└── 记住用户偏好（展开/折叠）

M5-FE4 历史会话面板:
├── 位置: 对话区 Header 下方
├── 搜索框: 实时过滤会话
├── 收藏筛选: ⭐ 按钮
├── 会话列表
│   ├── 会话标题
│   ├── 最后活跃时间
│   └── 右键菜单: 收藏/重命名/导出/删除
└── 新建会话按钮: [+] 新建

M5-BE1 错误处理 + 自动重试:
├── 错误分类
│   ├── NETWORK_ERROR: 网络超时
│   ├── API_KEY_INVALID: API Key 无效
│   ├── RATE_LIMIT: 速率限制
│   ├── SESSION_NOT_FOUND: session_id 无效
│   └── UNKNOWN: 未知错误
├── 用户提示
│   ├── NETWORK_ERROR: "网络连接失败，是否重试？"
│   ├── API_KEY_INVALID: "API Key 无效，请检查设置"
│   └── RATE_LIMIT: "请求过于频繁，请在 X 秒后重试"
├── 自动重试
│   ├── NETWORK_ERROR: 3 次指数退避重试
│   └── RATE_LIMIT: 等待后自动重试
└── 日志记录: 错误类型 + 时间 + 上下文

M5-BE2 内存泄漏检查:
├── JCEF Browser 生命周期
│   ├── ToolWindow 打开 → 创建 Browser
│   ├── ToolWindow 关闭 → browser.dispose()
│   └── ChatPanel dispose → messageRenderer.dispose()
├── 验证方法
│   ├── 打开/关闭 ToolWindow 10 次
│   ├── 检查进程数是否稳定
│   └── heap dump 无 Chromium 残留
└── 常见泄漏场景
    ├── JBCefJSQuery 回调未清理
    ├── JS 定时器未清除
    └── CSS/JS 资源未释放

M5-BE4 国际化 (简中/繁中/英/日):
├── 资源文件
│   ├── messages/MyBundle.properties (英文)
│   ├── messages/MyBundle_zh_CN.properties (简体中文, 默认)
│   ├── messages/MyBundle_zh_TW.properties (繁体中文)
│   └── messages/MyBundle_ja.properties (日本語)
├── 动态切换
│   ├── 跟随 IDE 语言设置 (默认)
│   └── 基础设置页手动选择语言
└── 需要国际化的字符串
    ├── UI 标签
    ├── 错误消息
    ├── 提示文案
    └── Slash 命令描述
```

**M5 验收标准**:
- [ ] @file 引用弹窗可搜索文件并插入
- [ ] Slash 命令弹窗可选择并执行命令
- [ ] 思考片段可折叠/展开
- [ ] 历史会话面板支持搜索和收藏
- [ ] 会话可导出为 Markdown/JSON/纯文本
- [ ] 错误提示友好，自动重试工作
- [ ] 连续使用 1 小时无内存泄漏
- [ ] 测试覆盖率 >70%
- [ ] 中英文切换正常
- [ ] 插件可通过 JetBrains Marketplace 发布审核

---

## 三、项目文件结构 (M5 完成时)

```
src/main/kotlin/.../ccassistant/
├── bridge/                    # CLI 桥接层
│   ├── CliMessage.kt         # NDJSON 消息类型 (M0)
│   ├── CliBridgeService.kt  # CLI 进程管理 (APP Service) (M0)
│   ├── NdjsonParser.kt      # NDJSON 解析器 (M0)
│   └── CliMessageCallback.kt # 细粒度回调接口 (M1)
├── model/
│   └── Provider.kt          # 供应商服务 + 预置配置 (M0)
├── config/
│   └── AppConfigState.kt    # 应用配置持久化 (M0)
├── ui/
│   ├── ChatPanel.kt         # 聊天面板 (M1: Swing, M2: JCEF)
│   ├── chat/
│   │   ├── JcefMessageRenderer.kt  # JCEF 渲染器 (M2)
│   │   ├── SessionTabBar.kt        # 会话 Tab 栏 (M2)
│   │   └── SessionHistoryPanel.kt  # 历史会话面板 (M5)
│   ├── dialog/
│   │   ├── CliInstallGuideDialog.kt # CLI 安装引导 (M1)
│   │   ├── DiffReviewDialog.kt      # Diff 审查 (M2)
│   │   └── PermissionDialog.kt      # 权限确认 (M3)
│   └── settings/
│       └── ProviderSettingsPanel.kt # 设置面板 (M4)
├── services/
│   ├── SessionService.kt     # 会话管理 (M2)
│   ├── RewindService.kt     # 回溯服务 (M2)
│   ├── UsageService.kt      # Token 统计 (M4)
│   ├── MCPService.kt        # MCP 管理 (M3)
│   └── ProviderService.kt   # 供应商管理 (M4)
├── editor/
│   └── SelectedTextHandler.kt # 选中文本发送 (M2)
├── toolWindow/
│   └── MyToolWindowFactory.kt
└── startup/
    └── MyProjectActivity.kt

src/main/resources/
├── providers/                 # 6 个预置供应商 JSON (M0)
├── web/                      # JCEF 前端资源 (M2)
│   ├── index.html
│   ├── chat.css
│   ├── chat.js
│   ├── marked.js
│   └── highlight.js
├── icons/
│   └── toolWindow.svg
├── messages/
│   ├── MyBundle.properties      # 英文 (M0)
│   └── MyBundle_zh_CN.properties # 中文 (M5)
└── META-INF/
    └── plugin.xml

src/test/kotlin/.../ccassistant/
├── bridge/
│   ├── NdjsonParserTest.kt      # 16 个测试 (M0)
│   └── CliBridgeServiceTest.kt   # CLI 服务测试 (M0)
├── model/
│   └── ProviderServiceTest.kt    # Provider 测试 (M0)
├── services/
│   └── SessionServiceTest.kt     # 会话服务测试 (M2)
└── MyPluginTest.kt
```

---

## 四、风险与注意事项

### JCEF 相关 (M2)
| 风险 | 等级 | 解决方案 | 验证方法 |
|------|------|---------|---------|
| 版本兼容 | 高 | IDEA 2022.3+ 内置，低于此版本显示降级提示 | `JBCefApp.isSupported()` |
| 内存泄漏 | 高 | `ToolWindowFactory.dispose()` 中调用 `browser.dispose()` | 打开/关闭 10 次，检查进程数 |
| 线程安全 | 中 | JCEF 回调不在 EDT，`ApplicationManager.invokeLater {}` | 人工测试多线程场景 |
| 冷启动慢 | 中 | 骨架屏 + 预加载 | 首次加载计时 < 1.5s |
| JS 回调泄漏 | 中 | `JBCefJSQuery` 实例需手动释放 | 检查 heap dump |

### 会话管理 (M2)
| 风险 | 等级 | 解决方案 | 验证方法 |
|------|------|---------|---------|
| 会话目录不存在 | 中 | 首次启动自动创建 `~/.claude/sessions/` | 新安装测试 |
| session_id 丢失 | 高 | `ChatSession.sessionId` 持久化到 JSON | 重启 IDE 后验证 --resume |
| Rewind 实现复杂度 | 中 | 基于现有消息复制，不修改 CLI 行为 | 功能测试 |
| 多会话并发 | 低 | 单例 SessionService，线程安全 | 并发测试 |

### Diff 审查 (M2)
| 风险 | 等级 | 解决方案 | 验证方法 |
|------|------|---------|---------|
| 文件被外部修改 | 中 | 保存前检查文件 hash | - |
| 大文件 Diff 性能 | 低 | 限制 Diff 文件大小 (>1MB 提示) | 性能测试 |

### MCP 支持 (M3)
| 风险 | 等级 | 解决方案 | 验证方法 |
|------|------|---------|---------|
| Plan 模式状态同步 | 高 | CLI 暂停时等待用户响应，超时提示 | 中断测试 |
| 权限确认弹窗阻塞 | 中 | 使用非阻塞 Swing Dialog | 长时间等待测试 |
| MCP 服务器配置格式 | 低 | JSON Schema 验证 | 异常输入测试 |

### 设置界面 (M4)
| 风险 | 等级 | 解决方案 | 验证方法 |
|------|------|---------|---------|
| JSON 双向同步冲突 | 中 | 表单优先，JSON 只读模式可选 | 并发编辑测试 |
| API Key 明文存储 | 高 | 必须使用 PasswordSafe | 安全审计 |
| Provider 切换状态丢失 | 中 | 切换前检查是否有活跃会话 | 人工测试 |

### CLI 通信
| 风险 | 等级 | 解决方案 | 验证方法 |
|------|------|---------|---------|
| 进程僵死 | 中 | 超时中断 + 自动重启 | 网络中断测试 |
| NDJSON 解析失败 | 中 | 容错处理，跳过畸形行 | CLI 异常输出测试 |
| 并发 prompt | 高 | `isProcessing` 锁，禁止同时多个请求 | 并发测试 |

---

*文档版本: v5.2*
*最后更新: 2026-04-16*
*同步关联: API_Design.md v5.2, CC_Assistant_Technical_Architecture.md v5.2*
