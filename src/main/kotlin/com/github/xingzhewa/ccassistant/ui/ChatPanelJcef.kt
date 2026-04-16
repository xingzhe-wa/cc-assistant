package com.github.xingzhewa.ccassistant.ui

import com.github.xingzhewa.ccassistant.bridge.CliBridgeService
import com.github.xingzhewa.ccassistant.bridge.CliMessage
import com.github.xingzhewa.ccassistant.bridge.CliMessageCallback
import com.github.xingzhewa.ccassistant.ui.chat.JcefMessageRenderer
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.diagnostic.thisLogger
import com.intellij.ui.JBColor
import com.intellij.ui.components.JBPanel
import com.intellij.ui.components.JBScrollPane
import java.awt.BorderLayout
import java.awt.Dimension
import java.awt.FlowLayout
import java.awt.Font
import java.awt.datatransfer.StringSelection
import java.awt.event.KeyAdapter
import java.awt.event.KeyEvent
import javax.swing.Box
import javax.swing.BoxLayout
import javax.swing.JButton
import javax.swing.JLabel
import javax.swing.JPanel
import javax.swing.JScrollPane
import javax.swing.JTextArea
import javax.swing.SwingUtilities

/**
 * 聊天面板 V2 (JCEF) - CC Assistant 主界面
 *
 * M2 阶段：使用 JCEF 渲染消息区域
 *
 * 布局:
 * ```
 * ┌──────────────────────────────────┐
 * │ CC Assistant          [Stop] [⚙] │ Header
 * ├──────────────────────────────────┤
 * │                                  │
 * │  JCEF 消息区域 (chat.html)       │ Center
 * │  - 用户消息 (右侧，橙色背景)     │
 * │  - AI 响应 (左侧，灰色背景)      │
 * │  - Markdown + 代码高亮           │
 * │  - 流式打字机效果               │
 * │                                  │
 * ├──────────────────────────────────┤
 * │ Status: Ready                    │ Status bar
 * ├──────────────────────────────────┤
 * │ 输入消息...              [Send]  │ Input
 * └──────────────────────────────────┘
 * ```
 */
