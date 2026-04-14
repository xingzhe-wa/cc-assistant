package com.github.xingzhewa.ccassistant.bridge

import org.junit.Test

/**
 * NDJSON 解析器单元测试
 *
 * 验证各种 Claude Code CLI stream-json 输出格式的解析正确性。
 */
class NdjsonParserTest {

    private val parser = NdjsonParser()

    // ========== 空行 / 无效输入 ==========

    @Test
    fun testEmptyLineReturnsEmpty() {
        val messages = parser.parseLine("")
        assert(messages.isEmpty()) { "Expected empty list for empty line" }
    }

    @Test
    fun testBlankLineReturnsEmpty() {
        val messages = parser.parseLine("   ")
        assert(messages.isEmpty()) { "Expected empty list for blank line" }
    }

    @Test
    fun testInvalidJsonReturnsUnknown() {
        val messages = parser.parseLine("not json at all")
        assert(messages.size == 1) { "Expected 1 message" }
        assert(messages[0] is CliMessage.Unknown) { "Expected Unknown message" }
    }

    // ========== stream_event: text_delta ==========

    @Test
    fun testTextDelta() {
        val line = """{"type":"stream_event","event":{"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hello"}}}"""
        val messages = parser.parseLine(line)
        assert(messages.size == 1) { "Expected 1 message" }
        val msg = messages[0] as CliMessage.TextDelta
        assert(msg.text == "Hello") { "Expected 'Hello', got '${msg.text}'" }
    }

    @Test
    fun testTextDeltaJapanese() {
        val line = """{"type":"stream_event","event":{"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"容を"}}}"""
        val messages = parser.parseLine(line)
        assert(messages.size == 1) { "Expected 1 message" }
        val msg = messages[0] as CliMessage.TextDelta
        assert(msg.text == "容を") { "Expected '容を', got '${msg.text}'" }
    }

    @Test
    fun testTextDeltaEmpty() {
        val line = """{"type":"stream_event","event":{"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":""}}}"""
        val messages = parser.parseLine(line)
        assert(messages.isEmpty()) { "Expected empty list for empty text delta" }
    }

    // ========== stream_event: thinking_delta ==========

    @Test
    fun testThinkingDelta() {
        val line = """{"type":"stream_event","event":{"type":"content_block_delta","index":0,"delta":{"type":"thinking_delta","thinking":"Let me think..."}}}"""
        val messages = parser.parseLine(line)
        assert(messages.size == 1) { "Expected 1 message" }
        val msg = messages[0] as CliMessage.ThinkingDelta
        assert(msg.text == "Let me think...") { "Expected thinking text" }
    }

    // ========== stream_event: tool_use ==========

    @Test
    fun testToolUseStart() {
        val line = """{"type":"stream_event","event":{"type":"content_block_start","index":1,"content_block":{"type":"tool_use","id":"toolu_01","name":"Read"}}}"""
        val messages = parser.parseLine(line)
        assert(messages.size == 1) { "Expected 1 message" }
        val msg = messages[0] as CliMessage.ToolUseStart
        assert(msg.name == "Read") { "Expected tool name 'Read'" }
        assert(msg.id == "toolu_01") { "Expected tool id 'toolu_01'" }
    }

    @Test
    fun testToolUseInputDelta() {
        val line = """{"type":"stream_event","event":{"type":"content_block_delta","index":1,"delta":{"type":"input_json_delta","partial_json":"{\"file_path\":\"src/"}}}"""
        val messages = parser.parseLine(line)
        assert(messages.size == 1) { "Expected 1 message" }
        val msg = messages[0] as CliMessage.ToolUseInputDelta
        assert(msg.partialJson.contains("file_path")) { "Expected partial JSON with file_path" }
    }

    // ========== result ==========

