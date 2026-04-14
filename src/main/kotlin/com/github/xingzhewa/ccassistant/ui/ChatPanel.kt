package com.github.xingzhewa.ccassistant.ui

import com.github.xingzhewa.ccassistant.bridge.CliBridgeService
import com.github.xingzhewa.ccassistant.bridge.CliMessage
import com.github.xingzhewa.ccassistant.bridge.CliMessageCallback
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.diagnostic.thisLogger
import com.intellij.ui.JBColor
import com.intellij.ui.components.JBPanel
import com.intellij.ui.components.JBScrollPane
import java.awt.BorderLayout
import java.awt.Dimension
import java.awt.FlowLayout
import java.awt.Font
import java.awt.event.KeyAdapter
import java.awt.event.KeyEvent
import javax.swing.Box
import javax.swing.BoxLayout
import javax.swing.JButton
import javax.swing.JLabel
import javax.swing.JPanel
import javax.swing.JScrollPane
import javax.swing.JTextArea
import javax.swing.JTextPane
import javax.swing.SwingUtilities
import javax.swing.text.html.HTMLEditorKit

/**
 * 聊天面板 - CC Assistant 主界面
 *
 * MVP 布局:
 * ```
 * ┌──────────────────────────────────┐
 * │ CC Assistant          [Stop] [⚙] │ Header
 * ├──────────────────────────────────┤
 * │                                  │
 * │  消息区域 (可滚动)               │ Center
 * │  - 用户消息 (右侧，蓝色背景)     │
 * │  - AI 响应 (左侧，灰色背景)      │
 * │  - 流式打字机效果               │
 * │                                  │
 * ├──────────────────────────────────┤
 * │ Status: Ready                    │ Status bar
 * ├──────────────────────────────────┤
 * │ 输入消息...              [Send]  │ Input
 * └──────────────────────────────────┘
 * ```
 */
