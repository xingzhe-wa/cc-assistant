package com.github.xingzhewa.ccassistant.model

import com.google.gson.annotations.SerializedName
import java.time.Instant

/**
 * 会话数据模型
 *
 * @param id 插件内部 UUID
 * @param sessionId CLI 返回的 session_id（用于 --resume）
 * @param title 会话标题
 * @param createdAt 创建时间
 * @param updatedAt 更新时间
 * @param workingDir 工作目录（用于 --resume）
 * @param messages 消息列表
 * @param isFavorite 是否收藏
 */
data class ChatSession(
    @SerializedName("id")
    val id: String,

    @SerializedName("session_id")
    var sessionId: String? = null,

    @SerializedName("title")
    var title: String = "新对话",

    @SerializedName("created_at")
    val createdAt: Instant = Instant.now(),

    @SerializedName("updated_at")
    var updatedAt: Instant = Instant.now(),

    @SerializedName("working_dir")
    var workingDir: String,

    @SerializedName("messages")
    var messages: MutableList<Message> = mutableListOf(),

    @SerializedName("is_favorite")
    var isFavorite: Boolean = false
)

/**
 * 消息数据模型
 *
 * @param id 消息 ID
 * @param role 角色 (USER / ASSISTANT)
 * @param content 消息内容
 * @param timestamp 时间戳
 * @param usage Token 使用量
 * @param attachments 附件列表
 * @param fileReferences 文件引用
 * @param thinkingContent 思考内容
 * @param toolCalls 工具调用列表
 */
data class Message(
    @SerializedName("id")
    val id: String,

    @SerializedName("role")
    val role: Role,

    @SerializedName("content")
    val content: String,

    @SerializedName("timestamp")
    val timestamp: Instant = Instant.now(),

    @SerializedName("usage")
    val usage: Usage? = null,

    @SerializedName("attachments")
    val attachments: List<Attachment> = emptyList(),

    @SerializedName("file_refs")
    val fileReferences: List<FileReference> = emptyList(),

    @SerializedName("thinking")
    val thinkingContent: String? = null,

    @SerializedName("tool_calls")
    val toolCalls: List<ToolCall> = emptyList()
)

/**
 * 消息角色
 */
enum class Role {
    @SerializedName("user")
    USER,

    @SerializedName("assistant")
    ASSISTANT
}

/**
 * Token 使用量
 *
 * @param inputTokens 输入 Token 数
 * @param outputTokens 输出 Token 数
 * @param totalTokens 总 Token 数
 */
data class Usage(
    @SerializedName("input_tokens")
    val inputTokens: Int = 0,

    @SerializedName("output_tokens")
    val outputTokens: Int = 0,

    @SerializedName("total_tokens")
    val totalTokens: Int = 0
)

/**
 * 附件
 *
 * @param id 附件 ID
 * @param name 文件名
 * @param type 类型 (image / file)
 * @param path 文件路径 (JCEF 环境)
 * @param dataUrl Base64 数据 (开发模式)
 * @param size 文件大小 (bytes)
 */
data class Attachment(
    @SerializedName("id")
    val id: String,

    @SerializedName("name")
    val name: String,

    @SerializedName("type")
    val type: String,

    @SerializedName("path")
    val path: String? = null,

    @SerializedName("data_url")
    val dataUrl: String? = null,

    @SerializedName("size")
    val size: Long? = null
)

/**
 * 文件引用
 *
 * @param path 文件路径
 * @param startLine 起始行号
 * @param endLine 结束行号
 */
data class FileReference(
    @SerializedName("path")
    val path: String,

    @SerializedName("start_line")
    val startLine: Int? = null,

    @SerializedName("end_line")
    val endLine: Int? = null
)

/**
 * 工具调用
 *
 * @param id 工具调用 ID
 * @param name 工具名称
 * @param input 工具输入 (JSON)
 * @param output 工具输出
 * @param status 状态
 */
data class ToolCall(
    @SerializedName("id")
    val id: String,

    @SerializedName("name")
    val name: String,

    @SerializedName("input")
    val input: String,

    @SerializedName("output")
    val output: String? = null,

    @SerializedName("status")
    val status: ToolCallStatus = ToolCallStatus.PENDING
)

/**
 * 工具调用状态
 */
enum class ToolCallStatus {
    @SerializedName("pending")
    PENDING,

    @SerializedName("running")
    RUNNING,

    @SerializedName("success")
    SUCCESS,

    @SerializedName("error")
    ERROR
}

/**
 * 会话导出格式
 */
enum class ExportFormat {
    MARKDOWN,
    JSON,
    PLAIN_TEXT
}