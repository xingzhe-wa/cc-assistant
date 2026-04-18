## 1. JCEF 单 Bundle 配置修复

- [x] 1.1 修改 vite.config.ts，添加 manualChunks 强制单 bundle
- [x] 1.2 更新 copyChatHtml 插件内联 JS/CSS/runtime 到 HTML
- [x] 1.3 验证构建输出（chat.html 611KB，无外部资源引用）

## 2. Markdown XSS 安全修复

- [x] 2.1 安装 dompurify 包
- [x] 2.2 安装类型定义 @types/dompurify
- [x] 2.3 修改 MarkdownContent.tsx，添加 DOMPurify 消毒调用
- [x] 2.4 验证危险 HTML 被正确剥离（配置了 ALLOWED_TAGS）

## 3. 移除前端 Mock 响应逻辑

- [x] 3.1 找到 chatStore.ts 中的 mockResponses 数组
- [x] 3.2 删除 mock 响应逻辑，只保留发送消息到 Java 层的代码
- [x] 3.3 确保 sendMessage 不再执行 mock AI 响应

## 4. 事件处理模式修复

- [x] 4.1 修改 MarkdownContent.tsx，将直接 onclick 改为事件委托
- [x] 4.2 在容器上使用 addEventListener
- [x] 4.3 通过 .copy-code-btn 类名识别目标元素

## 5. 构建验证

- [x] 5.1 运行 `npm run build` 验证构建成功
- [x] 5.2 检查 dist/ 和 chat.html，确认 JS/CSS/runtime 已内联
- [x] 5.3 运行 `./gradlew copyFrontendResources` 同步到插件资源
- [x] 5.4 运行 `./gradlew compileKotlin` 验证 Kotlin 编译通过
