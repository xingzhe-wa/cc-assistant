## ADDED Requirements

### Requirement: Thinking content rendered in ThinkingBlock component
Thinking delta content SHALL be rendered using the `ThinkingBlock` component, visually distinct from regular assistant text, with expand/collapse capability.

#### Scenario: Thinking delta received during streaming
- **WHEN** CLI outputs `thinking_delta` with content "Analyzing code structure..."
- **THEN** the content appears inside a `ThinkingBlock` component
- **AND** the thinking block is visually distinct from regular text (collapsed by default)

### Requirement: Tool use displayed as status indicator
Tool use events SHALL be displayed as a status indicator showing the tool name, not mixed into the streaming text content.

#### Scenario: ToolUseStart received during streaming
- **WHEN** CLI outputs `tool_use` event with name "Read"
- **THEN** a status indicator shows "Using Read..." in the message area
- **AND** the tool name is NOT appended to the streaming text content

### Requirement: Streaming role information preserved through JCEF bridge
`JcefChatPanel.appendStreamingContent()` SHALL pass the `role` parameter to the frontend in a way that `useJcefEvents` can distinguish between "assistant", "thinking", and "tool" content.

#### Scenario: Thinking role forwarded to frontend
- **WHEN** `appendStreamingContent("thinking", "...", msgId)` is called
- **THEN** the `cc-stream` event includes `role: "thinking"` in its detail
- **AND** `useJcefEvents` stores thinking content separately from assistant text
