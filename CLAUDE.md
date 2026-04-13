# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

# CC Assistant 项目全局约束

> 本文件是 CC Assistant 项目的最高层约束定义，所有 AI 编码任务都必须遵守。
>
> **项目进度追踪**: 见 `docs/plan/00-项目进度.md`
> **当前检查点**: CP-0 (项目初始化)

---

## 项目概述

- **项目名称**: CC Assistant
- **类型**: IntelliJ Platform 插件
- **语言**: Kotlin 21
- **构建工具**: Gradle (Kotlin DSL)
- **最低 IDE 版本**: 2024.1+
- **目标**: 集成 Claude Agent SDK 到 IntelliJ IDE，提供对话式 AI 编程助手

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
```

### 运行与调试
```bash
# 在开发 IDE 中运行插件
# 使用 IntelliJ IDEA 的 "Run Plugin" 配置

# 验证插件
./gradlew verifyPlugin

# 检查插件兼容性
./gradlew patchPluginXml
```

### 代码检查
```bash
# Kotlin 代码检查（如果配置了 ktlint）
./gradlew lintKotlin

# 格式化代码（如果配置了 spotless）
./gradlew spotlessApply
```

---

## 当前项目状态

### 已实现模块 (CP-0 阶段)

| 模块 | 文件路径 | 状态 | 说明 |
|-----|---------|-----|------|
| ProviderService | `model/Provider.kt` | ✅ 完成 | Provider 管理，支持 Claude 默认配置 |
| DaemonBridgeService | `bridge/DaemonBridgeService.kt` | ⏳ 占位 | Daemon 进程桥接（待实现） |
| ConfigService | `config/AppConfigState.kt` | ✅ 完成 | 应用配置持久化 |
| ToolWindow | `toolWindow/MyToolWindowFactory.kt` | ⏳ 样板 | 需替换为实际 UI |

### 待清理样板代码
- `MyToolWindowFactory.kt` - 包含示例代码，需替换为实际的 CC Assistant UI
- `MyProjectService.kt` - 样板服务，可删除或改造
- `MyBundle.kt` - 国际化基础类，保留但需扩展

### 测试覆盖
- `ProviderServiceTest.kt` - Provider 服务单元测试（9 个测试用例，100% 通过）

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

## 详细设计规范 (来自 docs/dev)

> 本章节内容来自详细设计文档，所有实现必须严格遵守对应的接口规范。
>
> - **接口设计**: `docs/dev/04-接口设计.md`
> - **任务拆解**: `docs/dev/05-任务拆解与验收标准.md`
> - **技术架构**: `docs/CC_Assistant_Technical_Architecture.md`

### 核心交互规范

#### 1. 对话功能 (docs/dev/04-接口设计.md#1-对话功能)

**前端职责**:
- `InputAreaPanel`: 接收用户输入，验证，@file/@/触发
- `MessageAreaPanel`: 渲染用户/AI消息，支持流式追加
- `StatusBarPanel`: 显示对话状态（空闲/思考/流式/错误）

**后端职责**:
- `ChatService`: 协调对话流程，处理消息发送和接收
- `SessionService`: 管理会话和消息存储
- `ContextService`: 构建对话上下文（文件引用、项目信息）
- `DaemonBridgeService`: 与 daemon.js 通信

**接口定义**:
```kotlin
interface ChatService {
    fun sendMessage(request: SendMessageRequest): CompletableFuture<SendMessageResponse>
    fun registerStreamListener(listener: StreamListener)
    fun cancelCurrentMessage()
}
```

**验收标准**: 见 `docs/dev/05-任务拆解与验收标准.md#1-对话功能`

---

#### 2. 流式输出 (docs/dev/04-接口设计.md#2-流式输出)

**前端职责**:
- `StreamingMessageCard`: 实时渲染AI响应，节流更新(~60fps)
- `StreamingIndicator`: 显示流式状态动画

**后端职责**:
- `NDJSONParser`: 解析 daemon.js 输出的 NDJSON 流
- `StreamManager`: 管理流式缓冲和分发

**接口定义**:
```kotlin
interface StreamManager {
    fun startStream(messageId: String, consumer: (String) -> Unit)
    fun appendText(messageId: String, text: String)
    fun completeStream(messageId: String)
    fun cancelStream(messageId: String)
}
```

**验收标准**: 见 `docs/dev/05-任务拆解与验收标准.md#2-流式输出`

---

#### 3. 供应商管理 (docs/dev/04-接口设计.md#3-供应商管理)

