# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

# CC Assistant 项目全局约束

> 本文件是 CC Assistant 项目的最高层约束定义，所有 AI 编码任务都必须遵守。
>
> **详细设计文档**: `docs/CC_Assistant_Technical_Architecture.md`
> **开发规范**: `docs/dev/` 目录

---

## 项目概述

- **项目名称**: CC Assistant
- **类型**: IntelliJ Platform 插件
- **语言**: Kotlin 21
- **构建工具**: Gradle (Kotlin DSL)
- **最低 IDE 版本**: 2024.1+ (sinceBuild = 252)
- **目标**: Claude Code CLI 的 JetBrains IDE UI 壳子，提供内嵌对话界面
- **架构原则**: Claude Code CLI 直连模式，不自行封装 SDK

---

## 开发命令

### 构建相关
```bash
# 编译项目
./gradlew compileKotlin

# 清理构建产物
./gradlew clean

# 完整构建
./gradlew build

# 构建插件（用于发布）
./gradlew buildPlugin
```

### 测试相关
```bash
# 运行所有测试
./gradlew test

# 运行特定测试类
./gradlew test --tests ProviderServiceTest

# 查看测试报告
# 报告位置: build/reports/tests/test/index.html

# 代码覆盖率
./gradlew koverXmlReport
```

### 运行与调试
```bash
# 在开发 IDE 中运行插件
# 使用 IntelliJ IDEA 的 "Run Plugin" 配置

# 运行 UI 测试
./gradlew runIdeForUiTests

# 验证插件
./gradlew verifyPlugin

# 检查插件兼容性
./gradlew patchPluginXml
```

### 代码检查
```bash
# Qodana 代码质量检查
./gradlew qodana
```

---

## 当前项目状态

### MVP 开发阶段

项目当前处于 **M1: 极简对话 (已完成)** 阶段，下一步为 **M2: 多会话 + JCEF 切换**。详细里程碑见 `docs/CC_Assistant_Technical_Architecture.md` 第 11 节。

**已确认架构决策**:
- 多轮对话: `--resume <session_id>` (CLI 原生支持，已验证)
- 权限模式: 默认 `--permission-mode accept-all`，Plan 模式保留审批弹窗

**MVP 优先级** (按顺序实现):
1. **多会话管理** - 新建/切换/删除会话，`--resume` 续接
2. **JCEF 消息渲染** - Markdown/Diff/流式渲染
3. **MCP 支持** - 工具调用显示，权限模式管理

### 已实现模块

| 模块 | 文件路径 | 状态 | 说明 |
|-----|---------|-----|------|
| CliBridgeService | `bridge/CliBridgeService.kt` | ✅ 完成 | CLI 进程管理 (APP Service) |
| NdjsonParser | `bridge/NdjsonParser.kt` | ✅ 完成 | NDJSON 解析器 (Gson) |
| CliMessage | `bridge/CliMessage.kt` | ✅ 完成 | 消息类型定义 |
| ProviderService | `model/Provider.kt` | ✅ 完成 | Provider 管理 + 资源模板加载 |
| ChatPanel | `ui/ChatPanel.kt` | ✅ M1完成 | Swing 聊天面板 (M2 切换 JCEF) |
| ToolWindow | `toolWindow/MyToolWindowFactory.kt` | ✅ 完成 | 接入 ChatPanel |
| ConfigService | `config/AppConfigState.kt` | ✅ 完成 | 应用配置持久化 |
| Provider 模板 | `resources/providers/*.json` | ✅ 完成 | 6 个预置供应商 JSON |

### 待清理样板代码
- `MyProjectService.kt` - 样板服务，可删除或改造
- `MyBundle.kt` - 国际化基础类，保留但需扩展

### 测试覆盖
- `NdjsonParserTest.kt` - NDJSON 解析测试（16 个测试用例）
- `CliBridgeServiceTest.kt` - CLI 服务测试
- `ProviderServiceTest.kt` - Provider 服务测试（6 个测试用例）

---

## 硬约束 (HARD CONSTRAINTS)

> 违反以下任何约束将导致任务立即停止，必须修复后才能继续。

### HC-001: 编译必须成功
```bash
./gradlew compileKotlin
```
- 任何编译错误都必须修复
- 禁止使用 `@Suppress("UNCHECKED_CAST")` 隐藏类型错误

### HC-002: 测试必须通过
```bash
./gradlew test
```
- 所有单元测试必须通过
- 新功能必须有对应的测试
- 测试覆盖率不低于 70%

