# CC Assistant 项目全局约束

> 本文件是 CC Assistant 项目的最高层约束定义，所有 AI 编码任务都必须遵守。

---

## 项目概述

- **项目名称**: CC Assistant
- **类型**: IntelliJ Platform 插件
- **语言**: Kotlin 21
- **构建工具**: Gradle (Kotlin DSL)
- **最低 IDE 版本**: 2024.1+

---

## 硬约束 (HARD CONSTRAINTS)

> 违反以下任何约束将导致任务立即停止，必须修复后才能继续。

### HC-001: 编译必须成功
```bash
./gradlew compileKotlin
```
- 任何编译错误都必须修复
- 禁止使用 `@Suppress("UNCHECKED_CAST")` 隐藏类型错误

### HC-002: 测试必须通过
```bash
./gradlew test
```
- 所有单元测试必须通过
- 新功能必须有对应的测试
- 测试覆盖率不低于 70%

### HC-003: plugin.xml 必须有效
```xml
<!-- 所有扩展点必须正确注册 -->
<extensions defaultExtensionNs="com.intellij">
    <toolWindow id="CC Assistant" ... />
</extensions>
```

### HC-004: 禁止硬编码敏感信息
```kotlin
// ❌ 禁止
const val API_KEY = "sk-ant-xxxx"

// ✅ 正确
val apiKey = System.getenv("ANTHROPIC_API_KEY")
```

### HC-005: 线程安全
- 所有 Service 必须线程安全
- UI 操作必须在 EDT (Event Dispatch Thread)
- 后台任务使用 `ProgressManager` 或 `ApplicationManager.executeOnPooledThread`

### HC-006: 资源管理
```kotlin
// ✅ 正确：使用 use 自动关闭
FileInputStream(file).use { stream ->
    // ...
}

// ❌ 禁止：手动关闭可能遗漏
val stream = FileInputStream(file)
stream.close() // 可能不执行
```

### HC-007: 空安全
```kotlin
// ✅ 正确
val length = user?.name?.length ?: 0

// ❌ 禁止：使用 !! 可能崩溃
val length = user!!.name!!.length!!
```

---

## 软约束 (SOFT CONSTRAINTS)

> 违反以下约束将产生警告，但不会阻止任务继续。

### SC-001: 函数长度限制
- 单个函数不超过 **50 行**
- 超过必须拆分

### SC-002: 公共 API 必须有 KDoc
```kotlin
/**
 * 处理用户认证请求
 *
 * @param username 用户名
 * @param password 密码
 * @return 认证结果
 * @throws AuthException 当认证失败时抛出
 */
fun authenticate(username: String, password: String): AuthResult
```

### SC-003: 模块单向依赖
```
ui ─────► service ─────► bridge ─────► infrastructure
  (单向，禁止逆流)
```

### SC-004: 错误处理
```kotlin
// ✅ 正确
try {
    // ...
} catch (e: SpecificException) {
    log.error("具体错误信息", e)
    throw e // 不要吞噬异常
}

// ❌ 禁止
try {
    // ...
} catch (e: Exception) {
    // 空的 catch 块
}
```

---

## 代码组织规范

### 目录结构
```
src/main/kotlin/com/github/xingzhewa/ccassistant/
├── toolWindow/          # ToolWindow 相关
├── services/            # 服务层
├── bridge/              # 桥接层（Daemon）
├── ui/                  # UI 组件
│   ├── components/      # 可复用组件
│   ├── panels/          # 面板
│   └── dialogs/         # 对话框
├── model/               # 数据模型
├── util/                # 工具类
└── resources/           # 资源文件
```

### 命名规范
| 类型 | 规范 | 示例 |
|-----|-----|-----|
| 类名 | PascalCase | `MyToolWindowFactory` |
| 函数名 | camelCase | `createToolWindowContent` |
| 常量 | SCREAMING_SNAKE_CASE | `MAX_RETRY_COUNT` |
| 包名 | 全小写 | `com.ccassistant.ui` |
| 测试类 | `XxxTest` | `MyServiceTest` |

---

## Git 工作流

### 分支命名
```
feature/xxx           # 新功能
bugfix/xxx            # Bug 修复
refactor/xxx          # 重构
docs/xxx              # 文档更新
```

### 提交规范
```
<type>(<scope>): <subject>

types: feat, fix, docs, refactor, test, chore
scope: optional, indicates the affected module
```

### Commit Hooks
提交前自动运行:
1. `./gradlew compileKotlin`
2. `./gradlew test`
3. `./gradlew lintKotlin`

---

## 验证时机

### 任务前 (pre-task)
```bash
./harness/validation/pre-task.sh
```

### 任务后 (post-task)
```bash
./harness/validation/post-task.sh <checkpoint-id>
```

### 回归测试 (regression)
```bash
./harness/validation/regression.sh
```

### 快照保存
```bash
./harness/snapshot.sh save <task-id> [description]
```

---

## 架构原则

### 1. 轻量集成
- 最大化使用 IntelliJ Platform API
- 最小化外部依赖
- 仅 Gson 可选，其余使用 Platform API

### 2. Daemon 模式
- Agent SDK 常驻进程
- 零冷启动延迟
- stdin/stdout 通信

### 3. 双引擎支持
- Claude Agent SDK (主)
- OpenAI Codex (备)
- 统一抽象层切换

### 4. 按需加载
- 服务延迟初始化
- 资源按需创建
- 弱引用缓存

---

## 验证门禁

### 检查点定义
| 检查点 | 描述 | 必须通过 |
|-------|-----|---------|
| cp-1-0 | 环境验证 | ✓ |
| cp-1-1 | 脚手架 | ✓ |
| cp-2-0 | 服务层 | ✓ |
| cp-2-1 | UI层 | ✓ |
| cp-3-0 | Daemon桥接 | ✓ |
| cp-3-1 | Agent SDK | ✓ |
| cp-4-0 | 集成测试 | ✓ |
| cp-4-1 | 发布验证 | ✓ |

---

## 常见错误处理

### 编译错误
1. 检查 Kotlin 版本兼容性
2. 确认 IntelliJ Platform API 使用正确
3. 查看具体错误行的类型推断

### 测试失败
1. 确认测试环境 Mock 正确
2. 检查异步操作是否正确等待
3. 验证测试数据准备

### 运行时错误
1. 检查线程模型是否正确
2. 确认 UI 线程访问
3. 验证服务初始化时机

---

*最后更新: 2026-04-13*
