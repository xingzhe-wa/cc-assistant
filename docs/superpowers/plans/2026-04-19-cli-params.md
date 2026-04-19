# CLI参数扩展实现计划

> **For agentic workers:** 使用 superpowers:subagent-driven-development 或 superpowers:executing-plans 实现此计划。步骤使用 checkbox (`- [ ]`) 语法追踪。

**目标:** 为 `CliBridgeService.executePrompt()` 添加 `sessionId` 和 `agent` 参数，支持会话恢复和Agent选择

**架构:** 通过修改 `executePrompt()` 方法签名和CLI命令构建逻辑，在已有进程中添加 `--resume` 和 `--agent` 参数支持

**Tech Stack:** Kotlin, IntelliJ Platform SDK

---

## Task 1: 修改 CliBridgeService.executePrompt()

**Files:**
- Modify: `src/main/kotlin/com/github/xingzhewa/ccassistant/bridge/CliBridgeService.kt:138-184`

**Steps:**

- [ ] **Step 1: 查看当前 executePrompt 方法签名**

```kotlin
// 当前签名 (CliBridgeService.kt:138)
fun executePrompt(prompt: String, workingDir: String? = null, model: String? = null): Boolean
```

- [ ] **Step 2: 添加参数**

修改方法签名为:
```kotlin
fun executePrompt(
    prompt: String,
    workingDir: String? = null,
    model: String? = null,
    agent: String? = null,
    sessionId: String? = null
): Boolean
```

- [ ] **Step 3: 修改CLI命令构建逻辑**

在 `executePrompt()` 方法内部，约第155行，找到当前命令构建:
```kotlin
val command = mutableListOf(cli, "-p", prompt, "--output-format", "stream-json")
model?.let {
    command.add("--model")
    command.add(it)
}
```

替换为:
```kotlin
val command = mutableListOf<String>()

// sessionId 优先：使用 --resume 恢复会话
if (sessionId != null) {
    command.addAll(listOf(cli, "--resume", sessionId, "--output-format", "stream-json"))
} else {
    // 首次会话：使用 -p 模式
    command.addAll(listOf(cli, "-p", prompt, "--output-format", "stream-json"))
}

// model 参数
model?.let {
    command.add("--model")
    command.add(it)
}

// agent 参数
agent?.let {
    command.add("--agent")
    command.add(it)
}
```

- [ ] **Step 4: 编译验证**

Run: `./gradlew compileKotlin`
Expected: BUILD SUCCESSFUL

- [ ] **Step 5: 提交**

```bash
git add src/main/kotlin/com/github/xingzhewa/ccassistant/bridge/CliBridgeService.kt
git commit -m "feat(bridge): add sessionId and agent params to executePrompt"
```

---

## Task 2: 修改 ReactChatPanel 传递参数

**Files:**
- Modify: `src/main/kotlin/com/github/xingzhewa/ccassistant/ui/chat/ReactChatPanel.kt:216-234`

**Steps:**

- [ ] **Step 1: 查看当前 handleSendMessage 方法**

找到约216行的 handleSendMessage 方法:

```kotlin
private fun handleSendMessage(text: String, options: JcefChatPanel.MessageOptions) {
    if (text.isBlank()) return

    // 1. 先立即显示用户消息
    val timestamp = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date())
    jcefPanel?.appendUserMessage("user-${System.currentTimeMillis()}", text, timestamp)

    // 2. 清空输入框
    jcefPanel?.clearInput()

    // 3. 执行 CLI
    val modelToUse = options.model ?: getDefaultModelForProvider(options.provider)
    cliService.executePrompt(
        prompt = text,
        workingDir = workingDir,
        model = modelToUse
    )
}
```

- [ ] **Step 2: 添加 sessionId 参数传递**

需要:
1. 添加 `currentSessionId` 变量跟踪当前会话
2. 在调用时传递 `sessionId = currentSessionId`

```kotlin
private var currentSessionId: String? = null  // 添加类级变量

private fun handleSendMessage(text: String, options: JcefChatPanel.MessageOptions) {
    if (text.isBlank()) return

    // 1. 先立即显示用户消息
    val timestamp = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date())
    jcefPanel?.appendUserMessage("user-${System.currentTimeMillis()}", text, timestamp)

    // 2. 清空输入框
    jcefPanel?.clearInput()

    // 3. 执行 CLI
    val modelToUse = options.model ?: getDefaultModelForProvider(options.provider)
    cliService.executePrompt(
        prompt = text,
        workingDir = workingDir,
        model = modelToUse,
        agent = options.agent,
        sessionId = currentSessionId
    )
}
```

- [ ] **Step 3: 添加 loadSession 方法设置 currentSessionId**

在 ReactChatPanel 中添加会话加载方法:

```kotlin
fun loadSession(sessionId: String) {
    this.currentSessionId = sessionId
    logger.info("Loading session: $sessionId")
}
```

- [ ] **Step 4: 编译验证**

Run: `./gradlew compileKotlin`
Expected: BUILD SUCCESSFUL

- [ ] **Step 5: 提交**

```bash
git add src/main/kotlin/com/github/xingzhewa/ccassistant/ui/chat/ReactChatPanel.kt
git commit -m "feat(chat): pass sessionId and agent to executePrompt"
```

---

## Task 3: 验证会话ID解析

**Files:**
- Modify: `src/main/kotlin/com/github/xingzhewa/ccassistant/ui/chat/ReactChatPanel.kt:302-345`

**Steps:**

- [ ] **Step 1: 查看 handleCliMessage 中的 Result 处理**

在 Result 消息处理中，应该已有 sessionId 解析:

```kotlin
is CliMessage.Result -> {
    // 保存 sessionId 用于续接
    message.sessionId?.let { currentSessionId = it }
}
```

- [ ] **Step 2: 确认 sessionId 存储逻辑已存在**

检查 `handleCliMessage` 方法，确认 `message.sessionId` 会被保存到 `currentSessionId`

- [ ] **Step 3: 提交**

```bash
git commit -m "fix(chat): persist sessionId for session resume"
```

---

## 验证清单

| 场景 | 测试命令 | 预期 |
|------|----------|------|
| 新会话 | 发送消息 | `claude -p "..." --output-format stream-json` |
| 新会话+Agent | 选择Agent后发送 | `claude -p "..." --agent reviewer --output-format stream-json` |
| 恢复会话 | 加载历史会话后发送 | `claude --resume <id> --output-format stream-json` |
| 恢复+Agent | 加载会话+选择Agent | `claude --resume <id> --agent reviewer --output-format stream-json` |