# CC Assistant 开发规划文档

> **版本**: v1.0
> **日期**: 2026-04-14
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

**选型原则**: 默认 Swing，仅在 Swing 无法满足需求时引入 JCEF。当前仅消息渲染区需要 JCEF。

---

## 二、里程碑规划

### 总览

| 里程碑 | 周期 | 核心交付物 | 状态 |
|--------|------|------------|------|
| **M0** | Day 1 | CLI 链路验证 | ✅ 完成 |
| **M1** | Week 1 | 极简对话 (Swing) | ✅ 完成 |
| **M2** | Week 2-3 | 多会话 + JCEF 切换 | 🔲 待开始 |
| **M3** | Week 4 | MCP 支持 | 🔲 待开始 |
| **M4** | Week 5-6 | 设置 + 供应商 UI | 🔲 待开始 |
| **M5** | Week 7-8 | 打磨上线 | 🔲 待开始 |

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

**M1 局限性** (M2 解决):
- 消息渲染用 JTextPane HTML，无完整 Markdown 支持
- 无代码块语法高亮
- 无 Diff 展示
- 单会话，无持久化

---

### M2: 多会话 + JCEF 切换 🔲

**目标**:
1. 会话持久化，能新建/切换/删除
2. 消息渲染区从 Swing 切换到 JCEF

#### M2 任务拆解

**M2-A: JCEF 消息渲染区 (优先)**

| ID | 任务 | 技术 | 预估 |
|----|------|------|------|
| M2-A1 | 创建 JCEF Browser 管理器 | JCEF + JBPanel | 1天 |
| M2-A2 | 实现前端消息渲染页面 (HTML/CSS/JS) | marked.js + highlight.js | 2天 |
| M2-A3 | 实现 Java → JS 通信 (JBCefJSQuery) | JBCefJSQuery | 1天 |
| M2-A4 | 实现 JS → Java 通信 (复制/操作回调) | JBCefJSQuery | 0.5天 |
| M2-A5 | 流式输出适配 (增量 DOM 追加) | JS insertAdjacentHTML | 0.5天 |
| M2-A6 | 代码块 Diff 渲染 | diff2html | 1天 |
| M2-A7 | ChatPanel 集成 JCEF (替换 JTextPane) | Swing + JCEF | 1天 |

**M2-B: 多会话管理**

| ID | 任务 | 技术 | 预估 |
|----|------|------|------|
| M2-B1 | SessionService (会话 CRUD) | Kotlin + JSON | 1天 |
| M2-B2 | 会话持久化 (~/.claude/sessions/) | JSON 文件存储 | 0.5天 |
| M2-B3 | 会话 Tab 栏 UI | Swing JTabbedPane | 1天 |
| M2-B4 | 新建/切换/删除会话交互 | Swing | 0.5天 |
| M2-B5 | 会话标题自动生成 (取首条 prompt) | Kotlin | 0.5天 |
| M2-B6 | 重启 IDE 后会话恢复 | PersistentStateComponent | 0.5天 |

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
- ✅ Markdown 完整渲染 (标题/列表/代码块/表格/链接)
- ✅ 代码块语法高亮
- ✅ 流式输出打字机效果
- ✅ 消息复制按钮工作
- ✅ 新建/切换/删除会话
- ✅ 重启 IDE 后会话恢复

---

### M3: MCP 支持 🔲

**目标**: MCP 工具调用显示，权限确认

| ID | 任务 | 技术 |
|----|------|------|
| M3-FE1 | 工具调用状态卡片 (JCEF 组件) | HTML/CSS |
| M3-FE2 | 权限确认 UI (approve/reject) | Swing Popup |
| M3-BE1 | MCP 工具列表解析 | CliMessage 扩展 |
| M3-BE2 | 工具结果展示 | JCEF |

**验收标准**:
- ✅ 工具调用 (Read/Edit/Bash) 在 UI 显示状态
- ✅ 权限确认弹窗工作
- ✅ 工具结果可展开查看

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

