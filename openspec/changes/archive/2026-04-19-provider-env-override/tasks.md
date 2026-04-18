# Tasks: Provider Env 覆盖切换

## 目标

修改 Provider 切换逻辑：从模板完全替换改为只覆盖 env 属性。

## Tasks

### Task 1: 修改 ProviderService.switchProvider()

**修改文件**:
- `src/main/kotlin/com/github/xingzhewa/ccassistant/model/Provider.kt`

**步骤**:
1. [x] 修改 `switchProvider()` 方法实现
   - 加载现有 settings.json
   - 解析现有 env（保留 ANTHROPIC_AUTH_TOKEN 等）
   - 从模板加载新 env
   - 合并：现有 env + 新 env（后者覆盖前者）
   - 写回合并后的 env 到 settings.json
2. [x] 确保 permissions、skills、agents 配置不被修改

---

### Task 2: 测试 Provider 切换

**注意**: 此任务需要用户在运行时手动验证

**步骤**:
1. [x] 切换 Provider 后验证原 api key 仍然存在
2. [x] 发送消息测试是否使用新 Provider

> 验证方式：查看 `~/.claude/settings.json` 中的 `ANTHROPIC_AUTH_TOKEN` 是否在切换后保留

---

## 原理说明

修改后的代码：
```kotlin
fun switchProvider(providerId: String): Boolean {
    // 读取现有配置
    val existingSettings = loadSettings() ?: ClaudeSettings()

    // 从模板加载 env
    val templateEnv = loadProviderEnv(providerId)

    // 合并 env（模板覆盖现有）
    val mergedEnv = existingSettings.env.toMutableMap()
    mergedEnv.putAll(templateEnv)

    // 写回（只更新 env）
    return saveSettings(existingSettings.copy(env = mergedEnv))
}
```

Claude Code CLI 会自动读取 `~/.claude/settings.json` 中的环境变量，因此不需要额外传递参数。

---

## 修改的代码

### 修改前 (模板替换)
```kotlin
fun switchProvider(providerId: String): Boolean {
    // ...
    val mergedContent = mergeWithTemplate(existingContent, template)
    settingsFile.writeText(mergedContent)  // 完全替换！
    // ...
}
```

### 修改后 (env 覆盖)
```kotlin
fun switchProvider(providerId: String): Boolean {
    // 读取现有配置
    val existingSettings = loadSettings() ?: ClaudeSettings()

    // 读取模板中的 env
    val templateEnv = loadProviderEnv(providerId) ?: return false

    // 合并 env：模板覆盖现有，但保留 AUTH_TOKEN
    val mergedEnv = existingSettings.env.toMutableMap()
    mergedEnv.putAll(templateEnv)

    // 写回：只更新 env，保留其他配置
    val newSettings = existingSettings.copy(env = mergedEnv)
    return saveSettings(newSettings)
}
```