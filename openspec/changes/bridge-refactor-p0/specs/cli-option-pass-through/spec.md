## ADDED Requirements

### Requirement: executePrompt supports all UI options
`CliBridgeService.executePrompt()` SHALL accept and forward `mode`, `think`, `permissionMode` parameters to the CLI command, in addition to existing `model`, `agent`, `sessionId` parameters.

#### Scenario: Auto mode sends permission-mode accept-all
- **WHEN** user selects "auto" mode and sends a message
- **THEN** CLI command includes `--permission-mode accept-all`

#### Scenario: Plan mode omits permission-mode
- **WHEN** user selects "plan" mode and sends a message
- **THEN** CLI command does NOT include `--permission-mode` flag

#### Scenario: Agent parameter forwarded to CLI
- **WHEN** user selects an agent from the dropdown and sends a message
- **THEN** CLI command includes `--agent <agent-name>`

#### Scenario: Agent parameter omitted when default
- **WHEN** user selects "default" agent and sends a message
- **THEN** CLI command does NOT include `--agent` flag

### Requirement: ReactChatPanel forwards all MessageOptions to executePrompt
`ReactChatPanel.handleSendMessage()` SHALL pass `mode`, `agent`, and `think` from `MessageOptions` to `CliBridgeService.executePrompt()`.

#### Scenario: Mode passed through
- **WHEN** `MessageOptions.mode` is "auto"
- **THEN** `executePrompt` is called with `mode = "auto"` and `permissionMode = "accept-all"`

#### Scenario: Agent passed through
- **WHEN** `MessageOptions.agent` is "code-assistant"
- **THEN** `executePrompt` is called with `agent = "code-assistant"`

### Requirement: Frontend sends agent option
`jcefBridge.sendMessage()` SHALL include `agent` field in the options object sent to Java.

#### Scenario: Agent selection sent
- **WHEN** user selects agent "code-assistant" and sends a message
- **THEN** the JSON payload to Java includes `options.agent: "code-assistant"`

### Requirement: JcefChatPanel MessageOptions includes agent field
`JcefChatPanel.MessageOptions` data class SHALL include `agent: String?` field, and `SendOptions` parsing SHALL extract it.

#### Scenario: Agent extracted from sendMessage payload
- **WHEN** Java receives `sendMessage:{"text":"...","options":{"agent":"code-assistant",...}}`
- **THEN** `MessageOptions.agent` is "code-assistant"
