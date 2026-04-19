## Context

当前设置模块的 CRUD 操作（Provider/Agent/Skill）只存在于前端 Zustand 内存中，Java 层 `handleJSMessage` 虽然有 `saveProvider` 和 `deleteProvider` 的 case，但实现都是空的 TODO。更严重的是，前端发送的 action 名称（`providerCreate`/`providerUpdate`/`providerDelete`）与 Java 层处理的名称（`saveProvider`/`deleteProvider`）不匹配，导致所有操作都是断开的。

根据 `skillAgentManagement.md` 的分析：
- **Provider**: 通过 `~/.claude/settings.json` 的 `env` 字段注入 `ANTHROPIC_BASE_URL`/`ANTHROPIC_AUTH_TOKEN` 等环境变量
- **Agent**: 存储为 `~/.claude/agents/<name>.md`（Markdown + YAML frontmatter）
- **Skill**: 存储为 `~/.claude/skills/<name>/SKILL.md`（Markdown + YAML frontmatter）

## Goals / Non-Goals

**Goals:**
- Provider CRUD 持久化到 `~/.claude/settings.json`，切换时更新 `env` 字段
- Agent CRUD 读写 `~/.claude/agents/` 目录的 Markdown 文件
- Skill CRUD 读写 `~/.claude/skills/` 目录的 SKILL.md 文件
- 修正前端 action 名称与 Java handler 的对齐
- 使用 `settings-kimi.json` 测试数据验证端到端流程

**Non-Goals:**
- 企业级 managed settings（Enterprise/Plugin 作用域）
- Agent 的 system prompt 语法验证
- Skill 的 `/skill-name` 自动补全触发逻辑
- 多 Provider 配置的合并策略（当前只有一个 env 块）

## Decisions

### Decision 1: Provider CRUD 映射到 settings.json 的 env 字段

**选择**: 每个 Provider 的配置写入 `~/.claude/settings.json` 的 `env` 对象

**理由**: Claude Code 通过读取 `settings.json` 的 `env` 字段作为环境变量注入。切换 Provider = 更新 `env` 中的 `ANTHROPIC_BASE_URL`/`ANTHROPIC_AUTH_TOKEN`。现有 `ProviderService.switchProvider()` 已有部分实现。

**数据模型**:
```kotlin
data class ProviderConfig(
    val id: String,         // 唯一标识
    val name: String,       // 显示名称
    val baseUrl: String?,  // ANTHROPIC_BASE_URL
    val apiKey: String?,   // ANTHROPIC_AUTH_TOKEN
    val models: Map<String, String>, // default/opus/max -> modelId
    val status: String      // ok/err/off
)
```

**settings.json 写入结构**:
```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://api.xxx.com",
    "ANTHROPIC_AUTH_TOKEN": "sk-xxx",
    "ANTHROPIC_MODEL": "claude-xxx"
  }
}
```

### Decision 2: Agent CRUD 映射到文件系统

**选择**: Agent 存储为 `~/.claude/agents/<id>.md`，使用 YAML frontmatter

**理由**: Claude Code 原生读取 `~/.claude/agents/` 目录下的 Markdown 文件作为 Agent 定义。直接操作文件系统最简单，且与 CLI 原生一致。

**文件格式**:
```markdown
---
name: code-reviewer
description: 专注代码审查和质量分析
---
# Code Reviewer

You are an expert code reviewer focused on ...
```

### Decision 3: Skill CRUD 映射到文件系统

**选择**: Skill 存储为 `~/.claude/skills/<id>/SKILL.md`，使用 YAML frontmatter

**理由**: Claude Code 原生约定。`SKILL.md` 的 `name` 字段作为斜杠命令名（如 `/explain-code`）。

**文件格式**:
```markdown
---
name: explain-code
description: 解释代码逻辑和结构
when_to_use: 用户询问代码功能或实现细节时
---
# Explain Code Skill

When explaining code, you should:
1. Start with an overview
2. Explain key components
3. ...
```

### Decision 4: Action 名称对齐

**选择**: 前端发送 `providerCreate`/`providerUpdate`/`providerDelete`，Java 层新增对应的 case 处理

**理由**: 不想修改前端已有的 action 名称（涉及 `jcef.ts`、`chatStoreExtensions.ts`、`dataService.ts` 多处），Java 侧新增 handlers 更干净

**Java handlers**:
```kotlin
"providerCreate" -> invokeLater { onProviderCreate?.invoke(map) }
"providerUpdate" -> invokeLater { onProviderUpdate?.invoke(map) }
"providerDelete" -> invokeLater { onProviderDelete?.invoke(data) }
```

## Risks / Trade-offs

- **[风险] settings.json 读写冲突** → 使用 IntelliJ 的 `ApplicationManager.invokeLater` 确保 EDT 安全
- **[风险] 写入 settings.json 时丢失其他 env 字段** → 读取完整文件后深度合并而非覆盖
- **[风险] Agent/Skill YAML frontmatter 解析** → 使用简单的正则或 Jackson 解析，不引入复杂 YAML 库
- **[风险] settings.json 不存在** → 自动创建文件 + 默认结构

## Open Questions

- 是否需要支持项目级 Agent/Skill（`.claude/agents/`）？当前只实现用户级（`~/.claude/`）
- Provider 的 "设为默认" 功能是否需要修改 CLI 的默认配置？
