## ADDED Requirements

### Requirement: App component SHALL use precise Zustand selectors
`App.tsx` 中的 `useChatStore()` 和 `useConfigStore()` 调用 MUST 使用精确 selector 函数，只订阅组件实际使用的状态片段，不得使用无参数调用订阅全量 store。

#### Scenario: Only relevant state changes trigger re-render
- **WHEN** `useChatStore` 中的 `streamEnabled` 属性变化
- **AND** App 组件中没有 selector 直接订阅 `streamEnabled`
- **THEN** App 组件 SHALL NOT 重新渲染

#### Scenario: All consumed state is accessible
- **WHEN** App 组件需要访问 `sessions`、`activeSessionId`、`inputValue` 等状态
- **THEN** 每个状态 MUST 通过独立的 `useChatStore(state => state.xxx)` selector 获取

### Requirement: useEffect dependencies SHALL be stable references
`App.tsx` 中所有 `useEffect` 的依赖数组 MUST 只包含稳定引用（primitive 值、useRef.current、或 Zustand action 引用）。不得将每次渲染新建的对象作为 effect 依赖。

#### Scenario: cc-open-settings effect runs once on mount
- **WHEN** App 组件首次挂载
- **THEN** `cc-open-settings` 事件监听器 SHALL 注册一次且仅一次
- **AND** 后续 store 状态变化 SHALL NOT 导致该监听器重新注册

#### Scenario: cc-open-settings handler accesses current store state
- **WHEN** `cc-open-settings` 事件触发
- **THEN** 事件处理函数 MUST 通过 `useChatStore.getState()` 获取最新的 `currentPage` 状态
- **AND** 通过 `getState().setCurrentPage()` 执行页面切换

### Requirement: useConfigStore selectors SHALL be precise in App
`App.tsx` 中对 `useConfigStore` 的访问 MUST 使用 selector，只订阅 `providers`、`agents`、`skills` 这三个实际使用的状态片段。

#### Scenario: Theme change does not re-render App
- **WHEN** `useConfigStore` 中的 `theme` 属性变化
- **THEN** App 组件 SHALL NOT 因 theme 变化而重新渲染
- **AND** 只有 `useTheme()` hook 内部的订阅会触发 theme 相关更新
