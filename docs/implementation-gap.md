# CC Assistant 实现差异分析

> 基于 `cli-ui-codeBuddy.md` 和 `cli-ui-mapping.md` 文档共识
> 对比设计意图与当前实现差异

---

## 核心设计原则

| 原则 | 文档来源 |
|------|---------|
| GUI是CLI的外骨骼，不是替代品 | cli-ui-codeBuddy.md |
| 消息区应使用终端模拟器 | cli-ui-codeBuddy.md |
| 会话管理使用CLI原生能力 | cli-ui-mapping.md |
| Agent/Skill管理使用CLI配置 | cli-ui-codeBuddy.md |

---

## 一、前端渲染层差异

### 设计意图 (cli-ui-codeBuddy.md)
```
消息区 → xterm.js 终端模拟器
  - 直接渲染CLI输出的ANSI转义码
  - 无需自定义Markdown/Diff解析
  - 点击文件路径可跳转IDEA
```

### 当前实现
| 文件 | 当前状态 | 问题 |
|------|----------|------|
| `MessageArea.tsx` | ✅ 已实现 | 需废弃 |
| `DiffViewer.tsx` | ✅ 已实现 | 需废弃 |
| `CodeBlock.tsx` | ✅ 已实现 | 需废弃 |
| `MarkdownContent.tsx` | ✅ 已实现 | 需废弃 |
| xterm.js | ❌ 未实现 | **待引入** |

### 差异说明
- 当前：前端用React解析JSON流，自己渲染Markdown
- 设计：前端直接渲染终端输出，靠CLI原生能力

---

## 二、会话管理差异

### 设计意图 (cli-ui-mapping.md)
```
新会话 → claude -p "prompt"
历史会话 → claude --resume <session_id>
```

### 当前实现 (后端)
| 文件 | 功能 | 实现 | 问题 |
|------|------|------|------|
| `SessionService.kt` | 会话存储 | 前端/Zustand + 本地JSON | 需重构为CLI原生 |
| `CliBridgeService.kt:155` | CLI命令 | `claude -p "prompt"` | **未使用--resume** |

### 代码对比
```kotlin
// 当前实现 (CliBridgeService.kt:155)
val command = mutableListOf(cli, "-p", prompt, "--output-format", "stream-json")

// 设计意图
// 首次会话: claude -p "prompt" --output-format stream-json
// 恢复会话: claude --resume <session_id> --output-format stream-json
```

### 会话ID处理
| 功能 | 状态 | 说明 |
|------|------|------|
| sessionId解析 | ✅ 已实现 | NdjsonParser解析返回的session_id |
| sessionId存储 | ✅ 已实现 | ChatSession模型有sessionId字段 |
| --resume恢复 | ❌ 未实现 | **需重构executePrompt方法** |

---

## 三、Agent/Skill管理差异

### 设计意图 (cli-ui-codeBuddy.md)
```
Agent → ~/.claude/agents/*.md 文件系统
Skill → ~/.claude/skills/*/ 文件系统
```

### 当前实现
| 功能 | 设计 | 当前 | 差异 |
|------|------|------|------|
| Agent列表 | 读取CLI配置目录 | 独立Zustand存储 | 需重构 |
| Skill列表 | CLI无命令，完全自研 | 独立Zustand存储 | 可保留 |
| Agent使用 | --agent参数 | 未传递 | **需修复** |

### 问题代码
```kotlin
// CliBridgeService.kt:155-159
val command = mutableListOf(cli, "-p", prompt, "--output-format", "stream-json")
model?.let {
    command.add("--model")
    command.add(it)
}
// 缺失: --agent 参数传递
```

---

## 四、思考过程差异

### 设计意图 (cli-ui-codeBuddy.md)
```
思考展开 → Ctrl+O (\x0f) 发送到PTY
```

### 当前实现
| 功能 | 状态 | 文件 |
|------|------|------|
| thinking_delta解析 | ✅ 已实现 | NdjsonParser.kt:86-88 |
| ThinkingBlock组件 | ✅ 已实现 | ThinkingBlock.tsx |
| Ctrl+O发送 | ❌ 未实现 | **待实现** |

### 现有代码
```kotlin
// NdjsonParser.kt
"thinking_delta" -> {
    val text = delta.get("thinking")?.asString ?: ""
    if (text.isNotEmpty()) listOf(CliMessage.ThinkingDelta(text)) else emptyList()
}
```

---

## 五、选项传递差异

### 前端发送的选项
```typescript
// chatStore.ts:263
jcefBridge.sendMessage(inputValue, {
  stream: streamEnabled,    // ← 未传递到CLI
  think: thinkEnabled,    // ← 未传递到CLI
  mode: currentMode,      // ← 未传递到CLI
  model: currentModel,
  provider: currentProvider
});
```

### 当前CliBridgeService接受的参数
```kotlin
// CliBridgeService.kt:138
fun executePrompt(prompt: String, workingDir: String? = null, model: String? = null): Boolean
```

### 差异表
| 选项 | 前端发送 | 后端接收 | CLI传递 |
|------|---------|---------|--------|
| stream | ✅ | ❌ | ❌ |
| think | ✅ | ❌ | ❌ |
| mode | ✅ | ❌ | ❌ |
| model | ✅ | ✅ | ✅ |
| provider | ✅ | ❌ | ❌ |

---

## 六、重构优先级

### P0 (必须修复)
1. **Agent参数传递** - `executePrompt`添加`agent`参数
2. **会话恢复** - 使用`--resume`而非手动拼接消息

### P1 (建议重构)
3. **xterm.js引入** - 替换React渲染组件
4. **Agent列表** - 读取`~/.claude/agents/`目录

### P2 (可保留)
5. Skill管理 - CLI无命令，保持现状
6. 思考展开按钮 - 发送Ctrl+O

---

## 七、总结

| 类别 | 设计意图 | 当前状态 | 差异 |
|------|---------|----------|------|
| 渲染 | xterm.js | React组件 | 需重构 |
| 会话 | --resume | -p单次 | 需重构 |
| Agent | --agent参数 | 未传递 | 需修复 |
| Skill | 自研 | 自研 | 一致 |
| 思考 | Ctrl+O | Delta解析 | 部分实现 |