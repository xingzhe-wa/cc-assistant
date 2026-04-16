# 前端开发时间表

> **版本**: v1.0
> **创建日期**: 2026-04-16
> **周期**: 10 个工作日

---

## 总览

| 阶段 | 日期 | 主要任务 | 产出 |
|------|------|---------|------|
| Phase 1 | Day 1 | 项目初始化 + Mock 数据 | 可运行项目 |
| Phase 2 | Day 2-3 | 基础组件 + 布局组件 | UI 骨架 |
| Phase 3 | Day 4-5 | 消息组件 + 输入组件 | 核心功能 |
| Phase 4 | Day 6 | 国际化 + 主题切换 | 可配置 |
| Phase 5 | Day 7-8 | 状态管理 + 交互完善 | 可交互原型 |
| Phase 6 | Day 9-10 | 打磨优化 + 测试 | 交付版本 |

---

## 详细时间表

### Day 1: 项目初始化 + Mock 数据

**目标**: 创建可运行的前端项目

#### 上午 (4h)

| 任务 | 预估 | 实际 | 备注 |
|------|------|------|------|
| 创建 Vite + React + TypeScript 项目 | 1h | | `npm create vite@latest frontend -- --template react-ts` |
| 安装依赖 (zustand, marked, highlight.js) | 0.5h | | |
| 配置 Vite (别名、端口、代理) | 0.5h | | |
| 配置 TypeScript (路径别名) | 0.5h | | |
| 创建目录结构 | 0.5h | | |
| 验证项目运行 | 1h | | `npm run dev` |

#### 下午 (4h)

| 任务 | 预估 | 实际 | 备注 |
|------|------|------|------|
| 创建 Mock 类型定义 | 1h | | `src/types/mock.ts` |
| 创建 Mock 会话数据 | 1h | | `src/mock/sessions.ts` |
| 创建 Mock 供应商/模型数据 | 1h | | `src/mock/providers.ts`, `models.ts` |
| 创建 Mock 配置数据 | 0.5h | | `src/mock/config.ts` |
| 创建 Mock 统一导出 | 0.5h | | `src/mock/index.ts` |

**Day 1 产出**:
- [ ] 可运行的前端项目 (`npm run dev`)
- [ ] Mock 数据模块 (可 import 使用)

**验收标准**:
```bash
cd frontend
npm install
npm run dev
# 访问 http://localhost:5173 应显示默认 Vite 页面
```

---

### Day 2: 基础组件 + 布局组件 (上)

**目标**: 完成 AppLayout、TopBar、TabBar

#### 上午 (4h)

| 任务 | 预估 | 实际 | 备注 |
|------|------|------|------|
| 创建基础组件: Button | 1h | | primary/secondary/ghost 变体 |
| 创建基础组件: Icon | 0.5h | | Material Icons Round |
| 创建基础组件: ScrollArea | 0.5h | | 自定义滚动条样式 |
| 创建基础组件: Modal | 1h | | Portal 渲染 |
| 创建基础组件: Toast | 0.5h | | success/error/info 类型 |
| 创建基础组件: Dropdown | 0.5h | | 悬浮菜单 |

#### 下午 (4h)

| 任务 | 预估 | 实际 | 备注 |
|------|------|------|------|
| 创建 AppLayout | 1h | | 主布局容器 |
| 创建 TopBar | 1h | | 顶栏 |
| 创建 TabBar | 2h | | 会话标签管理 |

**Day 2 产出**:
- [ ] 6 个基础组件
- [ ] AppLayout、TopBar、TabBar

**验收标准**:
- Tab 切换正常
- Tab 关闭至少保留一个
- Tab 悬浮显示关闭按钮

---

### Day 3: 布局组件 (下) + 消息组件 (上)

**目标**: 完成 HistoryBar、MessageArea、MessageList

#### 上午 (4h)

| 任务 | 预估 | 实际 | 备注 |
|------|------|------|------|
| 创建 HistoryBar | 2h | | 历史会话列表 |
| 创建 EmptyState | 1h | | 空状态 |
| 集成 TabBar + HistoryBar | 1h | | 交互联调 |

#### 下午 (4h)

| 任务 | 预估 | 实际 | 备注 |
|------|------|------|------|
| 创建 MessageArea | 1h | | 消息容器 |
| 创建 MessageList | 1.5h | | 消息列表 |
| 创建 UserMessage | 0.5h | | 用户消息 |
| 创建 DiffSummary | 1h | | Diff 汇总 |

**Day 3 产出**:
- [ ] HistoryBar (展开/收起/搜索)
- [ ] MessageArea + MessageList
- [ ] UserMessage

**验收标准**:
- HistoryBar 展开/收起动画正常
- 搜索过滤正常
- MessageList 空状态显示 EmptyState

---

