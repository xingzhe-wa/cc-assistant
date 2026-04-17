package com.github.xingzhewa.ccassistant.services

import com.github.xingzhewa.ccassistant.model.ChatSession
import com.github.xingzhewa.ccassistant.model.ExportFormat
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.intellij.openapi.components.Service
import com.intellij.openapi.components.ServiceManager
import com.intellij.openapi.project.Project
import org.jetbrains.annotations.NotNull
import org.jetbrains.annotations.Nullable
import java.io.File
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

/**
 * 会话服务 - 管理会话生命周期
 *
 * 提供会话的 CRUD 操作，JSON 文件持久化到 ~/.claude/sessions/
 */
@Service(Service.Level.PROJECT)
class SessionService(private val project: Project) {

    private val gson: Gson = GsonBuilder()
        .setPrettyPrinting()
        .create()

    companion object {
        private val sessionsDir: File by lazy {
            File(System.getProperty("user.home"), ".claude/sessions").also { it.mkdirs() }
        }

        /**
         * 获取会话服务实例
         */
        fun getInstance(project: Project): SessionService =
            project.getService(SessionService::class.java)
    }

    /**
     * 创建新会话
     *
     * @param workingDir 工作目录（默认使用项目根目录）
     * @return 新创建的会话
     */
    fun createSession(workingDir: String? = null): ChatSession {
        val session = ChatSession(
            id = java.util.UUID.randomUUID().toString(),
            sessionId = null,
            title = "新对话",
            createdAt = Instant.now(),
            updatedAt = Instant.now(),
            workingDir = workingDir ?: project.basePath ?: "",
            messages = mutableListOf()
        )
        saveSession(session)
        return session
    }

    /**
     * 保存会话
     *
     * @param session 要保存的会话
     * @return 保存是否成功
     */
    fun saveSession(session: ChatSession): Boolean {
        return try {
            val file = File(sessionsDir, "${session.id}.json")
            session.updatedAt = Instant.now()
            file.writeText(gson.toJson(session))
            true
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }

    /**
     * 获取会话
     *
     * @param sessionId 会话 ID
     * @return 会话，不存在则返回 null
     */
    @Nullable
    fun getSession(sessionId: String): ChatSession? {
        return try {
            val file = File(sessionsDir, "$sessionId.json")
            if (!file.exists()) return null
            gson.fromJson(file.readText(), ChatSession::class.java)
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    /**
     * 删除会话
     *
     * @param sessionId 会话 ID
     * @return 删除是否成功
     */
    fun deleteSession(sessionId: String): Boolean {
        return try {
            val file = File(sessionsDir, "$sessionId.json")
            if (file.exists()) {
                file.delete()
            } else {
                false
            }
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }

    /**
     * 列出所有会话
     *
     * @return 会话列表（按更新时间倒序）
     */
    @NotNull
    fun listSessions(): List<ChatSession> {
        return try {
            sessionsDir.listFiles { _, name -> name.endsWith(".json") }
                ?.mapNotNull { file ->
                    try {
                        gson.fromJson(file.readText(), ChatSession::class.java)
                    } catch (e: Exception) {
                        null
                    }
                }
                ?.sortedByDescending { it.updatedAt }
                ?: emptyList()
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }

    /**
     * 切换收藏状态
     *
     * @param sessionId 会话 ID
     */
    fun toggleFavorite(sessionId: String): Boolean {
        val session = getSession(sessionId) ?: return false
        session.isFavorite = !session.isFavorite
        return saveSession(session)
    }

    /**
     * 重命名会话
     *
     * @param sessionId 会话 ID
     * @param newTitle 新标题
     * @return 重命名是否成功
     */
    fun renameSession(sessionId: String, newTitle: String): Boolean {
        val session = getSession(sessionId) ?: return false
        session.title = newTitle.trim()
        return saveSession(session)
    }

    /**
     * 生成会话标题（基于首条用户消息）
     *
     * @param firstUserMessage 首条用户消息
     * @return 生成的标题
     */
    fun generateTitle(firstUserMessage: String): String {
        val title = firstUserMessage
            .replace("\n", " ")
            .trim()
            .take(30)

        return if (firstUserMessage.length > 30) {
            "$title..."
        } else {
            title
        }
    }

    /**
     * 导出会话
     *
     * @param sessionId 会话 ID
     * @param format 导出格式
     * @return 导出内容，不存在则返回 null
     */
    @Nullable
    fun exportSession(sessionId: String, format: ExportFormat): String? {
        val session = getSession(sessionId) ?: return null

        return when (format) {
            ExportFormat.JSON -> gson.toJson(session)
            ExportFormat.MARKDOWN -> exportAsMarkdown(session)
            ExportFormat.PLAIN_TEXT -> exportAsPlainText(session)
        }
    }

    /**
     * 导出为 Markdown 格式
     */
    private fun exportAsMarkdown(session: ChatSession): String {
        val sb = StringBuilder()
        sb.appendLine("# ${session.title}")
        sb.appendLine()
        sb.appendLine("**创建时间**: ${DateTimeFormatter.ISO_INSTANT.format(session.createdAt)}")
        sb.appendLine()

        session.messages.forEach { message ->
            when (message.role) {
                com.github.xingzhewa.ccassistant.model.Role.USER -> {
                    sb.appendLine("## 用户")
                    sb.appendLine()
                    sb.appendLine(message.content)
                    sb.appendLine()
                }
                com.github.xingzhewa.ccassistant.model.Role.ASSISTANT -> {
                    sb.appendLine("## AI")
                    sb.appendLine()
                    sb.appendLine(message.content)
                    sb.appendLine()
                }
            }
        }

        return sb.toString()
    }

    /**
     * 导出为纯文本格式
     */
    private fun exportAsPlainText(session: ChatSession): String {
        val sb = StringBuilder()
        sb.appendLine(session.title)
        sb.appendLine("=".repeat(session.title.length))
        sb.appendLine()

        session.messages.forEach { message ->
            val label = when (message.role) {
                com.github.xingzhewa.ccassistant.model.Role.USER -> "用户"
                com.github.xingzhewa.ccassistant.model.Role.ASSISTANT -> "AI"
            }
            sb.appendLine("[$label] ${message.timestamp}")
            sb.appendLine(message.content)
            sb.appendLine()
        }

        return sb.toString()
    }

    /**
     * 获取收藏的会话
     */
    fun listFavoriteSessions(): List<ChatSession> {
        return listSessions().filter { it.isFavorite }
    }

    /**
     * 搜索会话
     */
    fun searchSessions(query: String): List<ChatSession> {
        return listSessions().filter { session ->
            session.title.contains(query, ignoreCase = true) ||
                    session.messages.any { it.content.contains(query, ignoreCase = true) }
        }
    }
}