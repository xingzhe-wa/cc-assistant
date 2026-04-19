## Why

插件加载时 JCEF 中的 React 应用抛出 `Minified React error #185`（Maximum update depth exceeded），导致整个聊天面板无法渲染，用户看到空白或错误页面。根因是 `App.tsx` 中 `useChatStore()` / `useConfigStore()` 无 selector 订阅全量状态 + `useEffect` 依赖不稳定对象引用 + Java→JS bridge 事件在 mount 期间触发 store 更新，三者叠加在 React 19 StrictMode 双重 effect 调用下形成渲染死循环。

## What Changes

- **修复 `App.tsx` Zustand 订阅方式**：将 `useChatStore()` / `useConfigStore()` 无 selector 调用替换为精确 selector，只订阅组件实际使用的状态片段，避免无关 store 更新触发 App 重渲染
- **稳定 `useEffect` 依赖引用**：将 `cc-open-settings` effect 中的 `store` 对象依赖（每次渲染新建引用）替换为直接使用 `useChatStore.getState()` 或 stable callback ref
- **添加 mount 期间的 bridge 事件防护**：在 `useJcefEvents` 中对 store 更新操作添加 debounce 或 mount-complete 标记，防止 Java 端 `pushProvidersToFrontend()` / `scanAndPushSkillsAgents()` 在 React 初始化期间触发级联状态更新
- **移除 StrictMode 或限定开发环境**：`<React.StrictMode>` 在 JCEF 生产环境中造成双重 effect 调用，增加 mount 期间状态冲突概率，应限定为仅开发环境启用

## Capabilities

### New Capabilities
- `store-selector-optimization`: Zustand store 订阅优化 — 将 App 组件的全量 store 订阅改为精确 selector，包含 selector 编写规范
- `bridge-event-mount-guard`: JCEF bridge 事件 mount 防护 — 防止 Java→JS 事件在 React mount 期间触发级联 store 更新

### Modified Capabilities

## Impact

- **前端代码**：`App.tsx`（主要修改）、`useJcefEvents.ts`（防护逻辑）、`main.tsx`（StrictMode 条件化）
- **Kotlin 代码**：`ReactChatPanel.kt` — `pushProvidersToFrontend()` / `scanAndPushSkillsAgents()` 可能需要延迟到 React mount 完成后再执行
- **无 API 变更**：不涉及 Java↔JS 接口变更
- **无依赖变更**：不引入新包
