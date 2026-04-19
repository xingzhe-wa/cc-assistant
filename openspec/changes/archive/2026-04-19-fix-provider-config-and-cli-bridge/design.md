## Context

The CC Assistant plugin currently has three critical issues preventing frontend-backend communication:

1. **Mock data pollution**: `frontend/src/mock.ts` exports `mockProviders` and `mockSessions` which are used as initial state in `chatStore.ts`. The frontend never receives real provider data from Java backend - `CCProviders.setData()` is defined but never properly called with actual `PRESET_PROVIDERS`.

2. **Incorrect provider config structure**: The frontend `MockProvider` interface uses `{provider: {name, url, apiKey, models: {default, opus, max}}}`. But Claude Code's `~/.claude/settings.json` uses `{env: {ANTHROPIC_BASE_URL, ANTHROPIC_MODEL, ...}}`. The `ProviderService.switchProvider()` attempts to overlay env keys but the structure mismatch means it cannot correctly persist provider configuration.

3. **CLI bridge not following terminal-driven philosophy**: Per `cli-ui-codeBuddy.md`, the GUI should be an "exoskeleton" for Claude Code CLI using PTY-based interaction. Currently uses `-p "prompt" --output-format stream-json` which is single-prompt mode, not interactive PTY.

**Stakeholders**: CC Assistant users who need working provider switching and CLI communication.

## Goals / Non-Goals

**Goals:**
- Remove all mock data from frontend, ensure real backend data flows through JCEF bridge
- Fix provider configuration to use correct env-based structure for Claude Code settings
- Ensure CLI bridge can spawn processes with correct env vars for provider switching
- Clean `CCProviders.setData()` integration so frontend receives actual `PRESET_PROVIDERS`

**Non-Goals:**
- Not implementing full PTY/terminal emulation (xterm.js) - that is a future enhancement
- Not changing the existing `CliBridgeService.executePrompt()` API signature
- Not modifying the existing NDJSON streaming parser (it works correctly)

## Decisions

### Decision 1: Frontend mock data cleanup
**Choice**: Remove `mockProviders` and `mockSessions` from `chatStore.ts` initial state. Frontend must initialize with empty data and wait for Java backend to push via `CCProviders.setData()`.

**Rationale**: The `jcef-integration.ts` correctly defines `CCProviders.setData()` which dispatches a custom event. But `chatStore.ts` ignores this and uses `mockSessions` as initial state. The fix is to make the store use real data.

**Alternative considered**: Keep mock data as fallback. Rejected - it masks real integration issues.

### Decision 2: Provider config structure alignment
**Choice**: `ProviderConfig` keeps its current fields (`id`, `name`, `endpoint`, `defaultModel`, `fastModel`) but `switchProvider()` must correctly map these to `ANTHROPIC_BASE_URL` and `ANTHROPIC_MODEL` env vars when spawning the CLI process.

**Rationale**: Claude Code reads `~/.claude/settings.json` for persistent config, but also respects environment variables at spawn time. Provider switching should:
1. Set env vars on `ProcessBuilder` (not try to overlay settings.json)
2. Keep `ANTHROPIC_AUTH_TOKEN` in settings.json (managed by CLI itself)
3. The `PRESET_PROVIDERS` list already has correct `endpoint` and `defaultModel` fields

**Alternative considered**: Try to overlay settings.json. Rejected - too fragile, causes race conditions with CLI's own writes.

### Decision 3: CLI spawn env injection
**Choice**: `CliBridgeService.executePrompt()` already accepts optional parameters. Add `envVars: Map<String, String>?` parameter that gets merged into `ProcessBuilder.environment()`.

**Rationale**: Current `switchProvider()` in `ProviderService` tries to modify `settings.json`. Instead, provider switching should set env vars at spawn time. This is how `cli-ui-codeBuddy.md` describes it: "Supplier switching → Environment variable injection → Not modifying files".

**Alternative considered**: Modify settings.json before spawn. Rejected - causes file contention with CLI's own config management.

## Risks / Trade-offs

- [Risk] Frontend may flash empty state briefly while waiting for backend data → [Mitigation] Add loading state, ensure `pushProvidersToFrontend()` is called in `onPageLoaded` callback
- [Risk] `ANTHROPIC_AUTH_TOKEN` must be preserved when switching providers → [Mitigation] Token is stored in settings.json (not env), so env-only changes don't affect it
- [Risk] Existing provider template JSONs in `resources/providers/` may be unused → [Mitigation] Remove or mark as deprecated, since provider switching now uses env vars not template files

## Open Questions

1. Should `settings-*.json` provider template files in `resources/providers/` be removed since they're not used?
2. Should `ProviderService.PRESET_PROVIDERS` be dynamically loaded from `resources/providers/` instead of hardcoded?