| ID | 任务 | 技术 |
|----|------|------|
| M4-FE1 | Settings Configurable (左右布局) | Swing JDialog |
| M4-FE2 | 供应商列表页 (表格 + 操作按钮) | Swing JTable |
| M4-FE3 | 供应商编辑页 (表单 + JSON 双向编辑) | Swing Form |
| M4-FE4 | 对话区工具栏集成供应商下拉 | Swing JComboBox |
| M4-BE1 | ProviderService UI 接入 (读取/写入) | Kotlin |
| M4-BE2 | Token 统计 (UsageService) | Kotlin |
| M4-BE3 | API Key 安全存储 | IDE PasswordSafe |

**验收标准**:
- ✅ Settings 界面能打开，左右布局正确
- ✅ 能新增/编辑/删除供应商
- ✅ 快捷配置自动填充 URL 和模型
- ✅ JSON 编辑器与表单双向同步
- ✅ 对话区下拉切换供应商生效
- ✅ API Key 不明文存储

---

### M5: 打磨上线 🔲

**目标**: 稳定性，细节打磨，发布准备

| ID | 任务 |
|----|------|
| M5-FE1 | @file 引用弹窗 |
| M5-FE2 | Slash 命令弹窗 (/clear, /commit, /review) |
| M5-FE3 | 思考片段折叠/展开 |
| M5-FE4 | 历史会话面板 (搜索 + 收藏) |
| M5-BE1 | 错误处理 + 自动重试 |
| M5-BE2 | 内存泄漏检查 (JCEF dispose) |
| M5-BE3 | 单元测试覆盖率 >70% |

**验收标准**:
- ✅ 连续使用 1 小时无崩溃
- ✅ 测试覆盖率 >70%
- ✅ 插件可发布到 JetBrains Marketplace

---

## 三、当前项目文件结构

```
src/main/kotlin/.../ccassistant/
├── bridge/                    # CLI 桥接层
│   ├── CliMessage.kt         # NDJSON 消息类型
│   ├── CliBridgeService.kt   # CLI 进程管理 (APP Service)
│   ├── NdjsonParser.kt       # NDJSON 解析器 (Gson)
│   └── CliMessageCallback.kt # 回调接口 (在 CliBridgeService.kt 中)
├── model/
│   └── Provider.kt           # 供应商服务 + 预置配置
├── config/
│   └── AppConfigState.kt     # 应用配置持久化
├── ui/
│   └── ChatPanel.kt          # 聊天面板 (M1: 纯 Swing, M2: JCEF)
├── toolWindow/
│   └── MyToolWindowFactory.kt
├── services/
│   └── MyProjectService.kt   # ← 待清理
├── startup/
│   └── MyProjectActivity.kt
└── MyBundle.kt

src/main/resources/
├── providers/                 # 6 个预置供应商 JSON
├── icons/
│   └── toolWindow.svg
├── messages/
│   └── MyBundle.properties
└── META-INF/
    └── plugin.xml

src/test/kotlin/.../ccassistant/
├── bridge/
│   ├── NdjsonParserTest.kt   # 16 个测试
│   └── CliBridgeServiceTest.kt
├── model/
│   └── ProviderServiceTest.kt
└── MyPluginTest.kt
```

---

## 四、风险与注意事项

### JCEF 相关 (M2)
- **版本兼容**: JCEF 在 IDEA 2022.3+ 内置，低于此版本需降级提示
- **内存管理**: 必须在 ToolWindow 关闭时调用 `browser.dispose()`，否则内存泄漏
- **线程安全**: JCEF 回调不在 EDT，UI 更新需 `invokeLater`
- **冷启动**: 首次加载 JCEF 需 ~1-2s，需优化 (预加载/骨架屏)

### 设置界面 (M4)
- **JSON 双向编辑**: 表单 ↔ JSON 同步需要精确的 merge 策略
- **API Key 安全**: 必须使用 IDE 的 `PasswordSafe` 存储，禁止明文
- **供应商列表**: 预置 + 自定义混合管理

### CLI 通信
- **进程管理**: 长时间运行需监控进程健康，自动重启
- **NDJSON 解析**: 不同 CLI 版本输出格式可能不同，需兼容
- **并发控制**: 一次只允许一个 prompt 执行中

---

*文档生成时间: 2026-04-14*
