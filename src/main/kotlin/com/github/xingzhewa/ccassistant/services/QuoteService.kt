package com.github.xingzhewa.ccassistant.services

import com.github.xingzhewa.ccassistant.model.ChatSession
import com.github.xingzhewa.ccassistant.model.Message
import com.github.xingzhewa.ccassistant.model.Role
import com.intellij.openapi.components.Service
import com.intellij.openapi.project.Project
import org.jetbrains.annotations.NotNull
import org.jetbrains.annotations.Nullable
import java.time.ZoneId
import java.time.format.DateTimeFormatter

/**
 * 消息引用服务 - 支持跨会话消息引用
 *
 * 提供消息引用格式化和 Markdown stripping
 */
@Service(Service.Level.PROJECT)
class QuoteService(private val project: Project) {

    companion object {
        private const val MAX_QUOTE_LENGTH = 500
        private val timeFormatter = DateTimeFormatter.ofPattern("HH:mm")
            .withZone(ZoneId.systemDefault())

        /**
         * 获取消息引用服务实例
         */
        fun getInstance(project: Project): QuoteService =
            project.getService(QuoteService::class.java)
    }

    /**
     * 获取消息详情
     *
     * @param sessionId 会话 ID
     * @param messageId 消息 ID
     * @return 消息详情
     */
    @Nullable
    fun getMessageDetail(sessionId: String, messageId: String): MessageDetail? {
        val session = SessionService.getInstance(project).getSession(sessionId) ?: return null
        val message = session.messages.find { it.id == messageId } ?: return null

        return MessageDetail(
            content = message.content,
            sessionTitle = session.title,
            timestamp = timeFormatter.format(message.timestamp),
            role = message.role
        )
    }

    /**
     * 格式化引用文本
     *
     * 格式化为 markdown blockquote
     *
     * @param messageDetail 消息详情
     * @return 格式化后的引用文本
     */
    @NotNull
    fun formatQuote(messageDetail: MessageDetail): String {
        val plainText = stripMarkdown(messageDetail.content)
        val truncated = if (plainText.length > MAX_QUOTE_LENGTH) {
            plainText.take(MAX_QUOTE_LENGTH) + "..."
        } else {
            plainText
        }

        return buildString {
            appendLine("> 引用自 [${messageDetail.sessionTitle} - ${messageDetail.timestamp}]:")
            truncated.lines().forEach { line ->
                append("> ")
                appendLine(line)
            }
            appendLine()
        }.trimEnd()
    }

    /**
     * 获取消息详情（基于消息内容）
     *
     * @param sessionId 会话 ID
     * @param messageContent 消息内容
     * @return 消息详情
     */
    @Nullable
    fun getMessageDetailByContent(sessionId: String, messageContent: String): MessageDetail? {
        val session = SessionService.getInstance(project).getSession(sessionId) ?: return null
        val message = session.messages.find { it.content == messageContent } ?: return null

        return getMessageDetail(sessionId, message.id)
    }

    /**
     * 解析会话中的引用消息
     *
     * @param sessionId 会话 ID
     * @return 消息列表
     */
    @NotNull
    fun listMessages(sessionId: String): List<MessageDetail> {
        val session = SessionService.getInstance(project).getSession(sessionId)
            ?: return emptyList()

        return session.messages.map { message ->
            MessageDetail(
                content = message.content,
                sessionTitle = session.title,
                timestamp = timeFormatter.format(message.timestamp),
                role = message.role
            )
        }
    }

    /**
     * 格式化多个引���
     *
     * @param messages 消息详情列表
     * @return 格式化后的引用文本
     */
    @NotNull
    fun formatQuotes(messages: List<MessageDetail>): String {
        return messages.joinToString("\n") { formatQuote(it) }
    }
}

/**
 * 消息详情数据模型
 *
 * @param content 消息内容
 * @param sessionTitle 会话标题
 * @param timestamp 时间戳
 * @param role 消息角色
 */
data class MessageDetail(
    val content: String,
    val sessionTitle: String,
    val timestamp: String,
    val role: Role
)

/**
 * Markdown stripping 工具函数
 *
 * 移除 Markdown 格式符号，保留纯文本
 */
private fun stripMarkdown(text: String): String {
    return text
        // 代码块 → [代码块]
        .replace(Regex("```[\\s\\S]*?```"), "[代码块]")
        .replace(Regex("```[\\s\\S]*?```"), "[代码块]")
        // 行内代码 → [代码]
        .replace(Regex("`[^`]+`"), "[代码]")
        // 粗体
        .replace(Regex("\\*\\*([^*]+)\\*\\*"), "$1")
        // 斜体
        .replace(Regex("\\*([^*]+)\\*"), "$1")
        // 链接
        .replace(Regex("\\[([^\\]]+)\\]\\([^)]+\\)"), "$1")
        // 标题符号
        .replace(Regex("^#+\\s*", RegexOption.MULTILINE), "")
        // 删除线
        .replace(Regex("~~([^~]+)~~"), "$1")
        // 列表符号
        .replace(Regex("^[*-]\\s+", RegexOption.MULTILINE), "")
        .replace(Regex("^\\d+\\.\\s+", RegexOption.MULTILINE), "")
        .trim()
}