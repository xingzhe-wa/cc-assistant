## Why

两份设计文档（`cli-ui-codeBuddy.md` 和 `cli-ui-mapping.md`）已达成共识：
- **核心原则**：GUI是CLI的外骨骼，不是替代品
- **实现方式**：消息区应使用终端模拟器(xterm.js)，而非自定义React渲染

当前代码大量使用了自定义React组件解析CLI输出，与设计初衷严重偏离。需要梳理差异，明确重构优先级。

## What Changes

1. **创建实现差异文档**：`docs/implementation-gap.md`
2. **前端重构**：
   - 废弃 `MessageArea.tsx`, `DiffViewer.tsx`, `CodeBlock.tsx` 等渲染组件
   - 引入 xterm.js 终端模拟器
3. **后端重构**：
   - 废弃手动消息历史拼接
   - 改为调用CLI `--resume` 恢复会话
4. **Skill/Agent管理重构**：
   - 废弃独立存储
   - 改为读写CLI配置文件

## Capabilities

### New Capabilities
- `terminal-rendering`：基于xterm.js的终端渲染能力

### Modified Capabilities
- `session-management`：改为使用CLI原生会话恢复

## Impact

- 前端需要引入xterm.js依赖
- 后端需要改造CLI进程管理逻辑
- 需要验证兼容性