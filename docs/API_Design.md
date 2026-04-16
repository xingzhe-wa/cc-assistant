# CC Assistant 接口设计方案

> **版本**: v6.4 (DiffSummary 组件 + diffFiles 数据流接入版)
> **更新日期**: 2026-04-17
> **设计原则**: 以功能和交互动作为驱动，端到端接口设计，与实际代码对齐
> **与架构对齐**: v6.4 与 CC_Assistant_Technical_Architecture.md v6.4 保持一致

---

## 重要说明

### CLI 调用方式

Claude Code CLI **不支持 stdin 交互式协议**，使用单次命令模式：

```bash
# 首次调用
claude -p "用户输入" --output-format stream-json

# 续接会话
claude -p "后续消息" --resume sess_abc123 --output-format stream-json

# 指定模型
claude -p "用户输入" --model claude-opus-4-20250514 --output-format stream-json

# 权限模式
# - default: 每次操作需确认（M5 Plan 模式）
# - sandbox: 沙箱模式，自动执行安全操作
# - yolo: 全自动，无需确认（MVP 默认 accept-all）
claude -p "用户输入" --permission-mode yolo --output-format stream-json
```

- **prompt** 通过 `-p` 参数传入
- **会话续接** 通过 `--resume session_id` 参数传入
- **模型选择** 通过 `--model` 参数传入
- **权限模式**：
  - MVP 阶段使用 `yolo`（等同于 `accept-all`），AI 自由执行，不打断用户
  - Plan 模式不传 `--permission-mode`，CLI 在需要确认时暂停，插件弹出 Swing 审批弹窗
- **输出** 通过 stdout 以 NDJSON 格式流式输出
- **中断** 直接 `process.destroy()` 杀进程

### NDJSON 输出格式

```json
// 流式文本增量
{"type":"stream_event","event":{"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"你"}}}

// 思考增量
{"type":"stream_event","event":{"type":"content_block_delta","index":0,"delta":{"type":"thinking_delta","thinking":"让我思考"}}}

// 工具调用开始
{"type":"stream_event","event":{"type":"content_block_start","content_block":{"type":"tool_use","name":"read_file","id":"tool-1"}}}

// 工具输入增量
{"type":"stream_event","event":{"type":"content_block_delta","index":0,"delta":{"type":"input_json_delta","partial_json":"{\"path\":\""}}}

// 最终结果
{"type":"result","subtype":"success","cost_usd":0.003,"result":"完整响应","session_id":"sess_abc123"}

// 错误
{"type":"error","error":"错误信息"}
```

**关键字段说明**：
- `session_id` - 会话标识符，必须保存用于后续消息续接
- `cost_usd` - 本次请求成本，用于 Token 统计

---

## 目录

