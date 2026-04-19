## ADDED Requirements

### Requirement: Provider ENV key-based selective merge
When switching providers, the system SHALL only update the specified provider-related ENV keys while preserving all other existing ENV keys in `~/.claude/settings.json`.

The keys to be managed by provider switching are:
- `ANTHROPIC_BASE_URL`
- `ANTHROPIC_MODEL`
- `ANTHROPIC_SMALL_FAST_MODEL`
- `API_TIMEOUT_MS`
- `CLAUDE_CODE_MAX_OUTPUT_TOKENS`
- `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`
- `ANTHROPIC_DEFAULT_SONNET_MODEL`
- `ANTHROPIC_DEFAULT_OPUS_MODEL`
- `ANTHROPIC_DEFAULT_HAIKU_MODEL`

All other keys in `env` SHALL NOT be modified during provider switching.

#### Scenario: Switch provider with user custom ENV keys
- **GIVEN** existing settings.json has `ANTHROPIC_AUTH_TOKEN`, `CUSTOM_USER_KEY`, and `ANTHROPIC_MODEL=old-model`
- **WHEN** user switches to a provider with `ANTHROPIC_MODEL=new-model`
- **THEN** `ANTHROPIC_MODEL` is updated to `new-model`
- **AND** `ANTHROPIC_AUTH_TOKEN` is preserved unchanged
- **AND** `CUSTOM_USER_KEY` is preserved unchanged

#### Scenario: Switch to same provider configuration (no change)
- **GIVEN** existing settings.json has `ANTHROPIC_MODEL=same-model` for current provider
- **WHEN** user switches to a provider that would set `ANTHROPIC_MODEL=same-model`
- **THEN** settings.json is NOT written (no file IO occurs)

### Requirement: ANTHROPIC_AUTH_TOKEN is never overwritten
The system SHALL never overwrite the `ANTHROPIC_AUTH_TOKEN` value during provider switching, regardless of what value is in the provider template.

#### Scenario: Provider template contains placeholder API key
- **GIVEN** provider template has `ANTHROPIC_AUTH_TOKEN=placeholder`
- **AND** existing settings.json has `ANTHROPIC_AUTH_TOKEN=user-real-key`
- **WHEN** user switches to this provider
- **THEN** `ANTHROPIC_AUTH_TOKEN` remains `user-real-key`

### Requirement: ENV change detection before write
Before writing to settings.json, the system SHALL compare the resulting ENV with the existing ENV to determine if a write is necessary.

#### Scenario: Only provider keys differ
- **GIVEN** existing ENV has all provider keys matching except `ANTHROPIC_BASE_URL`
- **WHEN** switch provider updates only `ANTHROPIC_BASE_URL`
- **THEN** settings.json IS written (change detected)

#### Scenario: All provider keys already match
- **GIVEN** existing ENV has all provider keys already matching the target provider
- **WHEN** user switches to this provider
- **THEN** settings.json is NOT written (no change detected)

### Requirement: Provider template supports extended fields
Provider resource templates SHALL support the following optional fields when present:
- `API_TIMEOUT_MS`
- `CLAUDE_CODE_MAX_OUTPUT_TOKENS`
- `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`
- `ANTHROPIC_DEFAULT_SONNET_MODEL`
- `ANTHROPIC_DEFAULT_OPUS_MODEL`
- `ANTHROPIC_DEFAULT_HAIKU_MODEL`

#### Scenario: Provider template with extended fields
- **GIVEN** provider template includes `ANTHROPIC_DEFAULT_SONNET_MODEL` and `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`
- **WHEN** user switches to this provider
- **THEN** these fields are merged into the existing ENV
