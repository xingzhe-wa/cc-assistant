# Claude Code CLI 与 UI 交互映射文档

> 最后更新: 2026-04-19
> 目的：明确哪些依赖CLI原生能力，哪些需要完全自研

---

## CLI 能力矩阵

| UI操作 | CLI能力 | CLI命令/参数 | 实现方式 |
|--------|---------|--------------|----------|
| **会话管理** | | | |
| 新建会话 | ✅ | `claude -p "..."` | CLI原生 |
| 历史会话恢复 | ✅ | `--resume <session_id>` | CLI原生 |
| 会话继续(当前目录) | ✅ | `-c, --continue` | CLI原生 |
| Fork会话 | ✅ | `--fork-session` | CLI原生 |
| **Agent管理** | | | |
| 列出Agent | ✅ | `claude agents` | CLI原生 |
| 使用Agent | ✅ | `--agent <name>` | CLI原生 |
| 定义Agent | 🔄 | `--agents <json>` | CLI原生(需JSON) |
| **Skill管理** | | | |
| 列出Skill | ❌ | 无 | 完全自研 |
| 使用Skill | ❌ | `/skill` | 完全自研 |
| **思考过程** | | | |
| 显示思考 | ✅ | stream-json thinking_delta | CLI原生 |
| 展开/收起 | ❌ | Ctrl+O(CLI快捷键) | 完全自研 |
| **MCP工具** | | | |
| 列出MCP | ✅ | `claude mcp list` | CLI原生 |
| 添加MCP | ✅ | `claude mcp add` | CLI原生 |
| 工具调用展示 | 🔄 | stream-json tool_use | CLI原生(需解析) |
| **其他** | | | |
| 模型切换 | ✅ | `--model <model>` | CLI原生 |
| 权限模式 | ✅ | `--permission-mode` | CLI原生 |
| 工作树 | ✅ | `-w, --worktree` | CLI原生 |

---

## 映射详情

### 1. 会话管理

```
┌─────────────────────────────────────────────────────────────┐
│ UI操作          │ CLI命令/参数          │ 实现优先级     │
├─────────────────────────────────────────────────────────────┤
│ 新建会话         │ claude -p "prompt"    │ P0 (CLI原生)   │
│ 恢复会话         │ claude -r <session>   │ P0 (CLI原生)   │
│ 继续最近会话      │ claude -c             │ P0 (CLI原生)   │
│ Fork会话         │ claude -r --fork       │ P1 (CLI原生)   │
│ 查看会话列表     │ claude -r (无参数)     │ P0 (CLI原生)   │
└─────────────────────────────────────────────────────────────┘
```

**当前实现状态：**
- 新建会话：✅ 使用 `claude -p` 启动新进程
- 历史会话：❌ 前端手动拼接消息历史，需重构为 `--resume`
- 会话列表：❌ 本地存储，需改为调用CLI获取

**重构建议：**
```kotlin
// 当前：手动传递消息历史
claude -p "..." --output-format stream-json

// 建议：使用--resume恢复
claude -p "continue conversation" --resume <session_id> --output-format stream-json
```

### 2. Agent管理

```
┌─────────────────────────────────────────────────────────────┐
│ UI操作          │ CLI命令/参数          │ 实现优先级     │
├─────────────────────────────────────────────────────────────┤
│ 列出Agent       │ claude agents        │ P0 (CLI原生)   │
│ 使用Agent       │ --agent <name>      │ P0 (CLI原生)   │
│ 添加Agent       │ --agents <json>     │ P1 (需要构建JSON)│
│ Agent详情       │ claude agents        │ P0 (CLI原生)   │
└────────��────────────────────────────────────────────────────┘
```

**当前实现状态：**
- 列出Agent：❌ 独立存储，需改为调用 `claude agents`
- 使用Agent：✅ 通过 `--agent` 参数传递
- 添加Agent：🔄 支持JSON定义

**重构建议：**
```kotlin
// 调用CLI获取Agent列表
val result = ProcessBuilder("claude", "agents", "--setting-sources", "user")
    .redirectErrorStream(true)
    .start()
    .inputStream
    .bufferedReader()
    .readText()

// 解析JSON结果更新UI
```

### 3. Skill管理（无原生命令）

```
┌─────────────────────────────────────────────────────────────┐
│ UI操作          │ CLI命令/参数          │ 实现优先级     │
├─────────────────────────────────────────────────────────────┤
│ 列出Skill       │ ❌ 无                │ 完全自研(P0)   │
│ 添加Skill       │ ❌ 无                │ 完全自研(P0)   │
│ 使用Skill       │ ❌ /skill (需-p模式)  │ 完全自研(P0)   │
└─────────────────────────────────────────────────────────────┘
```

**分析：** CLI无独立skill命令，但有 `--disable-slash-commands` 参数。

**建议：**
- 使用本地配置存储Skill
- 前端UI模拟 `/skill` 命令执行

### 4. 思考过程

```
┌─────────────────────────────────────────────────────────────┐
│ UI操作          │ CLI命令/参数          │ 实现优先级     │
├─────────────────────────────────────────────────────────────┤
│ 显示思考内容    │ stream-json thinking │ P0 (CLI原生)   │
│ 展开/收起      │ Ctrl+O             │ P1 (UI模拟)    │
│ 思考统计       │ stream-json        │ P0 (CLI原生)   │
└─────────────────────────────────────────────────────────────┘
```

**实现细节：**
- CLI通过 `{"type":"stream_event","event":{"type":"content_block_delta","delta":{"type":"thinking_delta","thinking":"..."}}` 输出thinking
- 后端 `NdjsonParser` 解析 `thinking_delta` 类型
- 前端 `ThinkingBlock` 组件展示

**当前实现：✅ 已正确实现**

### 5. MCP工具

```
┌─────────────────────────────────────────────────────────────┐
│ UI操作          │ CLI命令/参数          │ 实现优先级     │
├─────────────────────────────────────────────────────────────┤
│ 列出MCP        │ claude mcp list      │ P0 (CLI原生)   │
│ 添加MCP        │ claude mcp add      │ P0 (CLI原生)   │
│ 移除MCP        │ claude mcp remove   │ P0 (CLI原生)   │
│ 工具调用展示    │ stream-json tool_use│ P0 (需解析)   │
└─────────────────────────────────────────────────────────────���
```

**当前实现状态：**
- MCP管理：❌ 未实现
- 工具展示：🔄 部分实现（DiffViewer）

---

## 开发建议

### P0 优先级（必须CLI原生）

1. **会话恢复重构**
   - 使用 `--resume <session_id>` 而非手动拼接
   - 需要：CLI会话持久化配置验证

2. **Agent列表重构**
   - 调用 `claude agents` 获取列表
   - 需要：解析JSON输出

### P1 优先级（需要适配器）

3. **Skill模拟器**
   - 本地存储Skill定义
   - 前端拦截 `/skill` 命令
   - 调用Skill作为system prompt注入

4. **MCP管理**
   - 调用 `claude mcp add/remove/list`
   - 与现有配置合并

### P2 优先级（增强体验）

5. **思考过程增强**
   - 添加展开/收起动画
   - 统计思考耗时/长度

6. **工具调用可视化**
   - 解析tool_use事件
   - 展示工具执行状态

---

## 补充：CLI版本信息

```
Claude Code: 2.1.56
```

### 支持的命令
```
agents      - Agent管理
auth       - 认证管理
doctor     - 健康检查
install    - 安装/更新
mcp        - MCP服务器管理
plugin     - 插件管理
update     - 版本更新
```

### 缺失能力
- 无独立skill命令
- 无session列表查询命令
- 无thinking存储API