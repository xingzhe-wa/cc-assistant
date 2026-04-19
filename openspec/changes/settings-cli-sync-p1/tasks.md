## 1. Provider CLI 同步（provider-cli-sync）

### 1.1 JcefChatPanel action handlers 新增

- [x] 1.1 新增 `onProviderCreate: ((Map<String, String>) -> Unit)?` 回调
- [x] 1.2 新增 `onProviderUpdate: ((Map<String, String>) -> Unit)?` 回调
- [x] 1.3 新增 `onProviderDelete: ((String) -> Unit)?` 回调
- [x] 1.4 在 `handleJSMessage` 中新增 `providerCreate` case，调用 `onProviderCreate`
- [x] 1.5 在 `handleJSMessage` 中新增 `providerUpdate` case，调用 `onProviderUpdate`
- [x] 1.6 在 `handleJSMessage` 中新增 `providerDelete` case，调用 `onProviderDelete`

### 1.2 ProviderService settings.json CRUD

- [x] 1.7 新增 `createProvider(provider: ProviderConfig)` 方法：读取 `~/.claude/settings.json`，深度合并 `env` 字段，写回文件
- [x] 1.8 新增 `updateProvider(provider: ProviderConfig)` 方法：读取文件，更新对应 env 字段，写回
- [x] 1.9 新增 `deleteProvider(providerId: String)` 方法：从 settings.json 移除对应配置
- [x] 1.10 新增 `getAllProviders(): List<ProviderConfig>` 方法：从 settings.json 和 PRESET_PROVIDERS 合并返回

### 1.3 ReactChatPanel Provider callbacks

- [x] 1.11 在 `setupCallbacks()` 中实现 `onProviderCreate`，调用 `ProviderService.createProvider()`
- [x] 1.12 在 `setupCallbacks()` 中实现 `onProviderUpdate`，调用 `ProviderService.updateProvider()`
- [x] 1.13 在 `setupCallbacks()` 中实现 `onProviderDelete`，调用 `ProviderService.deleteProvider()`
- [x] 1.14 完善 `onProviderChange` 实现：调用 `ProviderService.switchProvider()` 更新 settings.json

## 2. Agent CLI 同步（agent-cli-sync）

### 2.1 JcefChatPanel action handlers 新增

- [x] 2.1 新增 `onAgentCreate: ((Map<String, String>) -> Unit)?` 回调
- [x] 2.2 新增 `onAgentUpdate: ((Map<String, String>) -> Unit)?` 回调
- [x] 2.3 新增 `onAgentDelete: ((String) -> Unit)?` 回调
- [x] 2.4 在 `handleJSMessage` 中新增 `agentCreate`/`agentUpdate`/`agentDelete` cases

### 2.2 SkillAgentService Agent CRUD 写入

- [x] 2.5 新增 `createAgentFile(id: String, name: String, description: String, systemPrompt: String)` 方法：在 `~/.claude/agents/` 下创建 Markdown 文件
- [x] 2.6 新增 `updateAgentFile(id: String, ...)` 方法：更新现有 Markdown 文件
- [x] 2.7 新增 `deleteAgentFile(id: String)` 方法：删除 `~/.claude/agents/<id>.md`

### 2.3 ReactChatPanel Agent callbacks

- [x] 2.8 实现 `onAgentCreate`/`onAgentUpdate`/`onAgentDelete` callbacks

## 3. Skill CLI 同步（skill-cli-sync）

### 3.1 JcefChatPanel action handlers 新增

- [x] 3.1 新增 `onSkillCreate: ((Map<String, String>) -> Unit)?` 回调
- [x] 3.2 新增 `onSkillUpdate: ((Map<String, String>) -> Unit)?` 回调
- [x] 3.3 新增 `onSkillDelete: ((String) -> Unit)?` 回调
- [x] 3.4 在 `handleJSMessage` 中新增 `skillCreate`/`skillUpdate`/`skillDelete` cases

### 3.2 SkillAgentService Skill CRUD 写入

- [x] 3.5 新增 `createSkillDir(id: String, name: String, description: String, instructions: String)` 方法：创建 `~/.claude/skills/<id>/SKILL.md`
- [x] 3.6 新增 `updateSkillFile(id: String, ...)` 方法：更新 SKILL.md 文件
- [x] 3.7 新增 `deleteSkillDir(id: String)` 方法：删除 `~/.claude/skills/<id>/` 目录

### 3.3 ReactChatPanel Skill callbacks

- [x] 3.8 实现 `onSkillCreate`/`onSkillUpdate`/`onSkillDelete` callbacks

## 4. 前端 action 对齐（可选）

- [ ] 4.1 确认前端 `jcef.ts` 中的 `createProvider`/`createAgent`/`createSkill` 等调用与 Java handler action 名称一致

## 5. 验证与测试

- [x] 5.1 运行 `./gradlew compileKotlin` 确认编译通过
- [x] 5.2 运行 `./gradlew test` 确认测试通过
- [ ] 5.3 使用 `settings-kimi.json` 测试数据验证 Provider CRUD 流程
- [ ] 5.4 创建/编辑/删除 Agent，验证文件系统操作
- [ ] 5.5 创建/编辑/删除 Skill，验证文件系统操作
- [ ] 5.6 切换 Provider 后发送消息，验证 env 配置生效
