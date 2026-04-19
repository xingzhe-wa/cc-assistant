## Context

CC Assistant 是 IntelliJ 插件，通过 JCEF 内嵌 React UI + Kotlin 桥接层调用 Claude Code CLI。当前存在三个核心问题：

1. **选项透传断裂**：前端发送的 `stream`/`think`/`mode`/`agent` 到达 Java `MessageOptions` 后未被消费，`CliBridgeService.executePrompt()` 缺少对应参数
2. **消息链路 Bug**：用户消息重复显示（前端和 Java 各添加一次）；`CliMessage.Error` 不传递到前端；停止生成功能未连通
3. **流式渲染问题**：Text/Thinking/ToolUse 内容混合追加到同一个 `streamingContent`，前端无法区分渲染

当前数据流：
```
前端 jcefBridge.sendMessage(text, {stream, think, mode, model, provider})
  → JcefChatPanel.handleJSMessage → MessageOptions(stream, think, mode, model, provider)
    → ReactChatPanel.handleSendMessage → 仅用 model 和 provider(fallback)
      → CliBridgeService.executePrompt(prompt, workingDir, model, agent, sessionId)
        → CLI 命令: claude -p "..." --model <model> --output-format stream-json
```

**缺失的 CLI 参数**：`--permission-mode`（控制 plan/auto/agent 模式）、`--agent`（agent 已支持参数但未从 UI 透传）

## Goals / Non-Goals

**Goals:**
- 将前端 UI 选项完整透传到 CLI 命令，实现闭环
- 修复用户消息重复显示
- 连通错误消息到前端 UI
- 连通停止生成功能
- 区分 Text/Thinking/ToolUse 的流式渲染

**Non-Goals:**
- xterm.js 终端模拟器重构（属于独立重大重构）
- Agent/Skill 管理从 Zustand 迁移到文件系统（P1）
- 会话历史从本地存储迁移到 `--resume`（P1）
- Token 使用量统计（P2）

## Decisions

### Decision 1: 在 `MessageOptions` → `executePrompt` 之间新增参数透传

**选择**: 扩展 `executePrompt()` 签名，新增 `mode`、`think`、`permissionMode` 参数

**理由**: `agent` 参数已在签名中但未从 UI 传递；`mode` 映射为 `--permission-mode`（`auto` → `accept-all`，`plan` → 省略，`agent` → `accept-all`）；`think` 暂无直接 CLI flag（Claude CLI 的 extended thinking 由模型决定），但保留参数位以备将来使用

**替代方案**: 将所有 UI 选项打包为一个 `PromptOptions` data class → 过度设计，当前只有 5 个参数

**修改后签名**:
```kotlin
fun executePrompt(
    prompt: String,
    workingDir: String? = null,
    model: String? = null,
    agent: String? = null,
    sessionId: String? = null,
    mode: String? = null,
    think: Boolean? = null,
    permissionMode: String? = null
): Boolean
```

CLI 命令映射：
| UI mode | --permission-mode | 说明 |
|---------|-------------------|------|
| auto | accept-all | 自动执行，无确认 |
| plan | 省略 | CLI 暂停等待确认 |
| agent | accept-all | 同 auto |

### Decision 2: 用户消息去重 — 由前端全权管理消息显示

**选择**: 移除 `ReactChatPanel.handleSendMessage()` 中的 `jcefPanel?.appendUserMessage()` 调用

**理由**: 前端 `chatStore.sendMessage()` 已经通过 `addMessage()` 添加了用户消息。Java 层再次调用 `appendUserMessage()` 会导致通过 `cc-message` 事件再次添加。保留前端一侧的添加逻辑更符合 React 单向数据流。

**替代方案**: 移除前端的 `addMessage()`，由 Java 驱动 → 不可取，Java 的 `appendUserMessage` 通过 CustomEvent 异步传递，会导致 UI 闪烁

### Decision 3: 错误消息展示 — 新增 `appendErrorMessage` 方法

**选择**: 在 `JcefChatPanel` 新增 `appendErrorMessage()` 方法，在 `ReactChatPanel.handleCliMessage()` 中将 `CliMessage.Error` 传递到前端

**理由**: 当前 `CliMessage.Error` 只调用 `finishStreaming()` + 日志，用户看不到任何错误提示。新增一个 `cc-error` 事件类型，前端 `useJcefEvents` 监听后展示 Toast 通知

### Decision 4: 停止生成 — 新增 `stopGeneration` handler

**选择**: 在 `JcefChatPanel.handleJSMessage()` 中添加 `stopGeneration` case，调用 `CliBridgeService.interrupt()`

**理由**: 前端已有 `jcefBridge.stopGeneration()` 调用，但 Java 侧缺少 handler。`CliBridgeService.interrupt()` 方法已存在

### Decision 5: 流式内容区分 — 保持当前 streamingContent 合并策略

**选择**: 保持 Text/Thinking/ToolUse 混合追加到 `streamingContent`，但在前端通过行内标记区分渲染

**理由**: 当前 `ThinkingBlock` 和 `ToolUse` 已在前端有独立组件。问题的根源是所有内容被混合到 `streamingContent` 而非分离存储。但重构前端 store 的 streaming 数据结构是较大改动（影响 MessageArea、useJcefEvents、chatStore 多处），且当前 P0 优先级是"能跑通"而非"完美渲染"。

**替代方案**: 在 `appendStreamingContent` 中携带 `role` 信息，前端按 role 分别存储 → 可作为后续 P1 优化

## Risks / Trade-offs

- **[风险] `--permission-mode plan` 模式下 CLI 会暂停等待确认** → 插件需要实现 Plan 模式的 Swing 确认对话框（当前未实现），建议 P0 先只支持 auto/agent 模式，plan 模式暂不传递 permission-mode
- **[风险] 移除 Java 侧的 appendUserMessage 可能影响会话恢复** → 会话恢复使用 `--resume` 不依赖前端消息列表，无影响
- **[风险] `think` 参数无 CLI flag** → 保留参数但当前不传递到 CLI，等 CLI 支持后启用
- **[风险] NdjsonParser 的 ToolUseInputDelta id 为空** → 当前影响不大（工具调用只显示名称），P2 再修复