### HC-003: plugin.xml 必须有效
```xml
<!-- 所有扩展点必须正确注册 -->
<extensions defaultExtensionNs="com.intellij">
    <toolWindow id="CC Assistant" ... />
</extensions>
```

### HC-004: 禁止硬编码敏感信息
```kotlin
// ❌ 禁止
const val API_KEY = "sk-ant-xxxx"

// ✅ 正确
val apiKey = System.getenv("ANTHROPIC_API_KEY")
```

### HC-005: 线程安全
- 所有 Service 必须线程安全
- UI 操作必须在 EDT (Event Dispatch Thread)
- 后台任务使用 `ProgressManager` 或 `ApplicationManager.executeOnPooledThread`

### HC-006: 资源管理
```kotlin
// ✅ 正确：使用 use 自动关闭
FileInputStream(file).use { stream ->
    // ...
}

// ❌ 禁止：手动关闭可能遗漏
val stream = FileInputStream(file)
stream.close() // 可能不执行
```

### HC-007: 空安全
```kotlin
// ✅ 正确
val length = user?.name?.length ?: 0

// ❌ 禁止：使用 !! 可能崩溃
val length = user!!.name!!.length!!
```

### HC-008: CLI-First 原则
- **禁止**自行封装 Agent SDK 或实现 SDK 级别的功能
- Claude Code CLI 是唯一的 AI 能力来源
- 如果 CLI 不支持的功能，插件也不支持
- 需要新功能 → 先看 CLI 是否支持 → 不支持则提 Issue

### HC-009: UI 技术栈约束
- **默认 Swing**: 所有 UI 区域默认使用 Swing 原生组件
- **JCEF 仅限对话区**: 消息渲染区（M2 起）使用 JCEF，用于 Markdown/Diff/流式渲染
- **其余区域禁止 JCEF**: 设置界面、会话管理、输入框、工具栏、历史面板等必须使用 Swing
- **JCEF 禁止全屏**: JCEF 仅嵌入消息渲染区，不作为整个 ToolWindow 的渲染引擎
- **JCEF 生命周期**: 必须在 ToolWindow 关闭时调用 `browser.dispose()` 释放 Chromium 资源
- **JCEF 降级方案**: 检测 `JBCefApp.isSupported()`，不支持时降级为 Swing 纯文本

### HC-010: MVP 范围控制
- 新功能必须按 MVP 优先级顺序实现
- 未经评审不能添加 MVP 范围外的功能
- 扩展功能 (V2) 必须在 MVP 稳定后再规划

### HC-011: 会话续接约束 (`--resume`)
- 多轮对话**必须**通过 CLI 的 `--resume <session_id>` 实现，禁止自行维护对话历史
- CLI result 消息中的 `session_id` 是续接的唯一标识，插件必须持久化
- `executePrompt()` 必须支持 `sessionId` 参数，传入时自动附加 `--resume`
- 新会话不传 `--resume`，CLI 返回新的 `session_id`

```kotlin
// ✅ 正确
fun executePrompt(
    prompt: String,
    workingDir: String? = null,
    sessionId: String? = null,  // 传入 session_id → --resume
    model: String? = null       // 传入 model → --model
): Boolean

// ❌ 禁止：自行拼接 prompt 拼接对话历史
val fullPrompt = previousMessages + "\n" + newMessage
```

### HC-012: 权限模式约束
- **默认模式 (agent/auto)**: 使用 `--permission-mode accept-all`，AI 自由执行，不打断用户
- **Plan 模式**: 不传 `--permission-mode`，CLI 在需要确认时暂停，插件弹出 Swing 审批弹窗
- 禁止在非 Plan 模式下添加审批弹窗（会打断用户心流）
- Plan 模式审批弹窗必须使用 Swing 原生 Dialog，禁止使用 JCEF

---

## 软约束 (SOFT CONSTRAINTS)

> 违反以下约束将产生警告，但不会阻止任务继续。

### SC-001: 函数长度限制
- 单个函数不超过 **50 行**
- 超过必须拆分

### SC-002: 公共 API 必须有 KDoc
```kotlin
/**
 * 处理用户认证请求
 *
 * @param username 用户名
 * @param password 密码
 * @return 认证结果
 * @throws AuthException 当认证失败时抛出
 */
fun authenticate(username: String, password: String): AuthResult
```

