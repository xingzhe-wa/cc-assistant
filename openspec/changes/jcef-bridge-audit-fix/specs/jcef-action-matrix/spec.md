## ADDED Requirements

### Requirement: Provider Switch End-to-End
The system SHALL allow the user to switch providers through the UI, which triggers a chain of events updating `~/.claude/settings.json`.

#### Scenario: Provider switch via UI
- **WHEN** user selects a different provider in the UI dropdown
- **THEN** `dataService.switchProvider(providerId)` is called
- **AND** `cefQuery.inject('providerChange:' + providerId)` sends the message to Java
- **AND** `handleJSMessage('providerChange:' + providerId)` receives and parses the message
- **AND** `onProviderChange?.invoke(providerId)` is called
- **AND** `ProviderService.switchProvider(providerId)` updates `settings.json`
- **AND** The `ANTHROPIC_AUTH_TOKEN` and other user custom keys are preserved

#### Scenario: Provider switch with unchanged env
- **GIVEN** current `settings.json` has same provider env keys as target provider
- **WHEN** user switches to that provider
- **THEN** `needsEnvUpdate()` returns `false`
- **AND** `settings.json` is NOT written (skipped)
- **AND** `_activeProviderId` is still updated

### Requirement: Provider CRUD End-to-End
The system SHALL allow creating, updating, and deleting providers through the UI.

#### Scenario: Create custom provider
- **WHEN** user creates a new provider with endpoint and API key
- **THEN** `dataService.createProvider(providerData)` sends `providerCreate:{...}` to Java
- **AND** `onProviderCreate?.invoke(data)` is called in ReactChatPanel
- **AND** `ProviderService.saveProvider()` writes to `settings.json`

#### Scenario: Update existing provider
- **WHEN** user updates provider configuration
- **THEN** `dataService.updateProvider(providerData)` sends `providerUpdate:{...}` to Java
- **AND** `onProviderUpdate?.invoke(data)` is called
- **AND** `ProviderService.saveProvider()` updates `settings.json`

#### Scenario: Delete provider
- **WHEN** user deletes a provider
- **THEN** `dataService.deleteProvider(providerId)` sends `providerDelete:providerId` to Java
- **AND** `onProviderDelete?.invoke(providerId)` is called

### Requirement: Agent CRUD End-to-End
The system SHALL allow creating, updating, and deleting agents.

#### Scenario: Create agent
- **WHEN** user creates a new agent
- **THEN** `dataService.createAgent(agentData)` sends `agentCreate:{...}` to Java
- **AND** `onAgentCreate?.invoke(data)` is called
- **AND** `SkillAgentService.createAgent()` writes to `~/.claude/agents/<id>.md`

#### Scenario: Update agent
- **WHEN** user updates an agent
- **THEN** `dataService.updateAgent(agentData)` sends `agentUpdate:{...}` to Java
- **AND** `onAgentUpdate?.invoke(data)` is called
- **AND** `SkillAgentService.updateAgent()` updates the agent file

#### Scenario: Delete agent
- **WHEN** user deletes an agent
- **THEN** `dataService.deleteAgent(agentId)` sends `agentDelete:agentId` to Java
- **AND** `onAgentDelete?.invoke(agentId)` is called
- **AND** `SkillAgentService.deleteAgent()` removes the agent file

### Requirement: Skill CRUD End-to-End
The system SHALL allow creating, updating, and deleting skills.

#### Scenario: Create skill
- **WHEN** user creates a new skill
- **THEN** `dataService.createSkill(skillData)` sends `skillCreate:{...}` to Java
- **AND** `onSkillCreate?.invoke(data)` is called
- **AND** `SkillAgentService.createSkill()` writes to `~/.claude/skills/<id>/SKILL.md`

#### Scenario: Update skill
- **WHEN** user updates a skill
- **THEN** `dataService.updateSkill(skillData)` sends `skillUpdate:{...}` to Java
- **AND** `onSkillUpdate?.invoke(data)` is called
- **AND** `SkillAgentService.updateSkill()` updates the skill file

#### Scenario: Delete skill
- **WHEN** user deletes a skill
- **THEN** `dataService.deleteSkill(skillId)` sends `skillDelete:skillId` to Java
- **AND** `onSkillDelete?.invoke(skillId)` is called
- **AND** `SkillAgentService.deleteSkill()` removes the skill directory

### Requirement: Message Sending End-to-End
The system SHALL allow sending messages to Claude Code CLI.

#### Scenario: Send text message
- **WHEN** user types a message and presses send
- **THEN** `dataService.sendMessage(text, options)` sends `sendMessage:{...}` to Java
- **AND** `onSendMessage?.invoke(text, options)` is called
- **AND** `CliBridgeService.executePrompt()` starts CLI process

#### Scenario: Send message with agent
- **WHEN** user selects an agent and sends a message
- **THEN** `options.agent` contains the agent ID
- **AND** `CliBridgeService.executePrompt()` passes `--agent` flag to CLI

### Requirement: JCEF Bridge Logging
The system SHALL provide visible logging for debugging JS↔Java communication.

#### Scenario: Log all incoming JS messages
- **WHEN** Java receives a JS message via `handleJSMessage()`
- **THEN** `logger.info("JS message: $request")` outputs to IDE log
- **AND** the action and first 100 chars of data are visible

#### Scenario: Log all callback invocations
- **WHEN** a callback like `onProviderChange?.invoke(data)` is called
- **THEN** `logger.info("Provider change: $providerId")` outputs to IDE log

### Requirement: ENV Preservation
The system SHALL preserve user custom ENV keys when switching providers.

#### Scenario: Switching provider preserves custom keys
- **GIVEN** `settings.json` contains `CUSTOM_USER_KEY=custom-value`
- **WHEN** user switches provider
- **THEN** `CUSTOM_USER_KEY` is still present in `settings.json`
- **AND** only `PROVIDER_ENV_KEYS` whitelist keys are updated

#### Scenario: Switching provider preserves AUTH_TOKEN
- **GIVEN** `settings.json` contains `ANTHROPIC_AUTH_TOKEN=user-key`
- **WHEN** user switches provider
- **THEN** `ANTHROPIC_AUTH_TOKEN` is preserved (not from template)
