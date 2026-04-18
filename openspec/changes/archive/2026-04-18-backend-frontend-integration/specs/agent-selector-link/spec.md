## ADDED Requirements

### Requirement: Agent selector shall display all available agents

The Agent dropdown in chat UI SHALL display all agents loaded from backend.

#### Scenario: Agent selector populated on load
- **WHEN** frontend receives cc-agents event with agent data
- **THEN** Agent dropdown SHALL display all agents from the data
- **AND** current agent SHALL be pre-selected based on ConfigService state

### Requirement: Agent selector shall have "Configure New Agent" option

The Agent dropdown SHALL include a "Configure New Agent" option at the bottom that allows users to jump to Settings page.

#### Scenario: User clicks "Configure New Agent"
- **WHEN** user selects "Configure New Agent" from dropdown
- **THEN** JavaScript SHALL call `jcefBridge.openSettings('agents')`
- **AND** Java backend SHALL receive 'openSettings' action with tab='agents'
- **AND** Settings page SHALL open with Agents tab active

### Requirement: Agent selector shall show agent name and description

The Agent dropdown SHALL show both name and description for each agent option.

#### Scenario: Display agent options with details
- **WHEN** Agent dropdown is rendered
- **THEN** each option SHALL display agent.name
- **AND** tooltip SHALL show agent.description
