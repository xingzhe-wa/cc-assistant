## Context

### 当前 JCEF 通信架构

```
Frontend (React)                    Java (Kotlin)
     │                                    │
     │  window.javaBridge.onXxx()         │
     │  或 cefQuery.inject()              │
     │  ─────────────────────────────────>│  JBCefJSQuery Handler
     │                                    │       │
     │                                    │  handleJSMessage(request)
     │                                    │       │
     │                                    │  when (action) { ... }
     │                                    │       │
     │                                    │  onXxx?.invoke(data)
     │                                    │       │
     │                                    │  ReactChatPanel callback
     │                                    │       │
     │                                    │  Service.method()
```

### 当前问题点

1. **cefQuery 访问方式不一致**：
   - `dataService.ts` 使用 `window.cefQuery.inject()`
   - 但 JBCefJSQuery 注入的全局变量名为 `cefQuery`，不一定是 `window.cefQuery`

2. **javaBridge vs cefQuery 混用**：
   - `jcef-integration.ts` 定义 `window.javaBridge` 用于 Java→JS
   - `dataService.ts` 直接使用 `window.cefQuery` 用于 JS→Java
   - `jcef.ts` 的 `jcefBridge.send()` 使用 `window.cefQuery?.inject()`

3. **Provider 切换链路**：
   ```
   dataService.switchProvider('claude')
   → cefQuery.inject('providerChange:claude')
   → handleJSMessage 解析
   → onProviderChange?.invoke('claude')
   → ProviderService.switchProvider('claude')
   → settings.json 写入
   ```

### JCEF 约束参考

来自 `docs/JCEF_Constraints_and_Best_Practices.md`：
- `console.log` 在 IDE 中不可见 → 使用 `window.javaBridge.log()` 桥接
- `window.cefQuery` 访问方式需验证
- 事件处理器可能被重置 → 使用事件委托
- 资源加载建议使用内联

## Goals / Non-Goals

**Goals:**
- 建立完整的 Action 矩阵文档
- 修复 JS→Java 通信链路
- 确保每个 action 的消息格式统一
- 添加日志确认消息送达

**Non-Goals:**
- 不重写 JBCefJSQuery 框架
- 不改变已稳定的 API
- 不实现新功能

## Decisions

### Decision 1: 统一使用 javaBridge 模式发送消息

**选择**：修改所有 JS→Java 消息发送，统一通过 `window.javaBridge` 暴露的方法

**理由**：
- `javaBridge` 已在 JcefChatPanel 中注入
- 统一入口便于追踪和调试
- 避免直接访问 `cefQuery` 的不确定性

**统一格式**：
```typescript
window.javaBridge.onProviderChange(providerId: string)
window.javaBridge.onProviderCreate(data: ProviderData)
window.javaBridge.onAgentCreate(data: AgentData)
// ... 统一格式
```

### Decision 2: 修复 cefQuery 注入变量名

**选择**：在 `injectJavaBridge()` 中同时设置 `window.cefQuery` 以兼容前端代码

**理由**：
- 前端 `dataService.ts` 使用 `window.cefQuery.inject()`
- JBCefJSQuery 本身提供的全局变量名可能不是 `cefQuery`
- 需要显式暴露

### Decision 3: 添加端到端日志

**选择**：在关键节点添加日志，确认消息流经每个环节

**日志点**：
1. JavaScript: `window.javaBridge.onXxx()` 入口
2. Java: `handleJSMessage()` 收到消息
3. Java: `onXxx?.invoke()` 调用回调
4. Java: Service 层实际执行

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| 修改桥接代码可能引入新问题 | 先验证当前链路是否工作，隔离修改 |
| 日志过多影响性能 | 仅在调试阶段开启，详细程度可配置 |
| 前端多模块发送方式不统一 | 统一重构到 javaBridge 模式 |

## Open Questions

1. 当前 `window.cefQuery` 是否能正常工作？需要实际验证
2. `ProviderService.switchProvider()` 是否有日志输出？
3. 前端是否正确监听了 `cc-message` 等事件？
