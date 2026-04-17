# CC Assistant 后端开发计划

> **版本**: v6.4
> **日期**: 2026-04-17
> **当前里程碑**: M1 (极简对话) 已完成 → M2 (多会话)
> **接口依据**: API_Design.md v6.4

---

## 一、后端任务总览

### 1.1 完成度评估

| 任务ID | 任务名称 | 状态 | 说明 |
|--------|----------|------|------|
| BE-001 | ConfigService | ✅ 完成 | AppConfigState.kt |
| BE-002 | CliBridgeService | ✅ 完成 | CLI 进程管理 |
| BE-004 | NdjsonParser | ✅ 完成 | 流式解析 |
| BE-005 | I18nService | ✅ 完成 | 国际化 |
| BE-006 | DependencyManager | ⚠️ 部分 | CLI 版本检测 |
| **BE-101** | **SessionService** | ✅ **完成** | **JSON 持久化** |
| BE-102 | MessageService | ✅ 已含 | 消息在 Session 中 |
| BE-104 | InterruptHandler | ✅ 完成 | 中断处理 |
| **BE-105** | **RewindService** | ✅ **完成** | **回滚功能** |
| **BE-106** | **FileReferenceService** | ✅ **完成** | **@file引用** |
| BE-107 | AttachmentService | ⚠️ 部分 | 已在 Model 中定义 |
| **BE-108** | **QuoteService** | ✅ **完成** | **消息引用** |
| BE-201 | ProviderService | ✅ 完成 | 多Provider |
| **BE-202** | **UsageService** | ✅ **完成** | **Token统计** |
| BE-205 | SkillService | ✅ 完成 | SkillAgentService |
| BE-206 | MCPService | ❌ 待完成 | (M3) |
| BE-207 | PromptEnhancementService | ❌ 待完成 | 提示词增强 |
| **BE-208** | **PermissionService** | ✅ **完成** | **权限确认** |
| **BE-303** | **DiffService** | ✅ **完成** | **Diff审查** |
| BE-304 | 错误处理 | ⚠️ 部分 | 需要统一 |
| BE-306 | 单元测试 | ✅ 完成 | 有测试 |

### 1.2 MVP 后端任务清单 (按优先级)

```
优先级排序:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
P0  (MVP 核心)  ██████████████████ 5 项 ✅ 完成
P1  (M2 体验)  ██████████████ 5 项 ✅ 完成
P2  (M3-M4)  ██████████ 3 项 ✅ 完成 (简化版)
P3  (M5)     ████ 1 项 ✅ 完成
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
新完成       ████████████████████████████████ 14 项
剩余        ████████ 5 项 (M3-M5 扩展功能)
```

---

## 二、M2 阶段后端任务 (核心)

### 2.1 SessionService - 会话持久化 (P0)

**API 接口**: M2-004

**当前状态**: 骨架版本，需完善 JSON 文件持久化

**实现位置**: `services/SessionService.kt`

**任务详情**:
```
数据模型 ChatSession:
├── id: String (插件内部 UUID)
├── sessionId: String? (CLI 返回的 session_id，用于 --resume)
├── title: String (自动生成或用户重命名)
├── createdAt: Instant
├── updatedAt: Instant
├── workingDir: String (持久化工作目录)
├── messages: MutableList<Message>
└── isFavorite: Boolean

存储位置: ~/.claude/sessions/{id}.json
```

**待完成方法**:
- `createSession(workingDir: String?): ChatSession`
- `saveSession(session: ChatSession)`
- `getSession(sessionId: String): ChatSession?`
- `deleteSession(sessionId: String)`
- `listSessions(): List<ChatSession>`
- `toggleFavorite(sessionId: String)`
- `renameSession(sessionId: String, newTitle: String)`

**依赖**:
- `model/ChatSession.kt` 需定义数据结构

---

### 2.2 RewindService - 回滚功能 (P0)

**API 接口**: M2-012

**实现位置**: `services/RewindService.kt`

**任务详情**:
```
核心方法:
- getRewindPoints(sessionId: String): List<RewindPoint>
  └── 返回每条 AI 消息作为可回溯点

- rewind(sessionId: String, rewindPointId: String): String?
  ├── 创建新会话
  ├── 复制回溯点之前的消息
  └── 返回新会话 ID (CLI session_id 后续异步更新)

数据模型 RewindPoint:
├── id: String
├── index: Int
├── preview: String (消息预览 50 字符)
└── timestamp: Instant
```

