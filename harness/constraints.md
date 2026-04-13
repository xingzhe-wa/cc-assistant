# CC Assistant 项目约束清单

> 本文件是 AI 编码的"安全带"，定义了在 CC Assistant 项目中编码时必须遵守的规则。

---

## 一、IntelliJ Platform 插件特定约束

### 1.1 组件注册
```kotlin
// ✅ 正确：使用正确的扩展点
class MyToolWindowFactory : ToolWindowFactory {
    override fun createToolWindowContent(project: Project, toolWindow: ToolWindow) {
        // ...
    }
}

// ❌ 错误：不能在构造函数中执行耗时操作
class BadFactory : ToolWindowFactory {
    val service = SomeService() // 这会在 IDE 启动时阻塞
}
```

### 1.2 服务单例模式
```kotlin
// ✅ 正确：使用 service<>{} 委托或 getService
@Service(Service.Level.APPLICATION)
class MyAppService { /* ... */ }

// 获取实例
val service = ApplicationManager.getApplication().getService(MyAppService::class.java)

// ❌ 错误：不要在 plugin.xml 外手动注册服务
```

### 1.3 线程安全
```kotlin
// ✅ 正确：在后台线程执行耗时操作
ProgressManager.getInstance().run(object : Task.Backgroundable(project, "Loading...") {
    override fun run(panel: ProgressPanel) {
        // 后台执行
        ApplicationManager.getApplication().invokeLater {
            // UI 更新
        }
    }
})

// ❌ 错误：不要在主线程执行阻塞操作
```

---

## 二、Kotlin 编码规范

### 2.1 空安全
```kotlin
// ✅ 正确：使用安全调用和 Elvis 操作符
val length = user?.name?.length ?: 0

// ❌ 错误：不要使用 !! 断言（会导致崩溃）
val length = user!!.name!!.length!!

// ✅ 正确：充分使用 let
user?.let { process(it) }

// ✅ 正确：使用 require/check 做前置条件校验
fun processUser(user: User) {
    requireNotNull(user.id) { "User ID must not be null" }
    // ...
}
```

### 2.2 资源管理
```kotlin
// ✅ 正确：使用 use 自动关闭资源
FileInputStream(file).use { stream ->
    stream.buffered().reader().readText()
}

// ❌ 错误：手动关闭可能遗漏
val stream = FileInputStream(file)
val text = stream.buffered().reader().readText()
stream.close() // 如果前面抛异常，这行不会执行
```

### 2.3 协程使用
```kotlin
// ✅ 正确：在 plugin 环境中使用协程
fun asyncOperation() {
    GlobalScope.applicationDisposalAwareExecutor().execute {
        // 后台执行
    }
}

// 或使用 IntelliJ 提供的协程调度器
val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

// ❌ 错误：不要在插件中使用默认的 Dispatchers.Main
// 它在 IntelliJ 插件环境中不工作
```

---

## 三、插件特定约束

### 3.1 依赖注入
```kotlin
// ✅ 正确：使用 service 委托
class MyComponent(project: Project) {
    private val service = project.service<MyProjectService>()

    init {
        // 在这里初始化 UI
    }
}

// ❌ 错误：不要在 init 中执行阻塞操作
class BadComponent(project: Project) {
    private val service = project.service<MyProjectService>()
    init {
        val result = service.fetchData() // 会阻塞 IDE 启动
    }
}
```

### 3.2 配置持久化
```kotlin
// ✅ 正确：使用 PersistentStateComponent
data class AppSettingsState(
    var apiKey: String = "",
    var theme: String = "dark"
)

@Service(Service.Level.APPLICATION)
class AppSettings : PersistentStateComponent<AppSettingsState> {
    private var state = AppSettingsState()

    override fun getState() = state
    override fun loadState(state: AppSettingsState) {
        this.state = state
    }
}

// ❌ 错误：不要使用 SharedPreferences 或手动序列化
```

### 3.3 UI 线程规则
```kotlin
// ✅ 正确：UI 操作必须在 EDT (Event Dispatch Thread)
ApplicationManager.getApplication().invokeLater {
    myPanel.add(label)
}

// ✅ 正确：读取可以在后台，执行 UI 更新用 invokeLater
fun loadData() {
    thread {
        val data = fetchFromNetwork()
        ApplicationManager.getApplication().invokeLater {
            updateUI(data)
        }
    }
}

// ❌ 错误：不要在后台线程直接更新 UI
```

---

## 四、测试约束

### 4.1 单元测试
```kotlin
// ✅ 正确：使用 IntelliJ 测试框架
class MyServiceTest {
    @Test
    fun `test service method`() {
        val project = MockProject()
        val service = MyProjectService(project)
        assertEquals("expected", service.method())
    }
}

// ❌ 错误：不要使用 Thread.sleep 等待异步结果
Thread.sleep(5000) // 这种方式不可靠
```

### 4.2 UI 测试
```kotlin
// ✅ 正确：使用 Robot Framework
fun testDialog() {
    robot.clickButton("OK")
    assertFalse(dialog.isVisible)
}

// ❌ 错误：不要假设 UI 操作是同步的
```

---

## 五、安全约束

### 5.1 禁止硬编码敏感信息
```kotlin
// ❌ 错误
const val API_KEY = "sk-ant-xxxx-xxxx"

// ✅ 正确：从环境变量或安全存储获取
val apiKey = System.getenv("ANTHROPIC_API_KEY")
    ?: SecureStorage.getInstance().get("api_key")
```

### 5.2 输入校验
```kotlin
// ✅ 正确：校验外部输入
fun processFile(path: String) {
    require(path.isValidPath()) { "Invalid path" }
    require(path.startsWith(project.basePath)) { "Path outside project" }
}
```

---

## 六、Git 工作流约束

### 6.1 提交规范
```
feat: 新功能
fix: Bug 修复
docs: 文档更新
refactor: 重构
test: 测试相关
chore: 构建/工具
```

### 6.2 分支策略
```
main          - 主分支，稳定版本
develop       - 开发分支
feature/*     - 功能分支
bugfix/*      - Bug 修复分支
release/*     - 发布分支
```

### 6.3 Commit 前检查
```bash
# 必须通过才能提交
gradlew check
gradlew lintKotlin
```

---

## 七、文档约束

### 7.1 KDoc 注释
```kotlin
/**
 * 处理用户认证请求
 *
 * @param username 用户名
 * @param password 密码（会被加密传输）
 * @return 认证结果，包含 token
 * @throws AuthException 当认证失败时抛出
 */
fun authenticate(username: String, password: String): AuthResult
```

### 7.2 README 更新
- 每次发布需要更新 CHANGELOG.md
- 新功能需要在文档中说明

---

## 八、CI/CD 约束

### 8.1 必须通过的检查
```yaml
# .github/workflows/ci.yml 必须包含
- gradlew assemble
- gradlew test
- gradlew lintKotlin
- gradlew verifyPlugin
```

### 8.2 发布前检查
```bash
gradlew patchChangelog
gradlew verifyPlugin
gradlew build
```
