## ADDED Requirements

### Requirement: CLI命令与UI交互映射
UI交互应尽可能复用Claude Code CLI原生命令和能力。

#### Scenario: 新会话
- **WHEN** 用户点击"新建会话"
- **THEN** 插件启动新的CLI进程，使用 `claude -p "..."` 而非手动拼接历史

#### Scenario: 历史会话恢复
- **WHEN** 用户从历史会话列表点击加载会话
- **THEN** 使用 `claude --resume <session_id>` 恢复会话，而非手动传递消息历史

#### Scenario: Agent管理
- **WHEN** 用户在设置页管理Agent
- **THEN** 优先调用 `/agent` 命令列出/添加/删除Agent

#### Scenario: Skill管理
- **WHEN** 用户在设置页管理Skill
- **THEN** 优先调用 `/skill` 命令列出/添加/删除Skill

---

## MODIFIED Requirements

### Requirement: 会话存储
**原需求**：前端存储所有会话消息历史
**新需求**：仅存储会话元数据(session_id, name, 创建时间)，消息由CLI通过--resume管理

### Requirement: Skill/Agent存储
**原需求**：独立存储在插件配置中
**新需求**：优先调用CLI命令，失败则fallback到本地存储