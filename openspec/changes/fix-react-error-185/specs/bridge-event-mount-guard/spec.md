## ADDED Requirements

### Requirement: useJcefEvents SHALL guard against pre-mount state updates
`useJcefEvents` hook MUST 使用 `useRef` 维护一个 `isMounted` 标记，在 effect 执行时设为 `true`，在 cleanup 时设为 `false`。所有会触发 store 更新的事件处理函数 MUST 检查此标记后才执行状态更新。

#### Scenario: Bridge event during mount is handled after ready
- **WHEN** Java 端通过 `executeScript()` 在 React mount 期间触发 `cc-providers` 事件
- **AND** `isMounted` ref 尚未设为 `true`
- **THEN** 事件处理函数 SHALL NOT 执行 `useConfigStore.getState().setProvidersFromBackend()`
- **AND** 数据 SHALL 在后续正常的 `cc-providers` 事件中处理

#### Scenario: Bridge event after mount is processed normally
- **WHEN** Java 端触发 `cc-providers` 事件
- **AND** `isMounted` ref 为 `true`
- **THEN** 事件处理函数 SHALL 正常执行 `setProvidersFromBackend()` 更新 store

### Requirement: Kotlin side SHALL delay data push until browser load completes
`ReactChatPanel.kt` 中的 `pushProvidersToFrontend()` 和 `scanAndPushSkillsAgents()` MUST NOT 在 `loadHTML()` 返回后立即通过 `executeScript()` 推送数据。MUST 通过 `JcefLoadListener` 或 `addLoadHandler` 等机制等待浏览器 `load` 事件完成后再执行。

#### Scenario: Provider data pushed after React mount
- **WHEN** JCEF 浏览器完成 HTML 加载（`load` 事件触发）
- **THEN** `pushProvidersToFrontend()` SHALL 执行 `CCProviders.setData()` 推送供应商数据
- **AND** 推送 SHALL 在 React `useEffect` 注册事件监听器之后发生

#### Scenario: Skills and agents pushed after React mount
- **WHEN** JCEF 浏览器完成 HTML 加载
- **THEN** `scanAndPushSkillsAgents()` SHALL 执行 `CCProviders.setSkillsAndAgents()` 推送数据
- **AND** 推送 SHALL 在 React `useEffect` 注册事件监听器之后发生

### Requirement: React StrictMode SHALL be development-only
`main.tsx` 中的 `<React.StrictMode>` 包裹 MUST 只在开发模式下启用。生产构建 MUST NOT 包含 StrictMode 双重 effect 调用行为。

#### Scenario: Production build without StrictMode
- **WHEN** 执行 `npm run build`（Vite 生产构建）
- **THEN** `import.meta.env.DEV` 为 `false`
- **AND** `<React.StrictMode>` SHALL NOT 包裹 `<App />`

#### Scenario: Development build with StrictMode
- **WHEN** 执行 `npm run dev`（Vite 开发服务器）
- **THEN** `import.meta.env.DEV` 为 `true`
- **AND** `<React.StrictMode>` SHALL 包裹 `<App />`
