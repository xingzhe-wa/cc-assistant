package com.github.xingzhewa.ccassistant.bridge

import com.google.gson.Gson
import com.google.gson.JsonObject
import com.intellij.openapi.diagnostic.thisLogger

/**
 * NDJSON 解析器 - 解析 Claude Code CLI 的 stream-json 输出
 *
 * Claude Code CLI 使用 `--output-format stream-json` 输出 NDJSON 格式:
 * ```json
 * {"type":"stream_event","event":{"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hello"}}}
 * {"type":"result","subtype":"success","cost_usd":0.003,"result":"...","session_id":"abc123"}
 * ```
 *
 * 消息类型:
 * - `stream_event`: 流式增量 (text_delta, thinking_delta, input_json_delta, content_block_start)
 * - `assistant`: 完整助手消息 (配合 --include-partial-messages)
 * - `result`: 最终结果
 * - `error`: 错误
 */
class NdjsonParser {

    private val logger = thisLogger()
    private val gson = Gson()

    /**
     * 解析单行 NDJSON
     *
     * @param line 一行 JSON 字符串
     * @return 解析出的消息列表 (一行可能产生 0 或 1 条消息)
     */
    fun parseLine(line: String): List<CliMessage> {
        if (line.isBlank()) return emptyList()

        return try {
            val json = gson.fromJson(line, JsonObject::class.java)
            parseJson(json, line)
        } catch (e: Exception) {
            logger.warn("Failed to parse NDJSON line: ${line.take(200)}")
            listOf(CliMessage.Unknown(line))
        }
    }

    private fun parseJson(json: JsonObject, rawLine: String): List<CliMessage> {
        val type = json.get("type")?.asString ?: return listOf(CliMessage.Unknown(rawLine))

        return when (type) {
            "stream_event" -> parseStreamEvent(json)
            "assistant" -> parseAssistantMessage(json)
            "result" -> parseResult(json)
            "error" -> listOf(CliMessage.Error(json.get("error")?.asString ?: "Unknown error"))
            else -> listOf(CliMessage.Unknown(rawLine))
        }
    }

    /**
     * 解析 stream_event 类型消息
     *
     * 子类型:
     * - content_block_delta: 文本/思考/工具输入增量
     * - content_block_start: 内容块开始 (含工具调用)
     * - content_block_stop: 内容块结束
     * - message_start / message_delta / message_stop: 消息级事件
     */
    private fun parseStreamEvent(json: JsonObject): List<CliMessage> {
        val event = json.getAsJsonObject("event") ?: return emptyList()
        val eventType = event.get("type")?.asString ?: return emptyList()

        return when (eventType) {
            "content_block_delta" -> parseContentBlockDelta(event)
            "content_block_start" -> parseContentBlockStart(event)
            else -> emptyList()
        }
    }

    private fun parseContentBlockDelta(event: JsonObject): List<CliMessage> {
        val delta = event.getAsJsonObject("delta") ?: return emptyList()
        val deltaType = delta.get("type")?.asString ?: return emptyList()

        return when (deltaType) {
            "text_delta" -> {
                val text = delta.get("text")?.asString ?: ""
                if (text.isNotEmpty()) listOf(CliMessage.TextDelta(text)) else emptyList()
            }
            "thinking_delta" -> {
                val text = delta.get("thinking")?.asString ?: ""
                if (text.isNotEmpty()) listOf(CliMessage.ThinkingDelta(text)) else emptyList()
            }
            "input_json_delta" -> {
                val id = "" // ID 在 content_block_start 中，这里无法获取
                val partialJson = delta.get("partial_json")?.asString ?: ""
                listOf(CliMessage.ToolUseInputDelta(id, partialJson))
            }
            else -> emptyList()
        }
    }

    private fun parseContentBlockStart(event: JsonObject): List<CliMessage> {
        val contentBlock = event.getAsJsonObject("content_block") ?: return emptyList()
        val blockType = contentBlock.get("type")?.asString ?: return emptyList()

        return when (blockType) {
            "tool_use" -> {
                val name = contentBlock.get("name")?.asString ?: ""
                val id = contentBlock.get("id")?.asString ?: ""
                listOf(CliMessage.ToolUseStart(name, id))
            }
            else -> emptyList()
        }
    }

    private fun parseAssistantMessage(json: JsonObject): List<CliMessage> {
        val message = json.getAsJsonObject("message") ?: return emptyList()
        val content = message.getAsJsonArray("content") ?: return emptyList()

        val texts = mutableListOf<String>()
        for (element in content) {
            val block = element.asJsonObject
            if (block.get("type")?.asString == "text") {
                block.get("text")?.asString?.let { texts.add(it) }
            }
        }

        return if (texts.isNotEmpty()) {
            listOf(CliMessage.AssistantMessage(texts.joinToString("")))
        } else {
            emptyList()
        }
    }

    private fun parseResult(json: JsonObject): List<CliMessage> {
        val content = json.get("result")?.asString ?: ""
        val costUsd = json.get("cost_usd")?.asDouble ?: 0.0
        val sessionId = json.get("session_id")?.asString ?: ""
        val isError = json.get("is_error")?.asBoolean ?: false

        return listOf(CliMessage.Result(content, costUsd, sessionId, isError))
    }
}