class ChatPanelJcef(
    private val workingDir: String? = null
) : JBPanel<ChatPanelJcef>(BorderLayout()) {

    private val logger = thisLogger()

    // JCEF 消息渲染器
    private val messageRenderer = JcefMessageRenderer()

    // UI 组件
    private val scrollPane: JBScrollPane
    private val inputArea = JTextArea(3, 40)
    private val sendButton = JButton("Send")
    private val stopButton = JButton("Stop")
    private val statusLabel = JLabel("Ready")

    // 状态
    private var currentStreamId: String? = null
    private var isStreaming = false

    // 服务
    private val cliService: CliBridgeService = CliBridgeService.getInstance()
    private val callback = object : CliMessageCallback {
        override fun onMessage(message: CliMessage) {
            ApplicationManager.getApplication().invokeLater {
                handleMessage(message)
            }
        }
    }

    init {
        cliService.registerCallback(callback)

        // === JCEF Messages Area ===
        val jcefPanel = messageRenderer.createPanel()
        scrollPane = JBScrollPane(jcefPanel).apply {
            horizontalScrollBarPolicy = JScrollPane.HORIZONTAL_SCROLLBAR_NEVER
            verticalScrollBarPolicy = JScrollPane.VERTICAL_SCROLLBAR_AS_NEEDED
        }

        // 初始化 JCEF 回调
        setupJcefCallbacks()

        // === Input Area ===
        inputArea.lineWrap = true
        inputArea.wrapStyleWord = true
        inputArea.font = Font("JetBrains Mono", Font.PLAIN, 13)

        sendButton.addActionListener { sendPrompt() }
        stopButton.addActionListener { stopGeneration() }
        stopButton.isEnabled = false

        inputArea.addKeyListener(object : KeyAdapter() {
            override fun keyPressed(e: KeyEvent) {
                if (e.keyCode == KeyEvent.VK_ENTER && !e.isShiftDown) {
                    e.consume()
                    sendPrompt()
                }
            }
        })

        // === Layout ===
        add(buildHeader(), BorderLayout.NORTH)
        add(scrollPane, BorderLayout.CENTER)
        add(buildInputArea(), BorderLayout.SOUTH)

        // 初始状态
        if (!messageRenderer.isCefSupported()) {
            statusLabel.text = "JCEF not supported, using fallback"
        } else if (cliService.isCliAvailable()) {
            statusLabel.text = "CLI: ${cliService.getCliVersion()}"
            messageRenderer.showEmpty()
        } else {
            statusLabel.text = "Claude Code CLI not found"
            messageRenderer.appendAIMessage(
                "welcome",
                """
                Welcome to CC Assistant!

                To get started, make sure **Claude Code CLI** is installed:

                ```bash
                npm install -g @anthropicai/claude-code
                ```
                """.trimIndent()
            )
        }
    }

    // ==================== JCEF 回调设置 ====================

    private fun setupJcefCallbacks() {
        messageRenderer.onCopyMessage = { id, content ->
            copyToClipboard(content)
            showToast("已复制到剪贴板")
        }

        messageRenderer.onQuoteMessage = { id, content ->
            // 引用格式化为 Markdown 引用
            val quoted = content.lines().joinToString("\n") { "> $it" }
            inputArea.text = "$quoted\n\n${inputArea.text}"
            inputArea.requestFocus()
            showToast("已添加到输入框")
        }

        messageRenderer.onRegenerate = { id ->
            // 重新生成
            logger.info("Regenerate message: $id")
        }

        messageRenderer.onRewind = { id ->
            // 回溯
            logger.info("Rewind message: $id")
        }

        messageRenderer.onCopyCode = { code ->
            copyToClipboard(code)
            showToast("代码已复制")
        }

        messageRenderer.onInsertPrompt = { text ->
            inputArea.text = text
            inputArea.requestFocus()
        }
    }

    // ==================== UI 构建 ====================

    private fun buildHeader(): JPanel {
        return JBPanel<JBPanel<*>>(BorderLayout()).apply {
            add(
                JLabel("CC Assistant").apply { font = font.deriveFont(Font.BOLD, 14f) },
                BorderLayout.WEST
            )
            add(
                JBPanel<JBPanel<*>>(FlowLayout(FlowLayout.RIGHT)).apply {
                    add(stopButton)
                },
                BorderLayout.EAST
            )
        }
    }

    private fun buildInputArea(): JPanel {
        val panel = JBPanel<JBPanel<*>>(BorderLayout(4, 4))
        panel.add(statusLabel, BorderLayout.NORTH)
        panel.add(JBScrollPane(inputArea), BorderLayout.CENTER)
        panel.add(sendButton, BorderLayout.EAST)
        return panel
    }

    // ==================== 消息操作 ====================

    private fun sendPrompt() {
        val text = inputArea.text.trim()
        if (text.isEmpty()) return

        inputArea.text = ""
        messageRenderer.appendUserMessage("user-${System.currentTimeMillis()}", text)

        statusLabel.text = "Thinking..."
        sendButton.isEnabled = false
        stopButton.isEnabled = true
        isStreaming = true

        // 启动流式输出
        currentStreamId = messageRenderer.appendStreamingAI(null, "")

        val success = cliService.executePrompt(text, workingDir)
        if (!success) {
            statusLabel.text = "Error: CLI not available"
            sendButton.isEnabled = true
            stopButton.isEnabled = false
            isStreaming = false
            messageRenderer.finishStreaming(currentStreamId)
        }
    }

    private fun stopGeneration() {
        cliService.interrupt()
        statusLabel.text = "Stopped"
        sendButton.isEnabled = true
        stopButton.isEnabled = false
        isStreaming = false
        messageRenderer.finishStreaming(currentStreamId)
    }

    // ==================== 消息渲染 ====================

    private fun handleMessage(message: CliMessage) {
        when (message) {
            is CliMessage.TextDelta -> {
                if (isStreaming) {
                    currentStreamId = messageRenderer.appendStreamingAI(currentStreamId, message.text)
                }
            }
            is CliMessage.AssistantMessage -> {
                if (isStreaming) {
                    currentStreamId = messageRenderer.appendStreamingAI(currentStreamId, message.text)
                }
            }
            is CliMessage.Result -> {
                isStreaming = false
                messageRenderer.finishStreaming(currentStreamId)
                currentStreamId = null

                val content = message.content
                if (content.isNotEmpty()) {
                    messageRenderer.appendAIMessage(
                        "ai-${System.currentTimeMillis()}",
                        content
                    )
                }

                val cost = "%.4f".format(message.costUsd)
                statusLabel.text = if (message.isError) "Error" else "Done (cost: \$$cost)"
                sendButton.isEnabled = true
                stopButton.isEnabled = false
            }
            is CliMessage.Error -> {
                isStreaming = false
                messageRenderer.finishStreaming(currentStreamId)
                currentStreamId = null

                messageRenderer.appendAIMessage(
                    "error-${System.currentTimeMillis()}",
                    "**Error:** ${message.message}"
                )
                statusLabel.text = "Error: ${message.message.take(60)}"
                sendButton.isEnabled = true
                stopButton.isEnabled = false
            }
            is CliMessage.ThinkingDelta -> {
                // 思考片段可以在下一版本支持
            }
            else -> { /* ToolUse 等 M3 阶段处理 */ }
        }
    }

    // ==================== 工具方法 ====================

    private fun copyToClipboard(text: String) {
        try {
            val selection = StringSelection(text)
            java.awt.Toolkit.getDefaultToolkit().systemClipboard.setContents(selection, null)
        } catch (e: Throwable) {
            logger.error("Failed to copy to clipboard", e)
        }
    }

    private fun showToast(message: String) {
        // 简单实现，实际应该用 JBToast 或自定义 toast
        statusLabel.text = message
        SwingUtilities.invokeLater {
            // 3秒后恢复
            java.util.Timer().schedule(object : java.util.TimerTask() {
                override fun run() {
                    SwingUtilities.invokeLater {
                        if (isStreaming) {
                            statusLabel.text = "Thinking..."
                        } else {
                            statusLabel.text = "Ready"
                        }
                    }
                }
            }, 3000)
        }
    }

    /**
     * 清理资源
     */
    fun dispose() {
        cliService.unregisterCallback(callback)
        messageRenderer.dispose()
    }
}
