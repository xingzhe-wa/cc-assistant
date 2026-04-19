## Context

### 当前状态

`ProviderService.switchProvider()` 的实现：
```kotlin
val mergedEnv = existingSettings.env.toMutableMap()
mergedEnv.putAll(templateEnv)
val newSettings = existingSettings.copy(env = mergedEnv)
saveSettings(newSettings)
```

问题：
1. `putAll()` 会用模板值覆盖所有 key，包括用户自定义的
2. 无论是否有变化，都会写回文件
3. 模板只覆盖 `ANTHROPIC_BASE_URL` 等核心字段

### 参考格式

`docs/claudeSettings/settings-kimi.json` 包含的字段：
- `ANTHROPIC_BASE_URL`
- `ANTHROPIC_AUTH_TOKEN`
- `API_TIMEOUT_MS`
- `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`
- `ANTHROPIC_MODEL`
- `ANTHROPIC_DEFAULT_SONNET_MODEL`
- `ANTHROPIC_DEFAULT_OPUS_MODEL`
- `ANTHROPIC_DEFAULT_HAIKU_MODEL`

## Goals / Non-Goals

**Goals:**
- 切换 Provider 时精准覆盖指定 env key
- 保留用户自定义的所有其他 env 字段
- 只有 env 实际变化时才写回文件
- 支持 Provider 模板包含更丰富的字段

**Non-Goals:**
- 不修改 `permissions`、`skills`、`agents` 等非 env 字段
- 不实现 Provider 模板创建/编辑 UI
- 不改变 `saveProvider()` 的现有行为（用于用户自定义 Provider）

## Decisions

### Decision 1: Key-based ENV 覆盖策略

**选择**：明确定义需要覆盖的 env key 列表，只覆盖这些 key

**理由**：
- `putAll()` 太暴力，会覆盖用户自定义字段
- 明确定义列表更安全、可预测

**需要覆盖的 key**：
```kotlin
val PROVIDER_ENV_KEYS = listOf(
    "ANTHROPIC_BASE_URL",
    "ANTHROPIC_MODEL",
    "ANTHROPIC_SMALL_FAST_MODEL",
    "API_TIMEOUT_MS",
    "CLAUDE_CODE_MAX_OUTPUT_TOKENS",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC",
    "ANTHROPIC_DEFAULT_SONNET_MODEL",
    "ANTHROPIC_DEFAULT_OPUS_MODEL",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL"
)
```

**替代方案**：
- 只覆盖 `ANTHROPIC_BASE_URL` → 太局限
- 从模板完整合并 → 会丢失用户字段（当前问题）

### Decision 2: 变更检测机制

**选择**：比较需要覆盖的 key 是否与目标值一致，只有变化才写回

```kotlin
fun needsUpdate(existingEnv: Map<String, String>, newEnv: Map<String, String>): Boolean {
    return PROVIDER_ENV_KEYS.any { key ->
        existingEnv[key] != newEnv[key]
    }
}
```

**理由**：避免无意义的文件 IO，提升性能

### Decision 3: 保留 ANTHROPIC_AUTH_TOKEN

**选择**：切换时永远不覆盖 `ANTHROPIC_AUTH_TOKEN`

**理由**：
- API Key 是用户私密信息，不应被模板覆盖
- 即使模板包含占位符，也不应替换用户已配置的有效 Key

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| 用户修改了模板不包含的 key，期望被清除 | 明确文档说明：只覆盖指定的 key，其他字段保留 |
| 模板字段与用户字段冲突 | key-based 覆盖策略确保只有白名单内的 key 会被覆盖 |

## Open Questions

1. Provider 资源模板是否需要更新以包含更多字段？
2. `saveProvider()`（用户自定义 Provider）是否需要相同的智能合并逻辑？