    @Test
    fun testResultMessage() {
        val line = """{"type":"result","subtype":"success","cost_usd":0.003,"is_error":false,"result":"Hello! How can I help?","session_id":"sess_abc123","total_cost_usd":0.003}"""
        val messages = parser.parseLine(line)
        assert(messages.size == 1) { "Expected 1 message" }
        val msg = messages[0] as CliMessage.Result
        assert(msg.content == "Hello! How can I help?") { "Expected result content" }
        assert(msg.costUsd == 0.003) { "Expected cost 0.003" }
        assert(msg.sessionId == "sess_abc123") { "Expected session ID" }
        assert(!msg.isError) { "Expected no error" }
    }

    @Test
    fun testResultError() {
        val line = """{"type":"result","subtype":"error","cost_usd":0.0,"is_error":true,"result":"API error","session_id":""}"""
        val messages = parser.parseLine(line)
        assert(messages.size == 1) { "Expected 1 message" }
        val msg = messages[0] as CliMessage.Result
        assert(msg.isError) { "Expected error flag" }
        assert(msg.content == "API error") { "Expected error content" }
    }

    // ========== assistant (partial messages) ==========

    @Test
    fun testAssistantMessage() {
        val line = """{"type":"assistant","message":{"id":"msg_01","type":"message","role":"assistant","content":[{"type":"text","text":"Hello World"}],"model":"claude-sonnet-4-20250514","stop_reason":null}}"""
        val messages = parser.parseLine(line)
        assert(messages.size == 1) { "Expected 1 message" }
        val msg = messages[0] as CliMessage.AssistantMessage
        assert(msg.text == "Hello World") { "Expected 'Hello World'" }
    }

    @Test
    fun testAssistantMessageMultipleContentBlocks() {
        val line = """{"type":"assistant","message":{"content":[{"type":"text","text":"Part 1 "},{"type":"text","text":"Part 2"}]}}"""
        val messages = parser.parseLine(line)
        assert(messages.size == 1) { "Expected 1 message" }
        val msg = messages[0] as CliMessage.AssistantMessage
        assert(msg.text == "Part 1 Part 2") { "Expected concatenated text" }
    }

    // ========== error ==========

    @Test
    fun testErrorMessage() {
        val line = """{"type":"error","error":"Rate limit exceeded"}"""
        val messages = parser.parseLine(line)
        assert(messages.size == 1) { "Expected 1 message" }
        val msg = messages[0] as CliMessage.Error
        assert(msg.message == "Rate limit exceeded") { "Expected error message" }
    }

    // ========== unknown ==========

    @Test
    fun testUnknownType() {
        val line = """{"type":"some_new_type","data":"whatever"}"""
        val messages = parser.parseLine(line)
        assert(messages.size == 1) { "Expected 1 message" }
        assert(messages[0] is CliMessage.Unknown) { "Expected Unknown for unrecognized type" }
    }

    @Test
    fun testMissingType() {
        val line = """{"data":"no type field"}"""
        val messages = parser.parseLine(line)
        assert(messages.size == 1) { "Expected 1 message" }
        assert(messages[0] is CliMessage.Unknown) { "Expected Unknown for missing type" }
    }

    // ========== 多行连续解析 ==========

    @Test
    fun testMultipleLines() {
        val lines = listOf(
            """{"type":"stream_event","event":{"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hello "}}}""",
            """{"type":"stream_event","event":{"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"World!"}}}""",
            """{"type":"result","subtype":"success","cost_usd":0.001,"is_error":false,"result":"Hello World!","session_id":"sess_1"}"""
        )

        val allText = StringBuilder()
        var resultReceived = false

        for (line in lines) {
            val messages = parser.parseLine(line)
            for (msg in messages) {
                when (msg) {
                    is CliMessage.TextDelta -> allText.append(msg.text)
                    is CliMessage.Result -> resultReceived = true
                    else -> {}
                }
            }
        }

        assert(allText.toString() == "Hello World!") { "Expected 'Hello World!', got '${allText}'" }
        assert(resultReceived) { "Expected result message" }
    }
}
