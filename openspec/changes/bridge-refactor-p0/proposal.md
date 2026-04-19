## Why

CC Assistant 插件的前后端通信链路存在多处断裂：前端发送的 `stream`/`think`/`mode` 选项虽然到达 Java 层但未被消费到 CLI 命令；用户消息会重复显示；错误消息未传递到前端；停止生成功能未连通。同时 CLI 进程的 `--permission-mode`、`--agent` 参数未从前端透传，导致用户无法控制核心工作模式。这些问题使得插件当前"什么也做不了"——无法完成一次完整的「用户输入 → CLI 执行 → 结果渲染」闭环。

## What Changes

- **BREAKING**: `ReactChatPanel.handleSendMessage()` 需要将 `stream`/`think`/`mode`/`agent` 选项全部传递到 `CliBridgeService.executePrompt()`
- **BREAKING**: `CliBridgeService.executePrompt()` 需要支持 `--permission-mode`、`--agent` 参数
- 修复用户消息重复显示（前端 chatStore 和 Java 层各添加一次）
- 连通「停止生成」功能（前端 stopGeneration → Java → CLI 进程中断）
- 连通错误消息展示（CliMessage.Error → JCEF → 前端 UI）
- 连通 Thinking/ToolUse 内容的区分渲染（不再与正文混合）

## Capabilities

### New Capabilities
- `cli-option-pass-through`: 将前端 UI 选项（stream、think、mode、agent、permission-mode）完整透传到 CLI 命令参数
- `message-dedup-and-error-display`: 修复消息重复显示、连通错误消息到前端 UI、停止生成功能
- `streaming-content-differentiation`: 流式内容按类型（text/thinking/tool）区分渲染，而非混合到同一个 streamingContent

### Modified Capabilities

## Impact

- **Kotlin 层**: `CliBridgeService.kt`（新增参数）、`ReactChatPanel.kt`（handleSendMessage 逻辑）、`JcefChatPanel.kt`（新增 JCEF 调用方法）
- **前端层**: `chatStore.ts`（去重）、`useJcefEvents.ts`（区分渲染）、`jcef.ts`（新增 stopGeneration 桥接）
- **CLI 兼容性**: 需确认 `claude --permission-mode plan` 等参数在 CLI 2.1.56+ 中可用
