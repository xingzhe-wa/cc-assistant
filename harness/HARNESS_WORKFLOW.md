# Harness Engineering 工作流

> 本文档描述如何使用 Harness Engineering 工作流来确保 AI 编码任务的成功交付。

---

## 概述

Harness Engineering 是一种**结构化的 AI 编码方法论**，通过以下机制确保长任务不会失控：

1. **分阶段验证** - 每个阶段必须通过验证门才能继续
2. **强制检查点** - 关键节点必须保存快照
3. **硬约束保护** - 违反规则立即停止
4. **快速恢复机制** - 断点后可快速恢复到稳定状态

---

## 核心文件

| 文件 | 用途 |
|-----|-----|
| `CLAUDE.md` | 项目全局约束 |
| `harness/harness.yaml` | 检查点定义 |
| `harness/constraints.md` | 详细约束清单 |
| `harness/validation/*.sh` | 验证脚本 |
| `harness/snapshot.sh` | 快照管理 |
| `harness/templates/` | 任务模板 |

---

## 工作流程

### 阶段 1: 任务启动

```bash
# 1. 创建任务分支
git checkout -b feature/xxx

# 2. 运行任务前检查
./harness/validation/pre-task.sh
# 必须全部通过才能开始

# 3. 保存初始快照
./harness/snapshot.sh save init "任务初始化"
```

### 阶段 2: 任务执行

按照 `harness/harness.yaml` 中定义的检查点执行：

```
CP-1-0 环境验证 ──→ CP-1-1 脚手架 ──→ CP-2-0 服务层
                                           │
                                           ▼
CP-4-1 发布 ←── CP-4-0 集成 ←── CP-3-1 SDK ←── CP-2-1 UI层
                                                   │
                                                   ▼
                                           CP-3-0 Daemon桥接
```

每个检查点：
1. 阅读相关代码和文档
2. 实现对应功能
3. 运行 `./harness/validation/post-task.sh cp-X-X`
4. 保存快照 `./harness/snapshot.sh save cp-X-X "描述"`
5. 人工 review（如需要）

### 阶段 3: 验证和提交

```bash
# 运行回归测试
./harness/validation/regression.sh

# 提交
git add -A
git commit -m "feat: 实现 xxx
验证:
- ./gradlew test ✓
- ./gradlew lintKotlin ✓
"
```

---

## 检查点详解

### CP-1-0: 环境验证
**目的**: 确认构建环境就绪

**验证**:
```bash
./gradlew --version
java -version
```

**必须通过**:
- Gradle 9.4.1+
- Java 21+

---

### CP-1-1: 脚手架验证
**目的**: 确认项目基础结构

**验证**:
```bash
./gradlew assemble
./gradlew lintKotlin
```

**必须通过**:
- 编译成功
- 无 lint 错误
- plugin.xml 有效

---

### CP-2-0: 服务层实现
**目的**: 实现核心服务层

**任务**:
- ConfigService (配置持久化)
- ProviderService (多Provider管理)
- DaemonBridgeService (Daemon进程管理)

**验证**:
```bash
./gradlew compileKotlin
./gradlew test --tests '*ServiceTest'
```

**覆盖率要求**: 70%+

---

### CP-2-1: UI层实现
**目的**: 实现UI组件层

**任务**:
- ChatPanel (聊天面板)
- SettingsDialog (设置对话框)
- ToolWindow (工具窗口)

**验证**:
```bash
./gradlew compileKotlin
./gradlew runIdeForUiTests
```

**覆盖率要求**: 60%+

---

### CP-3-0: Daemon桥接
**目的**: 实现Node.js Daemon桥接

**任务**:
- ProcessManager (进程管理)
- NDJSONParser (流式解析)
- MessageCallback (消息回调)

**验证**:
```bash
./gradlew compileKotlin
./gradlew test --tests '*DaemonBridge*'
```

**依赖**: Node.js 18+

---

### CP-3-1: Agent SDK集成
**目的**: 集成Claude Agent SDK

**任务**:
- SDKLoader (SDK动态加载)
- PersistentQueryService (Runtime池管理)
- MessageSender (消息发送)

**验证**:
```bash
./gradlew compileKotlin
node --check src/main/nodejs/daemon.js
```

---

### CP-4-0: 集成测试
**目的**: 完整功能集成验证

**验证**:
```bash
./gradlew check
./gradlew build
```

**覆盖率要求**: 80%+

---

### CP-4-1: 发布验证
**目的**: 发布前最终验证

**验证**:
```bash
./gradlew verifyPlugin
./gradlew publishPlugin --dryrun
```

---

## 约束系统

### 硬约束 (Critical)

| ID | 约束 | 触发动作 |
|----|-----|---------|
| HC-001 | 编译必须通过 | 立即停止 |
| HC-002 | 测试必须通过 | 立即停止 |
| HC-003 | plugin.xml 有效 | 立即停止 |
| HC-004 | 无硬编码敏感信息 | 立即停止 |
| HC-005 | 线程安全 | 立即停止 |

### 软约束 (Warning)

| ID | 约束 | 触发动作 |
|----|-----|---------|
| SC-001 | 函数 > 50 行 | 警告 |
| SC-002 | 循环依赖 | 警告 |
| SC-003 | 无 KDoc 注释 | 警告 |
| SC-004 | 覆盖率 < 70% | 警告 |

---

## 快照管理

### 保存快照
```bash
./harness/snapshot.sh save <task-id> [description]
```

### 列出快照
```bash
./harness/snapshot.sh list
```

### 恢复快照
```bash
./harness/snapshot.sh restore <task-id> [next-task]
```

### 导出/导入
```bash
./harness/snapshot.sh export <task-id>
./harness/snapshot.sh import <file.tar.gz>
```

---

## 验证脚本

### 任务前检查
```bash
./harness/validation/pre-task.sh
```
检查：环境、项目结构、依赖、代码质量基础

### 任务后检查
```bash
./harness/validation/post-task.sh [checkpoint-id]
```
检查：编译、测试、代码质量、插件验证

### 回归测试
```bash
./harness/validation/regression.sh
```
检查：完整构建、所有测试、静态分析、安全扫描

---

## 常见问题

### Q: 任务进行到一半失败了怎么办？
A: 使用快照恢复：
```bash
./harness/snapshot.sh list
./harness/snapshot.sh restore <task-id> "继续实现"
```

### Q: 如何处理复杂任务？
A: 按检查点拆分，每个检查点是一个可管理的子任务。

### Q: 什么时候应该保存快照？
A:
- 开始新检查点前
- 完成重要子任务后
- 任何长时间任务的关键节点

### Q: 硬约束失败了怎么办？
A: 必须修复才能继续。例如：
- HC-001 编译失败 → 修复编译错误
- HC-002 测试失败 → 修复测试
- HC-004 硬编码密钥 → 移除硬编码

---

## 最佳实践

1. **小步快跑**: 每个子任务尽量 < 2 小时
2. **频繁验证**: 每个小变更后运行相关测试
3. **及时快照**: 关键节点必须保存
4. **人工 review**: 关键阶段需要人工确认
5. **零容忍**: 硬约束违反必须立即修复

---

*最后更新: 2026-04-13*
