package com.github.xingzhewa.ccassistant.services

import com.github.xingzhewa.ccassistant.model.ChatSession
import com.github.xingzhewa.ccassistant.model.Message
import com.github.xingzhewa.ccassistant.model.Role
import com.intellij.openapi.components.Service
import com.intellij.openapi.project.Project
import org.jetbrains.annotations.NotNull
import org.jetbrains.annotations.Nullable
import java.time.Instant

/**
 * 回滚服务 - 支持会话回溯功能
 *
 * 提供回溯点列表和创建新会话（复制历史消息）
 */
@Service(Service.Level.PROJECT)
class RewindService(private val project: Project) {

    companion object {
        /**
         * 获取回滚服务实例
         */
        fun getInstance(project: Project): RewindService =
            project.getService(RewindService::class.java)
    }

    /**
     * 获取可回溯点列表
     *
     * @param sessionId 会话 ID
     * @return 回溯点列表
     */
    @NotNull
    fun getRewindPoints(sessionId: String): List<RewindPoint> {
        val session = SessionService.getInstance(project).getSession(sessionId)
            ?: return emptyList()

        return session.messages.mapIndexedNotNull { index, message ->
            if (message.role == Role.ASSISTANT && index > 0) {
                RewindPoint(
                    id = message.id,
                    index = index,
                    preview = message.content.take(50),
                    timestamp = message.timestamp
                )
            } else null
        }
    }

    /**
     * 执行回溯
     *
     * 创建新会话，复制回溯点之前的消息
     *
     * @param sessionId 原会话 ID
     * @param rewindPointId 回溯点 ID
     * @return 新会话 ID
     */
    @Nullable
    fun rewind(sessionId: String, rewindPointId: String): String? {
        val session = SessionService.getInstance(project).getSession(sessionId) ?: return null

        val rewindPointIndex = session.messages.indexOfFirst { it.id == rewindPointId }
        if (rewindPointIndex < 0) return null

        // 获取回溯点之前的时间戳作为新会话的 session_id 起点
        val rewindPointMessage = session.messages.getOrNull(rewindPointIndex) ?: return null

        // 1. 创建新会话
        val newSession = SessionService.getInstance(project).createSession(
            workingDir = session.workingDir
        )

        // 2. 复制回溯点之前的消息（深拷贝）
        val historyMessages = session.messages.take(rewindPointIndex)
        historyMessages.forEach { message ->
            newSession.messages.add(message.copy())
        }

        // 设置会话标题（基于复制后的首条用户消息）
        val firstUserMessage = newSession.messages
            .filter { it.role == Role.USER }
            .firstOrNull()
            ?.content
        if (firstUserMessage != null) {
            newSession.title = SessionService.getInstance(project).generateTitle(firstUserMessage)
        }

        // 3. 保存新会话
        SessionService.getInstance(project).saveSession(newSession)

        return newSession.id
    }

    /**
     * 执行回溯（基于索引）
     *
     * @param sessionId 原会话 ID
     * @param pointIndex 回溯点索引
     * @return 新会话 ID
     */
    @Nullable
    fun rewindByIndex(sessionId: String, pointIndex: Int): String? {
        val session = SessionService.getInstance(project).getSession(sessionId) ?: return null
        val message = session.messages.getOrNull(pointIndex) ?: return null
        return rewind(sessionId, message.id)
    }
}

/**
 * 回溯点数据模型
 *
 * @param id 回溯点 ID
 * @param index 消息索���
 * @param preview 消息预览
 * @param timestamp 时间戳
 */
data class RewindPoint(
    val id: String,
    val index: Int,
    val preview: String,
    val timestamp: Instant
)

/**
 * 创建消息的深拷贝扩展
 */
private fun Message.copy(): Message {
    return Message(
        id = this.id,
        role = this.role,
        content = this.content,
        timestamp = this.timestamp,
        usage = this.usage,
        attachments = this.attachments.toMutableList(),
        fileReferences = this.fileReferences.toMutableList(),
        thinkingContent = this.thinkingContent,
        toolCalls = this.toolCalls.toMutableList()
    )
}