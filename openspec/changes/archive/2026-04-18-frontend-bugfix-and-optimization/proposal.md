## Why

前端代码存在多个违反 JCEF 约束的问题，导致在 IntelliJ IDEA 中加载失败或存在安全风险。需要修复这些问题以确保前端能在 JCEF 环境中正常运行。

## What Changes

- **修复 JCEF 单bundle约束** - 修改 vite.config.ts 合并所有 JS 为单个文件，移除多 chunk 分割
- **XSS 安全修复** - 为 Markdown 渲染添加 DOMPurify 消毒
- **移除 Mock 数据逻辑** - 删除 chatStore.ts 中的 mock 响应逻辑，前端不应包含 AI 模拟
- **事件处理模式修复** - 将直接 `onclick` 赋值改为事件委托模式
- **移除生产环境 console.log** - 添加调试标志或完全移除
- **优化 CSS 体积** - 裁剪未使用的 highlight.js 样式

## Capabilities

### New Capabilities
- `jcef-single-bundle`: JCEF 单 bundle 构建配置，确保所有代码内联
- `markdown-sanitization`: Markdown 内容消毒，防止 XSS 攻击

### Modified Capabilities
- (none - bugfix 和优化不改变功能需求)

## Impact

- **Build**: `frontend/vite.config.ts` - 移除 manualChunks 配置
- **Security**: `frontend/src/components/message/MarkdownContent.tsx` - 添加 DOMPurify
- **State**: `frontend/src/stores/chatStore.ts` - 移除 mock 响应逻辑
- **Components**: `frontend/src/components/message/CodeBlock.tsx` - 修复事件处理
- **Build**: `frontend/vite.config.ts` - 添加 production console.log 移除
