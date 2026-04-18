# Provider Env 覆盖切换方案

## 问题描述

Task 3：配置供应商不生效的问题。

当前实现使用**模板替换**方式：切换 Provider 时，用预置模板（如 `settings-deepseek.json`）**完全替换** `~/.claude/settings.json` 内容。这会导致：
1. 丢失用户之前配置的 ANTHROPIC_AUTH_TOKEN（需要重新输入）
2. 丢失 permissions、skills、agents 配置

## 解决方案

采用 **Env 覆盖**方式：
- 保留 `~/.claude/settings.json` 的完整结构
- 只覆盖 `env` 属性（Provider 相关的环境变量）
- 其它配置（permissions、skills、agents、mcpServers）保持不变

### 覆盖策略

从预置模板中提取 `env` 属性，合并到现有配置的 `env` 中：
- 新 env 中的键 → 添加或覆盖
- 现有 env 中的其他键（如 ANTHROPIC_AUTH_TOKEN）→ 保留

### 覆盖示例

**现有配置** `~/.claude/settings.json`:
```json
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "sk-xxx",
    "ANTHROPIC_BASE_URL": "https://api.anthropic.com"
  },
  "permissions": { "allow": ["*"] },
  "skills": [...]
}
```

**DeepSeek 模板** `env`:
```json
{
  "ANTHROPIC_BASE_URL": "https://api.deepseek.com/anthropic",
  "ANTHROPIC_MODEL": "deepseek-reasoner"
}
```

**合并后**:
```json
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "sk-xxx",  // 保留
    "ANTHROPIC_BASE_URL": "https://api.deepseek.com/anthropic",  // 覆盖
    "ANTHROPIC_MODEL": "deepseek-reasoner"  // 新增
  },
  "permissions": { "allow": ["*"] },  // 保留
  "skills": [...]  // 保留
}
```

---

## 修改文件

| 文件 | 修改内容 |
|------|----------|
| `src/main/kotlin/.../model/Provider.kt` | 修改 `switchProvider()` 方法，使用 env 覆盖而非模板替换 |

---

## 实现步骤

1. 修改 ProviderService.switchProvider()
   - 读取现有 settings.json
   - 从模板加载新 env
   - 合并：保留现有非覆盖的 env 键 + 新 env
   - 写回 settings.json

2. 验证
   - 切换 Provider 后确认 AUTH_TOKEN 未被清除
   - 确认新 Provider 的 URL 生效

---

## 验收标准

- [ ] 切换 Provider 时保留 ANTHROPIC_AUTH_TOKEN
- [ ] 切换 Provider 时保留 permissions、skills、agents 配置
- [ ] 切换后可以使用新 Provider 的模型进行对话