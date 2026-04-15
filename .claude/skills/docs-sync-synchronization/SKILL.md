---
name: docs-sync-synchronization
description: CC Assistant文档三文档同步 - 当API_Design.md、CC_Assistant_Technical_Architecture.md或plan/README.md任一更新时，同步其他两个文档保持颗粒度对齐。触发词：文档同步、对齐文档、更新文档
type: reference
---

# CC Assistant 文档同步 Skill

> 当技术架构、接口设计、开发规划三个文档中的一个发生变更时，自动同步更新其他两个文档，保持内容颗粒度对齐。

---

## 1. 文档依赖关系地图

### 1.1 三个文档的角色分工

| 文档 | 颗粒度 | 职责 | 文档性质 |
|------|-------|------|--------|---------|
| `API_Design.md` | **接口级** | 定义具体API接口、方法签名、数据模型 | 设计交付物 |
| `CC_Assistant_Technical_Architecture.md` | **架构级** | 系统架构、模块设计、技术选型 | 设计交付物 |
| `plan/README.md` | **任务级** | 开发任务拆解、里程碑、文件结构 | 执行规划 |

### 1.2 依赖关系图

```
plan/README.md
    │
    ├─[依赖]─► API_Design.md (通过接口ID引用)
    │
    └─[依赖]─► CC_Assistant_Technical_Architecture.md (通过架构约束)

API_Design.md ◄──────► CC_Assistant_Technical_Architecture.md
     │                         │
     │    通过接口ID对齐        │    通过模块名对齐
     │                         │
     └─────────────────────────┘
```

### 1.3 对齐原则

| 对齐维度 | 描述 | 验证方法 |
|----------|------|----------|
| **接口ID** | API_Design中的M*接口ID必须在plan中存在对应任务 | plan中任务ID与API接口ID一致 |
| **模块名** | 技术架构中的模块名与plan中的文件路径对应 | 模块名=文件名 |
| **版本号** | 三个文档的版本号必须同步更新 | 版本号一致 |
| **里程碑** | 技术架构的里程碑与plan的里程碑一致 | M0/M1/M2...对齐 |
| **API接口** | API_Design中的接口必须在技术架构中有对应模块实现 | 模块→接口映射表 |

---

## 2. 文档间映射表

### 2.1 模块 ↔ 接口映射

| 技术架构模块 | API接口 | plan任务 |
|-------------|---------|---------|
| `CliBridgeService` | M0-001, M0-002 | M0-* |
| `ChatPanel` | M1-001, M1-002 | M1-* |
| `SessionService` | M2-004, M2-005 | M2-B1 |
| `SessionTabBar` | M2-001, M2-002, M2-003 | M2-B3 |
| `JcefMessageRenderer` | M2-010 | M2-A* |
| `RewindService` | M2-012 | M2-C2 |
| `QuoteService` | M2-C6 | M2-C6 |
| `ProviderService` | M4-001, M4-002 | M4-BE1 |
| `ThemeService` | M4-007 | M4-BE6 |
| `@file引用` | M5-001 | M5-FE1 |
| `Slash命令` | M5-002 | M5-FE2 |

### 2.2 里程碑对齐

| 里程碑 | 技术架构 | API_Design | plan |
|--------|---------|-----------|-------|
| M0 | 第1节 | M0: CLI链路验证 | M0: CLI链路验证 |
| M1 | 第2节 | M1: 极简对话 | M1: 极简对话 |
| M2 | 第3节 | M2: 多会话+JCEF | M2: 多会话+JCEF |
| M3 | 第4节 | M3: MCP支持 | M3: MCP支持 |
| M4 | 第5节 | M4: 设置+供应商 | M4: 设置+供应商 |
| M5 | 第6节 | M5: 打磨上线 | M5: 打磨上线 |

---

## 3. 同步触发条件

### 3.1 需要触发同步的场景

| 触发条件 | 源文档 | 需同步文档 | 优先级 |
|----------|--------|------------|--------|
| 新增API接口 | API_Design.md | plan, 技术架构 | P0 |
| 删除API接口 | API_Design.md | plan, 技术架构 | P0 |
| API接口变更(参数/返回值) | API_Design.md | plan, 技术架构 | P1 |
| 新增模块 | 技术架构 | API_Design, plan | P0 |
| 架构变更 | 技术架构 | API_Design, plan | P1 |
| 新增任务 | plan | API_Design, 技术架构 | P0 |
| 任务状态变��� | plan | 技术架构(状态) | P2 |
| 里程碑时间调整 | plan | 技术架构 | P2 |
| 版本号更新 | 任一文档 | 其他两个 | P0 |

