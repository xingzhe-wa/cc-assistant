结论先说在前面：
- Claude Code 里**没有**官方的 `settings.conf`。主配置文件是 `~/.claude/settings.json`（JSON），优先级分 5 层（Managed > 命令行 > Local > Project > User），通过“深度合并+数组拼接去重”得到最终配置。官方文档也没提任何 `.conf` 后缀的配置文件。
- Skills/Agents 都是**“约定目录+约定文件（Markdown+YAML frontmatter）”**，按优先级目录收集、监听变动、按需注入。
- Claude Code 官方并不原生提供“多供应商”开关。社区做多供应商（Anthropic 兼容/第三方中转）的方式，是统一复用 `ANTHROPIC_BASE_URL/ANTHROPIC_API_KEY/ANTHROPIC_AUTH_TOKEN` 等环境变量（或 `settings.json` 里的 `env`），把“供应商选择”翻译成“切换这些变量”。
  下面分三块讲，并直接给你“IDE 插件侧该怎么实现”的映射建议。
---
## 1. Claude Code 的配置加载：作用域与合并机制（没有 settings.conf）
### 1.1 配置文件位置与作用域（官方）
Claude Code 的配置系统是分层作用域。每层对应一个 JSON 文件来源（有些是系统级策略或远程下发）：
| 作用域     | 典型位置/来源 | 是否共享给团队 |
|------------|----------------|----------------|
| Managed    | 服务器下发、MDM/注册表、系统目录的 `managed-settings.json` | 是（IT 强制） |
| 命令行     | 启动参数 | 否（本次会话） |
| Local      | 项目内 `.claude/settings.local.json` | 否（gitignored） |
| Project    | 项目内 `.claude/settings.json` | 是（提交到 Git） |
| User       | `~/.claude/settings.json` | 否（个人全局） |
| 其他运行时 | `~/.claude.json`（OAuth、MCP、状态缓存等） | 否 |
合并规则：
- 优先级：Managed（最高）> 命令行 > Local > Project > User（最低）。优先级高会覆盖低（对标量/对象）。
- 对象：深度合并；
- 数组：**拼接+去重**（比如 `permissions.allow`，多处设置会叠加而不是替换）。
  官方验证方式：在 REPL 里输入 `/status` 可查看当前“哪个源生效、是否有错误”。
### 1.2 配置文件格式：`settings.json`（核心字段一览）
官方核心入口是 `~/.claude/settings.json`；示例结构（简化）：
```jsonc
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json", // 可选，用于编辑器补全
  "permissions": {
    "allow": [ "Bash(npm run lint)", "Bash(npm run test *)" ],
    "deny":  [ "Bash(curl *)", "Read(./.env)" ]
  },
  "env": {
    "CLAUDE_CODE_ENABLE_TELEMETRY": "1"
  },
  "companyAnnouncements": [ "团队公告：请 review 所有 PR" ],
  "enabledPlugins": { "formatter@acme-tools": true },
  // 其他字段略（hooks/sandbox/agent 等）
}
```
- `env`：会注入为当前会话的环境变量。这是第三方做“多供应商/多模型”最常用的切入点。
- `permissions`：控制 Claude 可以执行哪些工具命令（Bash/Read/Write 等）。
### 1.3 “多供应商”在 Claude Code 侧的真实做法
Claude Code 官方文档里没有“供应商列表/多供应商切换”概念。但很多 Anthropic 兼容/第三方中转（例如七牛云）都是通过**环境变量**来“变成 Anthropic 供应商”的：
在 `~/.claude/settings.json` 的 `env` 里配：
```jsonc
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "sk-xxx",            // 认证
    "ANTHROPIC_BASE_URL": "https://api.qnaigc.com", // 中转/兼容端点
    "ANTHROPIC_MODEL": "moonshotai/kimi-k2-thinking", // 可选，指定模型
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "...",     // 可选
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "...",      // 可选
    "ANTHROPIC_SMALL_FAST_MODEL": "..."          // 可选
  }
}
```
本质：Claude Code 启动时读取 `settings.json -> env`，把这些字段当作运行时环境变量使用，所以只要你的“供应商”兼容 Anthropic 协议，换 BASE_URL 就能切换。
> 所以如果你在插件里做“多供应商”，建议你直接维护一套 `providers` 配置，界面点击时只改变下一次请求使用的 `BASE_URL/KEY/MODEL`，而**不一定要改 Claude Code 的 `settings.json`**；除非你想“一键同步到 Claude Code CLI”。
---
## 2. Skills 的加载机制（解析与触发）
### 2.1 目录与优先级
官方约定：每个 skill 是一个目录，入口是 `SKILL.md`（必须），其它为辅助文件（可选）。目录层级决定优先级：
- Enterprise（托管/策略，具体由 managed 指定）
- Personal：`~/.claude/skills/<skill-name>/SKILL.md`（全局，你的所有项目）
- Project：`.claude/skills/<skill-name>/SKILL.md`（仅当前项目，可提交 Git）
- Plugin：`<plugin>/skills/<skill-name>/SKILL.md`（按启用范围）
  同名规则：enterprise > personal > project。插件用 `plugin-name:skill-name` 命名空间，不会冲突。
  额外来源：