**前端职责**:
- `ProviderSelector`: 显示当前Provider，支持切换
- `ModelSelector`: 显示当前模型，支持切换
- `ProviderSettingsDialog`: 管理Provider配置

**后端职责**:
- `ProviderService`: 管理Provider配置的增删改查
- API Key验证
- Daemon通知（切换Provider）

**接口定义**:
```kotlin
interface ProviderService {
    fun getAllProviders(): List<ProviderConfig>
    fun getActiveProvider(): ProviderConfig
    fun switchProvider(providerId: String): Boolean
    suspend fun validateProvider(config: ProviderConfig): ValidationResult
}
```

**验收标准**: 见 `docs/dev/05-任务拆解与验收标准.md#3-供应商管理`

---

#### 4. 对话模式切换 (docs/dev/04-接口设计.md#4-对话模式切换)

**前端职责**:
- `ChatModeSelector`: 显示当前模式（Auto/Thinking/Plan）
- 模式说明面板

**后端职责**:
- `ChatModeService`: 管理对话模式配置
- 模式参数转换（temperature, thinking等）

**接口定义**:
```kotlin
interface ChatModeService {
    fun getCurrentMode(): ChatMode
    fun setMode(mode: ChatMode): Boolean
    fun getModeConfig(mode: ChatMode): ChatModeConfig
}
```

**验收标准**: 见 `docs/dev/05-任务拆解与验收标准.md#4-对话模式切换`

---

#### 5. 模型思考 (docs/dev/04-接口设计.md#5-模型思考)

**前端职责**:
- `ThinkingBlockPanel`: 显示AI思考过程，支持折叠/展开
- 思考内容实时追加

**后端职责**:
- 处理daemon.js的thinking事件
- 思考内容存储到消息

**接口定义**:
```kotlin
interface ThinkingListener {
    fun onThinkingStart(messageId: String)
    fun onThinkingContent(messageId: String, content: String)
    fun onThinkingComplete(messageId: String, fullContent: String)
}
```

**验收标准**: 见 `docs/dev/05-任务拆解与验收标准.md#5-模型思考`

---

#### 6. 提示词增强 (docs/dev/04-接口设计.md#6-提示词增强)

**前端职责**:
- `PromptEnhancementPanel`: 显示增强前后对比
- 接受/拒绝按钮

**后端职责**:
- `PromptEnhancementService`: 规则引擎，应用增强规则
- 上下文构建（文件引用、选中文本等）

**接口定义**:
```kotlin
interface PromptEnhancementService {
    suspend fun enhancePrompt(
        originalPrompt: String,
        context: EnhancementContext
    ): EnhancementResult
}
```

**验收标准**: 见 `docs/dev/05-任务拆解与验收标准.md#6-提示词增强`

---

#### 7. 主题切换 (docs/dev/04-接口设计.md#7-主题切换)

**前端职责**:
- `ThemeService.getThemeColor()`: 获取主题颜色
- `ThemedComponent`: 主题感知组件基类

**后端职责**:
- `ThemeService`: 管理主题配置，IDE主题检测
- 主题事件发布

**接口定义**:
```kotlin
interface ThemeService {
    fun getCurrentTheme(): Theme
    fun setTheme(theme: Theme): Boolean
    fun getThemeColor(colorKey: String): Color
    fun applyTheme(component: Component)
}
```

**验收标准**: 见 `docs/dev/05-任务拆解与验收标准.md#7-主题切换`

---

#### 8. 国际化 (docs/dev/04-接口设计.md#8-国际化)

**前端职责**:
- `I18nComponent`: 国际化支持组件
- 语言自动更新

**后端职责**:
- `I18nService`: 提供翻译API
- 资源文件加载
- IDE语言检测

**接口定义**:
```kotlin
interface I18nService {
    fun getMessage(key: String, vararg params: Any): String
    fun getCurrentLanguage(): Language
    fun setLanguage(language: Language): Boolean
}
```

**验收标准**: 见 `docs/dev/05-任务拆解与验收标准.md#8-国际化`

---

#### 9. 文件引用 (@file) (docs/dev/04-接口设计.md#9-文件引用)

**前端职责**:
- `FileReferencePopup`: 文件搜索弹窗
- 引用标签显示和管理

**后端职责**:
- 文件索引和搜索
- 文件内容读取
- 行范围提取

**接口定义**:
```kotlin
interface FileReferenceService {
    fun searchFiles(query: String): List<VirtualFile>
    fun readFileContent(file: VirtualFile, startLine: Int?, endLine: Int?): String
}
```

