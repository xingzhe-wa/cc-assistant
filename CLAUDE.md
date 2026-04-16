# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

# CC Assistant - Project Overview

- **What**: IntelliJ Platform plugin that wraps Claude Code CLI with an in-IDE chat UI
- **Package**: `com.github.xingzhewa.ccassistant`
- **Language**: Kotlin 21 (JVM toolchain 21)
- **Build**: Gradle Kotlin DSL + version catalog (`gradle/libs.versions.toml`)
- **Target IDE**: 2025.2+ (sinceBuild = 252)
- **Plugin ID**: `com.github.xingzhewa.ccassistant`

**Core principle**: This plugin is a UI shell for Claude Code CLI. It does NOT wrap the SDK or implement AI features directly. If CLI doesn't support it, the plugin doesn't support it.

---

## Development Commands

```bash
# Build
./gradlew compileKotlin          # Compile only
./gradlew build                  # Full build (compile + test)
./gradlew buildPlugin            # Build distributable .zip
./gradlew clean

# Test
./gradlew test                                     # All tests
./gradlew test --tests NdjsonParserTest            # Single test class
./gradlew test --tests "NdjsonParserTest.test*"    # Single test method
./gradlew koverXmlReport                           # Coverage report

# Frontend (separate Vite project in frontend/)
cd frontend && npm install        # First time
cd frontend && npm run dev        # Dev server at http://localhost:5173
cd frontend && npm run build      # Build to frontend/dist/
./gradlew copyFrontendResources   # Copy dist/ → src/main/resources/web/

# Code quality
./gradlew qodana                  # Qodana static analysis
./gradlew verifyPlugin            # Plugin verification
```

> Note: `processResources` depends on `copyFrontendResources`, so Gradle builds auto-sync frontend assets.

---

## Architecture

```
ToolWindow (Swing container)
  └── ReactChatPanel (JPanel)
        ├── CliBridgeService (APP-level singleton) ← manages CLI process
        │     └── ProcessBuilder: claude -p "..." --output-format stream-json
        │           stdout → NdjsonParser → CliMessage (sealed class)
        │             └── TextDelta / ThinkingDelta / ToolUseStart / Result / Error
        │
        └── JcefChatPanel ← JCEF browser + Java↔JS bridge
              ├── Loads React app from resources/web/ (inline HTML/CSS/JS)
              ├── Java→JS: executeScript() calling CCChat/CCApp/CCProviders globals
              └── JS→Java: JBCefJSQuery with action:data protocol
```

**Data flow**: User types → JS `sendMessage` → JBCefJSQuery → `ReactChatPanel.handleSendMessage()` → `CliBridgeService.executePrompt()` → CLI process → NDJSON stdout → `NdjsonParser` → callbacks → `JcefChatPanel.appendStreamingContent()` → JS renders.

**Service levels**:
- `CliBridgeService` → `@Service(Service.Level.APP)` (singleton across IDE)
- `ConfigService` → `@Service` with `PersistentStateComponent<AppConfigState>`
- `ProviderService` → project-level, loads from `resources/providers/*.json`

### Frontend Stack (confirmed)

| Layer | Choice |
|-------|--------|
| Framework | React 19 + TypeScript 6 |
| Build | Vite 8 |
| State | Zustand 5 |
| Markdown | marked 18 + highlight.js |
| Icons | Material Symbols Rounded (local woff2 in assets/) |
| Styling | CSS (no Tailwind currently) |

### Key Source Paths

| Path | Purpose |
|------|---------|
| `src/main/kotlin/.../bridge/` | CLI process management + NDJSON parsing |
| `src/main/kotlin/.../ui/chat/` | JCEF panels (JcefChatPanel, ReactChatPanel) |
| `src/main/kotlin/.../model/Provider.kt` | Provider management + preset loading |
| `src/main/kotlin/.../config/AppConfigState.kt` | Persistent config |
| `src/main/resources/providers/` | 6 preset provider JSONs (claude, deepseek, gemini, glm, kimi, qwen) |
| `src/main/resources/web/` | Frontend build output (loaded via `loadHTML()`) |
| `frontend/src/` | React frontend source |
| `frontend/src/lib/jcef-integration.ts` | CCChat/CCApp/CCProviders global objects for Java bridge |
| `frontend/src/stores/chatStore.ts` | Zustand store |
| `frontend/src/i18n/locales/` | i18n translations (zh-CN, en-US, ja-JP, ko-KR) |

### Module Dependency Direction

```
toolWindow → ui → services → bridge → infrastructure
(swing)      (jcef)  (config)    (cli)     (os)
         ←── MUST NOT flow backwards ──→
```

