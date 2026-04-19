# Proposal: JCEF Bridge 端到端接口对齐与修复

## 1. Problem Statement

前后端通信存在多处断点，已实现的 Java 改动（如 Provider ENV 智能合并）无法生效。根本原因：

1. **JCEF 通信链路不透明**：`window.cefQuery` 全局变量访问模式与 JBCefJSQuery 实际暴露方式可能不一致
2. **消息格式不统一**：各模块自行构造消息格式，缺乏统一规范
3. **回调接口未完全连通**：部分 `onXXX` 回调存在，但前端未调用或调用方式错误
4. **Provider 切换链路断裂**：前端 `providerChange` 事件 → Java `handleJSMessage` → `ProviderService.switchProvider()` → `settings.json` 任一环节可能失效

## 2. Goals

- **链路可视化**：每个前端 action 都能追踪到对应的 Java handler
- **消息格式标准化**：统一 `action:JSON` 格式，无例外
- **端到端可测试**：每个 action 都有明确的预期行为
- **符合 JCEF 约束**：遵循 `console.log` 不可见、`cefQuery` 注入时机等约束

## 3. Approach

### 3.1 建立完整的 Action 矩阵

梳理所有 JS → Java 的 action：
- 列出 action 名称
- 消息格式（有无 data，data 类型）
- Java handler 回调名
- 回调后续处理

### 3.2 修复通信链路

- 确认 `window.cefQuery` vs `cefQuery` 的实际暴露方式
- 统一使用 `window.javaBridge` 模式（已注入的桥接对象）
- 添加日志确认消息发出/接收

### 3.3 统一消息格式

所有 action 统一为：
```
action:{"field": "value"}  // 有数据时
action:                     // 无数据时
```

### 3.4 验证每个 action

为每个 action 编写验证用例：
1. 前端发送 action
2. 检查 Java 日志确认接收
3. 检查预期副作用（文件写入、状态变更）

## 4. Impact

- **可靠性**：所有 UI 操作都能正确传递到后端
- **可维护性**：清晰的 action 矩阵便于后续开发
- **可测试性**：每个 action 都有明确的验证路径

## 5. Out of Scope

- 新增功能（如 MCP 支持）
- UI/UX 改进
- 性能优化（除非影响功能）
