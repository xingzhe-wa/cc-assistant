# CC Assistant 接口设计方案

> **版本**: v5.1 (产品对齐版)  
> **更新日期**: 2026-04-15  
> **设计原则**: 以功能和交互动作为驱动，端到端接口设计，与实际代码对齐
> **与架构对齐**: v5.1 与 CC_Assistant_Technical_Architecture.md v5.0 保持一致

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
| MessageRenderer | 2 | M2-010, M2-011 |
| ToolUseCard | 1 | M3-001 |
| ProviderSettingsPanel | 1 | M4-001 |
| ProviderSelector | 1 | M4-002 |
| ProviderEditDialog | 1 | M4-003 |
| ProviderService | 1 | M4-004 (导出) |
| FileReferencePopup | 1 | M5-001 |
| SlashCommandPopup | 1 | M5-002 |
| PermissionDialog | 1 | M5-003 |
| **总计** | **30** | - |

### 按里程碑分类

| 里程碑 | 接口数量 | 接口列表 |
|--------|---------|----------|
| M0 | 2 | M0-001, M0-002 |
| M1 | 4 | M1-001, M1-002, M1-003, M1-004 |
| M2 | 14 | M2-001~014 |
| M3 | 1 | M3-001 |
| M4 | 5 | M4-001~005 |
| M5 | 3 | M5-001~003 |
| **总计** | **29** | - |

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
18. M2-012: Rewind 回溯（新增）
19. M2-013: 选中文本发送（新增）
20. M2-014: Diff 审查（新增）

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

---

*文档版本: v5.1*  
*最后更新: 2026-04-15*  
*与 CC_Assistant_Technical_Architecture.md v5.0 保持一致*
