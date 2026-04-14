package com.github.xingzhewa.ccassistant.bridge

/**
 * CLI 消息类型 - Claude Code CLI stream-json 输出的类型化表示
 *
 * Claude Code CLI 使用 `--output-format stream-json` 输出 NDJSON:
 * - stream_event: 流式增量 (text_delta, thinking_delta, tool_use)
 * - assistant: 完整助手消息 (配合 --include-partial-messages)
 * - result: 最终结果 (含 cost, session_id)
 */
sealed class CliMessage {

    /**
     * 流式文本增量
     * 对应 stream-json: {"type":"stream_event","event":{"type":"content_block_delta","delta":{"type":"text_delta","text":"..."}}}
     */
    data class TextDelta(val text: String) : CliMessage()

    /**
     * 思考内容增量
     * 对应 stream-json: {"type":"stream_event","event":{"type":"content_block_delta","delta":{"type":"thinking_delta","thinking":"..."}}}
     */
    data class ThinkingDelta(val text: String) : CliMessage()

    /**
     * 工具调用开始
     * 对应 stream-json: {"type":"stream_event","event":{"type":"content_block_start","content_block":{"type":"tool_use","name":"Read","id":"..."}}}
     */
    data class ToolUseStart(val name: String, val id: String) : CliMessage()

    /**
     * 工具调用输入增量
     */
    data class ToolUseInputDelta(val id: String, val partialJson: String) : CliMessage()

    /**
     * 完整助手消息 (配合 --include-partial-messages)
     * 对应: {"type":"assistant","message":{"content":[{"type":"text","text":"..."}]}}
     */
    data class AssistantMessage(val text: String) : CliMessage()

    /**
     * 最终结果
     * 对应: {"type":"result","result":"...","cost_usd":0.003,"session_id":"abc123"}
     */
    data class Result(
        val content: String,
        val costUsd: Double,
        val sessionId: String,
        val isError: Boolean
    ) : CliMessage()

    /**
     * 错误消息
     */
    data class Error(val message: String) : CliMessage()

    /**
     * 未识别的消息
     */
    data class Unknown(val raw: String) : CliMessage()
}
