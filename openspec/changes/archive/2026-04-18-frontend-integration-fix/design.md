## Context

前端存在多个集成问题：

1. **国际化缺失**：`InputToolbar` 中"配置新 Provider/Agent/Skill"按钮没有 i18n 翻译
2. **导航断裂**：Dropdown 选择的 `__configure_provider__` 等 action 绑定了 `jcefBridge.openSettings()` 但可能参数传递有问题
3. **Provider 不生效**：后端推送 Provider 数据到前端，但切换 Provider 后 CLI 调用没有使用正确参数
4. **状态污染**：chatStore 使用全局 `streaming` 状态，多 Tab 会话共享导致状态冲突

## Goals / Non-Goals

**Goals:**
- 补全所有 UI 文本的 i18n
- 修复导航链路，确保点击配置按钮正确跳转到 Settings 对应 tab
- 修复 Provider 切换后 CLI 调用的参数传递
- 实现每个会话独立管理 streaming 状态

**Non-Goals:**
- 不重新设计数据架构
- 不修改后端 Provider/Agent/Skill 的存储逻辑
- 不添加新的 Provider 配置功能（仅修复现有功能）

## Decisions

### 1. Streaming 状态隔离

**决策**：将 `streaming` 状态从全局变量改为会话级别管理

**当前问题**：
```typescript
// chatStore.ts - 全局状态
streaming: boolean,
streamingContent: string,
```

**解决方案**：
- 在每个会话的 `MockSession` 中添加 `streaming` 和 `streamingContent` 字段
- `MessageArea` 渲染时使用当前活动会话的 streaming 状态
- 发送按钮禁用状态绑定到当前活动会话的 streaming

### 2. Provider 配置传递

**决策**：通过 JCEF 桥接将 Provider 切换事件传递到 Java 层

**数据流**：
```
InputToolbar onProviderChange
  → chatStore.setCurrentProvider(id)
    → jcefBridge.providerChange(id)  // 通过 cefQuery 发送到 Java
      → JcefChatPanel.handleJSMessage("providerChange:xxx")
        → ReactChatPanel.onProviderChange
          → 存储到 ConfigService / 传递给 CLI
```

### 3. 导航参数传递

**决策**：使用 `jcefBridge.openSettings(tab)` 传递目标 tab 参数

**检查点**：
- `jcef.ts` 中 `openSettings(tab)` 是否正确调用 `cefQuery.inject("openSettings", tab)`
- `JcefChatPanel` 是否正确处理 `openSettings` action 并调用 `onOpenSettings(tab)`
- `ReactChatPanel` 的 `onOpenSettings` 是否正确打开 Settings 并定位 tab

## Risks / Trade-offs

[Risk] 会话状态迁移 → Mitigation: 添加 streaming 字段时设置默认值 `false`
[Risk] 破坏现有 Provider 切换 → Mitigation: 保持 jcefBridge.providerChange 调用兼容

## Open Questions

1. Settings 页面是否支持 `tab` 参数定位？需要验证 `SettingsPage.tsx` 组件
2. 后端 Provider 切换后是否需要重新扫描可用模型？
3. 多语言翻译文件位置？需要确认 `frontend/src/i18n/locales/` 目录结构
