**“GUI 应该是 Claude Code CLI 的外骨骼，而不是替代它的心脏”**。很多开发者做这类插件时容易陷入的误区是：把 Claude Code 当成一个纯粹的 API 中转，自己在前端用 React 重写流式解析、Markdown 渲染和 Diff 展示，这会导致与 CLI 原生行为严重脱节。
基于你的“终端驱动”哲学和 `ui.md` 的现状，我为你整理了以下**操作映射文档**及**架构重构建议**。
---
### 第一部分：UI 交互与 Claude Code CLI 原生能力映射表
这份表格明确了你的每一个 UI 组件背后，应该向底层 PTY（伪终端）发送什么指令或读取什么数据。
| UI 模块 | 交互动作 | 对应的 Claude Code 原生机制 | 实现底层逻辑 (PTY 指令/系统操作) |
| :--- | :--- | :--- | :--- |
| **Tab 栏** | 新建会话 | 启动新进程 | `spawn('claude')` 创建一个新的 PTY 实例。 |
| | 切换会话 | 切换终端焦点 | 前端切换显示活动状态的 PTY 实例，不发送指令。 |
| | 重命名会话 | 纯前端状态 | **CLI 无此命令**。由前端监听首条 prompt 后本地修改 Tab 标题。 |
| | 关闭会话 | 终止进程 | 向 PTY 发送 `Ctrl+C`，若未退出则 `pty.kill()`。 |
| **输入区** | 发送消息 | 标准输入 | `pty.write(userInput + '\r')` |
| | 打断生成 (停止按钮) | 中断当前执行 | `pty.write('\x1b')` (发送 Escape 键，Claude Code 默认中断键)。 |
| | 附件/文件引用 | 上下文注入 | `pty.write('@' + filePath + ' ' + prompt + '\r')` (Claude 原生 `@` 语法)。 |
| | 对话模式切换 | 模式前缀 | 修改输入框的前缀，例如发送：`[plan] 你的需求\r`。 |
| | 调用 Skill | 斜杠命令 | `pty.write('/skill-name 参数\r')` |
| | 调用 Agent | 斜杠命令 | `pty.write('/agent-name 参数\r')` |
| | 思考过程 (开关) | 展示/折叠思考 | `pty.write('\x0f')` (发送 Ctrl+O，Claude Code 默认展开思考块快捷键)。 |
| **消息区** | 流式输出展示 | CLI 自身输出 | **无需前端解析流式 JSON**，由终端模拟器直接渲染 CLI 的 TUI 输出。 |
| | Markdown/Diff 渲染 | CLI 自带 TUI | Claude Code 终端自身支持 Markdown 和 Diff 高亮，GUI 终端只需配置好 ANSI 颜色主题。 |
| **历史会话** | 获取历史列表 | 读取本地文件 | 解析 `~/.claude/projects/<project-hash>/` 目录下的 JSON 文件获取 `sessionId` 和摘要。 |
| | 加载历史会话 | 恢复会话 | `spawn('claude', ['--resume', sessionId])` 开新终端加载。 |
| | 删除历史会话 | 删除文件 | 删除对应的 `<session-id>.json` 文件。 |
| | 收藏会话 | 纯前端状态 | **CLI 无此概念**。前端维护一个 `Set<sessionId>` 存在 IDEA 插件的 State 中。 |
| **设置界面** | 供应商切换 | 环境变量注入 | **不修改文件**，在 `spawn` 时传入 `env: { ANTHROPIC_BASE_URL: ... }`。 |
| | 供应商持久化配置 | 写入配置 | 直接读写 `~/.claude/settings.json` 的 `env` 字段。 |
| | 新增/编辑 Agent | 文件系统 CRUD | 直接在 `~/.claude/agents/` 目录下创建或修改 `.md` 文件。 |
| | 新增/编辑 Skill | 文件系统 CRUD | 直接在 `.claude/skills/<name>/` 目录下创建或修改 `SKILL.md` 文件。 |
---
### 第二部分：必须重构的“重灾区” (当前代码偏离了 CLI 集成初衷)
根据 `ui.md`，你当前的实现大量使用了类似 `AIMessage.tsx`, `MarkdownContent.tsx`, `DiffViewer.tsx` 这样的自定义 React 组件。**如果你的底层是通过 API 调用，这没问题；但如果你的底层是调用 Claude Code CLI，这就是严重的过度设计（重复造轮子）。**
#### 1. 消息渲染层的彻底重构 (核心风险)
*   **当前状态**：`MessageArea.tsx`, `DiffViewer.tsx`, `CodeBlock.tsx` ✅已实现。
*   **问题**：Claude Code 在终端里已经用 Ink (React for CLI) 写了一套极其完善的 TUI，包含 ANSI 颜色、Markdown 渲染、Diff 高亮、代码折叠。如果你在 GUI 里自己用 React 解析流式数据重写一遍，永远无法和原生保持 100% 一致，且性能开销巨大。
*   **重构建议**：
    *   **废弃**上述前端解析组件。
    *   **引入 `xterm.js` (或 `node-pty` + 前端终端组件)**。你的 GUI 消息区本质上应该是一个“浏览器里的终端窗口”。
    *   你只需要做两件事：1. 把 CLI 输出的带 ANSI 转义码的字符串直接喂给 xterm 渲染；2. 拦截 xterm 里的特定正则（如文件路径），将其转换为可点击的链接，点击后在 IDEA 里打开文件。