### Day 4: 消息组件 (下)

**目标**: 完成 AIMessage、MarkdownContent、CodeBlock

#### 上午 (4h)

| 任务 | 预估 | 实际 | 备注 |
|------|------|------|------|
| 创建 AIMessage | 2h | | AI 消息 (头部/内容/底部操作) |
| 创建 MarkdownContent | 1.5h | | Markdown 渲染 |
| 创建 markdown 工具函数 | 0.5h | | marked + highlight.js |

#### 下午 (4h)

| 任务 | 预估 | 实际 | 备注 |
|------|------|------|------|
| 创建 CodeBlock | 1.5h | | 代码块 + 复制按钮 |
| 创建 ThinkingBlock | 1h | | 思考片段 (折叠/展开) |
| 创建 DiffViewer | 1.5h | | Diff 可视化 |

**Day 4 产出**:
- [ ] AIMessage (消息/思考/操作)
- [ ] MarkdownContent + CodeBlock
- [ ] DiffViewer

**验收标准**:
- Markdown 完整渲染 (标题/列表/代码块/表格)
- 代码块语法高亮
- Diff 左右对比显示

---

### Day 5: 输入组件

**目标**: 完成 InputArea、InputBox、InputToolbar

#### 上午 (4h)

| 任务 | 预估 | 实际 | 备注 |
|------|------|------|------|
| 创建 InputBox | 1h | | 多行输入框 |
| 创建 InputArea | 1h | | 输入区域容器 |
| 创建 InputToolbar | 1h | | 工具栏 |
| 创建 ContextBar | 0.5h | | 上下文占用比 |

#### 下午 (4h)

| 任务 | 预估 | 实际 | 备注 |
|------|------|------|------|
| 创建 ProviderSelector | 1h | | 供应商选择器 |
| 创建 ModelSelector | 0.5h | | 模型选择器 |
| 创建 AgentSelector | 0.5h | | Agent 选择器 |
| 创建 ModeSelector | 0.5h | | 模式选择器 |
| 集成 InputArea 交互 | 1h | | 发送/停止 |

**Day 5 产出**:
- [ ] 完整的 InputArea
- [ ] Provider/Model/Agent Selector
- [ ] ContextBar

**验收标准**:
- 输入框自动高度调整
- Ctrl+Enter 发送
- 悬浮框弹出/收起正常

---

### Day 6: 国际化 + 主题切换

**目标**: 完成 i18n 模块 + theme 模块

#### 上午 (4h)

| 任务 | 预估 | 实际 | 备注 |
|------|------|------|------|
| 创建 i18n 模块结构 | 1h | | `src/i18n/` |
| 创建 zh-CN 翻译文件 | 1h | | 提取所有文本 |
| 创建 en-US 翻译文件 | 0.5h | | 英文翻译 |
| 创建 useI18n Hook | 0.5h | | 切换语言 |

#### 下午 (4h)

| 任务 | 预估 | 实际 | 备注 |
|------|------|------|------|
| 创建 theme 模块结构 | 1h | | `src/theme/` |
| 创建 IDEA 主题变量 | 1h | | CSS 变量定义 |
| 创建 dark/light 主题 | 0.5h | | 主题切换 |
| 创建 useTheme Hook | 0.5h | | 切换主题 |
| 创建语言/主题切换器 | 0.5h | | UI 组件 |

**Day 6 产出**:
- [ ] i18n 模块 (zh-CN, en-US)
- [ ] theme 模块 (idea, dark, light)
- [ ] 语言/主题切换 Hook

**验收标准**:
- 所有文本使用 `t()` 函数
- 所有颜色使用 CSS 变量
- 语言/主题切换实时生效

---

### Day 7: 状态管理 + 交互完善

**目标**: 完成 Zustand stores + Mock 交互

#### 上午 (4h)

| 任务 | 预估 | 实际 | 备注 |
|------|------|------|------|
| 创建 chatStore | 1.5h | | 聊天状态 |
| 创建 sessionStore | 1h | | 会话状态 |
| 创建 uiStore | 0.5h | | UI 状态 |
| 创建 configStore | 1h | | 配置状态 |

#### 下午 (4h)

| 任务 | 预估 | 实际 | 备注 |
|------|------|------|------|
| 创建 useJcef Hook | 1h | | JCEF 桥接 |
| 实现 Mock 发送交互 | 2h | | 模拟 AI 响应 |
| 实现 Tab 新建/切换/关闭 | 1h | | Store 联调 |

**Day 7 产出**:
- [ ] 4 个 Zustand Store
- [ ] useJcef Hook
- [ ] Mock 交互

**验收标准**:
- 状态更新触发 UI 重新渲染
- Mock 发送消息后自动追加 AI 响应
- Tab 操作正常

---

### Day 8: 弹窗组件 + 交互完善

