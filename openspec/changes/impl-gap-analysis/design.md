## Context

基于 `cli-ui-codeBuddy.md` 和 `cli-ui-mapping.md` 的设计共识，分析当前实现与设计意图的差异。

## Goals / Non-Goals

**Goals:**
- 修复P0级别差异（Agent参数、会话恢复）
- 重构P1级别差异（xterm.js渲染、Agent列表）
- 保持现有可用功能

**Non-Goals:**
- 不破坏现有可用功能
- 不引入Breaking Change

## Decisions

### 1. 渲染层重构策略
- 当前：React组件解析JSON流
- 设计：xterm.js渲染终端输出
- **决策**：保留React组件作为Fallback，渐进式引入xterm.js

### 2. 会话管理策略
- 当前：`claude -p` 单次执行
- 设计：`claude --resume` 恢复
- **决策**：添加 `sessionId` 参数支持resume

### 3. Agent参数传递
- 当前：未传递 `--agent` 参数
- 设计：传递 `--agent <name>`
- **决策**：添加 `agent` 参数到 `executePrompt`

### 4. 选项传递
- 当前：stream/think/mode未传递
- 设计：全部传递给CLI
- **决策**：添加对应参数

## Risks / Trade-offs

- xterm.js引入可能影响现有UI兼容性
- --resume行为需要CLI 2.1+支持