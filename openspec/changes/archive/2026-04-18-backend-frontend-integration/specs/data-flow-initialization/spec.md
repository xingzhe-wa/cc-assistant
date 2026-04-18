## ADDED Requirements

### Requirement: Backend shall push complete configuration to frontend on startup

The system SHALL push complete configuration data (providers, models, agents, skills) from backend to frontend when the JCEF chat panel is loaded.

#### Scenario: Initial data push on startup
- **WHEN** ReactChatPanel finishes loading HTML content
- **THEN** backend SHALL call `jcefPanel.setProviders(providers, models, agents, skills)`
- **AND** CCProviders.setData SHALL dispatch 'cc-providers' event with all data

### Requirement: Provider change shall be synchronized to backend

When user selects a different Provider in the chat UI, the selection SHALL be synchronized to backend.

#### Scenario: User switches provider
- **WHEN** user selects a different Provider from the dropdown
- **THEN** JavaScript SHALL call `jcefBridge.providerChange(providerId)`
- **AND** Java backend SHALL receive the providerChange action
- **AND** ProviderService.switchProvider SHALL be called
- **AND** ~/.claude/settings.json SHALL be updated

### Requirement: Model change shall be synchronized to backend

When user selects a different Model, the selection SHALL be persisted to ConfigService.

#### Scenario: User switches model
- **WHEN** user selects a different Model from the dropdown
- **THEN** JavaScript SHALL call `jcefBridge.modelChange(modelId)`
- **AND** Java backend SHALL receive the modelChange action
- **AND** ConfigService.setCurrentModelId SHALL be called

### Requirement: Agent change shall be synchronized to backend

When user selects a different Agent, the selection SHALL be persisted.

#### Scenario: User switches agent
- **WHEN** user selects a different Agent from the dropdown
- **THEN** JavaScript SHALL call `jcefBridge.agentChange(agentId)`
- **AND** Java backend SHALL receive the agentChange action
- **AND** ConfigService.setCurrentAgentId SHALL be called
