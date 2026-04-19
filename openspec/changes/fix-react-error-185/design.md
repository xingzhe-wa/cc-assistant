## Context

CC Assistant 插件使用 JCEF（IntelliJ 内嵌 Chromium）加载 React 19 前端。插件启动流程：

1. `ReactChatPanel.initJcefPanel()` → `JcefChatPanel.createPanel()`
2. `loadSkeleton()` 立即显示加载骨架
3. `invokeLater` 延迟执行 `loadHtmlContent()` + `initializeJSBridge()`
4. 同一 EDT tick 内排队 `scanAndPushSkillsAgents()` 和 `pushProvidersToFrontend()`
5. 这两个方法通过 `executeScript()` 调用 `CCProviders.setData()` / `CCProviders.setSkillsAndAgents()`
6. 全局对象 dispatch CustomEvent → `useJcefEvents` 监听 → 更新 Zustand store

当前代码存在三个问题叠加导致 React error #185：

**问题 A — 无 selector 全量订阅**
`App.tsx` 中 `useChatStore()` 和 `useConfigStore()` 无 selector，订阅全部 store 属性。任一属性变化都触发 App 重渲染。

**问题 B — 不稳定的 useEffect 依赖**
```typescript
const store = useChatStore(state => ({ setCurrentPage: state.setCurrentPage }));
useEffect(() => { /* cc-open-settings listener */ }, [store]);
```
`store` 每次渲染都是新对象引用 → effect 每次渲染都重新注册事件监听。

**问题 C — Java→JS bridge 事件在 mount 期间触发**
`pushProvidersToFrontend()` 通过 `executeScript()` 在 React mount 期间或之后立即触发 `cc-providers` 事件。在 React 19 StrictMode 双重 effect 调用下，事件处理函数更新 configStore → App 重渲染 → effect 重跑 → 可能再次触发事件处理。

## Goals / Non-Goals

**Goals:**
- 消除 React error #185，确保插件启动后 JCEF 面板正常渲染
- 减少 App 组件不必要的重渲染次数
- 保证 Java→JS bridge 事件在 React 就绪后正确处理

**Non-Goals:**
- 不重构整体状态管理架构（保持 Zustand）
- 不修改 JCEF 加载流程的两阶段策略
- 不引入新依赖

## Decisions

### Decision 1: 精确 Zustand selector 替代全量订阅

**选择**：在 `App.tsx` 中将 `useChatStore()` 拆分为多个独立 selector 调用，每个只订阅需要的状态片段。

**替代方案**：
- (a) 使用 `useShallow` equality — 仍需列举所有字段，且增加运行时开销
- (b) 拆分 store — 改动太大，超出修复范围

**理由**：精确 selector 是 Zustand 官方推荐方式，零运行时开销，且直接消除无关状态变化导致的重渲染。

### Decision 2: 稳定 useEffect 依赖

**选择**：移除 `store` 中间变量，在 `cc-open-settings` effect 中直接使用 `useChatStore.getState().setCurrentPage`。effect 依赖改为空数组 `[]`。

**替代方案**：
- (a) 使用 `useRef` 存储 `setCurrentPage` — 多余的间接层
- (b) 使用 `useCallback` 包装 — 不必要

**理由**：`setCurrentPage` 是 Zustand store 的 action，引用稳定（由 `create()` 生成），直接在 effect 内用 `getState()` 获取即可，无需将其放入依赖数组。

### Decision 3: 添加 mount-ready 标记延迟处理 bridge 事件

**选择**：在 `useJcefEvents` 中引入一个 `isMounted` ref，事件处理函数检查 `isMounted` 后再更新 store。同时在 `JcefChatPanel.kt` 中将 `pushProvidersToFrontend()` 和 `scanAndPushSkillsAgents()` 延迟到浏览器 load 事件完成后执行。

**替代方案**：
- (a) `requestAnimationFrame` 延迟 — 不可靠，可能在 mount 前就触发
- (b) 队列缓存未处理事件 — 过度设计

**理由**：`isMounted` ref 是 React 社区标准模式。Kotlin 侧延迟到 `load` 事件确保 React 已完成 mount，从根源避免竞态。

### Decision 4: StrictMode 仅开发环境启用

**选择**：`main.tsx` 中根据 `import.meta.env.DEV` 条件渲染 `<React.StrictMode>`。JCEF 环境中构建产物为生产模式，StrictMode 自动禁用。

**替代方案**：
- (a) 完全移除 StrictMode — 失去开发时的双重 effect 检查
- (b) 不处理 — StrictMode 在生产模式已不生效，但这取决于 Vite 构建配置

**理由**：Vite `build` 默认设置 `NODE_ENV=production`，React 19 StrictMode 在生产模式下**不会**双重调用 effect。但显式保护可防止配置错误。需验证当前构建配置。

## Risks / Trade-offs

- **[Risk] selector 拆分导致代码行数增加** → App.tsx 的 store 调用从 2 行变为 ~8 行，但可读性提升，性能改善明显
- **[Risk] `isMounted` ref 可能丢失 mount 早期的事件** → Kotlin 侧延迟到 `load` 事件后执行，确保 React 就绪后才推送数据，不存在丢失
- **[Risk] 修改 Kotlin 侧执行时机可能影响首次渲染速度** → 延迟在 `load` 事件后（约 100-200ms），用户感知不到差异
- **[Trade-off] 不使用 `useShallow` 而使用多个 selector** → 代码更冗长但性能更好，且避免了 `useShallow` 的浅比较开销
