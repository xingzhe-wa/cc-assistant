## ADDED Requirements

### Requirement: User message not duplicated
User messages SHALL appear exactly once in the chat UI. The Java layer SHALL NOT call `appendUserMessage()` for messages already added by the frontend.

#### Scenario: User sends a message
- **WHEN** user types "hello" and clicks send
- **THEN** the message "hello" appears exactly once in the chat UI
- **AND** the message is NOT duplicated

### Requirement: CLI error messages displayed to user
`CliMessage.Error` messages SHALL be displayed as toast notifications or inline error messages in the frontend UI, not just logged.

#### Scenario: CLI returns an error
- **WHEN** CLI process outputs `{"type":"error","message":"API key invalid"}`
- **THEN** a toast notification appears showing "API key invalid"
- **AND** streaming state is stopped

#### Scenario: CLI process crashes
- **WHEN** CLI process terminates unexpectedly
- **THEN** a toast notification appears showing "CLI process ended unexpectedly"
- **AND** streaming state is stopped

### Requirement: Stop generation connected to CLI interrupt
The "Stop Generation" button SHALL interrupt the running CLI process. The frontend `stopGeneration` action SHALL trigger `CliBridgeService.interrupt()`.

#### Scenario: User clicks stop during generation
- **WHEN** user clicks the stop button while CLI is generating
- **THEN** `CliBridgeService.interrupt()` is called
- **AND** the CLI process is terminated
- **AND** streaming state is stopped in the UI

### Requirement: JcefChatPanel handles stopGeneration action
`JcefChatPanel.handleJSMessage()` SHALL handle the `stopGeneration` action and invoke an `onStopGeneration` callback.

#### Scenario: stopGeneration message received
- **WHEN** Java receives `stopGeneration:` message from JS
- **THEN** `onStopGeneration?.invoke()` is called