#### 2. Skill / Agent 管理弹窗的重构
*   **当前状态**：`AgentEditModal.tsx`, `SkillEditModal.tsx` ✅已实现。
*   **问题**：如果这些弹窗只是把数据存到了你插件的本地数据库（如 SQLite 或 Zustand 持久化），那 Claude Code CLI 根本读不到这些 Agent 和 Skill！
*   **重构建议**：
    *   弹窗的“保存”按钮，必须映射为**文件写入操作**。
    *   例如点击“保存 Skill”，底层逻辑应该是：在项目根目录创建 `.claude/skills/用户输入名/SKILL.md`，将用户在 Textarea 里写的内容（加上 YAML frontmatter）直接写入这个物理文件。
    *   列表加载时，底层逻辑应该是：扫描 `~/.claude/skills/` 和 `.claude/skills/` 目录，读取所有 `SKILL.md` 的 frontmatter 中的 `name` 和 `description` 展示出来。
#### 3. 历史会话页面的重构
*   **当前状态**：`HistoryPage.tsx` ✅已实现。
*   **问题**：如果历史记录是前端自己生成的，那就无法利用 Claude Code 原生的极强上下文记忆。
*   **重构建议**：
    *   去掉前端数据库的历史记录表。
    *   改为读取文件系统：遍历 `~/.claude/projects/` 下对应当前 IDEA 项目的文件夹里的 `.json` 文件。
    *   解析 JSON 里的 `sessionId` 和第一条 `message` 作为列表展示。
    *   “加载到当前 Tab”的实现，改为 `spawn('claude', ['--resume', sessionId])`。
#### 4. 思考模式与智能体列表 (状态 🔄)
*   **当前状态**：`InputToolbar.tsx` 有开关 UI，存储未实现。
*   **重构建议**：
    *   **干掉“思考模式开关”这种持久化状态**。思考内容的展开/收起是 Claude Code CLI 内部的视觉状态，前端无法、也不应该持久化它。
    *   改为一个**动作按钮**：点击后，向当前 PTY 发送 `Ctrl+O` (`\x0f`) 即可。
    *   **智能体列表**：不要在前端存列表。启动时扫描 `~/.claude/agents/*.md`，提取名称，动态生成下拉菜单。点击后向输入框追加 `/agent-name `。
---
### 第三部分：纯 GUI 独立开发建议 (可以保留现有代码的增量能力)
这部分功能是 Claude Code CLI 原生**完全不提供**的，属于你插件的“增值卖点”，可以保留当前的纯前端实现方式，但需要优化。
| 功能 | 当前文件 | 独立开发建议 |
| :--- | :--- | :--- |
| **提示词强化** | `PromptEnhancePanel.tsx` | **保留**。但底层需要你自己调一个轻量模型（如本地 Ollama 或 Haiku）来改写用户 prompt，改写完毕后再替换输入框内容，由用户手动发送给 Claude Code。 |
| **消息时间线** | `MessageTimeline.tsx` | **重构为锚点导航**。由于底层是 xterm.js，你无法获取“消息节点”。建议实现为：解析 xterm 的滚动缓冲区，通过正则匹配出类似 `> User:` 或 `> Claude:` 的行，记录行号，生成时间线小地图，点击快速滚动 xterm。 |
| **文件引用弹窗** | `FileReferencePopup.tsx` | **强烈推荐深化**。拦截 xterm.js 的鼠标事件，监听点击。如果点击的文本符合正则 `/[a-zA-Z0-9_/-]+\.[a-z]+/`，弹出一个 Popover，提供“在编辑器打开”、“复制路径”、“显示项目树”等 IDEA 原生能力。 |
| **会话收藏** | `FavoritesPage.tsx` | **保留前端存储**。维护一个 `favorites.json` 存在插件目录，里面只存 `[{ sessionId: "xxx", note: "xxx" }]`。点击时走 `--resume` 逻辑。 |
| **上下文占用比** | `ContextBar.tsx` | **半重构**。Claude Code 原生在输入框上方会显示 Token 用量。你可以通过正则匹配 xterm 输出中的 `token` 字符串来同步前端的进度条；如果没有，则基于当前会话的历史消息长度做粗略估算。 |
### 总结：你的插件最理想的架构图
```text
[IDEA GUI 界面 (React)]
   ├── 输入框 (拦截用户输入，拼接 @ / [] 等语法)
   ├── 工具栏 (映射为环境变量、Ctrl+O 等特殊按键)
   └── 消息展示区 (Xterm.js 终端模拟器) <--- 核心改变在这里
         │
         │ (双向字符流 + 特殊按键控制)
         ▼
[Node.js 后端层 / Kotlin (IntelliJ)]
   ├── PTY 进程管理器 (管理多个 claude 进程的生命周期)
   ├── 文件系统桥接 (读写 ~/.claude/ 下的 json, md 文件)
   └── 正则拦截器 (从 CLI 输出中提取文件路径、Token 数供 GUI 用)
```
按照这个思路重构，你的代码量甚至会大幅减少（因为扔掉了前端流式解析和 Markdown 渲染那一大坨逻辑），而且与 Claude Code 的更新将永远保持 100% 同步。