### 3.2 同步优先级

| 优先级 | 说明 | 同步时限 |
|--------|------|---------|
| P0 | 必须同步 | 立即或当天完成 |
| P1 | 应同步 | 24小时内完成 |
| P2 | 建议同步 | 72小时内完成 |

---

## 4. 同步操作流程

### 4.1 当 API_Design.md 更新时

**步骤1: 识别变更类型**

```bash
# 新增接口
grep "^### M[0-9]" API_Design.md | grep -v "已实现" | head -5

# 删除接口 (对比旧版本)
git diff API_Design.md --stat
```

**步骤2: 同步到 plan/README.md**

检查plan中是否存在对应的任务：
- 有 → 更新任务状态
- 无 → 新增任务

**步骤3: 同步到 CC_Assistant_Technical_Architecture.md**

检查技术架构中是否存在对应模块：
- 有 → 更新模块说明
- 无 → 新增模块到第5/6/7/8节

### 4.2 当 CC_Assistant_Technical_Architecture.md 更新时

**步骤1: 识别变更类型**

```bash
# 新增章节/模块
git diff CC_Assistant_Technical_Architecture.md --stat
```

**步骤2: 同步到 plan/README.md**

更新对应的任务ID、预估工时、依赖

**步骤3: 同步到 API_Design.md**

检查是否需要新增API接口：
- 需要 → 新增接口定义
- 不需要 → 确认现有接口覆盖

### 4.3 当 plan/README.md 更新时

**步骤1: 识别变更类型**

```bash
# 新增任务
grep "^| M[0-9]" plan/README.md | grep "待开始" | head -5

# 完成任务
grep "^| M[0-9]" plan/README.md | grep "✅" | head -5
```

**步骤2: 验证API接口覆盖**

检查已完成的每个任务是否有对应的API接口：
- 无 → 在API_Design中添加占位接口(标记为待实现)

**步骤3: 同步到技术架构**

更新对应的模块状态

---

## 5. 同步检查清单

### 5.1 每次同步前检查

- [ ] 三个文档的版本号是否一致
- [ ] 里程碑阶段是否对齐
- [ ] 是否有孤儿任务(plan有任务但API_Design无接口)
- [ ] 是否有孤儿模块(技术架构有模块但plan无任务)

### 5.2 同步后检查

- [ ] API接口ID与plan任务ID映射正确
- [ ] 模块名与文件名对应
- [ ] 版本号已更新
- [ ] 变更日志已记录

---

## 6. 版本控制规范

### 6.1 版本号格式

```
vX.Y
X: 主版本(里程碑阶段)
Y: 细分版本(微调)
```

### 6.2 变更日志位置

每个文档末尾添加：

```
---
*文档版本: vX.Y*
*最后更新: YYYY-MM-DD*
*同步关联: API_Design.md vX.Y, CC_Assistant_Technical_Architecture.md vX.Y*
---
```

---

## 7. 触发方式

### 7.1 手动触发

当需要同步时，调用skill并说明：
- 哪个文档发生了变更
- 变更内容概述

### 7.2 自动触发(建议)

在 `.claude/settings.json` 中配置hook：

```json
{
  "hooks": {
    "after-write": [
      {
        "match": "docs/API_Design.md",
        "command": "skill docs-sync-synchronization"
      },
      {
        "match": "docs/CC_Assistant_Technical_Architecture.md",
        "command": "skill docs-sync-synchronization"
      },
      {
        "match": "docs/plan/README.md",
        "command": "skill docs-sync-synchronization"
      }
    ]
  }
}
```

---

## 8. 诚实边界

- 本skill处理同步，不处理文档内容的正确性验证
- 依赖手动识别变更内容，不自动diff
- 不自动生成文档内容，只执行已定义的对齐操作
- 需要用户确认同步范围后再执行

---

> 本Skill由 [女娲 · Skill造人术](https://github.com/alchaincyf/nuwa-skill) 生成
> 创建者：[花叔](https://x.com/AlchainHust)