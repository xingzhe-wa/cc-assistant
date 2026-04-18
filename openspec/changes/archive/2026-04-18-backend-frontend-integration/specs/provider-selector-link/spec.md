## ADDED Requirements

### Requirement: Provider selector shall display all available providers

The Provider dropdown in chat UI SHALL display all providers loaded from backend.

#### Scenario: Provider selector populated on load
- **WHEN** frontend receives cc-providers event with provider data
- **THEN** Provider dropdown SHALL display all providers from the data
- **AND** current provider SHALL be pre-selected based on ConfigService state

### Requirement: Provider selector shall have "Configure New Provider" option

The Provider dropdown SHALL include a "Configure New Provider" option at the bottom that allows users to jump to Settings page.

#### Scenario: User clicks "Configure New Provider"
- **WHEN** user selects "Configure New Provider" from dropdown
- **THEN** JavaScript SHALL call `jcefBridge.openSettings('providers')`
- **AND** Java backend SHALL receive 'openSettings' action with tab='providers'
- **AND** Settings page SHALL open with Providers tab active

### Requirement: Provider selector shall show current provider name

The Provider dropdown SHALL show a human-readable name for the currently selected provider.

#### Scenario: Display current provider name
- **WHEN** Provider dropdown is rendered
- **THEN** it SHALL display provider.name from the provider config
- **AND** NOT display the internal provider.id
