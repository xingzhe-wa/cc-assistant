## Context

当前前端构建输出多个独立的 JS chunk，但 JCEF 的 `loadHTML()` 要求所有 CSS/JS 内联到 HTML 中。外部 JS 文件（通过 `<script src="...">` 引用）在 JAR 包中加载时会失败。

此外，Markdown 渲染使用 `dangerouslySetInnerHTML` 直接插入未消毒的 HTML，存在 XSS 风险。

## Goals / Non-Goals

**Goals:**
- 修复 JCEF 单 bundle 约束，确保所有代码可加载
- 防止 XSS 攻击，保护用户安全
- 移除前端 mock 响应逻辑，保持前后端职责分离
- 修复事件处理模式，避免 JCEF 重置问题

**Non-Goals:**
- 不改变现有功能行为
- 不添加新功能
- 不修改后端代码

## Decisions

### Decision 1: 移除 manualChunks，合并为单 JS bundle
**Choice**: 修改 vite.config.ts，移除 `rollupOptions.output.manualChunks` 配置
**Rationale**: JCEF 环境需要所有 JS 在一个文件中，`loadHTML()` 无法处理动态 import
**Alternatives**:
- 使用 vite-plugin-singlefile 内联所有资源（会增加 bundle 大小）
- 当前选择最简单，不引入新依赖

### Decision 2: 使用 DOMPurify 进行 Markdown 消毒
**Choice**: 安装 `dompurify` 包，在渲染前消毒
**Rationale**: DOMPurify 是成熟的 HTML 消毒库，能有效防止 XSS
**Alternatives**:
- 使用 `textContent` 代替 `innerHTML`（会丢失所有格式）
- 使用 `marked` 的 sanitize 选项（功能不如 DOMPurify 完善）

### Decision 3: 移除 chatStore 中的 mock 响应逻辑
**Choice**: 删除 mockResponses 数组和相关的 sendMessage mock 分支
**Rationale**: 前端不应包含 AI 响应模拟，所有响应应来自后端 CliBridgeService
**Implementation**: sendMessage 只发送消息到 Java 层，不执行 mock

### Decision 4: 事件委托替代直接 onclick
**Choice**: 使用 `addEventListener` 配合事件委托
**Rationale**: JCEF 可能重置直接绑定的 onclick，事件委托更稳定
**Implementation**: 在容器上绑定一个 listener，通过 data-* 属性识别目标

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|------|--------|------------|
| DOMPurify 增加 bundle 体积 | 低 | DOMPurify 约 8KB gzip，比 XSS 漏洞风险小 |
| 单 bundle 体积增大 | 低 | 移除未使用代码，优化比多 chunk 更重要 |
| 移除 mock 影响开发 | 低 | 开发时可通过后端 mock 数据 |

## Migration Plan

1. 备份当前 vite.config.ts
2. 修改 vite.config.ts 移除 manualChunks
3. 安装 dompurify 并集成到 MarkdownContent
4. 移除 chatStore mock 逻辑
5. 修复事件处理模式
6. 构建并验证在 JCEF 中正常加载

## Open Questions

1. 是否需要保留开发环境的 mock 数据机制？
2. 是否需要添加 console.log 的调试标志？
