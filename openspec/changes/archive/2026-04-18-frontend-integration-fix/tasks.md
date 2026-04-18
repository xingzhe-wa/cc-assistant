## 1. 国际化审计与补全

- [x] 1.1 检查 `settings` 翻译中是否包含 `configureNewProvider`、`configureNewAgent`、`configureNewSkill`
- [x] 1.2 如缺失，在 `zh-CN.ts` 添加
- [x] 1.3 在 `en-US.ts`、`ja-JP.ts`、`ko-KR.ts` 添加对应翻译
- [x] 1.4 验证 `InputToolbar.tsx` 使用 `t('settings.configureNewProvider')` 而非硬编码

## 2. 导航链路修复

- [x] 2.1 验证 `jcef.ts` 中 `openSettings(tab)` 实现正确
- [x] 2.2 验证 `JcefChatPanel.injectJavaBridge()` 注入 `onOpenSettings` 处理
- [x] 2.3 验证 `JcefChatPanel.handleJSMessage()` 处理 `"openSettings"` action
- [x] 2.4 验证 `ReactChatPanel.onOpenSettings` 正确调用 `jcefPanel?.openSettings(tab)`
- [x] 2.5 验证 Settings 页面能接收并定位到指定 tab
- [x] 2.6 端到端测试：从 Toolbar 点击"配置新 Provider"到 Settings 页面显示 providers tab

## 3. Provider 对话功能修复

- [x] 3.1 验证 `ReactChatPanel.pushProvidersToFrontend()` 推送的数据格式
- [x] 3.2 验证 `JcefChatPanel.setProviders()` 调用 `CCProviders.setData()`
- [x] 3.3 验证 `useJcefEvents.ts` 中 `handleProviders` 正确解析并存储到 configStore
- [x] 3.4 验证 `chatStore.setCurrentProvider()` 正确切换并更新 currentModel
- [x] 3.5 验证 `ReactChatPanel.handleSendMessage()` 使用正确的 provider 参数
- [x] 3.6 验证 `CliBridgeService.executePrompt()` 接受 provider 参数

## 4. 发送状态会话隔离

- [x] 4.1 在 `MockSession` 类型中添加 `streaming: boolean` 和 `streamingContent: string`
- [x] 4.2 修改 `chatStore` 中的 streaming 相关状态移到会话级别
- [x] 4.3 修改 `MessageArea` 使用当前活动会话的 `streaming` 状态
- [x] 4.4 修改发送按钮禁用状态绑定到当前活动会话的 `streaming`
- [x] 4.5 验证多 Tab 场景：一个 Tab 发送时其他 Tab 可正常发送

## 5. 端到端接口复测

- [x] 5.1 对照 `docs/API_Design.md` 验证 CCProviders.setData 格式
- [x] 5.2 验证 CCProviders.setSkillsAndAgents 格式
- [x] 5.3 验证 jcefBridge.providerChange() 正确传递到 Java 层
- [x] 5.4 验证 onOpenSettings 回调链路完整
- [x] 5.5 运行 `npm run build` 和 `./gradlew compileKotlin` 确保无编译错误
