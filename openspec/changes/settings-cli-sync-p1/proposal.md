## Why

当前设置模块的所有 CRUD 操作（Provider/Agent/Skill 的增删改）只停留在前端 Zustand store 的内存中，刷新页面即丢失。Java 层虽然有 `saveProvider`、`deleteProvider` 的 handleJSMessage cases，但实现都是空的 TODO。这些设置从未真正与 Claude Code CLI 的配置文件（`~/.claude/settings.json`、`~/.claude/agents/`、`~/.claude/skills/`）打通，导致用户无法持久化管理 Agent/Skill 配置，多供应商切换也不生效。

## What Changes

- **新增**: Java 层完整实现 Provider CRUD（写入 `~/.claude/settings.json` 的 `env` 字段）
- **新增**: Java 层完整实现 Agent CRUD（读写 `~/.claude/agents/` 目录的 Markdown 文件）
- **新增**: Java 层完整实现 Skill CRUD（读写 `~/.claude/skills/` 目录的 SKILL.md 文件）
- **修复**: Java 层处理前端发送的 `providerCreate/providerUpdate/providerDelete` action（当前发的是这些，前端发的是 `providerDelete` 而 Java 处理的是 `deleteProvider`）
- **修复**: 前端 `jcefBridge` 中 agent/skill 相关的 action 与 Java handler 对齐
- **新增**: Provider 切换时自动将 ANTHROPIC_BASE_URL/ANTHROPIC_AUTH_TOKEN 写入 `~/.claude/settings.json`
- **新增**: `settings-kimi.json` 作为测试数据的端到端验证

## Capabilities

### New Capabilities
- `provider-cli-sync`: Provider 配置的增删改同步到 `~/.claude/settings.json` 的 `env` 字段，切换 Provider 时更新环境变量配置
- `agent-cli-sync`: Agent 的增删改读写 `~/.claude/agents/` 目录的 Markdown 文件
- `skill-cli-sync`: Skill 的增删改读写 `~/.claude/skills/` 目录的 SKILL.md 文件

### Modified Capabilities

## Impact

- **Kotlin 层**: `ProviderService.kt`（新增 CRUD + settings.json 读写）、`SkillAgentService.kt`（新增 CRUD 写入）、`JcefChatPanel.kt`（新增 action handlers）、`ReactChatPanel.kt`（新增 callbacks）
- **前端层**: `jcef.ts`（修正 action 名称对齐）、`chatStoreExtensions.ts`（确认调用正确）
- **测试**: 使用 `docs/claudeSettings/settings-kimi.json` 作为测试数据验证完整流程
