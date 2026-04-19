## ADDED Requirements

### Requirement: Agent create writes to filesystem
When a user creates a new Agent in the settings UI, the system SHALL create a Markdown file at `~/.claude/agents/<id>.md` with YAML frontmatter.

#### Scenario: Create new agent
- **WHEN** user fills in agent name, description, systemPrompt and clicks "Save"
- **THEN** a file is created at `~/.claude/agents/<id>.md` containing YAML frontmatter and markdown body

#### Scenario: Agent file format
- **WHEN** an agent with name="code-reviewer" and description="Code review specialist" is created
- **THEN** the file contains:
```
---
name: code-reviewer
---
# Code Reviewer

Code review specialist. ...
```

### Requirement: Agent update modifies filesystem
When a user updates an existing Agent, the system SHALL update the corresponding Markdown file.

#### Scenario: Update agent description
- **WHEN** user changes the description of an existing agent
- **THEN** the `~/.claude/agents/<id>.md` file is updated with the new content

### Requirement: Agent delete removes filesystem file
When a user deletes an Agent, the system SHALL delete the corresponding Markdown file.

#### Scenario: Delete existing agent
- **WHEN** user deletes an agent with id "my-agent"
- **THEN** the file `~/.claude/agents/my-agent.md` is deleted from disk

### Requirement: Java handles agent CRUD actions
The Java `handleJSMessage` SHALL handle `agentCreate`, `agentUpdate`, and `agentDelete` actions.

#### Scenario: agentCreate handled
- **WHEN** frontend sends `agentCreate:{...}` via cefQuery
- **THEN** Java calls `onAgentCreate?.invoke(map)` callback which writes to filesystem

#### Scenario: agentUpdate handled
- **WHEN** frontend sends `agentUpdate:{...}` via cefQuery
- **THEN** Java calls `onAgentUpdate?.invoke(map)` callback

#### Scenario: agentDelete handled
- **WHEN** frontend sends `agentDelete:agentId` via cefQuery
- **THEN** Java calls `onAgentDelete?.invoke(id)` callback

### Requirement: scanAgents reads from filesystem
The SkillAgentService.scanAgents() SHALL read existing agents from `~/.claude/agents/` directory on disk.

#### Scenario: Load agents from disk
- **WHEN** `~/.claude/agents/` contains agent markdown files
- **THEN** scanAgents() returns a list of AgentConfig parsed from these files
