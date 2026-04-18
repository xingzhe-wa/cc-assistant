# Spec: Provider.switchProvider()

## 函数签名

```kotlin
fun switchProvider(providerId: String): Boolean
```

## 功能

切换活跃的 Provider，只覆盖 env 属性，保留其他配置。

## 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| providerId | String | 要切换的 Provider ID (claude/deepseek/gemini/glm/kimi/qwen) |

## 返回值

- `true`: 切换成功
- `false`: 切换失败（Provider 不存在或保存失败）

## 业务流程

1. 验证 Provider ID 是否存在于 PRESET_PROVIDERS
2. 读取现有的 `~/.claude/settings.json`
3. 从资源 `/providers/settings-{providerId}.json` 加载模板的 env
4. 合并 env：模板值覆盖现有值，但保留现有的 ANTHROPIC_AUTH_TOKEN
5. 将合并后的 settings 写回 `~/.claude/settings.json`
6. 更新内部状态 `_activeProviderId`

## 错误处理

- Provider 不存在：返回 false
- 加载模板失败：返回 false
- 写文件失败：返回 false，记录日志