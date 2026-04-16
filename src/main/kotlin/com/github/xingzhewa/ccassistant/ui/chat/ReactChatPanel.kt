package com.github.xingzhewa.ccassistant.ui.chat

import com.github.xingzhewa.ccassistant.bridge.CliBridgeService
import com.github.xingzhewa.ccassistant.bridge.CliMessage
import com.github.xingzhewa.ccassistant.bridge.CliMessageCallback
import com.google.gson.Gson
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.application.invokeLater
import com.intellij.openapi.diagnostic.thisLogger
import com.intellij.ui.jcef.JBCefApp
import java.awt.BorderLayout
import javax.swing.JPanel

/**
 * React 聊天面板 - JCEF + React 前端集成
 *
 * 职责:
 * - 创建 JCEF Browser 加载 React 应用
 * - 桥接 CliBridgeService ↔ JcefChatPanel ↔ React App
 * - 管理会话状态、消息流、主题等
 */
class ReactChatPanel(
    private val workingDir: String? = null
) : JPanel(BorderLayout()) {

    private val logger = thisLogger()
    private val gson = Gson()

    private val cliService: CliBridgeService = CliBridgeService.getInstance()
    private var jcefPanel: JcefChatPanel? = null

    // 当前会话状态
    private var currentSessionId: String? = null
    private var currentMessageId: String? = null

    init {
        initJcefPanel()
        initCliBridge()
    }

    private fun initJcefPanel() {
        if (!JBCefApp.isSupported()) {
            logger.warn("JCEF not supported")
            add(JPanel().apply {
                add(javax.swing.JLabel("JCEF 不可用，请升级到 IDEA 2024.1+"))
            }, BorderLayout.CENTER)
            return
        }

        // 创建真正的 JcefChatPanel
        jcefPanel = JcefChatPanel().apply {
            // 设置 JS → Java 回调
            setupCallbacks()
        }

        val panel = jcefPanel!!.createPanel()
        add(panel, BorderLayout.CENTER)
        logger.info("ReactChatPanel initialized with JcefChatPanel")
    }

    private fun JcefChatPanel.setupCallbacks() {
        // 消息操作回调
        onCopyMessage = { id, content ->
            logger.info("Copy message: $id")
            java.awt.Toolkit.getDefaultToolkit().systemClipboard.setContents(
                java.awt.datatransfer.StringSelection(content),
                null
            )
        }

        onQuoteMessage = { id, content ->
            logger.info("Quote message: $id")
            // TODO: 实现引用功能
        }

        onRegenerate = { id ->
            logger.info("Regenerate: $id")
            // TODO: 实现重新生成
        }

        onRewind = { id ->
            logger.info("Rewind: $id")
            // TODO: 实现回退功能
        }

        onCopyCode = { code ->
            java.awt.Toolkit.getDefaultToolkit().systemClipboard.setContents(
                java.awt.datatransfer.StringSelection(code),
                null
            )
        }

        onSendMessage = { text, options ->
            logger.info("Send message: ${text.take(50)}...")
            handleSendMessage(text, options)
        }

        // 主题/设置回调
        onThemeChange = { themeId ->
            logger.info("Theme change: $themeId")
            // TODO: 实现主题切换
        }

        onProviderChange = { providerId ->
            logger.info("Provider change: $providerId")
            // TODO: 实现供应商切换
        }

        onCheckCli = {
            checkCliStatus()
        }

        // 会话操作回调
        onDeleteSession = { id ->
            logger.info("Delete session: $id")
            // TODO: 实现会话删除
        }

        onToggleFavorite = { id, fav ->
            logger.info("Toggle favorite: $id = $fav")
            // TODO: 实现收藏切换
        }

        onRenameSession = { id, title ->
            logger.info("Rename session: $id -> $title")
            // TODO: 实现会话重命名
        }
    }

    private fun initCliBridge() {
        val callback = object : CliMessageCallback {
            override fun onMessage(message: CliMessage) {
                ApplicationManager.getApplication().invokeLater {
                    handleCliMessage(message)
                }
            }
        }
        cliService.registerCallback(callback)
    }

    private fun handleSendMessage(text: String, options: JcefChatPanel.MessageOptions) {
        if (text.isBlank()) return

        // 追加用户消息到 JCEF
        val timestamp = java.text.SimpleDateFormat("HH:mm", java.util.Locale.getDefault())
            .format(java.util.Date())
        jcefPanel?.appendUserMessage("user-${System.currentTimeMillis()}", text, timestamp)

        // 执行 CLI (目前不支持 sessionId 和 model 参数)
        cliService.executePrompt(
            prompt = text,
            workingDir = workingDir
        )
    }

    private fun handleCliMessage(message: CliMessage) {
        when (message) {
            is CliMessage.TextDelta -> {
                // 流式输出
                val id = jcefPanel?.appendStreamingContent(
                    "assistant",
                    message.text,
                    currentMessageId
                )
                // 存储当前消息 ID 用于完成
                id?.let { currentMessageId = it }
            }
            is CliMessage.ThinkingDelta -> {
                // Thinking 内容
                jcefPanel?.appendStreamingContent(
                    "thinking",
                    message.text,
                    null
                )
            }
            is CliMessage.ToolUseStart -> {
                // 工具使用中
                jcefPanel?.appendStreamingContent(
                    "tool",
                    "Using ${message.name}...",
                    null
                )
            }
            is CliMessage.Result -> {
                // 完成流式输出
                jcefPanel?.finishStreaming(currentMessageId)
                currentMessageId = null
                // 保存 sessionId 用于续接
                message.sessionId?.let { currentSessionId = it }
                logger.info("Message complete, cost: ${message.costUsd}")
            }
            is CliMessage.Error -> {
                jcefPanel?.finishStreaming(currentMessageId)
                currentMessageId = null
                logger.error("CLI Error: ${message.message}")
            }
            else -> { /* 忽略其他类型 */ }
        }
    }

    private fun checkCliStatus() {
        if (cliService.isCliAvailable()) {
            val version = cliService.getCliVersion()
            logger.info("CLI available: $version")
            // TODO: 通过 JCEF 显示 CLI 状态
        } else {
            logger.warn("CLI not available")
            // TODO: 通过 JCEF 显示 CLI 不可用提示
        }
    }

    /**
     * 清理资源
     */
    fun dispose() {
        jcefPanel?.dispose()
        jcefPanel = null
    }
}