- 当前工作目录的子目录里如果有 `.claude/skills/`，也会被发现（monorepo 常用）。
- 通过 `--add-dir` 指定的额外目录中的 `.claude/skills/` 会被加载（这是例外，其它配置不从 add-dir 加载）。
  Claude Code 会监听这些目录的变化（文件增加/修改/删除），**当前会话内无需重启**即刻生效。但如果一开始就不存在顶层 skills 目录，需要重启 Claude Code 才会开始监听。
### 2.2 SKILL.md 的结构（YAML frontmatter + Markdown）
- 顶部 YAML（`---` 包裹）：
    - `name`（斜杠命令名，也是“技能 ID”）
    - `description`（Claude 据此判断是否自动加载）
    - `when_to_use`、`argument-hint`、`disable-model-invocation`、`user-invocable`、`allowed-tools`、`model`、`effort`、`context`、`agent`、`hooks`、`paths`、`shell` 等字段（都可选）。
- 正文：Markdown 指令（参考手册、任务步骤、样例、模板等）。
  示例（官方文档的 explain-code）：
```yaml
---
name: explain-code
description: Explains code with visual diagrams and analogies. Use when ...
---
When explaining code, always include:
1. Start with an analogy ...
2. Draw a diagram ...
...
```
调用方式：
- 用户手动：`/explain-code src/auth/login.ts`；
- Claude 自动：根据 `description`/`when_to_use` 和对话语义决定要不要加载（除非设了 `disable-model-invocation: true`）。
### 2.3 支撑文件与变量替换
- 目录内可以放：
    - `template.md` / `examples/sample.md` / `scripts/validate.sh` 等，`SKILL.md` 里引用即可按需加载。
- 内容里可用字符串替换：
    - `$ARGUMENTS`、`$ARGUMENTS[N]`、`$N`；
    - `${CLAUDE_SESSION_ID}`、`${CLAUDE_SKILL_DIR}`。很适合做“日志/临时文件/脚本路径”的场景。
### 2.4 触发流程（简化版）
- 启动/目录变化时：收集所有候选 SKILL.md（按优先级）；
- 将它们的“描述/when_to_use”加入 Claude 的“可用工具列表”（上下文）；
- 用户输入消息时：
    - Claude 根据语义 + description 匹配；
    - 若命中且未被禁用，则“加载该 SKILL.md 的正文+必要支撑文件”作为一条消息注入对话，执行任务；
- `context: fork` 时，Claude Code 会启动子代理运行 skill。
---
## 3. Agents（Subagents）的加载机制（与 Skills 的区别）
### 3.1 目录与格式
- 用户级：`~/.claude/agents/`
- 项目级：`.claude/agents/`
- 文件格式：Markdown + YAML frontmatter（与 skill 类似），但用途不同。
- 作用：定义一个“专用 AI 助手（子代理）”，有自己的系统提示和工具权限；在 `settings.json` 中用 `agent: "code-reviewer"` 把当前线程绑定到某个 subagent。
  优先级/加载方式：同样遵循 User/Project 作用域，同名规则也类似（文档说明在 Settings 页的“Subagent configuration”小节）。