**目标**: 完成 SettingsModal + ProviderEditModal

#### 上午 (4h)

| 任务 | 预估 | 实际 | 备注 |
|------|------|------|------|
| 创建 SettingsModal | 2h | | 设置弹窗 |
| 创建 SettingsNav | 0.5h | | 设置导航 |
| 创建 SettingsContent | 1.5h | | 设置内容 |

#### 下午 (4h)

| 任务 | 预估 | 实际 | 备注 |
|------|------|------|------|
| 创建 ProviderEditModal | 1.5h | | 供应商编辑 |
| 集成设置保存逻辑 | 1h | | Store 联调 |
| 实现表单验证 | 1h | | 必填项检查 |
| 实现 Toast 提示 | 0.5h | | 操作反馈 |

**Day 8 产出**:
- [ ] SettingsModal (4 个设置页)
- [ ] ProviderEditModal

**验收标准**:
- 设置弹窗打开/关闭正常
- 供应商编辑表单完整
- 表单验证正常

---

### Day 9: 打磨优化

**目标**: 性能优化 + 动画优化

#### 上午 (4h)

| 任务 | 预估 | 实际 | 备注 |
|------|------|------|------|
| 实现虚拟列表 | 2h | | 长消息列表优化 |
| 优化动画 | 1h | | CSS 动画优化 |
| 优化首屏渲染 | 1h | | 懒加载 |

#### 下午 (4h)

| 任务 | 预估 | 实际 | 备注 |
|------|------|------|------|
| 添加加载状态 | 0.5h | | skeleton |
| 优化错误处理 | 1h | | try/catch |
| 添加空状态 | 0.5h | | 各组件空状态 |
| 代码审查 | 2h | | 重构/清理 |

**Day 9 产出**:
- [ ] 性能优化
- [ ] 动画优化
- [ ] 错误处理

**验收标准**:
- 首屏渲染 < 1.5s
- 交互响应 < 100ms
- 无控制台错误

---

### Day 10: 测试 + 交付

**目标**: 测试 + 文档 + 交付

#### 上午 (4h)

| 任务 | 预估 | 实际 | 备注 |
|------|------|------|------|
| 功能测试 | 1h | | 手动测试所有功能 |
| 浏览器兼容性测试 | 1h | | Chrome 兼容性 |
| 文档更新 | 1h | | README |
| 代码审查 | 1h | | PR |

#### 下午 (4h)

| 任务 | 预估 | 实际 | 备注 |
|------|------|------|------|
| Bug 修复 | 2h | | 测试发现的问题 |
| 构建测试 | 1h | | `npm run build` |
| 准备交付 | 1h | | 打包/发布 |

**Day 10 产出**:
- [ ] 测试通过
- [ ] 构建成功
- [ ] 交付文档

---

## 里程碑

| 里程碑 | 时间 | 完成标准 |
|--------|------|---------|
| M1-FE | Day 1 | 可运行项目 + Mock 数据 |
| M2-FE | Day 3 | 布局组件完成 |
| M3-FE | Day 5 | 消息/输入组件完成 |
| M4-FE | Day 6 | 国际化/主题完成 |
| M5-FE | Day 8 | 可交互原型 |
| M6-FE | Day 10 | 交付版本 |

---

## 每日检查清单

### Day 1 结束检查

```markdown
- [ ] npm run dev 启动成功
- [ ] TypeScript 无编译错误
- [ ] Mock 数据可 import
- [ ] 目录结构符合规范
```

### Day 3 结束检查

```markdown
- [ ] TabBar 可切换 Tab
- [ ] Tab 可关闭 (至少保留一个)
- [ ] HistoryBar 可展开/收起
- [ ] MessageList 可显示消息
```

### Day 5 结束检查

```markdown
- [ ] InputArea 可输入文本
- [ ] Ctrl+Enter 发送
- [ ] Provider/Model/Agent 选择器可用
- [ ] ContextBar 显示正确
```

### Day 7 结束检查

```markdown
- [ ] 状态管理正常工作
- [ ] Mock 发送消息正常
- [ ] Mock AI 响应正常
- [ ] Tab 操作正常
```

### Day 10 结束检查

```markdown
- [ ] npm run build 成功
- [ ] 所有功能可操作
- [ ] 无控制台错误
- [ ] 文档完整
```

---

## 风险管理

| 风险 | 影响 | 应对 |
|------|------|------|
| JCEF 集成复杂度 | 中 | 参考现有 JcefChatPanel.kt 实现 |
| 性能问题 | 中 | 预留 Day 9-10 优化 |
| 国际化遗漏 | 低 | Day 6 集中处理 |
| 主题切换不完整 | 低 | CSS 变量预定义 |

---

*文档版本: v1.0*
*最后更新: 2026-04-16*
