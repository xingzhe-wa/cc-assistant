## Why

The frontend and backend are unable to communicate properly - the plugin cannot establish a connection with Claude Code CLI. Three root causes have been identified: (1) mock data pollution preventing real backend data from flowing to the frontend, (2) the CLI bridge architecture does not follow the terminal-driven philosophy defined in `cli-ui-codeBuddy.md`, and (3) the provider configuration JSON structure is fundamentally broken and cannot correctly override `~/.claude/settings.json`.

## What Changes

1. **Clean up mock data**: Remove `mockProviders`, `mockSessions`, and related mock data from frontend stores. Frontend must use real data from Java backend via JCEF bridge.

2. **Align CLI bridge with terminal-driven architecture**: Refactor `CliBridgeService` to properly follow the PTY-based approach from `cli-ui-codeBuddy.md` - using environment variable injection for provider switching instead of incorrect JSON structure overlays.

3. **Fix provider config structure**: The current `ProviderConfig` JSON structure is fundamentally wrong. It uses `{provider: {name, url, apiKey, models: {default, opus, max}}}` but the correct Claude Code `settings.json` format uses `{env: {ANTHROPIC_BASE_URL, ANTHROPIC_MODEL, ...}}`. Provider switching must use env vars at spawn time, not file overlays.

4. **Clean up `CCProviders` data flow**: Frontend must receive real provider list from backend instead of using hardcoded `mockProviders`.

## Capabilities

### New Capabilities
- `provider-config-via-env`: Provider switching via environment variables at CLI spawn time, matching Claude Code's native behavior. Provider config contains `endpoint` and `model` that map to `ANTHROPIC_BASE_URL` and `ANTHROPIC_MODEL` env vars.
- `mock-data-cleanup`: Complete removal of mock data from frontend stores, chat components, and providers list. Frontend only renders data received from Java backend via JCEF `CCProviders.setData()`.

### Modified Capabilities
- `cli-bridge-service`: The CLI bridge currently uses `-p "prompt" --output-format stream-json` mode. Per `cli-ui-codeBuddy.md`, this should be refactored to properly handle PTY-based interactive sessions where the GUI acts as a terminal emulator, not a JSON parser.

## Impact

**Affected files:**
- `frontend/src/mock.ts` - Remove mock providers, sessions
- `frontend/src/stores/chatStore.ts` - Use real backend data instead of mockSessions
- `frontend/src/types/mock.ts` - May need cleanup of unused types
- `src/main/kotlin/.../model/Provider.kt` - ProviderService needs to provide real provider data to frontend
- `src/main/kotlin/.../bridge/CliBridgeService.kt` - Environment variable injection for provider switching
- `src/main/kotlin/.../ui/chat/ReactChatPanel.kt` - CCProviders.setData() must receive real providers
- `src/main/resources/providers/settings-*.json` - Provider template JSONs use correct `env` structure already, but switching logic needs to respect this
