# JCEF 显示约束与最佳实践

> 基于 IntelliJ IDEA 2025.2 + JCEF 的实际测试总结

## ✅ 已验证可行的功能

| 功能 | 状态 | 说明 |
|------|------|------|
| HTML 渲染 | ✅ 可用 | `loadHTML()` 直接加载字符串 |
| CSS 样式 | ✅ 可用 | 渐变、flex、grid 均正常 |
| 基础 DOM 操作 | ✅ 可用 | `getElementById`、`textContent` 正常 |
| 内联事件处理 | ✅ 可用 | `onclick=""` 可以工作 |
| 颜色样式切换 | ✅ 可用 | `style.background` 修改生效 |

## ⚠️ 已知限制

### JavaScript 约束

| 限制 | 影响 | 解决方案 |
|------|------|----------|
| `alert()` 被阻止 | 弹窗不显示 | 使用自定义 DOM 元素显示消息 |
| `console.log` 静默 | 控制台不可见 | 桥接到 Java 日志系统 |
| 事件处理器可能被重置 | 按钮只能点击一次 | 使用事件委托或持久化绑定 |
| `window.open` 被阻止 | 无法打开新窗口 | 在 JCEF 内导航或通知 Java |
| LocalStorage 限制 | 持久化可能失效 | 使用 Java 侧存储 |

### 资源加载约束

| 约束 | 说明 | 解决方案 |
|------|------|----------|
| ClassLoader 资源路径 | `getResource()` 在插件中不稳定 | 使用 `loadHTML()` 或 Base64 |
| 相对路径资源 | JAR 内相对路径可能失效 | 使用绝对 URL 或内联 |
| 外部资源请求 | CORS 和安全策略限制 | 预加载或内联资源 |

### 性能约束

| 约束 | 阈值 | 建议 |
|------|------|------|
| 单页 HTML 大小 | < 500KB 推荐 | 分块加载或懒加载 |
| 首次渲染时间 | < 1s 目标 | 减少 DOM 深度 |
| 内存占用 | < 200MB 稳定 | 及时 `dispose()` |

## 📋 最佳实践

### 1. HTML 结构

```html
<!-- ✅ 推荐：内联 CSS 和 JS -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    /* 所有 CSS 内联 */
  </style>
</head>
<body>
  <!-- 内容 -->
  <script>
    // 所有 JS 内联
  </script>
</body>
</html>

<!-- ❌ 避免：外部资源 -->
<link href="./style.css" rel="stylesheet">  <!-- 可能加载失败 -->
<script src="./app.js"></script>              <!-- 可能加载失败 -->
```

### 2. 事件处理

```javascript
// ✅ 推荐：事件委托
document.body.addEventListener('click', (e) => {
  if (e.target.matches('.btn-test')) {
    handleTest();
  }
});

// ❌ 避免：直接 onclick（可能被重置）
button.onclick = () => { ... };
```

### 3. 消息显示

```javascript
// ✅ 推荐：自定义消息元素
function showMessage(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// ❌ 避免：alert()
alert(msg);  // JCEF 中不显示
```

### 4. 日志输出

```javascript
// ✅ 推荐：桥接到 Java
if (window.javaBridge) {
  window.javaBridge.log('info', 'Message');
}

// ❌ 避免：仅 console.log
console.log('Message');  // 在 IDE 中不可见
```

### 5. 状态管理

```javascript
// ✅ 推荐：Java 侧存储状态
window.javaBridge.setState(JSON.stringify(data));

// ⚠️ 谨慎：LocalStorage
localStorage.setItem('key', 'value');  // 可能失效
```

## 🔧 Java → JCEF 集成模式

### 模式 A：内联 HTML（推荐用于简单场景）

```kotlin
val html = """
    <!DOCTYPE html>
    <html>...</html>
""".trimIndent()

browser.loadHTML(html)
```

**优点**：无资源加载问题
**缺点**：HTML 难以维护

### 模式 B：资源文件（推荐用于复杂应用）

```kotlin
// 读取资源文件内容
val html = javaClass.classLoader
    .getResourceAsStream("web/app.html")
    ?.bufferedReader()
    ?.readText()

if (html != null) {
    browser.loadHTML(html)
}
```

**优点**：HTML 可分离维护
**缺点**：需要确保资源被正确打包

### 模式 C：JBCefApp 加载（仅用于开发调试）

```kotlin
val url = javaClass.classLoader.getResource("web/app.html")?.toString()
browser = JBCefBrowser(url)
```

**优点**：支持热重载
**缺点**：生产环境不稳定

## 🚫 禁止使用的 API

| API | 原因 | 替代方案 |
|-----|------|----------|
| `alert()` / `confirm()` / `prompt()` | 被阻止 | 自定义 Modal |
| `window.open()` | 被阻止 | `window.location.href` |
| `eval()` | 安全风险 | JSON.parse + 动态函数 |
| `innerHTML` + 用户输入 | XSS 风险 | `textContent` 或 DOM API |
| 同步 XHR | 阻塞 UI | Fetch API |
| `new Function()` | 安全风险 | 预定义函数 |

## 📊 React 集成特殊考虑

### 构建配置

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // 内联所有资源
        assetFileNames: 'assets/[name][extname]',
        chunkFileNames: 'assets/[name].js',
        entryFileNames: 'assets/[name].js',
      }
    }
  }
});
```

### 状态管理

```typescript
// ✅ 推荐：桥接到 Java
const sendToJava = (action: string, data: any) => {
  if (window.javaBridge) {
    window.javaBridge.send(action, JSON.stringify(data));
  }
};

// ❌ 避免：仅本地状态
const [state, setState] = useState(initial);  // Java 无法访问
```

### 事件处理

```typescript
// ✅ 推荐：持久化事件监听
useEffect(() => {
  const handler = (e: Event) => {
    // 处理事件
  };
  document.addEventListener('click', handler);
  return () => document.removeEventListener('click', handler);
}, []);
```

## 🧪 测试清单

在开发 JCEF 功能时，确保测试：

- [ ] HTML 内容正确显示
- [ ] CSS 样式完整应用
- [ ] JavaScript 执行无错误
- [ ] 按钮可多次点击
- [ ] 长时间运行无内存泄漏
- [ ] IDE 主题切换时 UI 正常
- [ ] 窗口大小调整时布局正确
- [ ] Java → JS 调用成功
- [ ] JS → Java 调用成功

## 🔍 调试技巧

### 1. 检查 JCEF 是否支持

```kotlin
if (!JBCefApp.isSupported()) {
    // 降级到 Swing
}
```

### 2. 监控浏览器状态

```kotlin
browser?.cefClient?.addLifeCycleHandler(object : CefLifeCycleAdapter() {
    override fun onAfterCreated(browser: CefBrowser) {
        logger.info("JCEF Browser created")
    }

    override fun onBeforeClose(browser: CefBrowser) {
        logger.info("JCEF Browser closing")
    }
})
```

### 3. 捕获 JavaScript 错误

```javascript
window.addEventListener('error', (e) => {
  if (window.javaBridge) {
    window.javaBridge.log('error', e.message);
  }
});
```

---

*最后更新: 2026-04-16*
*基于 IntelliJ IDEA 2025.2 测试*