### SC-003: 模块单向依赖
```
ui ─────► service ─────► bridge ─────► infrastructure
  (单向，禁止逆流)
```

### SC-004: 错误处理
```kotlin
// ✅ 正确
try {
    // ...
} catch (e: SpecificException) {
    log.error("具体错误信息", e)
    throw e // 不要吞噬异常
}

// ❌ 禁止
try {
    // ...
} catch (e: Exception) {
    // 空的 catch 块
}
```

---

## Vibe Coding 工作流

> 本项目采用 **Vibe Coding** (直觉式编程) 模式，以下是工作流指引。

### 每次开发的启动流程

```
1. 确认当前里程碑优先级
   → 查看 CLAUDE.md "MVP 开发阶段" 或 docs/CC_Assistant_Technical_Architecture.md 第 11 节

2. 明确本周目标
   → 例如："这周要完成 M1 - 极简对话"

3. 从任务清单选一个任务
   → 优先选没有依赖的并行任务
```

### 开发节奏

```
┌─────────────────────────────────────────────────────────────┐
│  单次开发循环 (2-4 小时)                                    │
├─────────────────────────────────────────────────────────────┤
│  1. 选一个具体任务                                          │
│     "实现流式文本渲染到 JTextPane"                          │
│                                                             │
│  2. 先写一个能跑的最小 demo                                 │
│     - 不追求完美，先让功能工作                               │
│     - 用 println 调试                                       │
│                                                             │
│  3. 验证功能工作                                           │
│     - 编译通过                                              │
│     - 功能正常                                              │
│                                                             │
│  4. 清理代码                                               │
│     - 移除调试代码                                          │
│     - 添加必要注释                                          │
│     - 重构明显的坏味道                                       │
│                                                             │
│  5. 提交                                                   │
│     - commit message: "feat(chat): add streaming text render"│
└─────────────────────────────────────────────────────────────┘
```

### 避免的陷阱

```
❌ 不要一开始就设计完整架构
   → 先让 CLI 调用链路通

❌ 不要同时做多个功能
   → 一次只做一个功能

❌ 不要在 demo 阶段追求完美
   → "能用就行"是 demo 的最高评价

❌ 不要引入复杂的抽象
   → unless 你真的需要三个地方用它

❌ 不要过早优化
   → profile 过了再优化

✅ 每次只改一个文件
   → 降低回归风险

✅ 频繁运行测试
   → 每次小改后都运行

✅ 保持 CLI 独立可用
   → 你的插件只是 CLI 的 UI 壳子
```

### 功能验证检查清单

每完成一个功能后，自问：

```
□ 编译通过了吗？      ./gradlew compileKotlin
□ 测试通过了吗？      ./gradlew test
□ 功能能工作了吗？    手动测试
□ 日志干净吗？        没有 ERROR/WARN
□ 内存泄漏了吗？      长时间运行检查
□ 有没有引入新依赖？  确认必要
```

---

## 核心架构模式

### CLI 直连模式

> **核心决策**: 本插件不自行封装 Agent SDK，而是直接调用 Claude Code CLI。
> CLI 是 SDK 的封装，提供完整的 AI 能力，开箱即用。

**正确路径**:
```
Java/Kotlin 层 (CliBridgeService)
    │  ProcessBuilder: claude -p "prompt" --output-format stream-json
    │  多轮对话: claude -p "prompt" --resume <session_id> --output-format stream-json
    │  权限控制: --permission-mode accept-all (默认) 或不传 (Plan 模式)
    │  stdout: 读取 NDJSON 响应 (NdjsonParser 解析)
    ▼
Claude Code CLI (自带 SDK)
    │  流式输出 stream-json 格式
    │  result 消息包含 session_id → 持久化用于 --resume
    ▼
CliMessage (TextDelta/Thinking/ToolUse/Result/Error)
    │  通过 CliMessageCallback 分发
    ▼
UI 层 (ChatPanel → JCEF Browser 或 Swing JTextPane)
```

**错误路径**:
```
Java/Kotlin → 自定义的 daemon.js → Agent SDK → Claude API
              ❌ 不要自己封装 SDK
```

### JCEF 混合架构 (M2 起)

> **已确认决策**: 对话消息渲染区使用 JCEF，其余所有 UI 保持 Swing。

