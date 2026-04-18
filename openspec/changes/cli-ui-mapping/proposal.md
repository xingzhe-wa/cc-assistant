## Why

当前UI设计文档缺少对交互操作底层能力的映射。用户开发此插件的核心目的是**基于Claude Code CLI原生命令做GUI集成**，而非独立实现AI功能。需要明确：
- 哪些交互可复用CLI原生能力（命令、快捷键）
- 哪些必须完全独立开发（场景化操作）

## What Changes

1. **创建 `docs/cli-ui-mapping.md`**：CLI原生命令与UI交互的映射文档
2. **重构部分实现**：
   - 历史会话加载 → 使用 `--resume` 而非手动拼接消息历史
   - Skill/Agent管理 → 调用 `/agent` `/skill` 命令而非独立存储
   - 会话重命名 → 调用CLI命令或更新本地配置
3. **补充缺失能力**：
   - 思考过程显示（Ctrl+O）
   - MCP工具调用展示

## Capabilities

### New Capabilities
- `cli-command-mapping`：CLI命令到UI交互的映射规范

### Modified Capabilities
- `session-management`：改为基于 `--resume` 的会话恢复
- `agent-skill-management`：改为调用CLI命令而非独立存储

## Impact

- 变更 `stores/chatStore.ts` 会话加载逻辑
- 变更 `stores/configStore.ts` Agent/Skill管理逻辑
- 需要研究CLI支持的命令和参数