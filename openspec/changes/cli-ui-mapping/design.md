## Context

本插件是Claude Code CLI的GUI包装器，核心原则是：
- **一个会话 = 一个CLI终端窗口**
- **新会话 = 新开终端**
- **历史会话 = `--resume`恢复**
- **Skill/Agent管理 = `/agent` `/skill`命令**
- **思考过程 = Ctrl+O展开**

## Goals / Non-Goals

**Goals:**
- 创建CLI命令与UI交互的映射文档
- 重构会话管理使用CLI原生能力
- 重构Skill/Agent管理使用CLI命令

**Non-Goals:**
- 不修改CLI本身
- 不实现新的AI能力

## Decisions

### 1. 会话管理策略
| 操作 | 当前实现 | 建议实现 |
|------|---------|---------|
| 新会话 | 前端创建session | `claude -p "..."` 新开终端 |
| 历史会话 | 手动拼接消息 | `--resume <session_id>` |
| 会话重命名 | 前端修改 | CLI配置或本地元数据 |

### 2. Skill/Agent管理策略
| 操作 | 当前实现 | 建议实现 |
|------|---------|---------|
| 列出 | 独立存储 | `/agent list` `/skill list` |
| 添加 | 独立存储 | `/agent create` `/skill create` |
| 删除 | 独立存储 | `/agent delete` `/skill delete` |
| 使用 | 传递参数 | `--agent <name>` `--skill <name>` |

### 3. 思考过程策略
- 当前：有UI组件 `ThinkingBlock.tsx`
- CLI原生命令：Ctrl+O快捷键
- 需要：监听CLI输出或本地存储thinking

### 4. MCP工具策略
- MCP工具调用通过CLI输出
- 需要：解析CLI输出的tool_use消息

## Risks / Trade-offs

**风险：**
1. CLI `--resume`行为需要验证（是否保留完整上下文）
2. `/agent` `/skill` 命令存在性和参数格式需确认
3. 思考过程存储位置待确认

**权衡：**
- 若CLI命令不满足需求，仍保留本地存储作为fallback