**验收标准**: 见 `docs/dev/05-任务拆解与验收标准.md#9-文件引用`

---

#### 10. 附件处理 (docs/dev/04-接口设计.md#10-附件处理)

**前端职责**:
- `AttachmentPreview`: 附件预览组件
- 拖拽上传支持

**后端职责**:
- 图片Base64编码
- 附件验证（大小、类型）
- 内存管理

**接口定义**:
```kotlin
interface AttachmentService {
    fun encodeImage(image: BufferedImage): String
    fun validateAttachment(file: VirtualFile): ValidationResult
}
```

**验收标准**: 见 `docs/dev/05-任务拆解与验收标准.md#10-附件处理`

---

#### 11. 会话管理 (docs/dev/04-接口设计.md#11-会话管理)

**前端职责**:
- `SessionListPanel`: 会话列表，搜索，收藏
- 会话切换动画

**后端职责**:
- `SessionService`: 会话CRUD，回溯点管理
- 会话持久化

**接口定义**:
```kotlin
interface SessionService {
    fun createSession(): ChatSession
    fun getActiveSession(): ChatSession?
    fun switchSession(sessionId: String): Boolean
    fun createRewindPoint(sessionId: String, description: String): RewindPoint
    fun rewindTo(sessionId: String, rewindPointId: String): Boolean
}
```

**验收标准**: 见 `docs/dev/05-任务拆解与验收标准.md#11-会话管理`

---

#### 12. Agent 执行 (docs/dev/04-接口设计.md#12-agent执行)

**前端职责**:
- `AgentStatusPanel`: 显示Agent执行状态
- 任务列表，子Agent追踪

**后端职责**:
- `AgentService`: Agent配置和执行
- 进度回调

**接口定义**:
```kotlin
interface AgentService {
    fun getActiveAgent(): Agent
    fun executeAgent(agent: Agent, context: ConversationContext, onProgress: (AgentProgress) -> Unit): AgentResult
}
```

**验收标准**: 见 `docs/dev/05-任务拆解与验收标准.md#12-agent执行`

---

## 架构模式

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

## CI/CD

### GitHub 工作流

- **构建测试**: `.github/workflows/build.yml` - 每次推送自动构建测试
- **发布**: `.github/workflows/release.yml` - 标签触发发布流程
- **UI 测试**: `.github/workflows/run-ui-tests.yml` - UI 测试专用流程

### 依赖更新

使用 Dependabot 自动更新依赖：
- 配置文件: `.github/dependabot.yml`

---

## 项目特定约定

### Provider 管理

当前项目仅支持 Claude Provider：
- 默认 Provider ID: `"claude"`
- 默认模型: `"claude-sonnet-4-20250514"`
- 支持的模型: Opus 4, Sonnet 4, Haiku 3.5

添加自定义 Provider:
```kotlin
val customProvider = ProviderConfig(
    id = "custom",
    name = "Custom Provider",
    apiKey = "...",
    endpoint = "https://custom.api.com",
    defaultModel = "custom-model",
    type = ProviderType.CUSTOM
)
providerService.addProvider(customProvider)
```

### 安全约定

- API Key 必须通过 `ConfigService` 存储到持久化配置
- 禁止在日志中输出完整的 API Key
- API Key 验证应在 Provider 切换时进行

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

## 执行计划

> 详细执行计划见 `docs/plan/` 目录，采用 Harness Engineering 检查点机制。

### 检查点列表

| 检查点 | 描述 | 对应文档 | 状态 |
|-------|-----|---------|------|
| CP-0 | 项目初始化 | - | ⏳ |
| CP-1 | 基础框架 | `docs/dev/05#阶段1` | ⏳ |
| CP-2 | 会话功能 | `docs/dev/05#阶段2` | ⏳ |
| CP-3 | 设置功能 | `docs/dev/05#阶段3` | ⏳ |
| CP-4 | 集成功能 | `docs/dev/05#阶段4` | ⏳ |
| CP-5 | 优化测试 | `docs/dev/05#阶段5` | ⏳ |

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

---

## 下一步开发

根据 `docs/plan/01-CP0-项目初始化.md`，当前待完成任务：

1. [ ] 清理样板代码 (`MyToolWindowFactory`, `MyProjectService`)
2. [ ] 验证编译无错误
3. [ ] 验证所有测试通过
4. [ ] 验证插件可正常加载

完成后即可进入 CP-1 (基础框架) 阶段。

---

*最后更新: 2026-04-14 | 检查点: CP-0*