**架构分层**:
```
┌─ ToolWindow (Swing 容器) ──────────────────────────┐
│ 标题栏 + 会话 Tab (Swing)                           │
├────────────────────────────────────────────────────┤
│ 消息渲染区 (JCEF Browser)          ← M2 引入       │
│ ├── Java → JS: executeJavaScript()                 │
│ ├── JS → Java: JBCefJSQuery                        │
│ ├── marked.js + highlight.js + diff2html           │
│ └── insertAdjacentHTML 流式追加                     │
├────────────────────────────────────────────────────┤
│ 输入框 + 工具栏 (Swing)                             │
└────────────────────────────────────────────────────┘
```

**JCEF 开发约束**:
- JCEF 实例必须在 `dispose()` 中调用 `browser.dispose()` 释放资源
- JS 回调不在 EDT 线程，UI 更新必须 `ApplicationManager.invokeLater()`
- 检测 `JBCefApp.isSupported()`，不支持时降级 Swing JTextPane
- 前端资源 (HTML/CSS/JS) 放在 `resources/web/` 目录

### 服务层模式

项目使用 IntelliJ Platform 的 `@Service` 注解进行服务注册：

**Application-level 服务** (单例，跨项目):
```kotlin
@Service(Service.Level.APP)
class AppConfigService : PersistentStateComponent<AppConfigState> {
    // 应用级配置，整个 IDE 共享
}
```

**Project-level 服务** (每个项目实例):
```kotlin
@Service(Service.Level.PROJECT)
class ProviderService {
    // 项目级服务，每个项目独立实例
}
```

### 配置持久化模式

使用 `PersistentStateComponent` 实现配置持久化：
```kotlin
data class AppConfigState(
    var cliPath: String = "",
    var autoSaveSession: Boolean = true
)

@Service
class ConfigService : PersistentStateComponent<AppConfigState> {
    private var state = AppConfigState()

    override fun getState(): AppConfigState = state
    override fun loadState(state: AppConfigState) {
        this.state = state
    }
}
```

### 消息总线模式

Daemon 通信使用回调模式：
```kotlin
interface MessageCallback {
    fun onChunk(content: String) {}
    fun onThinking(content: String) {}
    fun onToolUse(toolName: String, toolInput: String) {}
    fun onComplete(content: String, usage: Map<String, Any>) {}
    fun onError(message: String) {}
}

class DaemonBridgeService {
    private val messageCallbacks = ConcurrentLinkedQueue<MessageCallback>()

    fun registerCallback(callback: MessageCallback) {
        messageCallbacks.add(callback)
    }
}
```

---

## 项目特定约定

### Provider 管理

> **架构决策**: 通过覆盖 `~/.claude/settings.json` 实现 Provider 切换。
> Claude Code CLI 读取该文件，根据 `env` 配置路由到不同 Provider。

**预置 Provider**:

| Provider ID | Base URL | 典型模型 |
|------------|----------|----------|
| `claude` | `https://api.anthropic.com` | claude-opus-4, claude-sonnet-4 |
| `deepseek` | `https://api.deepseek.com/anthropic` | deepseek-reasoner |
| `gemini` | `https://generativelanguage.googleapis.com/v1beta/openai` | gemini-2.5-pro |
| `glm` | `https://open.bigmodel.cn/api/anthropic` | GLM-4.7, glm-4.5-air |
| `kimi` | `https://api.moonshot.cn/anthropic` | kimi-k2-turbo-preview |
| `qwen` | `https://dashscope.aliyuncs.com/api/v2/apps/claude-code-proxy` | qwen3-coder-plus |

**切换机制**:
```kotlin
// 1. 读取预置配置
val presetJson = loadPresetProviderSettings(providerId)

// 2. 合并到 ~/.claude/settings.json
val targetFile = File(System.getProperty("user.home"), ".claude/settings.json")
targetFile.writeText(presetJson)

// 3. 重启 CLI 进程使配置生效
daemonBridge.restart()
```

**预置配置文件位置**:
```
src/main/resources/providers/
├── settings-claude.json
├── settings-deepseek.json
├── settings-gemini.json
├── settings-glm.json
├── settings-kimi.json
└── settings-qwen.json
```

### 安全约定

- API Key 存储在 `~/.claude/settings.json` (由 Claude Code CLI 管理)
- 插件仅负责读写该文件，不直接存储 API Key
- 禁止在日志中输出完整的 API Key

### 国际化约定

