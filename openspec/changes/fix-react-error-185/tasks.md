## 1. React StrictMode 条件化

- [x] 1.1 修改 `frontend/src/main.tsx`：将 `<React.StrictMode>` 改为根据 `import.meta.env.DEV` 条件渲染，生产构建不包裹 StrictMode
- [ ] 1.2 验证：运行 `cd frontend && npm run build` 确认构建成功，检查构建产物中 StrictMode 相关代码被 tree-shake

## 2. App.tsx Zustand selector 精确化

- [x] 2.1 将 `useChatStore()` 无 selector 调用（`App.tsx:103`）拆分为多个精确 selector：分别订阅 `sessions`、`activeSessionId`、`openTabs`、`streamEnabled`、`currentPage`、`inputValue`、`currentProvider`、`currentModel`、`currentMode`、`currentAgent`、`currentSkill`、`thinkEnabled`、`contextUsed`、`toasts`、`attachments`、`agentStatus`、`statusMessage`、`subAgentName`、`diffFiles` 以及所有 action 函数
- [x] 2.2 将 `useConfigStore()` 无 selector 调用（`App.tsx:106`）改为 `useConfigStore(state => ({ providers: state.providers, agents: state.agents, skills: state.skills }))`，或拆分为独立 selector
- [x] 2.3 修复 `store` 不稳定依赖：移除 `App.tsx:28` 的 `const store = useChatStore(state => ({ setCurrentPage: state.setCurrentPage }))`，改为在 `cc-open-settings` effect 中直接使用 `useChatStore.getState().setCurrentPage`，effect 依赖改为 `[]`

## 3. useJcefEvents mount 防护

- [x] 3.1 在 `useJcefEvents.ts` 中添加 `const isMounted = useRef(false)`，在 useEffect 中设置 `isMounted.current = true`，cleanup 中设为 `false`
- [x] 3.2 在所有触发 store 更新的事件处理函数（`handleProviders`、`handleSkillsAndAgents`、`handleStream`、`handleMessage`、`handleLocale`、`handleFileRef`、`handleCodeRef`、`handleClearInput`）中添加 `if (!isMounted.current) return` 守卫
- [x] 3.3 验证：检查所有 `useChatStore.getState().xxx()` 和 `useConfigStore.getState().xxx()` 调用是否都在守卫之后

## 4. Kotlin 侧延迟数据推送

- [x] 4.1 在 `JcefChatPanel.kt` 中添加 `CefLoadHandler` 或使用 `browser.getCefBrowser().addLoadHandler()` 监听页面 `load` 完成事件
- [x] 4.2 将 `ReactChatPanel.kt` 中的 `invokeLater { scanAndPushSkillsAgents() }` 和 `invokeLater { pushProvidersToFrontend() }` 改为在 load 事件回调中执行，而不是 `initJcefPanel()` 中立即排队
- [x] 4.3 添加 `isPageLoaded` 标记防止重复推送，load 事件触发后只执行一次数据推送

## 5. 构建与验证

- [x] 5.1 运行 `cd frontend && npm run build` 确认前端构建成功
- [x] 5.2 运行 `./gradlew copyFrontendResources` 确认资源复制成功
- [x] 5.3 运行 `./gradlew compileKotlin` 确认 Kotlin 编译通过
- [x] 5.4 运行 `./gradlew test` 确认所有测试通过
