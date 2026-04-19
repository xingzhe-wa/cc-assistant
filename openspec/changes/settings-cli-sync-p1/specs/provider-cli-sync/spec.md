## ADDED Requirements

### Requirement: Provider create persists to settings.json
When a user creates a new Provider in the settings UI, the system SHALL write the provider configuration to `~/.claude/settings.json` in the `env` field.

#### Scenario: Create a new provider
- **WHEN** user fills in provider name, baseUrl, apiKey, and clicks "Save"
- **THEN** a new entry is added to `~/.claude/settings.json`'s `env` field with `ANTHROPIC_BASE_URL` and `ANTHROPIC_AUTH_TOKEN`

#### Scenario: Provider with custom model
- **WHEN** user creates a provider with a custom model mapping (default/opus/max)
- **THEN** the model mapping is stored in the provider config (not directly in env; env uses `ANTHROPIC_MODEL` as fallback)

### Requirement: Provider update persists to settings.json
When a user updates an existing Provider, the system SHALL update the corresponding entry in `~/.claude/settings.json`.

#### Scenario: Update provider API key
- **WHEN** user changes the API key for an existing provider
- **THEN** `~/.claude/settings.json`'s `env.ANTHROPIC_AUTH_TOKEN` is updated

### Requirement: Provider delete removes from settings.json
When a user deletes a Provider, the system SHALL remove its configuration from `~/.claude/settings.json`.

#### Scenario: Delete non-active provider
- **WHEN** user deletes a provider that is not currently active
- **THEN** the provider config is removed from `~/.claude/settings.json`

### Requirement: Provider switch updates env
When a user switches the active Provider, the system SHALL update `~/.claude/settings.json` so the next CLI invocation uses the new configuration.

#### Scenario: Switch to a different provider
- **WHEN** user selects a different provider from the dropdown and sends a message
- **THEN** `~/.claude/settings.json` is updated with the new provider's `ANTHROPIC_BASE_URL` and `ANTHROPIC_AUTH_TOKEN`
- **AND** the CLI process uses the new environment variables

### Requirement: Frontend action names align with Java handlers
The Java `handleJSMessage` SHALL handle `providerCreate`, `providerUpdate`, and `providerDelete` actions sent by the frontend.

#### Scenario: providerCreate handled
- **WHEN** frontend sends `providerCreate:{...}` via cefQuery
- **THEN** Java calls `onProviderCreate?.invoke(map)` callback

#### Scenario: providerUpdate handled
- **WHEN** frontend sends `providerUpdate:{...}` via cefQuery
- **THEN** Java calls `onProviderUpdate?.invoke(map)` callback

#### Scenario: providerDelete handled
- **WHEN** frontend sends `providerDelete:providerId` via cefQuery
- **THEN** Java calls `onProviderDelete?.invoke(id)` callback

### Requirement: settings.json merge is non-destructive
When updating the env field, the system SHALL perform a deep merge, preserving other top-level fields (permissions, hooks, etc.).

#### Scenario: Preserve existing settings fields
- **WHEN** `~/.claude/settings.json` contains `{"permissions": {...}}` and user creates a provider
- **THEN** the `permissions` field is preserved after the update