**与 CLI 交互**:
- Rewind 本质是创建一个新会话，复制历史消息
- `--resume` 由 CLI 自动管理上下文，无需手动拼接

---

### 2.3 FileReferenceService - @file 引用 (P1)

**API 接口**: M5-001

**实现位置**: `services/FileReferenceService.kt`

**任务详情**:
```
核心方法:
- searchFiles(query: String, project: Project): List<FileItem>
  └── 支持模糊搜索项目文件

- parseFileReference(text: String): List<FileReference>
  └── 解析 @filename 或 @filename:lineNumber 语法

- getFileContent(path: String): String
  └── 读取文件内容作为 prompt 上下文

数据模型 FileItem:
├── name: String
├── path: String
└── relativePath: String
```

**使用场景**:
- 用户输入 `@App` 触发文件搜索弹窗
- 搜索结果点击后插入 `@filename` 到输入框
- 发送时解析为文件内容

---

### 2.4 QuoteService - 消息引用 (P1)

**API 接口**: M2-C6

**实现位置**: `services/QuoteService.kt`

**任务详情**:
```
核心方法:
- getMessageDetail(sessionId: String, messageId: String): MessageDetail?
- formatQuote(message: MessageDetail): String
  └── 格式化为 markdown blockquote

引用格式:
> 引用自 [会话标题 - HH:mm]:
> 消息第一行...
> 消息第二行...

数据模型 MessageDetail:
├── content: String
├── sessionTitle: String
├── timestamp: String
└── role: Role
```

**Markdown stripping 规则**:
- 代码块 → `[代码块]`
- 行内代码 → `[代码]`
- 粗体/斜体 → 纯文本
- 链接 → 链接文字
- 截断: 超过 500 字符截断并添加 `...`

---

### 2.5 UsageService - Token 统计 (P1)

**API 接口**: M4-005

**实现位置**: `services/UsageService.kt`

**任务详情**:
```
核心方法:
- recordUsage(sessionId: String, costUsd: Double, model: String, provider: String)
- getSessionUsage(sessionId: String): SessionUsage
- getDailyUsage(date: LocalDate): DailyUsage
- getUsageReport(days: Int = 7): UsageReport

数据模型:
├── SessionUsage(sessionId, totalCost, messageCount)
├── DailyUsage(date, totalCost, messageCount, modelBreakdown)
└── UsageReport(totalTokens, totalCost, dailyBreakdown, modelBreakdown)

事件发布: UsageTopics.USAGE_UPDATED
```

---

## 三、M3-M4 阶段后端任务

### 3.1 PermissionService - 权限确认 (P2)

**API 接口**: M5-003

**实现位置**: `services/PermissionService.kt`

**任务详情**:
```
核心方法:
- showPermissionDialog(toolName: String, toolInput: Map<String, Any>): Boolean
  └── 弹窗让用户确认或拒绝
  └── 返回: true (批准) / false (拒绝)

触发条件:
- Plan 模式 (不传 --permission-mode)
- CLI 暂停并等待输入 "approve" / "reject"

数据模型 PermissionRequest:
├── toolName: String
├── toolInput: Map<String, Any>
├── description: String (可读描述)
└── riskLevel: RiskLevel (LOW/MEDIUM/HIGH)
```

**MVP 行为**:
- MVP 使用 `yolo` (accept-all)，不弹窗
- M5 Plan 模式才需要此服务

---

### 3.2 DiffService - Diff 审查 (P1)

**API 接口**: M2-014

**实现位置**: `services/DiffService.kt`

**任务详情**:
```
核心方法:
- showDiffReviewDialog(project: Project, filePath: String, original: String, suggested: String, onAccept: () -> Unit, onReject: () -> Unit)
  └── 使用 IntelliJ DiffManager
  └── onAccept → 写入文件
  └── onReject → 关闭弹窗

数据模型 DiffFile:
├── path: String
├── originalContent: String
├── suggestedContent: String
└── diffStats: DiffStats (additions, deletions)
```

---

### 3.3 UsageService - Token 统计 (P2)

见 2.5 节

---

## 四、需要创建的文件

### 4.1 新建服务文件