1. [M0: CLI 链路验证](#m0-cli-链路验证)
2. [M1: 极简对话](#m1-极简对话)
3. [M2: 多会话 + JCEF 切换](#m2-多会话--jcef-切换)
4. [M3: MCP 支持](#m3-mcp-支持)
5. [M4: 设置 + Provider 管理](#m4-设置--provider-管理)
6. [M5: 打磨上线](#m5-打磨上线)

---

## M0: CLI 链路验证

### M0-001: CLI 检测接口

| 属性 | 值 |
|------|-----|
| **功能描述** | 检测 Claude Code CLI 是否已安装 |
| **优先级** | P0 |
| **依赖** | 无 |

#### 前端接口 (Kotlin)
```kotlin
// 位置: bridge/CliBridgeService.kt
/**
 * 检测 Claude Code CLI 是否已安装
 * @return CLI 二进制名称，未找到返回 null
 */
fun detectCli(): String?

/**
 * 检查 CLI 是否可用
 */
fun isCliAvailable(): Boolean = detectCli() != null

/**
 * 获取 CLI 版本信息
 */
fun getCliVersion(): String? {
    val cli = detectCli() ?: return null
    return try {
        val process = ProcessBuilder(cli, "--version")
            .redirectErrorStream(true)
            .start()
        val output = process.inputStream.bufferedReader().readText().trim()
        process.waitFor(5, TimeUnit.SECONDS)
        output
    } catch (e: Exception) {
        null
    }
}
```

---

### M0-002: Stream-Json 格式测试接口

| 属性 | 值 |
|------|-----|
| **功能描述** | 验证 CLI 的 stream-json 输出是否正常工作 |
| **优先级** | P0 |
| **依赖** | M0-001 |

#### 前端接口 (Kotlin)
```kotlin
// 位置: bridge/CliBridgeService.kt
/**
 * 执行单次 Prompt (非交互模式)
 * @param prompt 用户输入
 * @param workingDir 工作目录 (可选)
 * @param sessionId 会话 ID (可选，用于续接)
 * @param model 模型 ID (可选)
 * @return true 如果进程成功启动
 */
fun executePrompt(
    prompt: String, 
    workingDir: String? = null,
    sessionId: String? = null,
    model: String? = null
): Boolean {
    val cli = detectCli() ?: return false
    
    // 关键修正：移除 permissionMode 参数（会话级设置，不应每次传入）
    val command = buildListOf(
        cli, "-p", prompt,
        "--output-format", "stream-json",
        "--permission-mode", "accept-all"  // MVP 固定使用 accept-all
    ).apply {
        sessionId?.let { this.addAll(listOf("--resume", it)) }
        model?.let { this.addAll(listOf("--model", it)) }
    }
    
    val process = ProcessBuilder(command)
        .redirectErrorStream(false)
        .start()
    
    // 启动输出读取线程
    Thread { readProcessOutput(process) }.start()
    return true
}
```

#### 消息回调接口 (CliMessageCallback)

```kotlin
// 位置: bridge/CliMessageCallback.kt
/**
 * CLI 消息回调接口
 * 细粒度回调设计，便于独立处理各类消息
 */
interface CliMessageCallback {

    /** 流式文本增量 */
    fun onTextDelta(text: String)

    /** 思考片段增量 */
    fun onThinkingDelta(text: String)

    /** 工具调用开始 */
    fun onToolUseStart(toolUse: CliMessage.ToolUseStart)

    /** 工具调用输入增量 */
    fun onToolUseInputDelta(toolUse: CliMessage.ToolUseInputDelta)

    /** 最终结果（包含 session_id、cost_usd） */
    fun onResult(result: CliMessage.Result)

    /** 错误信息 */
    fun onError(error: CliMessage.Error)

    /** 中断回调（CLI 进程被 kill 后触发）*/
    fun onInterrupted()
}

/**
 * CLI 消息类型定义
 */
sealed class CliMessage {
    data class TextDelta(val text: String) : CliMessage()
    data class ThinkingDelta(val thinking: String) : CliMessage()
    data class ToolUseStart(
        val toolName: String,
        val toolInput: String,
        val status: ToolUseStatus
    ) : CliMessage()
    data class ToolUseInputDelta(
        val toolName: String,
        val delta: String
    ) : CliMessage()
    data class Result(
        val content: String,
        val sessionId: String,
        val costUsd: Double,
        val usage: Map<String, Int>
    ) : CliMessage()
    data class Error(val message: String, val code: String?) : CliMessage()
}

enum class ToolUseStatus { PENDING, RUNNING, SUCCESS, ERROR }
```

---

## M1: 极简对话 (Swing 版)

### M1-001: 发送消息接口

| 属性 | 值 |
|------|-----|
| **功能描述** | 用户发送消息给 AI，接收流式响应 |
| **优先级** | P0 |
| **依赖** | M0 |
| **UI 技术** | Swing (JTextPane) |

#### 前端接口 (Kotlin)
```kotlin
// 位置: ui/chat/ChatPanel.kt
class ChatPanel(
    private val project: Project  // 关键修正：通过构造函数传入 Project
) : JPanel() {
    
    private val cliBridge = CliBridgeService.getInstance()
    private var currentSessionId: String? = null
    private val currentModel: ModelInfo? = null
    
    fun sendMessage() {
        val prompt = inputArea.text.trim()
        if (prompt.isEmpty()) return
        
        // 禁用输入框和发送按钮
        inputArea.isEnabled = false
        sendButton.isEnabled = false
        sendButton.text = "中断"
        
        // 添加用户消息到 UI
        appendUserMessage(prompt)
        
        // 清空输入框
        inputArea.text = ""
        
        // 获取当前选择的模型
        val selectedModel = modelSelector.selectedItem as? ModelInfo
        
        // 注册回调并执行
        val callback = object : CliMessageCallback {
            override fun onTextDelta(text: String) {
                ApplicationManager.invokeLater { appendAiChunk(text) }
            }

            override fun onThinkingDelta(text: String) {
                ApplicationManager.invokeLater { showThinking(text) }
            }

            override fun onToolUseStart(toolUse: CliMessage.ToolUseStart) {
                ApplicationManager.invokeLater { showToolUseStart(toolUse) }
            }

            override fun onToolUseInputDelta(toolUse: CliMessage.ToolUseInputDelta) {
                ApplicationManager.invokeLater { showToolUseDelta(toolUse) }
            }

            override fun onResult(result: CliMessage.Result) {
                ApplicationManager.invokeLater { onResult(result) }
            }

            override fun onError(error: CliMessage.Error) {
                ApplicationManager.invokeLater { showError(error) }
            }

            override fun onInterrupted() {
                ApplicationManager.invokeLater {
                    sendButton.text = "发送"
                    inputArea.isEnabled = true
                    sendButton.isEnabled = true
                    appendSystemMessage("已中断")
                }
            }
        }
        
        cliBridge.registerCallback(callback)
        val started = cliBridge.executePrompt(
            prompt = prompt,
            workingDir = project.basePath,  // 关键修正：使用传入的 project
            sessionId = currentSessionId,
            model = selectedModel?.id
        )
        
        if (!started) {
            inputArea.isEnabled = true
            sendButton.isEnabled = true
            sendButton.text = "发送"
        }
    }
    
    private fun onResult(result: CliMessage.Result) {
        // 关键修正：保存 session_id（CLI 返回的标识符）
        currentSessionId = result.sessionId
        
        // 重新启用输入框和发送按钮
        inputArea.isEnabled = true
        sendButton.isEnabled = true
        sendButton.text = "发送"
        inputArea.requestFocus()
        
        // 显示 Token 统计
        statusBar.updateCost(result.costUsd)
    }
}
```

---

### M1-002: 中断响应接口

| 属性 | 值 |
|------|-----|
| **功能描述** | 用户主动中断 AI 的流式响应 |
| **优先级** | P0 |
| **依赖** | M1-001 |

#### 前端接口 (Kotlin)
```kotlin
// 位置: ui/chat/ChatPanel.kt
fun interruptMessage() {
    sendButton.text = "发送"
    sendButton.icon = sendIcon
    
    CliBridgeService.getInstance().interrupt()
    
    appendSystemMessage("已中断")
}
```

---

### M1-003: 模型选择接口

| 属性 | 值 |
|------|-----|
| **功能描述** | 用户选择要使用的模型 |
| **优先级** | P1 |
| **依赖** | M0 |

#### 前端接口 (Kotlin)
```kotlin
// 位置: ui/chat/ModelSelector.kt
class ModelSelector : JComboBox<ModelInfo>() {

    private var selectedModel: ModelInfo? = null

    init {
        val models = ProviderService.getInstance()
            .getModelsForProvider(currentProviderId)

        models.forEach { addItem(it) }
        selectedItem = models.first()

        addActionListener {
            selectedModel = selectedItem as? ModelInfo
        }
    }
}
```

---

### M1-004: CLI 安装引导接口 (关键新增)

| 属性 | 值 |
|------|-----|
| **功能描述** | 检测 CLI 是否安装，未安装时引导用户安装 |
| **优先级** | P0 |
| **依赖** | M0-001 |

#### UI 交互
```
┌─────────────────────────────────────────────────────────────┐
│  CLI 未安装引导                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ⚠️  Claude Code CLI 未安装                          │   │
│  │                                                     │   │
│  │ 请先安装 Claude Code CLI 才能使用 CC Assistant      │   │
│  │                                                     │   │
│  │ [访问 Claude Code 官网]                             │   │
│  │                                                     │   │
│  │ 安装完成后点击 [重新检测]                            │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

#### 前端接口 (Kotlin)
```kotlin
// 位置: ui/dialog/CliInstallGuideDialog.kt
class CliInstallGuideDialog(private val project: Project) : DialogWrapper(project) {

    override fun createCenterPanel(): JComponent {
        return JPanel().apply {
            layout = BorderLayout(16, 16)
            border = BorderFactory.createEmptyBorder(24, 24, 24, 24)

            // 警告图标 + 标题
            add(JLabel("⚠️ Claude Code CLI 未安装", SwingConstants.CENTER), BorderLayout.NORTH)

            // 说明文本
            val descPanel = JPanel().apply {
                layout = BoxLayout(this, BoxLayout.Y_AXIS)
                alignmentX = CENTER_ALIGNMENT

                add(JLabel("请先安装 Claude Code CLI 才能使用 CC Assistant"))
                add(JLabel(" "))
                add(JLabel("安装方式:"))
                add(JLabel("npm install -g @anthropic-ai/claude-code"))
            }
            add(descPanel, BorderLayout.CENTER)

            // 按钮面板
            val buttonPanel = JPanel().apply {
                layout = FlowLayout(FlowLayout.CENTER, 8, 0)

                add(JButton("访问 Claude Code 官网").apply {
                    addActionListener {
                        BrowserUtil.open("https://docs.anthropic.com/claude-code")
                    }
                })

                add(JButton("重新检测").apply {
                    addActionListener {
                        if (CliBridgeService.getInstance().isCliAvailable()) {
                            close(OK_EXIT_CODE)
                        } else {
                            Messages.showInfoMessage("仍未检测到 CLI，请确认已正确安装", "检测结果")
                        }
                    }
                })

                add(JButton("取消").apply {
                    addActionListener { close(CANCEL_EXIT_CODE) }
                })
            }
            add(buttonPanel, BorderLayout.SOUTH)
        }
    }
}

// 位置: bridge/CliBridgeService.kt
/**
 * 检测 CLI 并在需要时显示安装引导
 * @return true 如果 CLI 可用，false 如果用户取消安装引导
 */
fun checkAndPromptCliInstallation(): Boolean {
    if (isCliAvailable()) return true

    val result = Messages.showYesNoDialog(
        "Claude Code CLI 未安装。\n\n是否打开官网下载页面？",
        "CLI 未安装",
        "打开官网",
        "取消"
    )

    if (result == Messages.YES) {
        BrowserUtil.open("https://docs.anthropic.com/claude-code")
    }

    return false
}
```

---

## M2: 多会话 + JCEF 切换

### M2-001: 新建会话接口

| 属性 | 值 |
|------|-----|
| **功能描述** | 创建新的对话会话 |
| **优先级** | P0 |
| **依赖** | M1 |

#### 前端接口 (Kotlin)
```kotlin
// 位置: ui/chat/SessionTabBar.kt
fun createNewSession() {
    // 关键修正：重置会话 ID
    chatPanel.currentSessionId = null
    
    val session = ChatSession(
        id = UUID.randomUUID().toString(),  // 插件内部标识
        sessionId = null,                   // CLI session_id（首次调用后获得）
        title = "新对话",
        createdAt = Instant.now(),
        workingDir = project.basePath,      // 关键修正：持久化工作目录
        messages = mutableListOf()
    )
    
    addSessionTab(session)
    switchToSession(session.id)
    
    messageArea.clear()
}
```

---

### M2-002: 切换会话接口

| 属性 | 值 |
|------|-----|
| **功能描述** | 切换到已有会话，恢复历史消息 |
| **优先级** | P0 |
| **依赖** | M2-001 |

#### 前端接口 (Kotlin)
```kotlin
// 位置: ui/chat/SessionTabBar.kt
fun switchToSession(sessionId: String) {
    val session = SessionService.getInstance(project).getSession(sessionId) ?: return
    
    // 关键修正：恢复 CLI session_id（用于 --resume）
    chatPanel.currentSessionId = session.sessionId
    
    // 关键修正：切换工作目录（--resume 需要在原始目录执行）
    chatPanel.currentWorkingDir = session.workingDir
    
    // 加载历史消息到 UI
    messageArea.clear()
    session.messages.forEach { message ->
        when (message.role) {
            Role.USER -> messageArea.appendUserMessage(message.content)
            Role.ASSISTANT -> messageArea.appendAIMessage(message.content)
        }
    }
    
    setSelectedTab(sessionId)
}
```

---

### M2-003: 删除会话接口

| 属性 | 值 |
|------|-----|
| **功能描述** | 删除不需要的会话 |
| **优先级** | P1 |
| **依赖** | M2-001 |

#### 前端接口 (Kotlin)
```kotlin
// 位置: ui/chat/SessionTabBar.kt
fun deleteSession(sessionId: String) {
    val session = SessionService.getInstance(project).getSession(sessionId)
    val confirm = Messages.showYesNoDialog(
        "确定要删除会话 \"${session?.title}\" 吗？",
        "确认删除"
    )
    
    if (confirm == Messages.YES) {
        SessionService.getInstance(project).deleteSession(sessionId)
        removeSessionTab(sessionId)
        
        if (currentSessionId == sessionId) {
            currentSessionId = null
            messageArea.clear()
        }
    }
}
```

---

### M2-004: 会话持久化接口

| 属性 | 值 |
|------|-----|
| **功能描述** | 会话数据持久化存储 |
| **优先级** | P0 |
| **依赖** | M2-001 |
| **存储方案** | JSON 文件（与 CLI ~/.claude/ 对齐） |

#### 前端接口 (Kotlin)
```kotlin
// 位置: service/SessionService.kt
@Service(Service.Level.PROJECT)
class SessionService(val project: Project) {
    
    private val sessionsDir = File(
        System.getProperty("user.home"),
        ".claude/sessions"
    )
    
    companion object {
        fun getInstance(project: Project): SessionService =
            project.getService(SessionService::class.java)
    }
    
    init {
        // 关键修正：使用 JSON 文件存储
        sessionsDir.mkdirs()
    }
    
    /**
     * 保存会话
     */
    fun saveSession(session: ChatSession) {
        val file = File(sessionsDir, "${session.id}.json")
        val json = Gson().toJson(session)
        file.writeText(json)
    }
    
    /**
     * 获取会话
     */
    fun getSession(sessionId: String): ChatSession? {
        val file = File(sessionsDir, "$sessionId.json")
        if (!file.exists()) return null
        
        return try {
            Gson().fromJson(file.readText(), ChatSession::class.java)
        } catch (e: Exception) {
            null
        }
    }
    
    /**
     * 删除会话
     */
    fun deleteSession(sessionId: String) {
        val file = File(sessionsDir, "$sessionId.json")
        if (file.exists()) {
            file.delete()
        }
    }
    
    /**
     * 列出所有会话
     */
    fun listSessions(): List<ChatSession> {
        return sessionsDir.listFiles()
            ?.filter { it.extension == "json" }
            ?.mapNotNull { file ->
                try {
                    Gson().fromJson(file.readText(), ChatSession::class.java)
                } catch (e: Exception) {
                    null
                }
            }
            ?.sortedByDescending { it.createdAt }
            ?: emptyList()
    }
}

/**
 * 会话数据结构
 */
data class ChatSession(
    val id: String,              // 插件内部 UUID
    var sessionId: String?,       // CLI 返回的 session_id（用于 --resume）
    var title: String,
    val createdAt: Instant,
    var workingDir: String,       // 关键修正：持久化工作目录
    var messages: MutableList<Message>,
    var isFavorite: Boolean = false
)
```

---

### M2-005: 会话标题自动生成接口

| 属性 | 值 |
|------|-----|
| **功能描述** | 自动生成会话标题 |
| **优先级** | P1 |
| **依赖** | M2-001 |

#### 前端接口 (Kotlin)
```kotlin
// 位置: service/SessionService.kt
/**
 * 生成会话标题
 */
fun generateTitle(firstUserMessage: String): String {
    val title = firstUserMessage
        .replace("\n", " ")
        .trim()
        .take(30)
    
    return if (firstUserMessage.length > 30) {
        "$title..."
    } else {
        title
    }
}
```

---

### M2-006: 历史会话面板接口 (关键新增)

| 属性 | 值 |
|------|-----|
| **功能描述** | 显示历史会话列表，支持搜索、收藏、操作 |
| **优先级** | P0 |
| **依赖** | M2-004 |
| **UI 参考** | ui.md 第 2 节 |

#### UI 交互
```
┌─────────────────────────────────────────────────────────────┐
│  历史会话面板                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🔍 搜索会话...                    [+ 新建] [⭐ 收藏]│   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ 📋 会话列表 (可折叠)                               │   │
│  │ ┌─────────────────────────────────────────────┐     │   │
│  │ │ 🔵 新对话                    10:30    ⋮     │     │   │
│  │ │    分析代码结构...                          │     │   │
│  │ └─────────────────────────────────────────────┘     │   │
│  │ ┌─────────────────────────────────────────────┐     │   │
│  │ │ ⭐ 代码优化讨论              昨天    ⋮       │     │   │
│  │ │    重构建议已应用                            │     │   │
│  │ └─────────────────────────────────────────────┘     │   │
│  │ ┌─────────────────────────────────────────────┐     │   │
│  │ │ ⚪ Bug分析                   04-10   ⋮       │     │   │
│  │ └─────────────────────────────────────────────┘     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

#### 前端接口 (Kotlin)
```kotlin
// 位置: ui/chat/SessionHistoryPanel.kt
class SessionHistoryPanel(
    private val project: Project,
    private val onSessionSelected: (String) -> Unit
) : JPanel() {
    
    private val sessionList = JList<SessionListItem>()
    private val searchField = JTextField()
    private var showFavoritesOnly = false
    
    init {
        layout = BorderLayout()
        
        // 工具栏
        val toolbar = JPanel().apply {
            layout = BorderLayout()
            
            // 搜索框
            searchField.addActionListener { loadSessions() }
            add(searchField, BorderLayout.CENTER)
            
            // 按钮
            val buttonPanel = JPanel().apply {
                add(JButton("+ 新建").apply {
                    addActionListener { createNewSession() }
                })
                add(JButton("⭐ 收藏").apply {
                    addActionListener { toggleFavoritesOnly() }
                })
            }
            add(buttonPanel, BorderLayout.EAST)
        }
        
        // 会话列表
        sessionList.cellRenderer = SessionListCellRenderer()
        sessionList.addListSelectionListener {
            if (!it.valueIsAdjusting) {
                val selected = sessionList.selectedValue
                selected?.let { onSessionSelected(it.sessionId) }
            }
        }
        
        // 右键菜单
        sessionList.componentPopupMenu = createPopupMenu()
        
        add(toolbar, BorderLayout.NORTH)
        add(JScrollPane(sessionList), BorderLayout.CENTER)
        
        loadSessions()
    }
    
    private fun loadSessions() {
        val query = searchField.text.trim()
        val sessions = SessionService.getInstance(project).listSessions()
        
        val filtered = when {
            query.isNotEmpty() -> sessions.filter { 
                it.title.contains(query, ignoreCase = true) 
            }
            showFavoritesOnly -> sessions.filter { it.isFavorite }
            else -> sessions
        }
        
        sessionList.setListData(filtered.map { 
            SessionListItem(it) 
        }.toTypedArray())
    }
    
    private fun createPopupMenu(): JPopupMenu {
        return JPopupMenu().apply {
            add(JMenuItem("⭐ 收藏/取消收藏").apply {
                addActionListener { toggleFavorite() }
            })
            add(JMenuItem("✏️ 重命名").apply {
                addActionListener { renameSession() }
            })
            add(JMenuItem("📤 导出会话").apply {
                addActionListener { exportSession() }
            })
            addSeparator()
            add(JMenuItem("🗑️ 删除会话").apply {
                addActionListener { deleteSession() }
            })
        }
    }
}

data class SessionListItem(
    val sessionId: String,
    val title: String,
    val createdAt: Instant,
    val isFavorite: Boolean,
    val messagePreview: String
) {
    constructor(session: ChatSession) : this(
        session.id,
        session.title,
        session.createdAt,
        session.isFavorite,
        session.messages.firstOrNull()?.content?.take(50) ?: ""
    )
}
```

---

### M2-007: 收藏会话接口 (关键新增)

| 属性 | 值 |
|------|-----|
| **功能描述** | 收藏/取消收藏会话 |
| **优先级** | P1 |
| **依赖** | M2-004 |
| **UI 参考** | ui.md 第 3 节 |

#### 前端接口 (Kotlin)
```kotlin
// 位置: service/SessionService.kt
/**
 * 切换会话收藏状态
 */
fun toggleFavorite(sessionId: String) {
    val session = getSession(sessionId) ?: return
    session.isFavorite = !session.isFavorite
    saveSession(session)
    
    // 发布事件
    ApplicationManager.getApplication().messageBus
        .syncPublisher(SessionTopics.SESSION_FAVORITE_TOGGLED)
        .onFavoriteToggled(sessionId, session.isFavorite)
}
```

---

### M2-008: 重命名会话接口 (关键新增)

| 属性 | 值 |
|------|-----|
| **功能描述** | 重命名会话标题 |
| **优先级** | P1 |
| **依赖** | M2-004 |

#### 前端接口 (Kotlin)
```kotlin
// 位置: ui/chat/SessionHistoryPanel.kt
private fun renameSession() {
    val selected = sessionList.selectedValue ?: return
    val session = SessionService.getInstance(project).getSession(selected.sessionId) ?: return
    
    val newTitle = Messages.showInputDialog(
        "请输入新的会话标题:",
        "重命名会话",
        Messages.getQuestionIcon(),
        session.title
    ) ?: return
    
    if (newTitle.isNotBlank()) {
        session.title = newTitle.trim()
        SessionService.getInstance(project).saveSession(session)
        loadSessions()
    }
}
```

---

### M2-009: 导出会话接口 (关键新增)

| 属性 | 值 |
|------|-----|
| **功能描述** | 导出会话为 Markdown/JSON/纯文本 |
| **优先级** | P1 |
| **依赖** | M2-004 |

#### 前端接口 (Kotlin)
```kotlin
// 位置: service/SessionService.kt
/**
 * 导出会话
 */
fun exportSession(sessionId: String, format: ExportFormat): String? {
    val session = getSession(sessionId) ?: return null
    
    return when (format) {
        ExportFormat.MARKDOWN -> exportAsMarkdown(session)
        ExportFormat.JSON -> Gson().toJson(session)
        ExportFormat.PLAIN_TEXT -> exportAsPlainText(session)
    }
}

private fun exportAsMarkdown(session: ChatSession): String {
    val sb = StringBuilder()
    sb.appendLine("# ${session.title}")
    sb.appendLine()
    sb.appendLine("**创建时间**: ${DateTimeFormatter.ISO_INSTANT.format(session.createdAt)}")
    sb.appendLine()
    
    session.messages.forEach { message ->
        when (message.role) {
            Role.USER -> {
                sb.appendLine("## 👤 用户")
                sb.appendLine()
                sb.appendLine(message.content)
                sb.appendLine()
            }
            Role.ASSISTANT -> {
                sb.appendLine("## 🤖 Claude")
                sb.appendLine()
                sb.appendLine(message.content)
                sb.appendLine()
            }
        }
    }
    
    return sb.toString()
}

enum class ExportFormat { MARKDOWN, JSON, PLAIN_TEXT }
```

---

### M2-010: JCEF 消息渲染接口

| 属性 | 值 |
|------|-----|
| **功能描述** | 使用 JCEF 替代 Swing JTextPane 渲染消息 |
| **优先级** | P0 |
| **依赖** | M1, JCEF 配置完成 |
| **降级方案** | 检测 `JBCefApp.isSupported()`，不支持时降级 Swing |

#### 前端接口 - MessageRenderer 抽象
```kotlin
// 位置: ui/chat/MessageRenderer.kt
/**
 * 消息渲染器接口
 */
interface MessageRenderer {
    fun appendUserMessage(content: String)
    fun appendAIMessage(content: String)
    fun appendThinking(content: String)
    fun appendToolUse(toolName: String, input: String)
    fun clear()
    fun dispose()
}

// Swing 实现
class SwingMessageRenderer(private val textPane: JTextPane) : MessageRenderer {
    override fun appendAIMessage(content: String) {
        val styledDoc = textPane.styledDocument
        val style = textPane.addStyle("AI", null)
        StyleConstants.setForeground(style, Color(0xCC, 0xCC, 0xCC))
        styledDoc.insertString(styledDoc.length, content, style)
    }
    // ...
}

// JCEF 实现
class JcefMessageRenderer(private val browser: JBCefBrowser) : MessageRenderer {
    init {
        if (!JBCefApp.isSupported()) {
            throw IllegalStateException("JCEF is not supported")
        }
        val html = javaClass.getResourceAsStream("/web/chat.html")?.bufferedReader()?.readText()
        browser.loadHTML(html)
    }
    
    override fun appendAIMessage(content: String) {
        // executeJavaScript 本身线程安全，不需要 invokeLater
        val escaped = escapeHtml(content)
        val js = "appendMessageChunk('$escaped');"
        browser.executeJavaScript(js)
    }
    
    override fun dispose() {
        browser.dispose()
    }
}
```

#### 前端接口 - ChatPanel 集成
```kotlin
// 位置: ui/chat/ChatPanel.kt
class ChatPanel(
    private val project: Project
) : JPanel() {
    
    private var messageRenderer: MessageRenderer? = null
    
    fun createMessageRenderer(): MessageRenderer {
        return if (JBCefApp.isSupported()) {
            JcefMessageRenderer(createBrowser())
        } else {
            SwingMessageRenderer(textPane)
        }.also { messageRenderer = it }
    }
}
```

---

### M2-011: JCEF 复制回调接口

| 属性 | 值 |
|------|-----|
| **功能描述** | JS → Java 复制回调 |
| **优先级** | P1 |
| **依赖** | M2-010 |

#### 前端接口 (JS → Java)
```javascript
// 位置: resources/web/chat.js
function copyMessage(button) {
    const messageDiv = button.closest('.message');
    const content = messageDiv.querySelector('.message-content').innerText;
    
    CopyToClipboard.copy(content);
    showTooltip(button, '已复制');
}
```

#### 后端接口 (Java)
```kotlin
// 位置: ui/chat/JcefMessageRenderer.kt
class JcefMessageRenderer(private val browser: JBCefBrowser) : MessageRenderer {
    
    private val copyQuery = JBCefJSQuery.create(browser)
    
    init {
        // JS 回调不在 EDT，操作 Swing 需要 invokeLater
        copyQuery.addHandler(object : JBCefJSQuery.Handler {
            override fun onQuery(query: JBCefJSQuery): JBCefJSQuery.Response {
                val content = query.request
                
                ApplicationManager.invokeLater {
                    val clipboard = CopyPasteManager.getInstance()
                    val contents = StringSelection(content)
                    clipboard.setContents(contents, null)
                }
                
                return query.response(200)
            }
        })
        
        browser.executeJavaScript("""
            window.CopyToClipboard = {
                copy: (text) => { $copyQuery.query(text); }
            };
        """)
    }
}
```

---

### M2-011b: JCEF 双向通信总线 (前端 React ↔ Kotlin)

| 属性 | 值 |
|------|-----|
| **功能描述** | 前端 React 组件与 Kotlin 后端的双向通信接口汇总 |
| **优先级** | P0 |
| **依赖** | M2-010 |
| **通信方式** | Java→JS: `executeJavaScript()` + 自定义事件; JS→Java: `JBCefJSQuery` |

#### Java → JS 全局对象 (Kotlin 调用)

```typescript
// CCChat - 消息操作
window.CCChat = {
  appendMessage(role, content, options),   // 追加完整消息
  appendStreamingContent(role, content, messageId), // 流式追加
  finishStreaming(messageId),              // 完成流式输出
  clearMessages(),                         // 清空消息
  showEmpty(),                             // 显示空状态
  setSessionList(sessionsJson),            // 设置会话列表 (新增)
  setCliStatus(version, hasUpdate),        // 设置 CLI 状态 (新增)
}

// CCApp - 应用级操作
window.CCApp = {
  applyTheme({variables, isDark}),         // 应用主题 CSS 变量
  setTheme(themeId),                       // 设置主题 ID
  applyI18n(messages),                     // 应用国际化字符串
  setLocale(locale),                       // 设置语言 (新增)
}

// CCProviders - 数据注入
window.CCProviders = {
  setData(providers, models, agents, context), // 设置所有数据
  setAgents(agents),                       // 设置 Agents (新增)
  setSkills(skills),                       // 设置 Skills (新增)
}
```

#### JS → Java 动作 (React 调用)

```typescript
// jcefBridge.send(action, data) 通过 JBCefJSQuery 发送

// 消息操作
jcefBridge.sendMessage(text, options)      // 发送消息
jcefBridge.stopGeneration()                // 停止生成
jcefBridge.copyMessage(id, content)        // 复制消息
jcefBridge.quoteMessage(id, content)       // 引用消息

// 会话操作
jcefBridge.newSession()                    // 新建会话
jcefBridge.deleteSession(id)               // 删除会话
jcefBridge.toggleFavorite(id, fav)         // 切换收藏
jcefBridge.renameSession(id, title)        // 重命名会话

// 设置操作
jcefBridge.themeChange(themeId)            // 主题变更
jcefBridge.languageChange(locale)          // 语言变更
jcefBridge.providerChange(providerId)      // 供应商切换
jcefBridge.modelChange(modelId)            // 模型切换
jcefBridge.modeChange(mode)                // 模式切换
jcefBridge.agentChange(agentId)            // Agent 切换
jcefBridge.thinkChange(enabled)            // 思考模式切换
jcefBridge.enhancePrompt(text)             // 强化提示词

// Provider/Agent/Skill CRUD (新增)
jcefBridge.send('providerCreate', data)    // 创建供应商
jcefBridge.send('providerUpdate', data)    // 更新供应商
jcefBridge.send('providerDelete', id)      // 删除供应商
jcefBridge.send('agentCreate', data)       // 创建 Agent
jcefBridge.send('agentUpdate', data)       // 更新 Agent
jcefBridge.send('agentDelete', id)         // 删除 Agent
jcefBridge.send('skillCreate', data)       // 创建 Skill
jcefBridge.send('skillUpdate', data)       // 更新 Skill
jcefBridge.send('skillDelete', id)         // 删除 Skill
```

#### 自定义事件列表

| 事件名 | 触发方 | 数据格式 |
|--------|--------|----------|
| `cc-message` | CCChat | `{type: 'append'\|'clear'\|'empty', role, content, id, timestamp, thinking}` |
| `cc-stream` | CCChat | `{type: 'append'\|'finish', role, content, messageId}` |
| `cc-theme` | CCApp | `{isDark, variables}` 或 `{themeId}` |
| `cc-i18n` | CCApp | `{messages}` |
| `cc-locale` | CCApp | `{locale}` |
| `cc-providers` | CCProviders | `{providers, models, agents}` |
| `cc-session-list` | CCChat | `{sessions}` |
| `cc-cli-status` | CCChat | `{version, hasUpdate}` |
| `cc-agents` | CCProviders | `{agents}` |
| `cc-skills` | CCProviders | `{skills}` |
| `cc-file-ref` | CCChat | `{path}` — 文件路径注入（来自 Project View 右键） |
| `cc-code-ref` | CCChat | `{code, source}` — 代码片段注入（来自编辑器右键） |
| `cc-file-list` | CCProviders | `{files}` — 文件搜索结果（@file 引用弹窗） |

---

### M2-012: Rewind 回溯接口 (关键新增)

| 属性 | 值 |
|------|-----|
| **功能描述** | 回滚到历史消息点，重新生成响应 |
| **优先级** | P0 |
| **依赖** | M2-001, M2-004 |
| **CLI 支持** | CLI 使用 `--resume` 机制，通过新建会话实现 |

#### UI 交互
```
┌─────────────────────────────────────────────────────────────┐
│  回溯点标记                                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ○ 回溯点 1 - 10:25  [从这重新开始]                  │   │
│  └─────────────────────────────────────────────────────┘   │
│  在消息之间显示，点击可回滚                                 │
└─────────────────────────────────────────────────────────────┘
```

#### 前端接口 (Kotlin)
```kotlin
// 位置: service/RewindService.kt
@Service(Service.Level.PROJECT)
class RewindService(val project: Project) {

    companion object {
        fun getInstance(project: Project): RewindService =
            project.getService(RewindService::class.java)
    }

    /**
     * 获取可回溯点列表
     * @param sessionId 会话 ID
     * @return 回溯点列表，每条 AI 响应都是一个回溯点
     */
    fun getRewindPoints(sessionId: String): List<RewindPoint> {
        val session = SessionService.getInstance(project).getSession(sessionId)
            ?: return emptyList()

        return session.messages.mapIndexedNotNull { index, message ->
            if (message.role == Role.ASSISTANT && index > 0) {
                RewindPoint(
                    id = message.id,
                    index = index,
                    preview = message.content.take(50),
                    timestamp = message.timestamp
                )
            } else null
        }
    }

    /**
     * 执行回溯：基于指定消息重新发起对话
     * @param sessionId 原会话 ID
     * @param rewindPointId 回溯点 ID
     * @return 新会话 ID（CLI 返回的 session_id 后续异步更新）
     */
    fun rewind(sessionId: String, rewindPointId: String): String? {
        val session = SessionService.getInstance(project).getSession(sessionId) ?: return null

        val rewindPointIndex = session.messages.indexOfFirst { it.id == rewindPointId }
        if (rewindPointIndex < 0) return null

        // 1. 创建新会话
        val newSession = SessionService.getInstance(project).createSession(
            workingDir = session.workingDir
        )

        // 2. 复制回溯点之前的消息
        session.messages.take(rewindPointIndex).forEach { newSession.messages.add(it.copy()) }

        // 3. 保存新会话
        SessionService.getInstance(project).saveSession(newSession)

        return newSession.id
    }
}

data class RewindPoint(
    val id: String,
    val index: Int,
    val preview: String,
    val timestamp: Instant
)
```

#### JS 回调接口
```javascript
// 位置: resources/web/chat.js
function showRewindPoints() {
    document.querySelectorAll('.rewind-point').forEach(point => {
        point.addEventListener('click', () => {
            const pointId = point.dataset.pointId;
            window.rewindCallback.invoke(pointId);
        });
    });
}
```

---

### M2-013: 选中文本发送接口 (关键新增)

| 属性 | 值 |
|------|-----|
| **功能描述** | 发送编辑器中选中的代码到对话 |
| **优先级** | P0 |
| **依赖** | M2-001 |
| **快捷键** | `Ctrl+Alt+K` |

#### 前端接口 (Kotlin)
```kotlin
// 位置: editor/SelectedTextHandler.kt
class SelectedTextHandler(private val project: Project) : AnActionHandler {

    override fun handleEditorAction(editor: TextEditor, event: InputEvent?): Boolean {
        val selectionModel = editor.editor.selectionModel
        val selectedText = selectionModel.selectedText

        if (selectedText.isNullOrBlank()) {
            Messages.showInfoMessage("请先选择代码", "提示")
            return false
        }

        // 获取或创建当前会话
        val chatPanel = ToolWindowManager.getInstance(project)
            .getToolWindow("CC Assistant")?.contentManager
            ?.selectedContent?.component as? ChatPanel

        if (chatPanel == null) {
            // 打开 ToolWindow
            val toolWindow = ToolWindowManager.getInstance(project)
                .getOrActivateToolWindow("CC Assistant") ?: return false
            return false  // ChatPanel 会在激活后处理
        }

        // 追加选中内容到输入框
        chatPanel.appendToInput("[选中代码]\n${selectedText}\n[/选中代码]\n")
        return true
    }
}
```

#### ChatPanel 扩展
```kotlin
// 位置: ui/chat/ChatPanel.kt
class ChatPanel(private val project: Project) : JPanel() {

    /**
     * 追加文本到输入框（用于选中文本发送）
     */
    fun appendToInput(text: String) {
        inputArea.text = inputArea.text + text
        inputArea.caretPosition = inputArea.document.length
        inputArea.requestFocus()
    }
}
```

---

### M2-014: Diff 审查接口 (关键新增)

| 属性 | 值 |
|------|-----|
| **功能描述** | AI 修改文件前预览差异，用户确认后应用 |
| **优先级** | P0 |
| **依赖** | M2-010, Git4Idea |

#### UI 交互
```
┌─────────────────────────────────────────────────────────────┐
│  Diff 审查弹窗                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📝 App.kt - 建议修改                          [✕]  │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ - 原始内容                    + 建议修改            │   │
│  │   if (dir == null)          │   if (dir == null)   │   │
│  │   │                           │   if (dir.isEmpty())│   │
│  │   │ return                    │   return            │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │              [拒绝]              [应用修改]         │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

#### 前端接口 (Kotlin)
```kotlin
// 位置: ui/dialog/DiffReviewDialog.kt
class DiffReviewDialog(
    private val project: Project,
    private val filePath: String,
    private val originalContent: String,
    private val suggestedContent: String,
    private val onAccept: () -> Unit,
    private val onReject: () -> Unit
) : DialogWrapper(project) {

    override fun createCenterPanel(): JComponent {
        return DiffViewer.create(
            project,
            filePath,
            originalContent,
            suggestedContent,
            onAccept,
            onReject
        )
    }
}

// 位置: ui/diff/DiffViewer.kt
object DiffViewer {

    fun create(
        project: Project,
        filePath: String,
        original: String,
        suggested: String,
        onAccept: () -> Unit,
        onReject: () -> Unit
    ): JComponent {
        val diffPanel = DiffPanel(project)

        // 使用 IntelliJ 内置 Diff 机制
        val originalDocument = EditorFactory.getInstance().createDocument(original)
        val suggestedDocument = EditorFactory.getInstance().createDocument(suggested)

        diffPanel.setContent(
            DiffManager.getInstance().createFileEditor(
                OriginalContent(originalDocument),
                ModifiedContent(suggestedDocument)
            )
        )

        return JPanel(BorderLayout()).apply {
            add(diffPanel.component, BorderLayout.CENTER)

            val buttonPanel = JPanel(FlowLayout(FlowLayout.RIGHT)).apply {
                add(JButton("拒绝").apply {
                    addActionListener {
                        onReject()
                        close(CANCEL_EXIT_CODE)
                    }
                })
                add(JButton("应用修改").apply {
                    addActionListener {
                        onAccept()
                        close(OK_EXIT_CODE)
                    }
                })
            }
            add(buttonPanel, BorderLayout.SOUTH)
        }
    }
}
```

#### JS 回调接口
```javascript
// 位置: resources/web/chat.js
function showDiffButton(button, originalContent, suggestedContent) {
    button.addEventListener('click', async () => {
        const result = await window.diffCallback.invoke({
            filePath: button.dataset.filePath,
            original: originalContent,
            suggested: suggestedContent
        });
        if (result.accepted) {
            showNotification('修改已应用');
        }
    });
}
```

---

### M2-C5: 历史会话加载接口

| 属性 | 值 |
|------|-----|
| **功能描述** | 从历史会话面板加载会话，复制到新 Tab |
| **优先级** | P1 |
| **依赖** | M2-004, M2-006 |
| **关键语义** | COPY (复制) 而非 MOVE (移动)，原会话不受影响 |

#### UI 交互
```
┌─────────────────────────────────────────────────────────────┐
│  历史会话面板 → 加载到新 Tab                               │
│  点击会话 → 创建新 Tab，复制完整消息                         │
│                                                             │
│  Tab1 (当前)          Tab2 (新 Tab)                        │
│  ┌─────────────┐      ┌─────────────┐                    │
│  │ 你好        │      │ 你好        │ ← 复制自 Tab1       │
│  │ AI: 嗨！    │      │ AI: 嗨！    │ ← 复制自 Tab1       │
│  │ 你好吗？    │      │ 你好吗？    │ ← 复制自 Tab1       │
│  └─────────────┘      │ (新消息...) │ ← 新增             │
│                       └─────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

#### 前端接口 (Kotlin)
```kotlin
// 位置: ui/chat/SessionTabBar.kt
/**
 * 加载会话到新 Tab (复制，非移动)
 * @param sessionId 要加载的会话 ID
 * @return 新创建的 Tab 对应的会话 ID
 */
fun loadSessionAsNewTab(sessionId: String): String? {
    val sourceSession = SessionService.getInstance(project).getSession(sessionId)
        ?: return null

    // 1. 创建新会话 (UUID 新建，sessionId 置空)
    val newSession = Session(
        id = UUID.randomUUID().toString(),
        sessionId = null,  // CLI 首次调用后返回新的 session_id
        title = "[引用] ${sourceSession.title}",
        createdAt = Instant.now(),
        workingDir = sourceSession.workingDir,
        messages = sourceSession.messages.toMutableList(),  // 深拷贝消息
        isFavorite = false
    )

    // 2. 保存新会话
    SessionService.getInstance(project).saveSession(newSession)

    // 3. 创建新 Tab
    addSessionTab(newSession)
    switchToSession(newSession.id)

    return newSession.id
}
```

#### JS 回调接口
```javascript
// 位置: resources/web/chat.js
// 历史会话面板点击事件
function onHistorySessionClick(sessionId) {
    // 通过 JBCefJSQuery 调用 Java
    window.loadSessionCallback.invoke(sessionId);
}
```

---

### M2-C6: 消息引用 (Quote) 接口

| 属性 | 值 |
|------|-----|
| **功能描述** | 引用其他会话的消息追加到当前输入框 |
| **优先级** | P1 |
| **依赖** | M2-004, M2-010 (JCEF) |
| **触发方式** | 长按/右键 AI 消息 → "引用此消息" |
| **核心区别** | Rewind 丢弃后续消息；Quote 保留当前对话 |

#### UI 交互
```
┌─────────────────────────────────────────────────────────────┐
│  引用显示格式                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ↩ 引用自 [代码优化讨论 - 10:30]:                     │   │
│  │ "建议将这个方法抽取为独立函数，可以提高可读性..."     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  输入框追加:                                               │
│  > 引用自 [代码优化讨论 - 10:30]:                          │
│  > 建议将这个方法抽取为独立函数，可以提高可读性...          │
│                                                             │
│  [发送]                                                    │
└─────────────────────────────────────────────────────────────┘
```

#### 消息右键菜单
```
AI 消息气泡 (JCEF)
├── 复制
├── 引用此消息        ← 新增
├── 重新生成
└── [分隔线]
    回溯到此处        ← M2-C2 Rewind
```

#### 前端接口 (Kotlin)
```kotlin
// 位置: ui/chat/ChatPanel.kt
/**
 * 追加引用文本到输入框
 * @param quotedMessage 引用消息的内容
 * @param sourceSessionTitle 来源会话标题
 * @param timestamp 时间戳 (格式: HH:mm)
 */
fun appendQuoteToInput(
    quotedMessage: String,
    sourceSessionTitle: String,
    timestamp: String
) {
    val formattedQuote = buildString {
        appendLine("> 引用自 [$sourceSessionTitle - $timestamp]:")
        quotedMessage.lines().forEach { line ->
            append("> ")
            appendLine(line)
        }
        appendLine()
    }
    appendToInput(formattedQuote)
}
```

#### SessionService 扩展
```kotlin
// 位置: service/SessionService.kt
/**
 * 获取消息详情 (用于引用)
 * @param sessionId 会话 ID
 * @param messageId 消息 ID
 * @return 消息内容及元信息
 */
fun getMessageDetail(sessionId: String, messageId: String): MessageDetail? {
    val session = getSession(sessionId) ?: return null
    val message = session.messages.find { it.id == messageId } ?: return null

    return MessageDetail(
        content = message.content,
        sessionTitle = session.title,
        timestamp = DateTimeFormatter.ofPattern("HH:mm").format(message.timestamp),
        role = message.role
    )
}

data class MessageDetail(
    val content: String,
    val sessionTitle: String,
    val timestamp: String,
    val role: Role
)
```

#### JS 回调接口
```javascript
// 位置: resources/web/chat.js
// AI 消息气泡右键菜单
function showAIMessageContextMenu(event, messageId, sessionId) {
    event.preventDefault();

    const contextMenu = document.createElement('div');
    contextMenu.className = 'context-menu';
    contextMenu.innerHTML = `
        <div class="menu-item" data-action="copy">复制</div>
        <div class="menu-item" data-action="quote">引用此消息</div>
        <div class="menu-item" data-action="regenerate">重新生成</div>
        <div class="menu-separator"></div>
        <div class="menu-item" data-action="rewind">回溯到此处</div>
    `;

    contextMenu.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', () => {
            const action = item.dataset.action;
            if (action === 'quote') {
                // 获取消息内容并调用 Java
                const content = event.target.closest('.message-content').innerText;
                window.quoteCallback.invoke({
                    messageId: messageId,
                    sessionId: sessionId,
                    content: content
                });
            }
            // ... 其他 action 处理
            closeContextMenu();
        });
    });

    document.body.appendChild(contextMenu);
    positionContextMenu(contextMenu, event);
}
```

#### 引用文本格式化规则
```kotlin
// 位置: service/QuoteService.kt
/**
 * 格式化引用文本
 * - 移除 Markdown 格式符号，保留纯文本
 * - 截断超长引用 (超过 500 字符截断并添加 "...")
 * - 处理多行引用
 */
fun formatQuote(message: MessageDetail): String {
    val plainText = stripMarkdown(message.content)
    val truncated = if (plainText.length > 500) {
        plainText.take(500) + "..."
    } else {
        plainText
    }

    return buildString {
        appendLine("> 引用自 [${message.sessionTitle} - ${message.timestamp}]:")
        truncated.lines().forEach { line ->
            append("> ")
            appendLine(line)
        }
        appendLine()
    }
}

private fun stripMarkdown(text: String): String {
    return text
        .replace(Regex("```[\\s\\S]*?```"), "[代码块]")  // 代码块
        .replace(Regex("`[^`]+`"), "[代码]")            // 行内代码
        .replace(Regex("\\*\\*([^*]+)\\*\\*"), "$1")    // 粗体
        .replace(Regex("\\*([^*]+)\\*"), "$1")          // 斜体
        .replace(Regex("\\[([^\\]]+)\\]\\([^)]+\\)"), "$1")  // 链接
        .trim()
}
```

---

## M3: MCP 支持

### M3-001: MCP 工具调用显示接口

| 属性 | 值 |
|------|-----|
| **功能描述** | 显示 AI 正在调用的 MCP 工具状态 |
| **优先级** | P0 |
| **依赖** | M2 |
| **权限模式** | MVP 使用 `accept-all`，不弹窗确认 |

#### UI 交互
```
┌─────────────────────────────────────────────────────────────┐
│  工具调用状态卡片                                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🟠 Claude Sonnet 4                                 │   │
│  │ 分析代码中...                                       │   │
│  │                                                     │   │
│  │ 🔧 工具调用                                         │   │
│  │ ┌───────────────────────────────────────────────┐ │   │
│  │ │ ✓ read_file         App.kt                  │ │   │
│  │ │ ⏳ edit_file         Service.kt              │ │   │
│  │ │ ○ run_command        gradle build            │ │   │
│  │ └───────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

#### 前端接口 (Kotlin → JS)
```kotlin
// 位置: bridge/CliBridgeService.kt callback
override fun onMessage(message: CliMessage) {
    when (message) {
        is CliMessage.ToolUseStart -> {
            ApplicationManager.invokeLater {
                when (message.status) {
                    ToolUseStatus.PENDING -> showPendingTool(message)
                    ToolUseStatus.RUNNING -> showRunningTool(message)
                    ToolUseStatus.SUCCESS -> showSuccessTool(message)
                    ToolUseStatus.ERROR -> showErrorTool(message)
                }
            }
        }
        is CliMessage.ToolUseInputDelta -> {
            // 更新工具输入
        }
    }
}
```

---

## M4: 设置 + Provider 管理

### M4-001: Provider 设置界面（左右布局）

| 属性 | 值 |
|------|-----|
| **功能描述** | 打开 Provider 设置对话框（左右布局） |
| **优先级** | P0 |
| **依赖** | M0 |
| **UI 参考** | ui.md 第 4 节 |

#### 前端接口 (Kotlin)
```kotlin
// 位置: ui/settings/ProviderSettingsPanel.kt
// 关键修正：使用 Configurable 接口
class ProviderSettingsPanel : Configurable {
    
    private val providerList = JList<ProviderConfig>()
    private val jsonEditor = JTextArea()
    private var modified = false
    
    override fun getDisplayName(): String = "Provider"
    
    override fun createComponent(): JComponent {
        val panel = JPanel().apply {
            layout = BorderLayout()
            
            // 左侧：供应商列表
            val leftPanel = JPanel().apply {
                layout = BorderLayout()
                border = BorderFactory.createTitledBorder("供应商")
                
                val toolbar = JPanel().apply {
                    add(JButton("+ 新增供应商").apply {
                        addActionListener { showAddProviderDialog() }
                    })
                    add(JButton("刷新").apply {
                        addActionListener { loadProviders() }
                    })
                }
                
                add(toolbar, BorderLayout.NORTH)
                add(JScrollPane(providerList), BorderLayout.CENTER)
            }
            
            // 右侧：JSON 编辑器
            val rightPanel = JPanel().apply {
                layout = BorderLayout()
                border = BorderFactory.createTitledBorder("配置预览")
                add(JScrollPane(jsonEditor), BorderLayout.CENTER)
            }
            
            val splitPane = JSplitPane(JSplitPane.HORIZONTAL_SPLIT, leftPanel, rightPanel)
            splitPane.resizeWeight = 0.3
            
            add(splitPane, BorderLayout.CENTER)
        }
        
        providerList.addListSelectionListener {
            jsonEditor.text = Gson().toJson(providerList.selectedValue)
        }
        
        loadProviders()
        return panel
    }
    
    override fun isModified(): Boolean = modified
    
    override fun apply() {
        // 保存配置
        modified = false
    }
}
```

---

### M4-002: Provider 切换接口

| 属性 | 值 |
|------|-----|
| **功能描述** | 切换到指定的 Provider，更新 ~/.claude/settings.json |
| **优先级** | P0 |
| **依赖** | M4-001 |
| **上下文处理** | 提示用户当前对话将结束 |

#### 前端接口 (Kotlin)
```kotlin
// 位置: ui/chat/ProviderSelector.kt
class ProviderSelector : JComboBox<ProviderConfig>() {
    
    init {
        val providers = ProviderService.getInstance().allProviders
        providers.forEach { addItem(it) }
        selectedItem = providers.find { it.id == currentProviderId }
        
        addActionListener {
            val selected = selectedItem as? ProviderConfig ?: return
            switchProvider(selected.id)
        }
    }
    
    private fun switchProvider(providerId: String): Boolean {
        // 检查是否有活跃会话
        if (chatPanel.currentSessionId != null) {
            val confirm = Messages.showYesNoDialog(
                "切换供应商将结束当前对话，确定继续吗？",
                "切换供应商"
            )
            if (confirm != Messages.YES) {
                selectedItem = allProviders.find { it.id == currentProviderId }
                return false
            }
        }
        
        val success = ProviderService.getInstance().switchProvider(providerId)
        
        if (success) {
            currentProviderId = providerId
            
            // 重置会话 ID
            chatPanel.currentSessionId = null
            
            // 刷新模型列表
            modelSelector.updateModels(providerId)
            
            ApplicationManager.invokeLater {
                statusBar.showInfo("已切换到 ${getProviderName(providerId)}")
            }
        }
        
        return success
    }
}
```

---

### M4-003: API Key 配置接口 (使用 PasswordSafe)

| 属性 | 值 |
|------|-----|
| **功能描述** | 使用 IDE PasswordSafe 安全存储 API Key |
| **优先级** | P0 |
| **依赖** | M4-001 |

#### 前端接口 (Kotlin)
```kotlin
// 位置: ui/dialog/ProviderEditDialog.kt
class ProviderEditDialog(
    private val providerId: String,
    private val onSave: (String) -> Unit
) : DialogWrapper(project) {
    
    private lateinit var apiKeyField: JPasswordField
    
    override fun createCenterPanel(): JComponent {
        return JPanel().apply {
            layout = GridBagLayout()
            
            add(JLabel("API Key:"), gbc(0, 0))
            apiKeyField = JPasswordField(getCurrentApiKey(), 30)
            add(JPanel().apply {
                layout = BorderLayout()
                add(apiKeyField, BorderLayout.CENTER)
                add(JButton("👁️").apply {
                    addActionListener { toggleApiKeyVisibility() }
                }, BorderLayout.EAST)
            }, gbc(1, 0))
            
            add(JButton("验证").apply {
                addActionListener { validateApiKey() }
            }, gbc(2, 0))
        }
    }
    
    override fun doOKAction() {
        val apiKey = String(apiKeyField.password)
        saveApiKeyToPasswordSafe(providerId, apiKey)
        onSave(apiKey)
        super.doOKAction()
    }
}
```

#### 后端接口 (PasswordSafe)
```kotlin
// 位置: util/PasswordSafeUtil.kt
object PasswordSafeUtil {
    
    fun saveApiKey(providerId: String, apiKey: String) {
        val attributes = CredentialAttributes(
            "cc-assistant-provider-$providerId",
            "CC Assistant - $providerId API Key"
        )
        val credentials = Credentials("api-key", apiKey)
        PasswordSafe.getInstance().set(attributes, credentials)
    }
    
    fun getApiKey(providerId: String): String? {
        val attributes = CredentialAttributes(
            "cc-assistant-provider-$providerId",
            "CC Assistant - $providerId API Key"
        )
        val credentials = PasswordSafe.getInstance().get(attributes)
        return credentials?.getPasswordAsString()
    }
}
```

---

### M4-004: Provider 导出 JSON 接口 (关键新增)

| 属性 | 值 |
|------|-----|
| **功能描述** | 导出 Provider 配置为 JSON 文件 |
| **优先级** | P1 |
| **依赖** | M4-001 |

#### 前端接口 (Kotlin)
```kotlin
// 位置: service/ProviderService.kt
/**
 * 导出 Provider 配置
 */
fun exportProviderConfig(providerId: String): String? {
    val provider = PRESET_PROVIDERS.find { it.id == providerId } ?: return null
    
    val config = mapOf(
        "id" to provider.id,
        "name" to provider.name,
        "endpoint" to provider.endpoint,
        "defaultModel" to provider.defaultModel,
        "fastModel" to provider.fastModel
    )
    
    return Gson().toJson(config)
}

/**
 * 导入 Provider 配置
 */
fun importProviderConfig(configJson: String): ProviderConfig? {
    return try {
        val map = Gson().fromJson(configJson, Map::class.java) as? Map<String, Any>
        ProviderConfig(
            id = map?.get("id") as? String ?: return null,
            name = map?.get("name") as? String ?: return null,
            endpoint = map?.get("endpoint") as? String ?: return null,
            defaultModel = map?.get("defaultModel") as? String ?: "",
            fastModel = map?.get("fastModel") as? String ?: ""
        )
    } catch (e: Exception) {
        null
    }
}
```

---

### M4-005: Token 统计接口

| 属性 | 值 |
|------|-----|
| **功能描述** | 统计 Token 使用和成本 |
| **优先级** | P0 |
| **依赖** | M1 |

#### 前端接口 (Kotlin)
```kotlin
// 位置: service/UsageService.kt
@Service(Service.Level.APP)
class UsageService {
    
    private val sessionUsages = mutableMapOf<String, SessionUsage>()
    private val dailyUsages = mutableMapOf<LocalDate, DailyUsage>()
    
    companion object {
        fun getInstance(): UsageService =
            ApplicationManager.getApplication().getService(UsageService::class.java)
    }
    
    /**
     * 记录 Token 使用
     */
    fun recordUsage(sessionId: String, costUsd: Double, model: String) {
        val sessionUsage = sessionUsages.getOrPut(sessionId) { SessionUsage(sessionId) }
        sessionUsage.totalCost += costUsd
        sessionUsage.messageCount++
        
        val today = LocalDate.now()
        val dailyUsage = dailyUsages.getOrPut(today) { DailyUsage(today) }
        dailyUsage.totalCost += costUsd
        dailyUsage.messageCount++
        
        ApplicationManager.getApplication().messageBus
            .syncPublisher(UsageTopics.USAGE_UPDATED)
            .onUsageUpdated(sessionId, sessionUsage)
    }
    
    /**
     * 获取今日统计
     */
    fun getTodayUsage(): DailyUsage {
        val today = LocalDate.now()
        return dailyUsages.getOrPut(today) { DailyUsage(today) }
    }
}

data class SessionUsage(
    val sessionId: String,
    var totalCost: Double = 0.0,
    var messageCount: Int = 0
)

data class DailyUsage(
    val date: LocalDate,
    var totalCost: Double = 0.0,
    var messageCount: Int = 0
)
```

---

### M4-006: 基础设置接口 (关键新增)

| 属性 | 值 |
|------|-----|
| **功能描述** | CLI 版本检测、自动更新、国际化语言配置 |
| **优先级** | P0 |
| **依赖** | M0-001, M4-001 |

#### 前端接口 (Kotlin)
```kotlin
// 位置: ui/settings/BasicSettingsPanel.kt
class BasicSettingsPanel : JPanel() {

    private val cliVersionLabel = JLabel()
    private val updateButton = JButton("检测更新")
    private val languageCombo = JComboBox<Locale>()

    init {
        layout = GridBagLayout()

        // CLI 版本检测区域
        add(JLabel("CLI 版本:"), gbc(0, 0))
        cliVersionLabel.text = CliBridgeService.getInstance().getCliVersion() ?: "未安装"
        add(cliVersionLabel, gbc(1, 0))
        updateButton.addActionListener { checkForUpdate() }
        add(updateButton, gbc(2, 0))

        // 自动更新开关
        val autoCheckUpdate = JCheckBox("启动时自动检测 CLI 更新", true)
        add(autoCheckUpdate, gbc(0, 1, 3))

        // 语言选择
        add(JLabel("界面语言:"), gbc(0, 2))
        languageCombo.setModel(DefaultComboBoxModel(arrayOf(
            Locale.SIMPLIFIED_CHINESE,  // 简体中文 (默认)
            Locale.TRADITIONAL_CHINESE, // 繁体中文
            Locale.ENGLISH,             // English
            Locale.JAPANESE             // 日本語
        )))
        languageCombo.selectedItem = I18nService.getInstance().getCurrentLocale()
        languageCombo.renderer = LocaleListCellRenderer()
        add(languageCombo, gbc(1, 2, 2))
    }

    private fun checkForUpdate() {
        val updateResult = CliUpdateService.getInstance().checkForUpdate()
        if (updateResult.hasUpdate) {
            val confirm = Messages.showYesNoDialog(
                "发现新版本 ${updateResult.latestVersion}，是否立即更新？\n当前版本: ${updateResult.currentVersion}",
                "CLI 更新"
            )
            if (confirm == Messages.YES) {
                CliUpdateService.getInstance().performUpdate()
            }
        } else {
            Messages.showInfoMessage("当前已是最新版本 ${updateResult.currentVersion}", "CLI 更新")
        }
    }
}

// 位置: service/CliUpdateService.kt
@Service(Service.Level.APP)
class CliUpdateService {

    companion object {
        fun getInstance(): CliUpdateService =
            ApplicationManager.getApplication().getService(CliUpdateService::class.java)
    }

    /**
     * 检查 CLI 更新
     */
    fun checkForUpdate(): UpdateResult {
        val currentVersion = CliBridgeService.getInstance().getCliVersion()
            ?: return UpdateResult(null, null, false)

        val latestVersion = getLatestVersion()
        val hasUpdate = latestVersion != null && latestVersion != currentVersion

        return UpdateResult(currentVersion, latestVersion, hasUpdate)
    }

    /**
     * 执行更新
     */
    fun performUpdate(): Boolean {
        return try {
            val process = ProcessBuilder("npm", "update", "-g", "@anthropic-ai/claude-code")
                .redirectErrorStream(true)
                .start()
            process.waitFor(60, TimeUnit.SECONDS)
            process.exitValue() == 0
        } catch (e: Exception) {
            false
        }
    }

    private fun getLatestVersion(): String? {
        return try {
            val process = ProcessBuilder("npm", "view", "@anthropic-ai/claude-code", "version")
                .redirectErrorStream(true)
                .start()
            val output = process.inputStream.bufferedReader().readText().trim()
            process.waitFor(10, TimeUnit.SECONDS)
            output
        } catch (e: Exception) {
            null
        }
    }
}

data class UpdateResult(
    val currentVersion: String?,
    val latestVersion: String?,
    val hasUpdate: Boolean
)
```

#### 国际化服务接口
```kotlin
// 位置: service/I18nService.kt
@Service(Service.Level.APP)
class I18nService {

    companion object {
        fun getInstance(): I18nService =
            ApplicationManager.getApplication().getService(I18nService::class.java)
    }

    /** 支持的语言列表 */
    val supportedLocales: List<Locale> = listOf(
        Locale.SIMPLIFIED_CHINESE,
        Locale.TRADITIONAL_CHINESE,
        Locale.ENGLISH,
        Locale.JAPANESE
    )

    /**
     * 获取当前语言
     */
    fun getCurrentLocale(): Locale {
        return ConfigService.getInstance().state.locale
    }

    /**
     * 设置语言 (重启后生效)
     */
    fun setLocale(locale: Locale) {
        ConfigService.getInstance().state.locale = locale
    }

    /**
     * 获取国际化字符串
     */
    fun getMessage(key: String): String {
        return MyBundle.getResourceBundle(getCurrentLocale()).getString(key)
    }
}

// AppConfigState 扩展
data class AppConfigState(
    var cliPath: String = "",
    var autoSaveSession: Boolean = true,
    var autoCheckUpdate: Boolean = true,
    var locale: Locale = Locale.SIMPLIFIED_CHINESE,
    var themeConfig: ThemeConfig = ThemeConfig()
)
```

---

### M4-007: 外观设置接口 (关键新增)

| 属性 | 值 |
|------|-----|
| **功能描述** | 主题切换、对话背景、消息气泡背景配置 |
| **优先级** | P0 |
| **依赖** | M4-001, M2-010 (JCEF) |

#### 前端接口 (Kotlin)
```kotlin
// 位置: ui/settings/AppearanceSettingsPanel.kt
class AppearanceSettingsPanel(private val project: Project) : JPanel() {

    private val themeCombo = JComboBox<String>()
    private val chatBgTypeCombo = JComboBox<BackgroundType>()
    private val chatBgColorChooser = JButton()
    private val chatBgImageField = JTextField()
    private val userBubbleColor = JButton()
    private val aiBubbleColor = JButton()
    private val resetButton = JButton("恢复默认")

    init {
        layout = GridBagLayout()

        // 主题切换
        add(JLabel("主题:"), gbc(0, 0))
        themeCombo.setModel(DefaultComboBoxModel(arrayOf(
            "跟随 IDE (默认)", "暗色经典", "暗色护眼", "浅色经典"
        )))
        add(themeCombo, gbc(1, 0, 2))

        // 对话背景
        add(JLabel("对话背景:"), gbc(0, 1))
        chatBgTypeCombo.setModel(DefaultComboBoxModel(BackgroundType.values()))
        add(chatBgTypeCombo, gbc(1, 1))

        chatBgColorChooser.text = "选择颜色"
        chatBgColorChooser.addActionListener { chooseChatBgColor() }
        add(chatBgColorChooser, gbc(2, 1))

        add(JButton("选择图片").apply {
            addActionListener { chooseChatBgImage() }
        }, gbc(1, 2))
        add(chatBgImageField, gbc(2, 2))

        // 消息气泡背景
        add(JLabel("用户气泡颜色:"), gbc(0, 3))
        userBubbleColor.background = Color(0x3B, 0x82, 0xF6)
        userBubbleColor.addActionListener { chooseBubbleColor("user") }
        add(userBubbleColor, gbc(1, 3, 2))

        add(JLabel("AI 气泡颜色:"), gbc(0, 4))
        aiBubbleColor.background = Color(0x2D, 0x2D, 0x30)
        aiBubbleColor.addActionListener { chooseBubbleColor("ai") }
        add(aiBubbleColor, gbc(1, 4, 2))

        // 恢复默认
        add(resetButton, gbc(0, 5))
        resetButton.addActionListener { resetToDefaults() }
    }
}

enum class BackgroundType { FOLLOW_THEME, SOLID_COLOR, IMAGE }
```

#### 主题服务接口
```kotlin
// 位置: service/ThemeService.kt
@Service(Service.Level.APP)
class ThemeService : Disposable {

    companion object {
        fun getInstance(): ThemeService =
            ApplicationManager.getApplication().getService(ThemeService::class.java)
    }

    /**
     * 获取当前主题配置
     */
    fun getActiveTheme(): ThemeConfig {
        return ConfigService.getInstance().state.themeConfig
    }

    /**
     * 应用主题
     * @param themeConfig 主题配置
     */
    fun applyTheme(themeConfig: ThemeConfig) {
        // 1. 更新 JCEF CSS 变量
        val browser = getActiveBrowser() ?: return
        browser.executeJavaScript("""
            document.documentElement.style.setProperty('--chat-bg', '${themeConfig.chatBgCss}');
            document.documentElement.style.setProperty('--user-bubble-bg', '${themeConfig.userBubbleColor}');
            document.documentElement.style.setProperty('--ai-bubble-bg', '${themeConfig.aiBubbleColor}');
        """)

        // 2. 如果有背景图片，设置到 body
        if (themeConfig.chatBgType == BackgroundType.IMAGE && themeConfig.chatBgImage != null) {
            browser.executeJavaScript("""
                document.body.style.backgroundImage = 'url(file://${themeConfig.chatBgImage})';
            """)
        }

        // 3. 持久化
        ConfigService.getInstance().state.themeConfig = themeConfig
    }

    /**
     * 监听 IDE 主题变更 (LaF 变更时自动同步)
     */
    fun onIdeThemeChanged() {
        val currentTheme = getActiveTheme()
        if (currentTheme.themeMode == "follow_ide") {
            applyTheme(currentTheme.copy(
                isDark = UIManager.getColor("Panel.background").red < 128
            ))
        }
    }

    override fun dispose() {}
}

/**
 * 主题配置
 */
data class ThemeConfig(
    var themeMode: String = "follow_ide",     // follow_ide / dark_classic / dark_eye / light_classic
    var isDark: Boolean = true,
    var chatBgType: BackgroundType = BackgroundType.FOLLOW_THEME,
    var chatBgColor: String = "#1E1E1E",
    var chatBgImage: String? = null,
    var userBubbleColor: String = "#3B82F6",
    var aiBubbleColor: String = "#2D2D30"
) : PersistentStateComponent<ThemeConfig> {
    override fun getState(): ThemeConfig = this
    override fun loadState(state: ThemeConfig) {
        this.themeMode = state.themeMode
        this.isDark = state.isDark
        this.chatBgType = state.chatBgType
        this.chatBgColor = state.chatBgColor
        this.chatBgImage = state.chatBgImage
        this.userBubbleColor = state.userBubbleColor
        this.aiBubbleColor = state.aiBubbleColor
    }
}
```

---

## M5: 打磨上线

### M5-001: @file 文件引用接口 (关键新增)

| 属性 | 值 |
|------|-----|
| **功能描述** | 用户在输入框输入 @ 引用文件 |
| **优先级** | P1 |
| **依赖** | M2 |

#### UI 交互
```
┌─────────────────────────────────────────────────────────────┐
│  输入框 @ 引用弹窗                                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 请帮我分析 @App 这段代码                   [发送 ↑] │   │
│  │              ↑                                       │   │
│  │              光标位置                                │   │
│  └─────────────────────────────────────────────────────┘   │
│       │                                                     │
│       │ 用户输入 @ 字符                                    │
│       ▼                                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🔍 搜索文件...                                       │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ 📄 App.kt                          src/main/kotlin  │   │
│  │ 📄 Service.kt                      src/main/kotlin  │   │
│  │ 📁 utils/                          src/main/kotlin  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

#### 前端接口 (Kotlin)
```kotlin
// 位置: ui/chat/FileReferencePopup.kt
class FileReferencePopup(
    private val inputArea: JTextArea,
    private val project: Project
) : JWindow() {
    
    private val fileList = JList<FileItem>()
    private val filterField = JTextField()
    
    init {
        inputArea.addKeyListener(object : KeyAdapter() {
            override fun keyTyped(e: KeyEvent) {
                if (e.keyChar == '@') {
                    showPopup()
                }
            }
        })
        
        fileList.addListSelectionListener {
            if (it.valueIsAdjusting) {
                val selected = fileList.selectedValue
                insertFileReference(selected)
                dispose()
            }
        }
    }
    
    private fun insertFileReference(file: FileItem) {
        val caretPos = inputArea.caretPosition
        val text = inputArea.text
        
        val atPos = text.lastIndexOf('@', caretPos)
        
        val newText = text.substring(0, atPos) + "@${file.name}" + text.substring(caretPos)
        inputArea.text = newText
        inputArea.caretPosition = atPos + file.name.length + 1
    }
}
```

---

### M5-002: Slash 指令接口

| 属性 | 值 |
|------|-----|
| **功能描述** | 用户输入 / 执行斜杠指令 |
| **优先级** | P2 |
| **依赖** | M2 |
| **方案决策** | 指令作为 prompt 发送给 CLI |

#### 前端接口 (Kotlin)
```kotlin
// 位置: ui/chat/SlashCommandPopup.kt
class SlashCommandPopup(
    private val inputArea: JTextArea,
    private val project: Project
) : JWindow() {
    
    private val commandList = JList<SlashCommand>()
    
    init {
        inputArea.addKeyListener(object : KeyAdapter() {
            override fun keyTyped(e: KeyEvent) {
                if (e.keyChar == '/') {
                    showPopup()
                }
            }
        })
        
        commandList.addListSelectionListener {
            if (it.valueIsAdjusting) {
                val selected = commandList.selectedValue
                insertCommand(selected)
                dispose()
            }
        }
    }
    
    private fun insertCommand(command: SlashCommand) {
        val caretPos = inputArea.caretPosition
        val text = inputArea.text
        
        val slashPos = text.lastIndexOf('/', caretPos)
        
        val newText = text.substring(0, slashPos) + "/" + command.id + text.substring(caretPos)
        inputArea.text = newText
        inputArea.caretPosition = slashPos + command.id.length + 1
        
        // 关键修正：不在这里执行，让用户点击发送
        // 指令会作为 prompt 发送给 CLI
    }
}
```

---

### M5-003: 权限确认接口 (M5 扩展)

| 属性 | 值 |
|------|-----|
| **功能描述** | MCP 工具调用权限确认（delegate 模式） |
| **优先级** | P2 |
| **依赖** | M3 |
| **说明** | MVP 使用 `accept-all`，M5 扩展 `delegate` 模式 |

#### 前端接口 (Kotlin)
```kotlin
// 位置: ui/dialog/PermissionDialog.kt
class PermissionDialog(
    private val toolName: String,
    private val toolInput: Map<String, Any>,
    private val onApprove: (Boolean) -> Unit
) : DialogWrapper(project) {
    
    override fun createCenterPanel(): JComponent {
        return JPanel().apply {
            layout = BorderLayout()
            
            add(JLabel("工具: $toolName"), BorderLayout.NORTH)
            
            val preview = JTextArea().apply {
                text = Gson().toJson(toolInput)
                isEditable = false
            }
            add(JScrollPane(preview), BorderLayout.CENTER)
            
            val buttonPanel = JPanel().apply {
                add(JButton("批准").apply {
                    addActionListener { 
                        onApprove(true)
                        dispose()
                    }
                })
                add(JButton("拒绝").apply {
                    addActionListener { 
                        onApprove(false)
                        dispose()
                    }
                })
            }
            add(buttonPanel, BorderLayout.SOUTH)
        }
    }
}
```

---

### M5-001b: SendFileToChat Action (右键文件引用)

| 属性 | 值 |
|------|-----|
| **功能描述** | Project View 文件右键 → 将文件路径注入聊天输入框 |
| **优先级** | P1 |
| **依赖** | M2-010 (JCEF), plugin.xml 注册 |

#### Kotlin 实现
```kotlin
// 位置: action/SendFileToChatAction.kt
class SendFileToChatAction : AnAction() {
    override fun actionPerformed(e: AnActionEvent) {
        val project = e.project ?: return
        val files = e.getData(CommonDataKeys.VIRTUAL_FILE_ARRAY) ?: return
        val panel = ReactChatPanel.getInstance(project) ?: return
        files.forEach { panel.insertFileReference(it.path) }
    }
    override fun update(e: AnActionEvent) {
        val project = e.project
        val files = e.getData(CommonDataKeys.VIRTUAL_FILE_ARRAY)
        e.presentation.isEnabledAndVisible =
            project != null && !files.isNullOrEmpty() && ReactChatPanel.getInstance(project) != null
    }
}
```

#### plugin.xml 注册
```xml
<action id="CCAssistant.SendFileToChat"
        class="com.github.xingzhewa.ccassistant.action.SendFileToChatAction"
        text="Send to CC Assistant">
    <add-to-group group-id="ProjectViewPopupMenu" anchor="last"/>
</action>
```

#### JCEF Bridge (Java → JS)
```typescript
// JcefChatPanel.insertFileReference(path) → CCChat.insertFileReference(path)
// JS 事件: cc-file-ref { path: string }
// 前端处理: setInputValue(inputValue + '\n@' + path)
```

---

### M5-001c: SendSelectionToChat Action (右键代码引用)

| 属性 | 值 |
|------|-----|
| **功能描述** | 编辑器选中文本右键 → 将代码片段注入聊天输入框 |
| **优先级** | P1 |
| **依赖** | M2-010 (JCEF), plugin.xml 注册 |

#### Kotlin 实现
```kotlin
// 位置: action/SendSelectionToChatAction.kt
class SendSelectionToChatAction : AnAction() {
    override fun actionPerformed(e: AnActionEvent) {
        val project = e.project ?: return
        val editor = e.getData(CommonDataKeys.EDITOR) ?: return
        val selectedText = editor.selectionModel.selectedText ?: return
        val file = e.getData(CommonDataKeys.VIRTUAL_FILE) ?: return
        val panel = ReactChatPanel.getInstance(project) ?: return
        val lineNumber = editor.caretModel.logicalPosition.line + 1
        panel.insertCodeReference(selectedText, "${file.path}:${lineNumber}")
    }
    override fun update(e: AnActionEvent) {
        val project = e.project
        val editor = e.getData(CommonDataKeys.EDITOR)
        val hasSelection = editor?.selectionModel?.hasSelection() == true
        e.presentation.isEnabledAndVisible =
            project != null && hasSelection && ReactChatPanel.getInstance(project) != null
    }
}
```

#### plugin.xml 注册
```xml
<action id="CCAssistant.SendSelectionToChat"
        class="com.github.xingzhewa.ccassistant.action.SendSelectionToChatAction"
        text="Send to CC Assistant">
    <add-to-group group-id="EditorPopupMenu" anchor="last"/>
</action>
```

#### JCEF Bridge (Java → JS)
```typescript
// JcefChatPanel.insertCodeReference(code, source) → CCChat.insertCodeReference(code, source)
// JS 事件: cc-code-ref { code: string, source: string }
// 前端处理: setInputValue(inputValue + '\n// From: source\ncode')
```

---

### M2-015: 文件附件接口

| 属性 | 值 |
|------|-----|
| **功能描述** | 用户通过文件选择器或拖拽附加文件到消息 |
| **优先级** | P1 |
| **依赖** | M2-010 (JCEF InputArea) |

#### 前端数据模型
```typescript
// 位置: types/mock.ts
interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'file';
  path?: string;       // JCEF 环境下由 Java 设置
  dataUrl?: string;    // 图片 base64 (开发模式)
  size?: number;       // 文件大小 (bytes)
}

interface SendOptions {
  stream?: boolean;
  think?: boolean;
  mode?: string;
  model?: string;
  provider?: string;
  attachments?: Attachment[];  // 新增
}
```

#### 前端组件
```typescript
// 位置: components/input/AttachmentPreview.tsx
// 附件预览条：图片缩略图 / 文件图标 + 名称 + 删除按钮
// 触发方式: InputBox 隐藏 <input type="file"> (forwardRef + useImperativeHandle)
```

#### JCEF Bridge (JS → Java)
```typescript
// 发送消息时附带附件信息
jcefBridge.sendMessage(text, options)  // options.attachments 包含附件列表
```

#### Kotlin 侧扩展
```kotlin
// CliBridgeService.kt 扩展
data class Attachment(val name: String, val type: String, val path: String?, val content: String?)

fun executePrompt(
    prompt: String,
    workingDir: String? = null,
    sessionId: String? = null,
    model: String? = null,
    attachments: List<Attachment> = emptyList()  // 新增
): Boolean
```

---

### M2-016: 图片粘贴接口

| 属性 | 值 |
|------|-----|
| **功能描述** | 在输入框粘贴剪贴板图片，自动添加为附件 |
| **优先级** | P1 |
| **依赖** | M2-015 |

#### 前端实现
```typescript
// 位置: components/input/InputBox.tsx
const handlePaste = (e: React.ClipboardEvent) => {
  const items = e.clipboardData?.items;
  if (!items) return;
  for (const item of Array.from(items)) {
    if (item.type.startsWith('image/')) {
      e.preventDefault();
      const file = item.getAsFile();
      if (file && onImagePaste) onImagePaste(file);
      return;
    }
  }
};
```

#### 数据流
```
用户 Ctrl+V → InputBox.onPaste → 检测 image/* → FileReader.readAsDataURL
→ chatStore.addAttachment(file) → 生成 Attachment { type: 'image', dataUrl }
→ AttachmentPreview 显示缩略图
→ sendMessage 时 Attachment 随 SendOptions 发送给 Java
```

---

### M2-011b 扩展: 强化提示词接口

| 属性 | 值 |
|------|-----|
| **功能描述** | 结构化提示词增强，支持模板/角色/格式/约束条件 |
| **优先级** | P1 |
| **依赖** | M2-011 (JCEF Bridge) |

#### 前端数据模型
```typescript
interface PromptTemplate {
  id: string;
  name: string;
  icon: string;
  role: string;           // e.g. 'Senior Developer'
  format: string[];       // e.g. ['markdown', 'code']
  constraints: string;
  examples?: Array<{ input: string; output: string }>;
  language: string;       // 输出语言 'zh-CN' | 'en-US' | 'ja-JP'
  systemPrefix: string;   // 拼接在用户输入前的系统提示
}
```

#### 前端组件
```typescript
// 位置: components/input/PromptEnhancePanel.tsx
// Modal: 左侧预设模板列表 + 右侧编辑器 + 底部预览
// 6 个预设模板: 代码优化 / Bug 分析 / 代码审查 / 文档生成 / 测试用例 / 重构建议
```

#### JCEF Bridge (JS → Java, 预留)
```typescript
// 当前: 前端本地生成增强后的 prompt
// 未来扩展: AI 驱动的提示词增强
jcefBridge.enhancePrompt(text, options: {
  templateId?: string;
  role?: string;
  format?: string[];
  constraints?: string;
  language?: string;
})

// Java → JS 返回增强结果
CCChat.setEnhancedPrompt(enhancedText: string)
```

---

### M2-017: AIStatusBar 状态栏接口 (v6.1 新增)

| 属性 | 值 |
|------|-----|
| **功能描述** | 输入区顶部的 AI 状态栏，始终可见，显示任务状态/子代理/diff 统计 |
| **优先级** | P0 |
| **依赖** | M2-011 (JCEF Bridge) |

#### 前端数据模型
```typescript
type AgentStatus = 'idle' | 'thinking' | 'working' | 'waiting';

interface AIStatusBarProps {
  status: AgentStatus;       // 当前 AI 状态
  statusMessage: string;     // 状态描述文字
  subAgentName: string | null; // 子代理名称
  diffFiles: MockDiffFile[]; // diff 文件列表
}

interface MockDiffFile {
  name: string;
  add: number;
  del: number;
}
```

#### 状态转换流
```
用户发送消息 → agentStatus: 'thinking', statusMessage: 'Analyzing...'
首个 streaming chunk → agentStatus: 'working', statusMessage: 'Generating...'
流式完成 → agentStatus: 'idle', statusMessage: ''
```

#### UI 行为
- **idle**: 灰色圆点 + "Ready" 文字；中间/右侧显示占位符 "—"
- **thinking**: 琥珀色脉冲圆点 + "Thinking..."
- **working**: 绿色圆点 + "Working..."
- **waiting**: 青色圆点 + "Waiting for input..."
- 中间区域：有子代理时显示 `smart_toy` icon + 名称 chip
- 右侧区域：有 diff 文件时显示 `+X -Y in N files` badge

---

### M2-018: ErrorBoundary 渲染安全网 (v6.1 新增)

| 属性 | 值 |
|------|-----|
| **功能描述** | React ErrorBoundary 包裹 App，防止渲染错误导致黑屏 |
| **优先级** | P0 |
| **依赖** | React 19 |

#### 实现方案
```typescript
// ErrorBoundary: React Class 组件
// - getDerivedStateFromError: 捕获错误，切换到 fallback 状态
// - componentDidCatch: 记录错误日志到 JCEF Java 层
// - Fallback UI: 居中面板，错误 icon + 消息 + Reload 按钮
// - renderMarkdown: 包裹 try-catch，异常时返回 <pre> 转义文本
```

#### 防护层级
1. **renderMarkdown try-catch**: 捕获 `marked.parse()` 异常，降级为转义文本
2. **ErrorBoundary**: 捕获 React 组件树渲染异常，显示 fallback UI 而非黑屏

---

### M4-008: Skills/Agents Scope 字段接口 (v6.1 新增)

| 属性 | 值 |
|------|-----|
| **功能描述** | Agent/Skill 编辑弹窗添加作用域选择器，卡片显示 scope badge |
| **优先级** | P1 |
| **依赖** | M4-001 (Settings UI), SkillAgentService |

#### 前端数据模型扩展
```typescript
interface MockAgent {
  id: string;
  name: string;
  description?: string;
  scope?: 'global' | 'project';  // v6.1 新增
}

interface MockSkill {
  id: string;
  name: string;
  description?: string;
  scope?: 'global' | 'project';  // v6.1 新增
  trigger?: string;
}
```

#### UI 组件变更
- **SettingsPage**: Agent/Skill 卡片标题旁显示 scope badge (`G` 金色 / `P` 蓝色)
- **AgentEditModal**: 新增 scope `<select>` (Project / Global)
- **SkillEditModal**: 同上
- **InputToolbar**: agent dropdown 选项显示 `[G]`/`[P]` 前缀

#### 作用域切换行为
- 切换 scope = 复制文件到目标目录（全局→项目 或 项目→全局）
- 后端 SkillAgentService 扫描两个目录，ID 格式: `global:xxx` / `project:xxx`

---

## 接口汇总表

### 按 UI 组件分类

| UI 组件 | 接口数量 | 接口 ID |
|---------|---------|---------|
| CliBridgeService | 2 | M0-001, M0-002 |
| CliInstallGuideDialog | 1 | M1-004 |
| ChatPanel | 3 | M1-001, M1-002, M2-013 |
| ModelSelector | 1 | M1-003 |
| SessionTabBar | 3 | M2-001, M2-002, M2-003 |
| SessionService | 5 | M2-004, M2-005, M2-007, M2-009, M4-004 |
| RewindService | 1 | M2-012 |
| DiffReviewDialog | 1 | M2-014 |
| SessionHistoryPanel | 1 | M2-006 |
| QuoteService | 1 | M2-C6 |
| MessageRenderer | 2 | M2-010, M2-011 |
| ToolUseCard | 1 | M3-001 |
| ProviderSettingsPanel | 1 | M4-001 |
| BasicSettingsPanel | 1 | M4-006 |
| AppearanceSettingsPanel | 1 | M4-007 |
| ProviderSelector | 1 | M4-002 |
| ProviderEditDialog | 1 | M4-003 |
| CliUpdateService | 1 | M4-006 |
| ThemeService | 1 | M4-007 |
| ProviderService | 1 | M4-004 (导出) |
| FileReferencePopup | 1 | M5-001 |
| SlashCommandPopup | 1 | M5-002 |
| PermissionDialog | 1 | M5-003 |
| **总计** | **32** | - |

### 按里程碑分类

| 里程碑 | 接口数量 | 接口列表 |
|--------|---------|----------|
| M0 | 2 | M0-001, M0-002 |
| M1 | 4 | M1-001, M1-002, M1-003, M1-004 |
| M2 | 19 | M2-001~014, M2-C5, M2-C6, M2-015, M2-016, M2-011b扩展 |
| M3 | 1 | M3-001 |
| M4 | 7 | M4-001~007 |
| M5 | 6 | M5-001~003, M5-001b, M5-001c, M2-015~016, M2-011b扩展 |
| **总计** | **37** | - |

---

## 开发顺序建议

按照依赖关系和优先级，建议的开发顺序：

### Week 1: M0 + M1
1. M0-001: CLI 检测
2. M0-002: Stream-Json 测试
3. M1-004: CLI 安装引导（新增）
4. M1-001: 发送消息（Swing 版）
5. M1-002: 中断响应
6. M1-003: 模型选择

### Week 2-3: M2 (多会话 + JCEF)
7. M2-004: 会话持久化
8. M2-001: 新建会话
9. M2-002: 切换会话
10. M2-003: 删除会话
11. M2-005: 会话标题生成
12. M2-010: JCEF 消息渲染
13. M2-011: JCEF 复制回调
14. M2-006: 历史会话面板
15. M2-007: 收藏会话
16. M2-008: 重命名会话
17. M2-009: 导出会话
18. M2-012: Rewind 回溯
19. M2-013: 选中文本发送
20. M2-014: Diff 审查
21. M2-C5: 历史会话加载 (引用)
22. M2-C6: 消息引用 (Quote)

### Week 4: M3 + M4
21. M3-001: MCP 工具调用显示
22. M4-001: Provider 设置界面
23. M4-002: Provider 切换
24. M4-003: API Key 配置
25. M4-004: Token 统计
26. M4-005: Provider 导出

### Week 5+: M5
27. M5-001: @file 文件引用
28. M5-002: Slash 指令
29. M5-003: 权限确认

---

## 关键修正总结

| # | 修正项 | 类型 | 影响 |
|---|--------|------|------|
| 1 | 删除 M3-002 权限确认（移到 M5） | P0 | 与架构对齐 |
| 2 | executePrompt 移除 permissionMode | P0 | 会话级设置 |
| 3 | 添加 M2-006 历史会话面板 | P1 | 功能完整 |
| 4 | 添加 M2-007 收藏会话 | P1 | 功能完整 |
| 5 | M2-004 改用 JSON 存储 | P1 | 与 CLI 对齐 |
| 6 | ChatSession 添加 workingDir | P1 | --resume 必需 |
| 7 | ChatPanel 通过构造函数传 Project | P2 | 技术正确 |
| 8 | ProviderSettingsPanel 改用 Configurable | P2 | API 正确 |
| 9 | 明确 id vs sessionId 语义 | P2 | 概念清晰 |
| 10 | 添加 M2-008 重命名 | P1 | 功能完整 |
| 11 | 添加 M2-009 导出 | P1 | 功能完整 |
| 12 | 添加 M4-004 Provider 导出 | P1 | 功能完整 |
| 13 | 添加 M5-001 @file 引用 | P1 | 功能完整 |
| 14 | v5.1: 添加 M1-004 CLI 安装引导 | P0 | 首次用户体验 |
| 15 | v5.1: 添加 M2-012 Rewind 回溯 | P0 | 核心体验功能 |
| 16 | v5.1: 添加 M2-013 选中文本发送 | P0 | 核心使用场景 |
| 17 | v5.1: 添加 M2-014 Diff 审查 | P0 | 用户信任度 |
| 18 | v5.1: CliMessageCallback 拆分为细粒度 + onInterrupted | P1 | 回调设计完整 |
| 19 | v5.1: 权限模式描述与架构对齐 (default/sandbox/yolo) | P1 | 文档一致性 |
| 20 | v5.1: 添加 M4-006 基础设置 (CLI 更新 + 国际化) | P0 | ui.md 4.0 对齐 |
| 21 | v5.1: 添加 M4-007 外观设置 (主题/背景/气泡) | P0 | ui.md 4.0 对齐 |
| 22 | v5.2: 添加 M2-C5 历史会话加载 (引用) | P1 | 多会话核心交互 |
| 23 | v5.2: 添加 M2-C6 消息引用 (Quote) | P1 | 跨会话引用场景 |
| 24 | v5.3: 添加 M2-011b JCEF 双向通信总线 | P0 | 前后端联调完整接口 |
| 25 | v6.0: 添加 M2-015 文件附件接口 | P1 | 附件栏 + 文件选择器 |
| 26 | v6.0: 添加 M2-016 图片粘贴接口 | P1 | 剪贴板图片检测 |
| 27 | v6.0: 添加 M5-001b SendFileToChat Action | P1 | Project View 右键引用 |
| 28 | v6.0: 添加 M5-001c SendSelectionToChat Action | P1 | 编辑器右键代码引用 |
| 29 | v6.0: 扩展 M2-011b enhancePrompt 为结构化 options | P1 | 模板化提示词增强 |
| 30 | v6.1: 添加 AIStatusBar 数据流 (状态栏始终可见) | P0 | 交互体验 |
| 31 | v6.1: 添加 ErrorBoundary 渲染安全网 | P0 | 稳定性 |
| 32 | v6.1: 添加 Skills/Agents scope 字段与 UI | P1 | 作用域管理 |
| 33 | v6.1: 移除 ToolWindow content tab title "Chat" | P2 | UI 简化 |
| 34 | v6.2: CSS token 化（accent/selection/focus-ring/shadow） | P1 | 视觉一致性 |
| 35 | v6.2: MessageTimeline 实际 offsetTop 定位 + keyboard a11y | P2 | 导航精度 |
| 36 | v6.2: 合并 messageIn/cursorBlink/toastIn 重复动画 | P2 | 代码整洁 |
| 37 | v6.2: ScrollArea scrollbar 宽度 10px → 4px | P3 | 视觉统一 |
| 38 | v6.3: ThinkingBlock 折叠/展开组件 | P1 | AI思考过程可视化 |
| 39 | v6.3: i18n toast.renamed/quoteAdded补全 + SessionPage 硬编码修复 | P1 | 国际化 |
| 40 | v6.3: SessionPage 5处hardcoded toast字符串 → t() 调用 | P1 | 国际化 |
| 41 | v6.4: DiffSummary 折叠组件 + MockMessage.diffFiles 字段接入 | P1 | DiffReview 核心功能 |

---

*文档版本: v6.4*
*最后更新: 2026-04-17*
*同步关联: CC_Assistant_Technical_Architecture.md v6.4, plan/README.md v6.4*
