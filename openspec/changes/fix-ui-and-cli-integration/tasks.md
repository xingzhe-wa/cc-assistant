# Tasks: 修复 UI 和 CLI 集成问题

## 目标

修复三个反馈的问题：
1. 设置页面 Tab 跳转不生效
2. 消息发送卡顿（用户体验问题）
3. Provider 配置不生效

## Tasks

### Task 1: 修复设置页面 Tab 跳转

**问题**: 点击工具栏的 "Configure new Provider/Agent/Skill" 按钮时，设置页面打开了但 Tab 没有正确切换。

**修改文件**:
- `frontend/src/App.tsx` - 修复 useEffect 依赖和状态更新逻辑
- 确认 `jcefBridge.openSettings()` 参数传递

**步骤**:
1. [x] 修改 App.tsx 的 `handleOpenSettings` 事件处理，确保每次都正确设置 `settingsTab`
2. [x] 添加日志确认事件接收正常
3. [x] 测试点击工具栏按钮是否能跳转到正确的 Tab

---

### Task 2: 修复消息发送卡顿

**问题**: 用户按回车后消息不会立即显示，要等待 CLI 响应。

**原因**: 当前代码在 CLI 执行后才显示用户消息。

**修改文件**:
- `src/main/kotlin/com/github/xingzhewa/ccassistant/ui/chat/ReactChatPanel.kt`
- `src/main/kotlin/com/github/xingzhewa/ccassistant/ui/chat/JcefChatPanel.kt`

**步骤**:
1. [x] 在 `handleSendMessage` 方法中，先调用 `appendUserMessage` 显示用户消息
2. [x] 添加 `clearInput` 方法清空输入框
3. [x] 然后再调用 `executePrompt` 执行 CLI
4. [x] 添加错误处理：如果 CLI 调用失败，显示错误消息给用户

---

### Task 3: 验证 Provider 配置

**问题**: 配置了不同的 Provider 后，CLI 调用时仍使用默认模型。

**原因**: 需要确认 Provider 切换逻辑是否正确，以及 CLI 调用参数。

**修改文件**:
- `src/main/kotlin/com/github/xingzhewa/ccassistant/bridge/CliBridgeService.kt`
- `src/main/kotlin/com/github/xingzhewa/ccassistant/model/ProviderService.kt`

**步骤**:
1. [x] 添加 Provider 切换成功的日志（代码已存在）
2. [ ] 确认 executePrompt 是否需要额外参数来指定 provider
3. [ ] 验证 Claude Code CLI 是否支持 provider 参数
4. [ ] 如果支持，修改代码传递正确的参数

> **注意**: 此问题需要进一步验证 Claude Code CLI 的参数支持情况。当前代码通过修改 `~/.claude/settings.json` 来切换 Provider，这是 Claude Code 的推荐方式。CLI 可能不直接支持 `--provider` 参数。

---

## 验收标准

- [x] 点击工具栏的 "Configure new Provider" 能跳转到 Provider Tab
- [x] 用户发送消息后能立即看到自己的消息
- [ ] 切换 Provider 后，CLI 调用能使用新的模型配置（待验证）