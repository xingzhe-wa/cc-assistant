# CC Assistant UI 设计vs实现对比

> 最后更新: 2026-04-19
> 状态标记: ✅已实现 | 🔄部分实现 | ❌未实现 | 📋规划中

---

## 1. 会话界面

### 1.1 标题栏

| 设计项 | 状态 | 实现文件 | 差异说明 |
|--------|------|---------|---------|
| 会话名称(可重命名) | ✅ | `components/layout/TabBar.tsx` | 用户发起对话后变为用户prompt |
| 新建会话按钮 | ✅ | `components/layout/TabBar.tsx` | |
| 历史会话按钮 | ✅ | `components/layout/TopBar.tsx` | |
| 设置按钮 | ✅ | `components/layout/TopBar.tsx` | |
| 流式输出开关 | ❌ | - | 设计中遗漏，MVP阶段不需要 |

### 1.2 消息区域

| 设计项 | 状态 | 实现文件 | 差异说明 |
|--------|------|---------|---------|
| 用户消息 | ✅ | `components/message/UserMessage.tsx` | 含复制按钮 |
| AI消息 | ✅ | `components/message/AIMessage.tsx` | 头部/尾部均有复制按钮 |
| 流式输出 | ✅ | `components/message/MessageArea.tsx` | |
| 代码块diff(新增/修改) | ✅ | `components/message/DiffViewer.tsx` | |
| Markdown渲染 | ✅ | `components/message/MarkdownContent.tsx` | |
| 代码高亮 | ✅ | `components/message/CodeBlock.tsx` | |

### 1.3 对话区

| 设计项 | 状态 | 实现文件 | 差异说明 |
|--------|------|---------|---------|
| 附件栏(图片/文件) | ✅ | `components/input/AttachmentPreview.tsx` | |
| 上下文占用比 | ✅ | `components/input/ContextBar.tsx` | |
| 输入框 | ✅ | `components/input/InputBox.tsx` | |
| 供应商切换 | ✅ | `components/input/Dropdown.tsx` | 悬浮列表 |
| 对话模式(auto/plan/agent) | ✅ | `components/input/InputToolbar.tsx` | 悬浮列表 |
| 思考模式开关 | 🔄 | - | 有开关UI，存储未实现 |
| 智能体列表 | 🔄 | - | 有UI，存储未实现 |
| 发送按钮(可打断) | ✅ | `components/input/AIStatusBar.tsx` | |
| 提示词强化 | ✅ | `components/input/PromptEnhancePanel.tsx` | |

---

## 2. 历史会话界面

| 设计项 | 状态 | 实现文件 | 差异说明 |
|--------|------|---------|---------|
| 搜索栏(名称模糊搜索) | ✅ | `pages/HistoryPage/HistoryPage.tsx` | |
| 会话列表 | ✅ | `pages/HistoryPage/HistoryPage.tsx` | 显示发起时间/提问次数 |
| 点击加载到当前tab | ✅ | `stores/chatStore.ts` | loadSession |
| 重命名会话 | ✅ | `pages/HistoryPage/HistoryPage.tsx` | |
| 收藏按钮 | ✅ | `pages/HistoryPage/HistoryPage.tsx` | |
| 导出 | ✅ | `pages/HistoryPage/HistoryPage.tsx` | 按钮存在 |
| 删除按钮 | ✅ | `pages/HistoryPage/HistoryPage.tsx` | 含确认对话框 |

---

## 3. 收藏会话界面

| 设计项 | 状态 | 实现文件 | 差异说明 |
|--------|------|---------|---------|
| 搜索栏(名称模糊搜索) | ✅ | `pages/FavoritesPage/FavoritesPage.tsx` | |
| 会话列表 | ✅ | `pages/FavoritesPage/FavoritesPage.tsx` | |
| 点击加载到当前tab | ✅ | `stores/chatStore.ts` | |
| 导出 | ✅ | `pages/FavoritesPage/FavoritesPage.tsx` | |
| 删除按钮 | ✅ | `pages/FavoritesPage/FavoritesPage.tsx` | 含确认对话框 |

**与设计差异**: 设计中提到"内嵌在历史会话界面的右下角"，实际为独立页面，通过TopBar跳转

---

## 4. 设置界面

### 4.0 基础设置

| 设计项 | 状态 | 实现文件 | 差异说明 |
|--------|------|---------|---------|
| CLI版本检测 | ✅ | `pages/SettingsPage/SettingsPage.tsx` | 显示当前版本 |
| 自动安装/更新 | 🔄 | - | "检查更新"按钮存在，后端未实现 |
| 国际化语言 | ✅ | `stores/configStore.ts` | 支持zh-CN/en-US/ja-JP/ko-KR |
| 主题切换 | ✅ | `stores/configStore.ts` | idea/dark/light/highContrast |
| 对话背景(图片/颜色) | ❌ | - | 未实现 |
| 消息气泡背景 | ❌ | - | 未实现 |

### 4.1 供应商管理

| 设计项 | 状态 | 实现文件 | 差异说明 |
|--------|------|---------|---------|
| 新增供应商 | ✅ | `pages/SettingsPage/ProviderEditModal.tsx` | |
| 供应商列表 | ✅ | `pages/SettingsPage/SettingsPage.tsx` | 显示名称/状态/URL |
| 修改供应商 | ✅ | `pages/SettingsPage/ProviderEditModal.tsx` | |
| 导出JSON | ✅ | `pages/SettingsPage/SettingsPage.tsx` | 按钮存在 |
| 删除供应商 | ✅ | `pages/SettingsPage/SettingsPage.tsx` | 含确认对话框 |
| 三方快捷配置 | ✅ | `pages/SettingsPage/ProviderEditModal.tsx` | Claude/GLM/Minimax |
| 模型预设 | ✅ | `pages/SettingsPage/ProviderEditModal.tsx` | default/opus/max |
| JSON配置化 | ✅ | `pages/SettingsPage/ProviderEditModal.tsx` | 双向绑定 |

### 4.2 Agent管理

| 设计项 | 状态 | 实现文件 | 差异说明 |
|--------|------|---------|---------|
| 新增Agent | ✅ | `pages/SettingsPage/AgentEditModal.tsx` | |
| Agent列表 | ✅ | `pages/SettingsPage/SettingsPage.tsx` | 显示名称/描述 |
| 导出JSON | ✅ | `pages/SettingsPage/SettingsPage.tsx` | 按钮存在 |

### 4.3 Skill管理

| 设计项 | 状态 | 实现文件 | 差异说明 |
|--------|------|---------|---------|
| 新增Skill | ✅ | `pages/SettingsPage/SkillEditModal.tsx` | |
| Skill列表 | ✅ | `pages/SettingsPage/SettingsPage.tsx` | 显示名称/描述 |
| 导出JSON | ✅ | `pages/SettingsPage/SettingsPage.tsx` | 按钮存在 |

---

## 补充: 设计中遗漏的功能项

| 功能 | 说明 |
|------|------|
| Thinking显示 | AI思考过程展开/收起 (`components/message/ThinkingBlock.tsx`) |
| 消息时间线 | 消息时间轴导航 (`components/message/MessageTimeline.tsx`) |
| 滚动到底部按钮 | (`components/message/ScrollButtons.tsx`) |
| 文件引用 | 消息中引用文件展示 (`components/input/FileReferencePopup.tsx`) |
| Toast提示 | 操作反馈提示 (`components/common/Toast.tsx`) |
| 气泡模式切换 | 用户/AI消息气泡样式 |