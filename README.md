# CC Assistant

![Build](https://github.com/xingzhe-wa/cc-assistant/workflows/Build/badge.svg)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

<!-- Plugin description -->
CC Assistant 是一款 IntelliJ IDEA 插件，为 Claude Code CLI 提供原生 IDE 集成。通过内嵌聊天界面，让开发者无需离开 IDE 即可与 Claude AI 进行交互，获得智能编程辅助。

**特性:**
- Claude Code CLI 直连 - 不自行封装 SDK
- 多会话管理 - 支持多个并发对话
- Markdown 渲染 - 代码高亮、Diff 可视化
- 流式输出 - 实时显示 AI 响应
- 多 Provider 支持 - Claude、DeepSeek、Gemini、GLM、Kimi、Qwen
<!-- Plugin description end -->

> Claude Code CLI 的 JetBrains IDE UI 壳子，提供内嵌对话界面

CC Assistant 是一款 IntelliJ IDEA 插件，为 Claude Code CLI 提供原生 IDE 集成。通过内嵌聊天界面，让开发者无需离开 IDE 即可与 Claude AI 进行交互，获得智能编程辅助。

---

## 特性

- **🤖 Claude Code CLI 直连** - 不自行封装 SDK，直接调用 Claude Code CLI，开箱即用
- **💬 多会话管理** - 支持多个并发对话，快速切换上下文
- **📝 Markdown 渲染** - 完整支持 Markdown 语法、代码高亮、Diff 可视化
- **🔄 流式输出** - 实时显示 AI 响应，打字机效果
- **🔌 MCP 支持** - Model Context Protocol 服务器集成
- **🎨 现代化 UI** - JCEF + React/Vue/Svelte，美观流畅的交互体验
- **⚙️ 多 Provider 支持** - 内置 6 个预置供应商（Claude、DeepSeek、Gemini、GLM、Kimi、Qwen）

---

## 技术栈

### 后端 (Kotlin)
- **语言**: Kotlin 21
- **框架**: IntelliJ Platform SDK
- **最低 IDE 版本**: 2024.1+ (sinceBuild = 252)
- **构建工具**: Gradle (Kotlin DSL)
- **UI 混合架构**: Swing (设置/弹窗) + JCEF (聊天界面)

### 前端 (JCEF + 现代框架)
- **框架**: React 18+ / Vue 3 / Svelte (三选一)
- **构建工具**: Vite 5+
- **样式**: Tailwind CSS + shadcn/ui
- **状态管理**: Zustand / Redux Toolkit / Pinia
- **Markdown**: marked.js + highlight.js + diff2html

---

## 快速开始

### 前置要求

1. **安装 Claude Code CLI**
   ```bash
   npm install -g @anthropic-ai/claude-code
   ```

2. **配置 Claude Code**
   ```bash
   claude auth login
   ```

3. **IDE 要求**: IntelliJ IDEA 2024.1+ 或其他 JetBrains IDE

### 安装插件

#### 方式一：从源码构建

```bash
# 克隆仓库
git clone https://github.com/xingzhe-wa/cc-assistant.git
cd cc-assistant

# 构建插件
./gradlew buildPlugin

# 构建产物位于: build/distributions/cc-assistant-<version>.zip
```

然后在 IDE 中安装：
- `Settings/Preferences` > `Plugins` > `⚙️` > `Install plugin from disk...`

#### 方式二：开发模式运行

```bash
# 在开发 IDE 中运行插件
./gradlew runIde
```

---

## 开发指南

### 构建命令

```bash
# 编译项目
./gradlew compileKotlin

# 完整构建
./gradlew build

# 清理构建产物
./gradlew clean

# 构建插件（用于发布）
./gradlew buildPlugin

# 验证插件
./gradlew verifyPlugin
```

### 测试

```bash
# 运行所有测试
./gradlew test

# 运行特定测试类
./gradlew test --tests NdjsonParserTest

# 查看测试报告
# 报告位置: build/reports/tests/test/index.html

# 代码覆盖率
./gradlew koverXmlReport
```

### 前端开发（M2 起）

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 启动开发服务器 (HMR)
npm run dev
# 访问 http://localhost:5173 查看效果

# 构建生产版本
npm run build
# 输出到 frontend/dist/

# 同步到插件资源目录 (Gradle 自动执行)
./gradlew copyFrontendResources
```

### 代码检查

```bash
# Qodana 代码质量检查
./gradlew qodana
```

---

## 项目结构

```
src/main/kotlin/com/github/xingzhewa/ccassistant/
├── toolWindow/          # ToolWindow 相关
├── services/            # 服务层
├── bridge/              # 桥接层（CLI 进程管理）
├── ui/                  # UI 组件
│   ├── chat/            # 聊天界面 (JCEF + 前端框架)
│   ├── settings/        # 设置界面 (Swing)
│   └── dialogs/         # 对话框 (Swing)
├── model/               # 数据模型
└── util/                # 工具类

src/main/resources/
├── providers/           # Provider 配置模板
└── web/                 # 前端构建输出 (JCEF 加载)
```

---

## 架构设计

### CLI 直连模式

```
Java/Kotlin 层 (CliBridgeService)
    │  ProcessBuilder: claude -p "prompt" --output-format stream-json
    │  多轮对话: claude -p "prompt" --resume <session_id>
    ▼
Claude Code CLI (自带 SDK)
    │  流式输出 stream-json 格式
    ▼
CliMessage (TextDelta/Thinking/ToolUse/Result/Error)
    │  通过 CliMessageCallback 分发
    ▼
UI 层 (JCEF Browser + React/Vue/Svelte)
```

### UI 混合架构

```
┌─ ToolWindow (Swing 容器) ──────────────────────────┐
│ 标题栏 + 会话 Tab (Swing)                           │
├────────────────────────────────────────────────────┤
│ 聊天界面 (JCEF Browser + React/Vue/Svelte)          │
│ ├── Java → JS: executeJavaScript()                 │
│ ├── JS → Java: JBCefJSQuery                        │
│ └── Tailwind CSS + shadcn/ui                       │
├────────────────────────────────────────────────────┤
│ 输入框 + 工具栏 (Swing)                             │
└────────────────────────────────────────────────────┘
```

**关键决策**:
- **聊天界面**: 强制使用 JCEF + 现代前端框架（Markdown/Diff/流式渲染需要前端能力）
- **其余所有区域**: 使用 Swing 原生组件（轻量、与 IDE 深度集成）
- **降级条件**: 仅在 `JBCefApp.isSupported() = false` 时降级为纯文本

---

## 文档

- **[技术架构文档](docs/CC_Assistant_Technical_Architecture.md)** - 完整的技术架构设计 (v5.2)
- **[开发规划](docs/plan/README.md)** - 里程碑规划与任务拆解
- **[前端开发计划](docs/plan/frontend-first-plan.md)** - 前端优先开发策略
- **[CLAUDE.md](CLAUDE.md)** - 项目全局约束与开发指南

---

## 当前状态

### MVP 开发阶段

项目当前处于 **M1: 极简对话 (已完成)** 阶段，下一步为 **M2: 多会话 + JCEF 切换**。

| 里程碑 | 状态 | 说明 |
|--------|------|------|
| M0 | ✅ 完成 | CLI 链路验证 |
| M1 | ✅ 完成 | 极简对话 (Swing) |
| M2 | 🔲 待开始 | 多会话 + JCEF 切换 |
| M3 | 🔲 待开始 | MCP 支持 |
| M4 | 🔲 待开始 | 设置 + 供应商 UI |
| M5 | 🔲 待开始 | 打磨上线 |

### 已实现模块

| 模块 | 状态 | 说明 |
|------|------|------|
| CliBridgeService | ✅ 完成 | CLI 进程管理 (APP Service) |
| NdjsonParser | ✅ 完成 | NDJSON 解析器 (Gson) |
| CliMessage | ✅ 完成 | 消息类型定义 |
| ProviderService | ✅ 完成 | Provider 管理 + 资源模板加载 |
| ChatPanel (Swing) | ✅ M1完成 | 聊天面板 (M2 切换 JCEF) |
| ConfigService | ✅ 完成 | 应用配置持久化 |

---

## 预置 Provider

插件内置 6 个预置供应商配置：

| Provider ID | Base URL | 典型模型 |
|------------|----------|----------|
| `claude` | `https://api.anthropic.com` | claude-opus-4, claude-sonnet-4 |
| `deepseek` | `https://api.deepseek.com/anthropic` | deepseek-reasoner |
| `gemini` | `https://generativelanguage.googleapis.com/v1beta/openai` | gemini-2.5-pro |
| `glm` | `https://open.bigmodel.cn/api/anthropic` | GLM-4.7, glm-4.5-air |
| `kimi` | `https://api.moonshot.cn/anthropic` | kimi-k2-turbo-preview |
| `qwen` | `https://dashscope.aliyuncs.com/api/v2/apps/claude-code-proxy` | qwen3-coder-plus |

---

## 风险与注意事项

### JCEF 兼容性
- **支持**: IDEA 2022.3+ (JCEF 内置)
- **降级**: 检测 `JBCefApp.isSupported()`，不支持时降级为 Swing 纯文本

### 线程安全
- UI 操作必须在 EDT (Event Dispatch Thread)
- 后台任务使用 `ProgressManager` 或 `ApplicationManager.executeOnPooledThread`

### JCEF 内存管理
- ToolWindow 关闭时必须调用 `browser.dispose()` 释放资源
- 前端资源通过 Vite 构建后放入 `resources/web/` 目录

---

## 贡献指南

欢迎贡献！请遵循以下流程：

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 提交规范

```
<type>(<scope>): <subject>

types: feat, fix, docs, refactor, test, chore
scope: optional, indicates the affected module
```

---

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 鸣谢

- [IntelliJ Platform Plugin Template](https://github.com/JetBrains/intellij-platform-plugin-template)
- [Claude Code CLI](https://docs.anthropic.com/claude-code)
- [JetBrains Platform Dev Documentation](https://plugins.jetbrains.com/docs/intellij/welcome.html)

---

## 联系方式

- **Issues**: [GitHub Issues](https://github.com/xingzhe-wa/cc-assistant/issues)
- **Discussions**: [GitHub Discussions](https://github.com/xingzhe-wa/cc-assistant/discussions)

---

*最后更新: 2026-04-16*