---
## 4. 你的插件可以怎么做？——Claude Code 机制的映射方案
下面是针对你 IDE 插件（多供应商、Skills、Agents）的落地建议：
### 4.1 多供应商：保持 Claude Code 原味 + 插件侧“供应商调度”
- 插件侧：
    - 在“供应商管理界面”保存你自己的 `providers.json`（数组，每项含 `name/base_url/api_key/model/group` 等）；
    - UI 上“供应商切换”只改变插件内部下一次请求会用哪一条 `provider`，不自动覆盖 `~/.claude/settings.json`；
- 如果你确实想“一键同步到 Claude Code CLI”：
    - 用户点“同步/设为默认供应商”时，按 Claude Code 约定，把选中供应商写进 `~/.claude/settings.json` 的 `env`：
        - `ANTHROPIC_BASE_URL` = `provider.base_url`
        - `ANTHROPIC_AUTH_TOKEN` 或 `ANTHROPIC_API_KEY` = `provider.api_key`
        - 可选的 `ANTHROPIC_MODEL` = `provider.model`
    - 这样 Claude Code 下一次 REPL 会话就会使用你配置的供应商（Anthropic 兼容）。
### 4.2 Skills 管理界面：和 Claude Code 目录结构对齐
建议你这样映射 Claude Code 的 skills 目录（可选多目录）：
- 个人 skills：`~/.claude/skills/<skill-name>/SKILL.md`；
- 项目 skills：当前项目根 `.claude/skills/<skill-name>/SKILL.md`；
- 插件内置 skills：插件安装目录下的 `skills/<skill-name>/SKILL.md`。
  加载逻辑：
- 监听这三个根目录；
- 对每个 `<skill-name>` 目录：
    - 找到 `SKILL.md`，解析 YAML frontmatter（name/description/disable-model-invocation/model 等）和 Markdown 正文；
    - 读取目录下其它支撑文件（可选）；
- 同名冲突按 Claude Code 的优先级处理（enterprise > personal > project > plugin），或者直接用 UI 让用户手动解决冲突。
  触发逻辑（在你的插件里）：
- 用户在输入框 `/skill-name` 时，弹出补全列表（按 description 展示）；
- 或者当对话匹配到 `when_to_use`/`description`，由你的后台判定是否“静默注入”skill 正文（Claude Code 那边是模型自动判定，插件里你可以做成一个“轻量规则匹配”或干脆只支持手动调用）。
  导出/导入：
- 导出：把整个 `skill-name` 目录打包成 zip 或直接导出单个 `SKILL.md`；
- 导入：解压到 `~/.claude/skills/` 或项目 `.claude/skills/` 下即可，Claude Code 会自动发现。
### 4.3 Agents 管理界面
与 Skills 类似：
- 目录映射到 `~/.claude/agents/` 或项目 `.claude/agents/`；
- 每个代理一个 Markdown + YAML 文件；
- 插件里只做 CRUD + 列表展示 + “导出 JSON/Markdown”。
---
## 5. 小结：关键点清单
- 配置：
    - 文件：`~/.claude/settings.json`（主）、`.claude/settings.json`、`.claude/settings.local.json`、`~/.claude.json`（运行时/缓存）、managed-settings（企业）；
    - 作用域优先级：Managed > 命令行 > Local > Project > User；
    - 合并：对象深度合并；数组拼接去重；优先级高覆盖低。
- Skills：
    - 文件：`<any-root>/skills/<skill-name>/SKILL.md`（必须）；目录可含支撑文件；
    - 优先级：enterprise > personal > project > plugin；
    - 触发：手动 `/name` 或 Claude 自动（可通过 frontmatter 控制开关）；支持参数替换与子代理执行。
- Agents（Subagents）：
    - 文件：`~/.claude/agents/` 或 `.claude/agents/`，Markdown + YAML；
    - 用途：专用子代理，可在 `settings.json` 中用 `agent` 字段绑定到主线程。
- 多供应商：
    - Claude Code 本身不提供“供应商列表”；
    - 社区做法：统一走 Anthropic 兼容协议，用 `ANTHROPIC_BASE_URL/ANTHROPIC_API_KEY/ANTHROPIC_AUTH_TOKEN/ANTHROPIC_MODEL` 等环境变量切换（可在 `settings.json` 的 `env` 里配）。