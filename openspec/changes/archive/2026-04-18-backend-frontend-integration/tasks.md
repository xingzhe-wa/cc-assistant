## 1. 数据流基础 - 后端推送机制

- [x] 1.1 在 ReactChatPanel 添加 pushInitialData() 方法 (已存在：pushProvidersToFrontend)
- [x] 1.2 在 afterLoadHtml() 中调用 pushInitialData() (已存在)
- [x] 1.3 ProviderService 添加 getInstance() 单例访问 (静态访问PRESET_PROVIDERS)
- [x] 1.4 SkillAgentService 添加 getInstance() 单例访问 (项目级Service)
- [x] 1.5 jcefPanel?.setProviders() 调用注入完整数据 (已存在)

## 2. JavaScript 侧数据接收

- [x] 2.1 CCProviders.setData 分发 cc-providers 事件 (已存在)
- [x] 2.2 useJcefEvents.ts 监听 cc-providers 事件 (已存在)
- [x] 2.3 chatStore 更新 providers, models, agents, skills 状态 (已存在)
- [x] 2.4 验证数据流：后端 → chatStore → 前端 UI (数据流已建立)

## 3. JS → Java 接口补全

- [x] 3.1 添加 onOpenSettings 回调到 JcefChatPanel
- [x] 3.2 JcefChatPanel.handleJSMessage 处理 "openSettings" action
- [x] 3.3 ReactChatPanel 实现 onOpenSettings(tab) 打开 Settings
- [x] 3.4 添加 onSkillChange 回调（缺失的接口）

## 4. Provider 选择器改造

- [x] 4.1 验证 ProviderSelector 显示完整 provider 列表
- [x] 4.2 添加"配置新 Provider"选项到底部
- [x] 4.3 点击"配置新 Provider"触发 openSettings('providers')

## 5. Agent 选择器改造

- [x] 5.1 验证 AgentSelector 显示完整 agent 列表
- [x] 5.2 添加"配置新 Agent"选项到底部
- [x] 5.3 点击"配置新 Agent"触发 openSettings('agents')

## 6. Skill 选择器改造

- [x] 6.1 验证 SkillSelector 显示完整 skill 列表
- [x] 6.2 添加"配置新 Skill"选项到底部
- [x] 6.3 点击"配置新 Skill"触发 openSettings('skills')

## 7. 端到端验证

- [x] 7.1 验证启动时数据正确加载到前端
- [x] 7.2 验证切换 Provider 同步到后端
- [x] 7.3 验证"配置新 Provider"跳转有效
- [x] 7.4 验证 Agent/Skill 选择器联动
- [x] 7.5 运行 ./gradlew build 确保无编译错误
