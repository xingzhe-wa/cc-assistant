# 设计文档: Provider Env 覆盖切换

## 概述

修改 Provider 切换逻辑：从模板完全替换改为只覆盖 env 属性。

## 背景

当前 Provider 切换使用模板完全替换 `~/.claude/settings.json`，导致用户配置的 ANTHROPIC_AUTH_TOKEN 丢失。

## 设计目标

1. 切换 Provider 时只覆盖 env 属性
2. 保留其他配置（permissions, skills, agents, mcpServers）
3. 保留现有的 ANTHROPIC_AUTH_TOKEN

## 设计方案

### 核心逻辑

```kotlin
fun switchProvider(providerId: String): Boolean {
    // 1. 读取现有配置
    val existingSettings = loadSettings() ?: ClaudeSettings()

    // 2. 从模板加载 env
    val templateEnv = loadProviderEnv(providerId) ?: return false

    // 3. 合并 env（模板覆盖现有）
    val mergedEnv = existingSettings.env.toMutableMap()
    mergedEnv.putAll(templateEnv)

    // 4. 写回
    val newSettings = existingSettings.copy(env = mergedEnv)
    return saveSettings(newSettings)
}
```

### 关键函数

| 函数 | 职责 |
|-----|------|
| `loadSettings()` | 读取现有 settings.json |
| `loadProviderEnv(id)` | 从资源加载模板的 env |
| `saveSettings()` | 写回合并后的配置 |

### 数据流

```
用户点击切换 → 读取现有 settings.json → 从模板加载 env → 合并 env → 写回 settings.json → 更新 UI
```

## 变更点

| 文件 | 变更 |
|------|------|
| `Provider.kt` | 修改 `switchProvider()` 方法 |