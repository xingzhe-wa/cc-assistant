## ADDED Requirements

### Requirement: Provider switching via environment variables

When a user switches the active provider in the UI, the plugin SHALL inject the provider's `endpoint` and `defaultModel` as environment variables (`ANTHROPIC_BASE_URL` and `ANTHROPIC_MODEL`) into the CLI process at spawn time. The plugin SHALL NOT modify `~/.claude/settings.json` for provider switching.

#### Scenario: Switch to DeepSeek provider
- **WHEN** user selects "DeepSeek" from provider dropdown
- **THEN** the next CLI process spawn SHALL include env vars `ANTHROPIC_BASE_URL=https://api.deepseek.com/anthropic` and `ANTHROPIC_MODEL=deepseek-reasoner`
- **AND** `~/.claude/settings.json` SHALL NOT be modified

#### Scenario: Provider API key is preserved
- **WHEN** provider is switched
- **THEN** any existing `ANTHROPIC_AUTH_TOKEN` in `~/.claude/settings.json` SHALL be preserved (not overwritten by env)

#### Scenario: Default provider on startup
- **WHEN** the plugin starts and no explicit provider is set
- **THEN** the default provider SHALL be "claude" with `ANTHROPIC_BASE_URL=https://api.anthropic.com`

### Requirement: Provider data flow from backend to frontend

The Java backend SHALL provide the list of available providers to the frontend via `CCProviders.setData()`. The frontend SHALL use this data to populate the provider dropdown, NOT hardcoded mock data.

#### Scenario: Frontend receives provider list on load
- **WHEN** the JCEF page loads and `onPageLoaded` fires
- **THEN** `ReactChatPanel.pushProvidersToFrontend()` SHALL be called
- **AND** `CCProviders.setData()` SHALL receive `ProviderService.PRESET_PROVIDERS` converted to frontend format

#### Scenario: Provider list updates when changed
- **WHEN** user creates a new provider in settings
- **THEN** `CCProviders.setData()` SHALL be called again with the updated provider list