使用 `MyBundle.message()` 获取本地化字符串：
```kotlin
// 在 resources/messages/MyBundle.properties 中定义
randomLabel=Random number: {0}
shuffle=Shuffle

// 在代码中使用
MyBundle.message("randomLabel", number)
```

---

## 代码组织规范

### 目录结构
```
src/main/kotlin/com/github/xingzhewa/ccassistant/
├── toolWindow/          # ToolWindow 相关
├── services/            # 服务层
├── bridge/              # 桥接层（Daemon）
├── ui/                  # UI 组件
│   ├── components/      # 可复用组件
│   ├── panels/          # 面板
│   └── dialogs/         # 对话框
├── model/               # 数据模型
├── util/                # 工具类
└── resources/           # 资源文件
```

### 命名规范
| 类型 | 规范 | 示例 |
|-----|-----|-----|
| 类名 | PascalCase | `MyToolWindowFactory` |
| 函数名 | camelCase | `createToolWindowContent` |
| 常量 | SCREAMING_SNAKE_CASE | `MAX_RETRY_COUNT` |
| 包名 | 全小写 | `com.ccassistant.ui` |
| 测试类 | `XxxTest` | `MyServiceTest` |

---

## Git 工作流

### 分支命名
```
feature/xxx           # 新功能
bugfix/xxx            # Bug 修复
refactor/xxx          # 重构
docs/xxx              # 文档更新
```

### 提交规范
```
<type>(<scope>): <subject>

types: feat, fix, docs, refactor, test, chore
scope: optional, indicates the affected module
```

---

## CI/CD

### GitHub 工作流

- **构建测试**: `.github/workflows/build.yml` - 每次推送自动构建测试
- **发布**: `.github/workflows/release.yml` - 标签触发发布流程
- **UI 测试**: `.github/workflows/run-ui-tests.yml` - UI 测试专用流程

### 依赖更新

使用 Dependabot 自动更新依赖：
- 配置文件: `.github/dependabot.yml`

---

## 常见问题

### 编译错误
- **Kotlin 版本兼容性**: 确保使用 Kotlin 21 语法特性
- **IntelliJ Platform API**: 查阅 [Platform Dev Documentation](https://plugins.jetbrains.com/docs/intellij/welcome.html)
- **类型推断错误**: 使用显式类型而非 `!!` 强制解包

### 测试失败
- 确认测试环境 Mock 正确（可考虑使用 MockK）
- 异步操作使用 `runBlocking` 或 `runTest` 等待完成
- 验证测试数据准备充分

### 运行时错误
- UI 操作必须在 EDT: `EdtDispatcherUtil edtDispatcher { ... }`
- 后台任务使用: `ApplicationManager.getApplication().executeOnPooledThread { ... }`
- 服务获取: `project.service<XxxService>()`

### JCEF 开发问题
- **JCEF 不支持**: 检测 `JBCefApp.isSupported()`，不支持时降级 Swing
- **JS 回调线程**: JS → Java 回调不在 EDT，UI 更新需 `invokeLater()`
- **内存泄漏**: ToolWindow 关闭时必须调用 `browser.dispose()` 释放资源
- **白屏问题**: 检查 HTML/CSS 路径，使用 `JBCefApp.loadResource()` 加载资源

---

## 参考文档

### 项目文档
- **技术架构**: `docs/CC_Assistant_Technical_Architecture.md` - 完整的技术架构设计 (v6.0)
- **UI 设计**: `docs/ui.md` - 界面布局详细设计
- **开发规划**: `docs/plan/README.md` - 里程碑规划与任务拆解

### 外部参考
- [IntelliJ Platform Dev Documentation](https://plugins.jetbrains.com/docs/intellij/welcome.html)
- [IntelliJ Platform Plugin Template](https://github.com/JetBrains/intellij-platform-plugin-template)
- [Claude Code CLI](https://docs.anthropic.com/claude-code) - Claude Code CLI 官方文档
- [JCEF in IntelliJ](https://plugins.jetbrains.com/docs/intellij/jcef.html) - JCEF 内嵌浏览器
- [JBCefJSQuery API](https://github.com/JetBrains/intellij-community/tree/master/platform/jcef) - Java ↔ JS 双向通信

### 参考项目（类似 AI 插件）
- [AI IntelliJ Plugin](https://github.com/didalgolab/ai-intellij-plugin) - 多模型 AI 助手插件
- [Devoxx Genie](https://github.com/devoxx/devoxxgenieideaplugin) - 本地 LLM 支持

---

*最后更新: 2026-04-14*