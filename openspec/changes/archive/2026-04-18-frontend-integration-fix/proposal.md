## Why

前端存在多个集成问题导致用户体验断裂：
1. **国际化缺失**：新增的按钮缺少 i18n 翻译，界面显示硬编码文本
2. **导航链断裂**：配置页面入口存在但无法正确跳转到实际配置界面
3. **Provider 配置无效**：已配置的 Provider 数据无法用于实际对话
4. **发送状态未隔离**：多 Tab 会话共享同一个 streaming 状态，导致一个 Tab 发送时其他 Tab 无法操作

## What Changes

### 1. 国际化全面审计与修复
- 审计 InputToolbar、InputArea、Dropdown 等组件的硬编码文本
- 补全 zh-CN、en-US、ja-JP、ko-KR 翻译
- 确保新增功能按钮（配置新 Provider/Agent/Skill）有对应翻译 key

### 2. 导航链路修复
- 修复"配置新 Provider"点击事件，确保跳转到 Settings providers tab
- 修复"配置新 Agent"点击事件，确保跳转到 Settings agents tab
- 修复"配置新 Skill"点击事件，确保跳转到 Settings skills tab
- 验证 Settings 页面能正确接收并定位到指定 tab

### 3. Provider 对话功能修复
- 验证后端推送的 Provider 数据格式与前端期望一致
- 修复 Provider 切换后模型列表同步更新
- 确保选中的 Provider 正确传递到 CLI 调用参数

### 4. 发送状态会话隔离
- 修复 chatStore 的 streaming 状态管理
- 每个会话独立管理自己的 streaming 状态
- 避免一个 Tab 的操作影响其他 Tab

### 5. 端到端接口复测
- 对照 `docs/API_Design.md` 逐条验证 JS ↔ Java 接口
- 确保每个 action 有对应 handler，每个 callback 有对应事件
- 验证数据流的完整闭环

## Capabilities

### New Capabilities

- `i18n-toolbar`: InputToolbar 国际化
  - 所有按钮文本使用 t() 函数
  - 配置入口按钮有对应翻译 key

- `session-streaming-isolation`: 会话流式状态隔离
  - 每个会话独立管理 streaming 状态
  - UI 状态（如按钮禁用）与当前活动会话关联

### Modified Capabilities

- `provider-selector-link`: Provider 选择器跳转需验证并修复
  - 点击事件正确绑定
  - 跳转目标 tab 正确

- `data-flow-initialization`: 数据流需验证 Provider 用于对话
  - Provider 数据正确传递到 handleSendMessage
  - CLI 调用使用正确的 provider 参数

## Impact

- `InputToolbar.tsx` - 补全 i18n，修复事件绑定
- `chatStore.ts` - 修复 streaming 状态隔离
- `useJcefEvents.ts` - 验证数据流
- `ReactChatPanel.kt` - 修复 Provider 传递到 CLI
- `jcef-integration.ts` - 验证 CCProviders.setData 格式
- `i18n/locales/*.json` - 补全翻译