class ChatPanel(
    private val workingDir: String? = null
) : JBPanel<ChatPanel>(BorderLayout()) {

    private val logger = thisLogger()

    // UI 组件
    private val messagesPanel = JPanel()
    private val scrollPane: JBScrollPane
    private val inputArea = JTextArea(3, 40)
    private val sendButton = JButton("Send")
    private val stopButton = JButton("Stop")
    private val statusLabel = JLabel("Ready")

    // 状态
    private val responseBuffer = StringBuilder()
    private var currentResponsePane: JTextPane? = null

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

        // === Messages Area ===
        messagesPanel.layout = BoxLayout(messagesPanel, BoxLayout.Y_AXIS)
        messagesPanel.alignmentX = LEFT_ALIGNMENT
        scrollPane = JBScrollPane(messagesPanel).apply {
            horizontalScrollBarPolicy = JScrollPane.HORIZONTAL_SCROLLBAR_NEVER
            verticalScrollBarPolicy = JScrollPane.VERTICAL_SCROLLBAR_AS_NEEDED
        }

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

        // 初始提示
        if (cliService.isCliAvailable()) {
            statusLabel.text = "CLI detected: ${cliService.getCliVersion()}"
        } else {
            statusLabel.text = "Claude Code CLI not found"
            addWelcomeMessage()
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
        appendUserBubble(text)

        statusLabel.text = "Thinking..."
        sendButton.isEnabled = false
        stopButton.isEnabled = true

        // 创建 AI 响应占位
        appendAssistantBubble()

        val success = cliService.executePrompt(text, workingDir)
        if (!success) {
            statusLabel.text = "Error: CLI not available"
            sendButton.isEnabled = true
            stopButton.isEnabled = false
        }
    }

    private fun stopGeneration() {
        cliService.interrupt()
        statusLabel.text = "Stopped"
        sendButton.isEnabled = true
        stopButton.isEnabled = false
    }

    // ==================== 消息渲染 ====================

    private fun addWelcomeMessage() {
        val pane = createTextPane(
            """
            Welcome to CC Assistant!<br><br>
            To get started, make sure <b>Claude Code CLI</b> is installed:<br>
            <code>npm install -g @anthropic-ai/claude-code</code>
            """.trimIndent()
        )
        messagesPanel.add(wrapBubble(pane, BubbleStyle.SYSTEM))
        messagesPanel.add(Box.createVerticalStrut(8))
    }

    private fun appendUserBubble(text: String) {
        val pane = createTextPane(escapeHtml(text))
        messagesPanel.add(wrapBubble(pane, BubbleStyle.USER))
        messagesPanel.add(Box.createVerticalStrut(6))
        scrollToBottom()
    }

    private fun appendAssistantBubble() {
        responseBuffer.clear()
        val pane = createTextPane("...")
        currentResponsePane = pane
        messagesPanel.add(wrapBubble(pane, BubbleStyle.ASSISTANT))
        messagesPanel.add(Box.createVerticalStrut(6))
        scrollToBottom()
    }

    private fun handleMessage(message: CliMessage) {
        when (message) {
            is CliMessage.TextDelta -> {
                responseBuffer.append(message.text)
                updateResponsePane()
            }
            is CliMessage.AssistantMessage -> {
                responseBuffer.append(message.text)
                updateResponsePane()
            }
            is CliMessage.Result -> {
                if (responseBuffer.isEmpty() && message.content.isNotEmpty()) {
                    responseBuffer.append(message.content)
                    updateResponsePane()
                }
                val cost = "%.4f".format(message.costUsd)
                statusLabel.text = if (message.isError) "Error" else "Done (cost: \$$cost)"
                sendButton.isEnabled = true
                stopButton.isEnabled = false
                currentResponsePane = null
            }
            is CliMessage.Error -> {
                if (responseBuffer.isEmpty()) {
                    responseBuffer.append("Error: ${message.message}")
                    updateResponsePane()
                }
                statusLabel.text = "Error: ${message.message.take(60)}"
                sendButton.isEnabled = true
                stopButton.isEnabled = false
                currentResponsePane = null
            }
            else -> { /* Thinking, ToolUse 等 M3 阶段处理 */ }
        }
    }

    private fun updateResponsePane() {
        currentResponsePane?.let { pane ->
            val html = escapeHtml(responseBuffer.toString())
            // 简单代码块处理: ```code``` → <pre>
            val codeBlockRegex = Regex("```(.*?)```", RegexOption.DOT_MATCHES_ALL)
            val withCodeBlocks = codeBlockRegex.replace(html) { match ->
                "<pre style='background:#2b2b2b;color:#a9b7c6;padding:8px;border-radius:4px;overflow-x:auto;'><code>${match.groupValues[1]}</code></pre>"
            }
            pane.text = "<html><body style='font-family:sans-serif;font-size:13px;'>$withCodeBlocks</body></html>"
            scrollToBottom()
        }
    }

    // ==================== 组件工厂 ====================

    private fun createTextPane(html: String): JTextPane {
        return JTextPane().apply {
            isEditable = false
            contentType = "text/html"
            putClientProperty(JTextPane.HONOR_DISPLAY_PROPERTIES, true)
            text = "<html><body style='font-family:sans-serif;font-size:13px;'>$html</body></html>"
        }
    }

    private fun wrapBubble(pane: JTextPane, style: BubbleStyle): JPanel {
        return JBPanel<JBPanel<*>>(BorderLayout()).apply {
            background = style.bgColor
            border = style.border

            val wrapper = JBPanel<JBPanel<*>>(BorderLayout())
            wrapper.isOpaque = false
            wrapper.border = style.padding

            wrapper.add(pane, BorderLayout.CENTER)

            when (style) {
                BubbleStyle.USER -> {
                    add(wrapper, BorderLayout.EAST)
                    add(Box.createHorizontalStrut(Int.MAX_VALUE), BorderLayout.CENTER)
                }
                BubbleStyle.ASSISTANT, BubbleStyle.SYSTEM -> {
                    add(wrapper, BorderLayout.WEST)
                }
            }

            maximumSize = Dimension(Int.MAX_VALUE, Int.MAX_VALUE)
        }
    }

    private fun scrollToBottom() {
        SwingUtilities.invokeLater {
            val bar = scrollPane.verticalScrollBar
            bar.value = bar.maximum
        }
    }

    // ==================== 工具方法 ====================

    private fun escapeHtml(text: String): String {
        return text
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\n", "<br>")
    }

    /**
     * 清理资源
     */
    fun dispose() {
        cliService.unregisterCallback(callback)
    }

    // ==================== 样式定义 ====================

    private enum class BubbleStyle(val bgColor: JBColor) {
        USER(JBColor(0x2B5278, 0x2B5278)),
        ASSISTANT(JBColor(0x3C3F41, 0x3C3F41)),
        SYSTEM(JBColor(0x3C3F41, 0x3C3F41));

        val border: javax.swing.border.Border = javax.swing.border.EmptyBorder(4, 4, 4, 4)
        val padding: javax.swing.border.Border = javax.swing.border.EmptyBorder(8, 12, 8, 12)
    }
}
