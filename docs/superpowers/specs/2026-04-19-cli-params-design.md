# CC Assistant CLI参数扩展设计

> 日期: 2026-04-19
> 状态: 设计阶段

---

## 1. 背景

基于 `cli-ui-codeBuddy.md` 和 `cli-ui-mapping.md` 的设计共识，当前 `CliBridgeService.executePrompt()` 仅接受 `prompt`, `workingDir`, `model` 参数，缺少 CLI 原生支持的 `--resume` 和 `--agent` 参数，导致：
- 历史会话无法恢复，需手动传递消息历史
- Agent 选择不生效

---

## 2. 设计目标

### 目标
- 添加 `sessionId` 参数支持会话恢复 (`--resume`)
- 添加 `agent` 参数支持 Agent 选择 (`--agent`)

### 非目标
- 不修改渲染层（保持现有 React 组件）
- 不引入 Breaking Change

---

## 3. 技术设计

### 3.1 接口变更

**CliBridgeService.kt**

```kotlin
// 修改前
fun executePrompt(
    prompt: String,
    workingDir: String? = null,
    model: String? = null
): Boolean

// 修改后
fun executePrompt(
    prompt: String,
    workingDir: String? = null,
    model: String? = null,
    agent: String? = null,      // 新增
    sessionId: String? = null   // 新增
): Boolean
```

**ReactChatPanel.kt**

```kotlin
// handleSendMessage 修改
private fun handleSendMessage(text: String, options: JcefChatPanel.MessageOptions) {
    // ...
    cliService.executePrompt(
        prompt = text,
        workingDir = workingDir,
        model = modelToUse,
        agent = options.agent,           // 新增
        sessionId = currentSessionId  // 新增
    )
}
```

### 3.2 CLI命令构建逻辑

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
model?.let { command.addAll(listOf("--model", it)) }

// agent 参数
agent?.let { command.addAll(listOf("--agent", it)) }
```

### 3.3 数据流

```
前端选择会话 → chatStore.loadSession(id) → sessionId存储
                                                    ↓
                                         ReactChatPanel.handleSendMessage()
                                                    ↓
                                         cliService.executePrompt(sessionId=id)
                                                    ↓
                                         CLI --resume <session_id>
```

---

## 4. 测试用例

| 场景 | 输入 | 预期CLI命令 |
|------|------|----------|
| 新会话 | sessionId=null, agent=null | `claude -p "prompt" --output-format stream-json` |
| 新会话+Agent | sessionId=null, agent="reviewer" | `claude -p "prompt" --agent reviewer --output-format stream-json` |
| 恢复会话 | sessionId="abc", agent=null | `claude --resume abc --output-format stream-json` |
| 恢复+Agent | sessionId="abc", agent="reviewer" | `claude --resume abc --agent reviewer --output-format stream-json` |

---

## 5. 影响评估

| 影响项 | 说明 |
|--------|------|
| 兼容性 | 现有调用无需修改（参数为可选） |
| 前端改动 | 需从会话获取 sessionId 并传递 |
| 风险 | 低 |

---

## 6. 待办

- [ ] 修改 CliBridgeService.executePrompt() 签名
- [ ] 实现 CLI 命令构建逻辑
- [ ] 修改 ReactChatPanel.handleSendMessage() 传递参数