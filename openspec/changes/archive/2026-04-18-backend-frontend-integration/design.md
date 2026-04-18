## Context

### 当前问题

1. **数据流断裂**
   - `ProviderService` 有完整的 provider 配置，但不会主动推送到前端
   - `ReactChatPanel` 初始化时没有调用 `jcefPanel?.setProviders()` 注入数据
   - 前端 `chatStore` 使用 hardcoded mock 数据

2. **交互链路不闭环**
   - Chat 页面的 Provider/Model/Agent/Skill 选择器只有当前值显示
   - 没有"新增"选项让用户跳转到 Settings 页面配置

3. **JCEF 资源加载问题**
   - 前端资源通过 `getResourceAsStream` 加载，可能不稳定
   - `isLoaded` 标志导致修改后不会重新加载

### 设计目标

建立清晰的数据流：
```
后端配置数据 ──推送──> 前端 Store ──展示──> Chat UI
     ▲                                          │
     │                                          │
     └───用户操作──> JavaScript Handler ─────────┘
```

## Goals / Non-Goals

**Goals:**
- 启动时后端推送完整配置到前端（providers, models, agents, skills）
- Chat 页面每个选择器都有"新增"选项跳转到 Settings 对应 Tab
- 所有 JS → Java 接口 action 都有对应 handler
- 所有 Java → JS 回调都有对应 CustomEvent 监听

**Non-Goals:**
- 不改变现有 JCEF 加载机制（继续使用 loadHTML + 内联资源）
- 不实现完整的 CRUD 操作（先实现数据展示和切换）
- 不实现 Skill 的实际执行逻辑（仅做选择器联动）

## Decisions

### Decision 1: 数据推送时机

**选项 A（选择）**: 启动时推送 + 变更时增量推送
- 启动时推送完整数据
- Provider/Agent/Skill 变更时只推送增量变化

**选项 B**: 仅在启动时推送
- 简单但不够实时
- 用户在 Settings 修改后需要刷新

**选择 A**：实时性更重要

### Decision 2: 选择器"新增"选项实现

**选项 A（选择）**: 在选择器底部添加固定选项"配置新..."
- 每个选择器都是下拉框，在列表底部添加"配置新 X"选项
- 点击后触发跳转回调

**选项 B**: 旁边的单独按钮
- 需要占用额外空间

**选择 A**：更紧凑，符合下拉选择器常规设计

### Decision 3: 跳转机制

**选项 A（选择）**: JavaScript 触发 Java 方法，Java 打开 Settings 对话框
- 通过 `jcefBridge.openSettings()` 触发
- Java 侧打开 Settings ToolWindow 或 Dialog，并定位到对应 Tab

**选项 B**: 前端直接修改 URL/路由
- JCEF 内没有路由概念

**选择 A**：与现有 `openSettings` 机制一致

## Data Flow

### 启动时数据推送

```
ReactChatPanel 初始化
  ├── loadHtmlContent()  // 加载前端资源
  ├── initializeJSBridge()  // 注入回调
  └── afterLoadHtml() [新增]
        └── pushInitialData()
              ├── ProviderService.getInstance().allProviders
              ├── ProviderService.getInstance().getModelsForProvider()
              ├── SkillAgentService.getInstance().getAgents()
              ├── SkillAgentService.getInstance().getSkills()
              └── jcefPanel?.setProviders(providers, models, agents, skills)
```

### 用户切换 Provider

```
用户选择 Provider
  ├── jcefBridge.providerChange(providerId)
  │     └── jcefQuery.inject("providerChange:" + providerId)
  ├── JcefChatPanel.handleJSMessage("providerChange", data)
  │     └── invokeLater { onProviderChange?.invoke(providerId) }
  ├── ReactChatPanel.onProviderChange(providerId)
  │     └── configService.setCurrentProviderId(providerId)
  └── ProviderService.switchProvider(providerId)
        └── 写入 ~/.claude/settings.json
```

### 用户点击"配置新 Provider"

