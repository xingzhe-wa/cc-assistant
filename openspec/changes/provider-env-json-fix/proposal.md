# Proposal: Provider ENV JSON 配置格式适配与智能合并

## 1. Problem Statement

当前 Provider 切换逻辑存在以下问题：

1. **JSON 格式不一致**：用户已有的 `~/.claude/settings.json` 可能包含额外字段（如 `ANTHROPIC_DEFAULT_SONNET_MODEL` 等），而 Provider 资源模板格式固定，切换时会导致用户自定义字段丢失

2. **ENV 覆盖策略不精准**：当前 `switchProvider()` 使用 `putAll()` 整体合并，导致即使 env 内容没变化也会写回文件，增加不必要的文件 IO

3. **模板字段不全**：参考 `docs/claudeSettings/settings-kimi.json`，用户配置包含更丰富的字段，但 Provider 资源模板未涵盖

## 2. Goals

- **精准覆盖**：只覆盖 `env` 中的指定 key，保留其他所有字段
- **智能比较**：只有当 env 内容真正变化时才写回文件
- **格式兼容**：支持用户自定义的额外 env 字段

## 3. Approach

### 3.1 ENV 智能合并策略

切换 Provider 时：
1. 仅修改 `ANTHROPIC_BASE_URL`、`ANTHROPIC_MODEL`、`ANTHROPIC_SMALL_FAST_MODEL` 等关键字段
2. 保留现有 `ANTHROPIC_AUTH_TOKEN` 不变
3. 保留用户自定义的所有其他 env 字段

### 3.2 变更检测

在写回 `settings.json` 前，先比较：
- 现有 env 中需要变更的 key 是否与目标值一致
- 只有存在差异时才执行写回操作

### 3.3 参考格式

参考 `docs/claudeSettings/settings-kimi.json` 的完整格式，完善 Provider 资源模板。

## 4. Impact

- **安全性**：不会意外删除用户的自定义配置
- **性能**：避免无意义的文件写操作
- **兼容性**：支持任意用户自定义 env 字段

## 5. Out of Scope

- Provider 资源模板的创建（已有）
- 前端 UI 交互逻辑
- CLI 执行逻辑
