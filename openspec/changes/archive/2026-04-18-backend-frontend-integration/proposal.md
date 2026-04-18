## Why

前后端开发缺乏对齐，导致：
1. **数据流断裂**：Settings 页面配置的 Provider/Agent/Skill 数据没有传递到 Chat 页面
2. **交互链路不闭环**：Chat 页面的选择器只有展示，没有"新增"选项跳转到配置页面
3. **Mock 数据残留**：前端使用独立的 mock 数据，而非从后端获取真实配置

当前状态：
- 前端 `chatStore.ts` 有 hardcoded 的 `currentProvider: 'claude'`
- 前端 `mock.ts` 有独立的 Provider/Model/Agent 数据
- 后端 `ProviderService` 有完整配置但没有推送到前端
- JCEF 资源加载问题导致修改不生效

## What Changes

### 1. 数据流重构
- **Backend → Frontend**：启动时后端推送完整配置（providers, models, agents, skills）到前端
- **Frontend → Backend**：用户操作（切换Provider/Agent/Skill）实时同步到后端

### 2. Chat 页面选择器改造
- Provider 选择器：显示当前 Provider + "配置新 Provider" 选项
- Model 选择器：显示当前 Model + "配置新 Model" 选项
- Agent 选择器：显示当前 Agent + "配置新 Agent" 选项
- Skill 选择器：显示当前 Skill + "配置新 Skill" 选项
- 每个"新增"选项点击后跳转到 Settings 页面对应 Tab

### 3. 端到端接口对接
- 对照 `docs/API_Design.md` 逐条梳理 JS ↔ Java 接口
- 确保每个 action 都有对应 handler，每个 callback 都有对应事件

### 4. JCEF 资源加载验证
- 确保前端资源修改后能在 JCEF 中正确加载

## Capabilities

### New Capabilities

- `data-flow-initialization`: 启动时后端推送完整配置到前端
  - Provider/Model/Agent/Skill 全量数据推送
  - 持久化当前选择（Provider/Model/Mode/Agent）

- `provider-selector-link`: Provider 选择器与配置页面联动
  - 显示当前 Provider
  - "配置新 Provider" 跳转选项

- `agent-selector-link`: Agent 选择器与配置页面联动
  - 显示当前 Agent
  - "配置新 Agent" 跳转选项

- `skill-selector-link`: Skill 选择器与配置页面联动
  - 显示当前 Skill
  - "配置新 Skill" 跳转选项

### Modified Capabilities

- `settings-page`: 设置页面需支持从 Chat 页面直接跳转并定位到对应 Tab

## Impact

- `ProviderService` - 增加数据推送方法
- `ReactChatPanel` - 增加初始化数据推送调用
- `JcefChatPanel` - 增加 CCProviders 数据注入
- `useJcefEvents.ts` - 完整的事件监听（包含 cc-provider-saved 等）
- `chatStore.ts` - 使用后端数据替代 mock
- `ProviderEditModal.tsx` - 增加跳转回调