```
src/main/kotlin/com/github/xingzhewa/ccassistant/
├── services/
│   ├── SessionService.kt          # 会话持久化 (BE-101)
│   ├── RewindService.kt          # 回滚功能 (BE-105)
│   ├── FileReferenceService.kt  # @file引用 (BE-106)
│   ├── QuoteService.kt         # 消息引用 (BE-108)
│   ├── UsageService.kt         # Token统计 (BE-202)
│   ├── PermissionService.kt   # 权限确认 (BE-208)
│   └── DiffService.kt          # Diff审查 (BE-303)
└── model/
    ├── ChatSession.kt          # 会话数据模型
    ├── Message.kt             # 消息数据模型
    └── FileReference.kt      # 文件引用模型
```

### 4.2 扩展现有文件

```
bridge/CliBridgeService.kt:
├── interrupt() - ✅ 已实现
├── executePrompt(...) - ✅ 已实现
└── isRunning() - 新增

config/AppConfigState.kt:
├── sessionsDir - 新增
├── currentSessionId - 新增
└── themeConfig - 已实现

ui/chat/JcefChatPanel.kt:
├── loadSession(sessionId) - 新增
├── saveCurrentSession() - 新增
└── createNewSession() - 新增
```

---

## 五、开发顺序

### 5.1 第一批: M2 核心 (3 项)

| 顺序 | 任务 | 文件 | 预估 |
|------|------|------|------|
| 1 | 数据模型 | model/ChatSession.kt, Message.kt | 0.5天 |
| 2 | SessionService | SessionService.kt | 1天 |
| 3 | RewindService | RewindService.kt | 0.5天 |

### 5.2 第二批: M2 体验功能 (3 项)

| 顺序 | 任务 | 文件 | 预估 |
|------|------|------|------|
| 4 | FileReferenceService | FileReferenceService.kt | 0.5天 |
| 5 | QuoteService | QuoteService.kt | 0.5天 |
| 6 | UsageService | UsageService.kt | 0.5天 |

### 5.3 第三批: M3-M5 功能 (3 项)

| 顺序 | 任务 | 文件 | 预估 |
|------|------|------|------|
| 7 | PermissionService | PermissionService.kt | 0.5天 |
| 8 | DiffService | DiffService.kt | 1天 |
| 9 | 后端单元测试 | test/.../*Test.kt | 2天 |

---

## 六、验收标准

### 6.1 SessionService 验收

- [ ] 创建新会话返回 ChatSession
- [ ] 保存会话到 JSON 文件 (~/.claude/sessions/)
- [ ] 读取会话列表
- [ ] 删除会话
- [ ] 切换会话 (加载消息)
- [ ] 收藏/取消收藏
- [ ] 重命名会话标题

### 6.2 RewindService 验收

- [ ] 获取回溯点列表
- [ ] 回溯创建新会话，复制历史消息
- [ ] 新会话可继续对话

### 6.3 FileReferenceService 验收

- [ ] 搜索项目文件 (模糊匹配)
- [ ] 解析 @filename 语法
- [ ] 获取文件内容作为上下文

### 6.4 QuoteService 验收

- [ ] 获取消息详情
- [ ] 格式化引用文本 (markdown blockquote)
- [ ] Markdown stripping 正确

### 6.5 UsageService 验收

- [ ] 记录 Token 使用
- [ ] 统计每日/会话用量
- [ ] 发布使用更新事件

### 6.6 PermissionService 验收

- [ ] 弹窗显示工具调用信息
- [ ] 批准/拒绝回调
- [ ] 传递响应给 CLI

### 6.7 DiffService 验收

- [ ] Diff 审查弹窗显示原始 vs 建议
- [ ] 应用修改写入文件
- [ ] 拒绝关闭弹窗

---

## 七、接口对照

| 任务 | API_Design.md 接��� |
|------|------------------|
| SessionService | M2-004, M2-005, M2-007, M2-008, M2-009 |
| RewindService | M2-012 |
| FileReferenceService | M5-001 |
| QuoteService | M2-C6 |
| UsageService | M4-005 |
| PermissionService | M5-003 |
| DiffService | M2-014 |

---

*文档版本: v6.4*
*最后更新: 2026-04-17*
*同步关联: API_Design.md v6.4, CC_Assistant_Technical_Architecture.md v6.4*