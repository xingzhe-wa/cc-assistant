# CC Assistant 任务模板

## 任务开始模板

```markdown
## 任务信息
- **任务ID**: TASK-XXX
- **检查点**: cp-X-X
- **开始时间**: YYYY-MM-DD HH:MM
- **预计时长**: X小时

## 前置条件
- [ ] 需求文档已锁定
- [ ] 架构设计已批准
- [ ] 相关代码已索引到上下文中
- [ ] `./harness/validation/pre-task.sh` 通过

## 任务拆分

### 子任务 1: xxx
- **描述**: xxx
- **产出**: xxx.kt
- **验证**: `./gradlew test --tests '*XxxTest'`
- **状态**: ⬜ 进行中 / ✅ 完成

### 子任务 2: xxx
- **描述**: xxx
- **产出**: xxx.kt
- **验证**: `./gradlew test --tests '*YyyTest'`
- **状态**: ⬜ 进行中 / ✅ 完成

## 约束检查
- [ ] HC-001: 编译通过
- [ ] HC-002: 测试通过
- [ ] HC-003: plugin.xml 有效
- [ ] HC-004: 无硬编码敏感信息
- [ ] HC-005: 线程安全
- [ ] HC-006: 资源正确管理
- [ ] HC-007: 空安全

## 断点恢复
- **快照位置**: `./harness/snapshots/<task-id>/`
- **恢复命令**: `./harness/snapshot.sh restore <task-id> <next-task>`
```

---

## 标准功能开发流程

### 1. 初始化
```bash
# 1. 创建任务分支
git checkout -b feature/xxx

# 2. 运行任务前检查
./harness/validation/pre-task.sh

# 3. 保存初始快照
./harness/snapshot.sh save init "任务初始化"
```

### 2. 设计和实现
```markdown
## 设计决策
- [ ] 列出关键设计选择
- [ ] 确认 API 契约
- [ ] 识别潜在风险
```

### 3. 编码
1. 按检查点定义的任务拆分
2. 每个子任务完成后运行 `./harness/validation/post-task.sh cp-X-X`
3. 出现失败立即修复，不要跳过

### 4. 验证
```bash
# 运行回归测试
./harness/validation/regression.sh

# 确认所有检查通过
git status
git diff --stat
```

### 5. 提交
```bash
# 添加相关文件
git add src/ test/ harness/

# 提交
git commit -m "feat(module): 实现 xxx 功能

- 新增 xxx 服务
- 新增 xxx 测试
- 更新 harness 配置

验证:
- ./gradlew test ✓
- ./gradlew lintKotlin ✓
"
```

---

## Bug 修复流程

### 1. 复现
```bash
# 创建 bugfix 分支
git checkout -b bugfix/xxx

# 编写失败的测试用例
# 运行测试确认失败
./gradlew test --tests '*XxxTest'
```

### 2. 诊断
```markdown
## 根因分析
- **现象**: xxx
- **原因**: xxx
- **影响**: xxx
```

### 3. 修复
```kotlin
// 修复代码
// 确保测试通过
./gradlew test --tests '*XxxTest'
```

### 4. 验证
```bash
# 运行相关测试
./gradlew test --tests '*ServiceTest'

# 运行回归测试
./harness/validation/regression.sh
```

---

## 检查点任务卡

### CP-1-0: 环境验证
```markdown
## 任务
验证构建环境是否就绪

## 验证命令
```bash
./gradlew --version
java -version
```

## 完成标准
- Gradle 9.4.1+ 可用
- Java 21+ 可用
- 项目结构完整

## 产出
- [x] 环境验证完成
```

### CP-1-1: 脚手架验证
```markdown
## 任务
验证项目基础结构

## 验证命令
```bash
./gradlew assemble
./gradlew lintKotlin
```

## 完成标准
- 编译成功
- 无 lint 错误
- plugin.xml 有效

## 产出
- [x] 脚手架验证完成
```

### CP-2-0: 服务层实现
```markdown
## 任务
实现核心服务层
- DaemonBridgeService
- ProviderService
- ConfigService

## 子任务
1. [ ] 实现 ConfigService (配置持久化)
2. [ ] 实现 ProviderService (多Provider管理)
3. [ ] 实现 DaemonBridgeService (Daemon进程管理)
4. [ ] 为每个服务编写单元测试

## 验证
```bash
./gradlew compileKotlin
./gradlew test --tests '*ServiceTest'
```

## 覆盖率要求
- 70%+
```

### CP-2-1: UI层实现
```markdown
## 任务
实现UI组件层
- ChatPanel (聊天面板)
- SettingsDialog (设置对话框)
- ToolWindow (工具窗口)

## 子任务
1. [ ] 实现 MyToolWindowFactory → ChatPanel 迁移
2. [ ] 实现 SettingsDialog 框架
3. [ ] 实现 Header 组件
4. [ ] 实现 MessageArea 组件
5. [ ] 实现 InputArea 组件

## 验证
```bash
./gradlew compileKotlin
./gradlew runIdeForUiTests
```

## 覆盖率要求
- 60%+
```

### CP-3-0: Daemon桥接
```markdown
## 任务
实现Node.js Daemon桥接
- ProcessManager (进程管理)
- NDJSONParser (流式解析)
- MessageCallback (消息回调)

## 子任务
1. [ ] 实现 ProcessManager (启动/停止 daemon.js)
2. [ ] 实现 NDJSONParser (流式输出解析)
3. [ ] 实现 MessageCallback 回调系统
4. [ ] 编写集成测试

## 验证
```bash
./gradlew compileKotlin
./gradlew test --tests '*DaemonBridge*'
```

## 依赖
- Node.js 18+
- src/main/nodejs/daemon.js 存在
```

### CP-3-1: Agent SDK集成
```markdown
## 任务
集成Claude Agent SDK
- SDKLoader (SDK动态加载)
- PersistentQueryService (Runtime池管理)
- MessageSender (消息发送)

## 子任务
1. [ ] 实现 SDKLoader
2. [ ] 实现 PersistentQueryService
3. [ ] 实现 MessageSender
4. [ ] 验证 Node.js 端点通信

## 验证
```bash
./gradlew compileKotlin
node --check src/main/nodejs/daemon.js
```
```

### CP-4-0: 集成测试
```markdown
## 任务
完整功能集成验证

## 子任务
1. [ ] 端到端测试
2. [ ] 人工 review checklist
3. [ ] 性能基准测试
4. [ ] 安全扫描

## 验证
```bash
./gradlew check
./gradlew build
```

## 覆盖率要求
- 80%+
```

### CP-4-1: 发布验证
```markdown
## 任务
发布前最终验证

## 子任务
1. [ ] 验证 CHANGELOG 更新
2. [ ] 验证版本号更新
3. [ ] 验证插件签名
4. [ ] 验证 Marketplace 上传

## 验证
```bash
./gradlew verifyPlugin
./gradlew publishPlugin --dryrun
```
```

---

## 任务状态报告模板

```markdown
## 任务状态报告

### 基本信息
- **任务ID**: TASK-XXX
- **当前检查点**: cp-X-X
- **状态**: 🟢 进行中 / 🟡 阻塞 / 🔴 失败

### 进度
| 子任务 | 状态 | 说明 |
|-------|-----|-----|
| xxx    | ✅   | 已完成 |
| xxx    | ⬜   | 进行中 |
| xxx    | ⬜   | 等待中 |

### 阻塞项
- [ ] xxx

### 风险
- [ ] xxx

### 下一行动
1. xxx
2. xxx

### 验证结果
```bash
./harness/validation/post-task.sh cp-X-X
# 输出: ...
```
```
