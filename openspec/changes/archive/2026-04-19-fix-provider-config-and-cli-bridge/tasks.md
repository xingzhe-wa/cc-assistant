## 1. Frontend Mock Data Cleanup

- [x] 1.1 Remove `mockSessions` and `mockDiffFiles` imports from `frontend/src/stores/chatStore.ts`, initialize with empty arrays
- [x] 1.2 Remove `mockProviders` and related mock agent imports from `frontend/src/types/mock.ts` or mark as deprecated
- [x] 1.3 Remove mock data initialization from `frontend/src/stores/chatStoreExtensions.ts` if present
- [x] 1.4 Ensure `CCProviders.setData()` is properly hooked up to store's provider state in `App.tsx`
- [x] 1.5 Verify `jcef-integration.ts` `CCProviders.setData()` custom event is being listened to and updates store

## 2. Backend Provider Data Push Fix

- [x] 2.1 Verify `ReactChatPanel.pushProvidersToFrontend()` correctly maps `PRESET_PROVIDERS` to `JcefChatPanel.ProviderData`
- [x] 2.2 Verify `PRESET_MODELS` is correctly mapped to `ModelData` in `pushProvidersToFrontend()`
- [x] 2.3 Add null-safe handling in `pushProvidersToFrontend()` if `PRESET_PROVIDERS` is empty
- [x] 2.4 Ensure `onPageLoaded` callback properly gates `pushProvidersToFrontend()` to prevent double-push

## 3. Provider Config via Env Vars (CLI Bridge)

- [x] 3.1 Add `envVars: Map<String, String>?` parameter to `CliBridgeService.executePrompt()`
- [x] 3.2 Modify `ProcessBuilder` in `executePrompt()` to merge `envVars` into process environment
- [x] 3.3 Update `ReactChatPanel.handleSendMessage()` to pass current provider's `endpoint` and `model` as env vars
- [x] 3.4 Add `getProviderEnvVars(providerId: String): Map<String, String>` helper to `ProviderService`
- [x] 3.5 Ensure `ANTHROPIC_AUTH_TOKEN` is NOT passed as env var (kept in settings.json only)

## 4. Remove settings.json Overlay Logic (ProviderService)

- [x] 4.1 Deprecate `ProviderService.switchProvider()` file-overlay behavior - it should NOT modify `~/.claude/settings.json`
- [x] 4.2 Remove `loadProviderEnv()` and `mergeWithTemplate()` methods that try to overlay settings.json
- [x] 4.3 Keep `getEnv()` and `getEnv(key)` for reading current settings, but remove write on provider switch
- [x] 4.4 Add `saveProvider()` method for explicit user-saved provider config (different use case)

## 5. Testing and Verification

- [x] 5.1 Run `./gradlew test` to ensure no tests are broken ✓ BUILD SUCCESSFUL
- [ ] 5.2 Verify frontend loads without mock data - check console for any mock data references
- [ ] 5.3 Verify provider dropdown shows correct providers from `PRESET_PROVIDERS` after JCEF load
- [ ] 5.4 Test provider switch - verify env vars are correctly passed to CLI process (log inspection)
