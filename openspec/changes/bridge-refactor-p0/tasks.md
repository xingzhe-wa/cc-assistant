## 1. CLI 选项透传（cli-option-pass-through）

### 1.1 CliBridgeService 扩展参数

- [ ] 1.1 扩展 `executePrompt()` 签名：新增 `mode: String? = null`、`think: Boolean? = null`、`permissionMode: String? = null` 参数
- [ ] 1.2 在 `buildCommand()` 中实现 mode → `--permission-mode` 映射：`auto`/`agent` → `accept-all`，`plan` → 省略
- [ ] 1.3 将 `agent` 参数添加到 CLI 命令构建（已有参数位，需确认非 default 时才传递）

### 1.2 JcefChatPanel MessageOptions 扩展

- [ ] 1.4 在 `MessageOptions` data class 新增 `agent: String? = null` 字段
- [ ] 1.5 在 `SendOptions` data class 新增 `agent: String?` 字段
- [ ] 1.6 在 `handleJSMessage()` 的 `sendMessage` case 中提取 `agent` 到 `MessageOptions`

### 1.3 ReactChatPanel 透传

- [ ] 1.7 修改 `handleSendMessage()` 将 `options.mode` 转换为 `permissionMode` 并传递给 `executePrompt()`
- [ ] 1.8 传递 `options.agent`（非 "default" 时）给 `executePrompt()`
- [ ] 1.9 传递 `options.think` 给 `executePrompt()`

### 1.4 前端 agent 选项发送

- [ ] 1.10 在 `chatStore.ts` 的 `sendMessage()` 中将 `currentAgent` 加入 options 对象
- [ ] 1.11 在 `jcef.ts` 的 `sendMessage()` 中确保 `agent` 字段包含在 options 中

## 2. 消息去重与错误展示（message-dedup-and-error-display）

### 2.1 用户消息去重

- [ ] 2.1 移除 `ReactChatPanel.handleSendMessage()` 中的 `jcefPanel?.appendUserMessage(...)` 调用
- [ ] 2.2 验证前端 `chatStore.sendMessage()` 中的 `addMessage()` 是用户消息的唯一来源

### 2.2 错误消息展示

- [ ] 2.3 在 `JcefChatPanel` 新增 `appendErrorMessage(message: String)` 方法，调用 `CCChat.appendMessage('error', ...)` 或 dispatch 新的 `cc-error` 事件
- [ ] 2.4 在 `ReactChatPanel.handleCliMessage()` 的 `CliMessage.Error` 分支中调用 `jcefPanel?.appendErrorMessage(message.message)`
- [ ] 2.5 在 `useJcefEvents.ts` 中添加 `cc-error` 事件监听，触发 `addToast(message, 'error')`

### 2.3 停止生成功能

- [ ] 2.6 在 `JcefChatPanel` 新增 `onStopGeneration: (() -> Unit)?` 回调属性
- [ ] 2.7 在 `handleJSMessage()` 中添加 `stopGeneration` case，调用 `onStopGeneration`
- [ ] 2.8 在 `ReactChatPanel.setupCallbacks()` 中设置 `onStopGeneration` 回调，调用 `cliService.interrupt()`
- [ ] 2.9 验证前端 `jcefBridge.stopGeneration()` 发送的 `stopGeneration:` 消息能被正确处理

## 3. 流式内容区分渲染（streaming-content-differentiation）

### 3.1 JCEF 桥接层

- [ ] 3.1 确认 `appendStreamingContent()` 的 `role` 参数已正确传递到 `CCChat.appendStreamingContent()` 的 `cc-stream` 事件 detail 中
- [ ] 3.2 验证 `jcef-integration.ts` 中 `CCChat.appendStreamingContent()` 的 `CustomEvent` detail 包含 `role` 字段

### 3.2 前端事件处理

- [ ] 3.3 在 `useJcefEvents.ts` 的 stream handler 中，根据 `role` 分别处理：`assistant` → 追加到 `streamingContent`，`thinking` → 追加到独立的 `thinkingContent`，`tool` → 更新 `agentStatus`
- [ ] 3.4 在 `chatStore` 中新增 `thinkingContent: string` 和 `agentStatusMessage: string` 会话级状态字段
- [ ] 3.5 在 `MessageArea` 中渲染 `thinkingContent` 到 `ThinkingBlock` 组件
- [ ] 3.6 在 `MessageArea` 中渲染 `agentStatusMessage` 为状态指示器

## 4. 验证与测试

- [ ] 4.1 运行 `cd frontend && npm run build` 确认前端编译通过
- [ ] 4.2 运行 `./gradlew compileKotlin` 确认 Kotlin 编译通过
- [ ] 4.3 运行 `./gradlew test` 确认现有测试通过
- [ ] 4.4 为 `executePrompt` 新增参数编写单元测试（覆盖 mode→permission-mode 映射）
- [ ] 4.5 手动端到端验证：发送消息 → CLI 执行 → 流式渲染 → 错误处理 → 停止生成