```
用户点击"配置新 Provider"
  ├── jcefBridge.openSettingsWithTab("providers")
  │     └── jcefQuery.inject("openSettings:providers")
  ├── JcefChatPanel.handleJSMessage("openSettings", data)
  │     └── invokeLater { onOpenSettings?.invoke("providers") }
  └── ReactChatPanel.onOpenSettings(tab)
        └── 打开 Settings 并切换到 providers Tab
```

## JS ↔ Java 接口对照表

### JS → Java (通过 jcefQuery.inject)

| Action | Java Handler | 说明 |
|--------|--------------|------|
| `sendMessage:{text,options}` | onSendMessage | 发送消息 |
| `providerChange:{providerId}` | onProviderChange | 切换 Provider |
| `modelChange:{modelId}` | onModelChange | 切换 Model |
| `agentChange:{agentId}` | onAgentChange | 切换 Agent |
| `skillChange:{skillId}` | onSkillChange | 切换 Skill |
| `modeChange:{mode}` | onModeChange | 切换模式 |
| `thinkChange:{enabled}` | onThinkChange | 思考模式 |
| `openSettings:{tab}` | onOpenSettings | 打开设置 |
| `providerCreate:{data}` | onSaveProvider | 创建 Provider |
| `providerUpdate:{data}` | onSaveProvider | 更新 Provider |
| `providerDelete:{id}` | onDeleteProvider | 删除 Provider |
| `agentCreate:{data}` | onAgentCreate | 创建 Agent |
| `agentUpdate:{data}` | onAgentUpdate | 更新 Agent |
| `agentDelete:{id}` | onAgentDelete | 删除 Agent |
| `skillCreate:{data}` | onSkillCreate | 创建 Skill |
| `skillUpdate:{data}` | onSkillUpdate | 更新 Skill |
| `skillDelete:{id}` | onSkillDelete | 删除 Skill |

### Java → JS (通过 executeScript)

| Method | JS Global | 触发事件 | 说明 |
|--------|-----------|----------|------|
| `setProviders(providers, models, agents, skills)` | CCProviders.setData | cc-providers | 推送配置数据 |
| `setAgents(agents)` | CCProviders.setAgents | cc-agents | 推送 Agents |
| `setSkills(skills)` | CCProviders.setSkills | cc-skills | 推送 Skills |
| `setSkillsAndAgents(skills, agents)` | CCProviders.setSkillsAndAgents | cc-skills-agents | 批量推送 |
| `onProviderSaved(success, error)` | CCProviders.onProviderSaved | cc-provider-saved | Provider 操作完成 |
| `appendUserMessage(id, content, time)` | CCChat.appendMessage | cc-message | 追加用户消息 |
| `appendAIMessage(id, content, time, thinking)` | CCChat.appendMessage | cc-message | 追加 AI 消息 |
| `appendStreamingContent(role, content, id)` | CCChat.appendStreamingContent | cc-stream | 流式内容 |
| `finishStreaming(id)` | CCChat.finishStreaming | cc-stream | 完成流式 |

## Risks / Trade-offs

[Risk] JCEF 资源加载不生效 → Mitigation: 添加调试日志，hash 跟踪机制，forceReload 方法

[Risk] 前后端数据不一致 → Mitigation: 单一数据源原则，后端是权威数据，前端只是展示和操作界面

[Risk] Settings 页面和 Chat 页面状态同步 → Mitigation: 通过后端服务作为唯一数据源，页面切换时重新获取

## Migration Plan

1. **Phase 1**: 验证数据推送链路
   - 在 ReactChatPanel 添加 pushInitialData 调用
   - 添加调试日志验证数据是否正确推送

2. **Phase 2**: 实现选择器"新增"选项
   - 修改 Chat 页面的 Provider/Model/Agent/Skill 选择器
   - 添加"配置新 X"选项
   - 实现跳转回调

3. **Phase 3**: 实现跳转目标
   - ReactChatPanel.onOpenSettings 实现打开 Settings 并定位 Tab

4. **Phase 4**: 端到端验证
   - 完整流程测试：启动 → 数据加载 → 选择切换 → 配置新增 → 跳转

## Open Questions

1. Skill 的实际执行逻辑是否在 MVP 范围内？
2. 是否需要支持自定义 Provider（除了预设的 7 个）？
3. Session 数据是否需要同步到前端？