---

## Hard Constraints

### HC-001: Build & Test must pass
- `./gradlew compileKotlin` must succeed
- `./gradlew test` must pass, new features need tests
- Coverage target ≥ 70%

### HC-002: No hardcoded secrets
- API keys stored in `~/.claude/settings.json` (managed by CLI)
- Plugin reads/writes that file but never logs full keys

### HC-003: Thread safety
- UI operations must run on EDT (`invokeLater` / `ApplicationManager.invokeLater`)
- Background work: `ProgressManager` or `executeOnPooledThread`
- Services use `ConcurrentLinkedQueue` for callbacks, `AtomicBoolean` for state

### HC-004: Null safety
- Use `?.` and `?: default`, never `!!` unless absolutely certain
- No `@Suppress("UNCHECKED_CAST")` to hide type errors

### HC-005: Resource management
- Use `.use {}` for closeable resources
- JCEF: must call `browser.dispose()` in `dispose()`, use `AtomicBoolean` to prevent double-dispose
- CLI process: destroy + waitFor timeout + destroyForcibly fallback

### HC-006: CLI-First principle
- **Never** wrap the Anthropic SDK or implement SDK-level features
- Claude Code CLI is the sole AI capability source
- Multi-turn conversations use `--resume <session_id>` (CLI native), never manually stitch prompt history
- `executePrompt()` must accept `sessionId` param → appends `--resume` when provided

### HC-007: UI tech stack
- **Chat UI**: JCEF + React (mandatory) — handles Markdown, streaming, diff, multi-session
- **Everything else**: Swing (settings, dialogs, popups)
- **Communication**: JBCefJSQuery only, never `eval()` with untrusted input
- **JCEF fallback**: if `JBCefApp.isSupported()` returns false, show Swing JLabel message
- **Resource loading**: inline all CSS/JS via `loadHTML()`, not relative paths (JAR loading is unreliable)

### HC-008: Permission modes
- Default (agent/auto): `--permission-mode accept-all`, no interruption
- Plan mode: omit `--permission-mode`, CLI pauses for confirmation → plugin shows Swing dialog
- No confirmation dialogs outside Plan mode

### HC-009: Session copy & quote
- Session load (M2-C5): create new session, copy messages, sessionId = null
- Message quote (M2-C6): format as `> ...` markdown blockquote, strip HTML to plain text
- Rewind vs Quote: rewind creates new branch; quote appends to current

### HC-010: Frontend i18n
- All visible text via `t(key)` from `useI18n()` hook
- Key format: `{module}.{name}` e.g. `toolbar.newSession`
- Default locale: `zh-CN`
- Brand names ("Claude", "DeepSeek") don't need translation

### HC-011: MVP scope control
- Implement features in priority order: JCEF render → multi-session → session load → message quote → MCP
- No features outside MVP scope without review

---

## Soft Constraints

- Functions ≤ 50 lines; split if longer
- Public APIs need KDoc
- Single-direction dependencies (ui → services → bridge)
- Never swallow exceptions in catch blocks — log and rethrow or handle

---

## JCEF-Specific Notes

These are practical constraints discovered through testing in IDEA 2025.2:

| What works | What doesn't |
|-----------|--------------|
| `loadHTML()` with inline CSS/JS | `alert()`, `confirm()`, `prompt()` (blocked) |
| Flex/Grid CSS, gradients | `window.open()` (blocked) |
| `onclick` and event delegation | `console.log` (invisible — bridge to Java) |
| `getElementById`, `textContent` | External `.css`/`.js` files (JAR path issues) |

**Do**: inline all resources, use event delegation, bridge logs via `window.javaBridge`
**Don't**: use `eval()`, `innerHTML` with user input, `new Function()`, synchronous XHR

---

## Git Conventions

```
Branch: feature/xxx | bugfix/xxx | refactor/xxx | docs/xxx
Commit: <type>(<scope>): <subject>
Types: feat, fix, docs, refactor, test, chore
```

---

## Reference Documents

| Document | Path | When to read |
|----------|------|-------------|
| Full architecture design | `docs/CC_Assistant_Technical_Architecture.md` | Before major changes |
| UI design spec | `docs/ui.md` | Before UI work |
| Milestone plan & tasks | `docs/plan/README.md` | Before starting a milestone |
| Frontend component spec | `docs/plan/frontend/components-spec.md` | Before frontend work |
| API design | `docs/API_Design.md` | Before adding endpoints |
| JCEF constraints | `docs/JCEF_Constraints_and_Best_Practices.md` | JCEF debugging |

---

*Last updated: 2026-04-17*
