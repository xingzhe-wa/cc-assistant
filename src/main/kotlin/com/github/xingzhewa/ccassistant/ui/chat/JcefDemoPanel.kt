package com.github.xingzhewa.ccassistant.ui.chat

import com.github.xingzhewa.ccassistant.bridge.CliBridgeService
import com.github.xingzhewa.ccassistant.bridge.CliMessage
import com.github.xingzhewa.ccassistant.bridge.CliMessageCallback
import com.intellij.openapi.Disposable
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.diagnostic.thisLogger
import com.intellij.ui.JBColor
import com.intellij.ui.components.JBPanel
import java.awt.BorderLayout
import java.awt.Dimension
import java.awt.FlowLayout
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
 * JCEF Demo 面板 - 用于验证 JCEF 技术可行性
 *
 * 混合架构:
 * - 中心: JCEF Browser (消息渲染) 或 Swing 降级
 * - 底部: Swing 输入区
 *
 * TODO: 后续将合并到完整 ChatPanel
 */
class JcefDemoPanel(
    private val workingDir: String? = null
) : JBPanel<JcefDemoPanel>(BorderLayout()), Disposable {

    private val logger = thisLogger()

    // JCEF 桥接器
    private val jcefBridge = JcefBridge()
    private val jcefContainer = JPanel(BorderLayout())

    // Swing 组件 (输入区)
    private val inputArea = JTextArea(3, 40)
    private val sendButton = JButton("Send (JCEF)")
    private val statusLabel = JLabel("Initializing...")

    // 消息面板 (Swing 降级模式)
    private val messagesPanel = JPanel()
    private val scrollPane = JScrollPane(messagesPanel)

    // 服务
    private val cliService: CliBridgeService = CliBridgeService.getInstance()

    init {
        // 注册 CLI 回调
        cliService.registerCallback(object : CliMessageCallback {
            override fun onMessage(message: CliMessage) {
                ApplicationManager.getApplication().invokeLater {
                    handleMessage(message)
                }
            }
        })

        // 设置布局
        setupLayout()

        // 初始化 JCEF
        initializeJCEF()

        // 初始状态
        updateStatus()
    }

    private fun setupLayout() {
        // === 顶部状态栏 ===
        add(JPanel(BorderLayout()).apply {
            add(statusLabel, BorderLayout.WEST)
            add(JPanel(FlowLayout(FlowLayout.RIGHT)).apply {
                add(JButton("Test JCEF").apply {
                    addActionListener { testJCEF() }
                })
                add(JButton("Test JS→Java").apply {
                    addActionListener { testJStoJava() }
                })
                add(JButton("Reload").apply {
                    addActionListener { jcefBridge.reload() }
                })
            }, BorderLayout.EAST)
        }, BorderLayout.NORTH)

        // === 中心: JCEF 或 Swing 降级 ===
        jcefContainer.border = javax.swing.BorderFactory.createTitledBorder("JCEF Browser")
        add(jcefContainer, BorderLayout.CENTER)

        // === 底部: 输入区 ===
        add(buildInputArea(), BorderLayout.SOUTH)
    }

    private fun initializeJCEF() {
        if (!jcefBridge.isSupported()) {
            logger.warn("JCEF not supported, using Swing fallback")
            setupSwingFallback()
            return
        }

        try {
            // 设置 JS 回调
            jcefBridge.onMessageFromJS = { action, data ->
                logger.info("JS → Java: action=$action, data=$data")
                ApplicationManager.getApplication().invokeLater {
                    handleJSMessage(action, data)
                }
            }

            // 创建 Browser
            val browserPanel = jcefBridge.createBrowserPanel("/web/jcef-demo.html")
            jcefContainer.add(browserPanel, BorderLayout.CENTER)

            logger.info("JCEF initialized successfully")

        } catch (e: Throwable) {
            logger.error("Failed to initialize JCEF", e)
            setupSwingFallback()
        }
    }

    private fun setupSwingFallback() {
        messagesPanel.layout = BoxLayout(messagesPanel, BoxLayout.Y_AXIS)
        messagesPanel.background = JBColor(0x111214, 0x111214)
        jcefContainer.add(scrollPane, BorderLayout.CENTER)

        messagesPanel.add(JPanel().apply {
            layout = BorderLayout()
            border = javax.swing.BorderFactory.createEmptyBorder(20, 20, 20, 20)
            add(JLabel("<html><body style='color: #87899a;'>" +
                    "<h2>JCEF Fallback Mode</h2>" +
                    "JCEF is not available on this platform.<br><br>" +
                    "Supported features will be limited.</body></html>"))
        })

        updateStatus()
    }

    private fun updateStatus() {
        val jcefStatus = if (jcefBridge.isSupported()) "JCEF Ready" else "Swing Fallback"
        val cliStatus = if (cliService.isCliAvailable()) {
            "CLI: ${cliService.getCliVersion()}"
        } else {
            "CLI: Not Found"
        }

        statusLabel.text = "$jcefStatus | $cliStatus"
        statusLabel.foreground = if (jcefBridge.isSupported()) {
            JBColor(0x50B85E, 0x50B85E)
        } else {
            JBColor(0xD95555, 0xD95555)
        }
    }

    // ==================== 测试方法 ====================

    private fun testJCEF() {
        if (!jcefBridge.isSupported()) {
            statusLabel.text = "JCEF not supported"
            return
        }

        jcefBridge.testSendMessage("Hello from Swing! Time: ${System.currentTimeMillis()}")
        statusLabel.text = "Test message sent to JCEF"
    }

    private fun testJStoJava() {
        statusLabel.text = "Waiting for JS callback... (Click '发送消息到 Java' in JCEF)"
    }

    private fun handleJSMessage(action: String, data: String) {
        when (action) {
            "testAction" -> {
                statusLabel.text = "JS → Java: $data"
                statusLabel.foreground = JBColor(0x50B85E, 0x50B85E)
            }
            else -> {
                logger.info("Unknown action: $action")
            }
        }
    }

    // ==================== 消息处理 ====================

    private fun buildInputArea(): JPanel {
        inputArea.lineWrap = true
        inputArea.wrapStyleWord = true
        sendButton.addActionListener { sendPrompt() }

        inputArea.addKeyListener(object : KeyAdapter() {
            override fun keyPressed(e: KeyEvent) {
                if (e.keyCode == KeyEvent.VK_ENTER && !e.isShiftDown) {
                    e.consume()
                    sendPrompt()
                }
            }
        })

        return JPanel(BorderLayout(4, 4)).apply {
            add(JScrollPane(inputArea), BorderLayout.CENTER)
            add(sendButton, BorderLayout.EAST)
        }
    }

    private fun sendPrompt() {
        val text = inputArea.text.trim()
        if (text.isEmpty()) return

        inputArea.text = ""

        // JCEF 模式: 发送到 JCEF 渲染
        if (jcefBridge.isSupported()) {
            jcefBridge.sendToJS("onJavaMessage", mapOf(
                "role" to "user",
                "content" to text,
                "time" to java.text.SimpleDateFormat("HH:mm").format(java.util.Date())
            ))
        } else {
            // Swing 降级: 直接显示
            appendUserMessage(text)
        }

        // 调用 CLI
        statusLabel.text = "Calling CLI..."
        val success = cliService.executePrompt(text, workingDir)
        if (!success) {
            statusLabel.text = "CLI not available"
        }
    }

    private val responseBuffer = StringBuilder()

    private fun handleMessage(message: CliMessage) {
        when (message) {
            is CliMessage.TextDelta -> {
                responseBuffer.append(message.text)
                if (jcefBridge.isSupported()) {
                    jcefBridge.sendToJS("onStreamChunk", mapOf("text" to message.text))
                }
            }
            is CliMessage.AssistantMessage -> {
                responseBuffer.append(message.text)
                if (jcefBridge.isSupported()) {
                    jcefBridge.sendToJS("onStreamChunk", mapOf("text" to message.text))
                }
            }
            is CliMessage.Result -> {
                val cost = "%.4f".format(message.costUsd)
                statusLabel.text = if (message.isError) "Error" else "Done (cost: \$$cost)"

                // 如果 JCEF 不可用，用 Swing 显示
                if (!jcefBridge.isSupported() && responseBuffer.isNotEmpty()) {
                    appendAIMessage(responseBuffer.toString())
                    responseBuffer.clear()
                }
            }
            is CliMessage.Error -> {
                statusLabel.text = "Error: ${message.message.take(60)}"
                if (!jcefBridge.isSupported()) {
                    appendAIMessage("Error: ${message.message}")
                }
            }
            else -> { /* Thinking, ToolUse 等后续处理 */ }
        }
    }

    // ==================== Swing 降级模式 ====================

    private fun appendUserMessage(text: String) {
        messagesPanel.add(JPanel().apply {
            layout = BorderLayout()
            background = JBColor(0x2B5278, 0x2B5278)
            border = javax.swing.BorderFactory.createEmptyBorder(8, 12, 8, 12)
            alignmentX = RIGHT_ALIGNMENT
            add(JLabel("<html><body style='color: #fff;'>${escapeHtml(text)}</body></html>"), BorderLayout.EAST)
        })
        messagesPanel.add(Box.createVerticalStrut(6))
        messagesPanel.revalidate()
        messagesPanel.repaint()
    }

    private fun appendAIMessage(text: String) {
        messagesPanel.add(JPanel().apply {
            layout = BorderLayout()
            background = JBColor(0x3C3F41, 0x3C3F41)
            border = javax.swing.BorderFactory.createEmptyBorder(8, 12, 8, 12)
            alignmentX = LEFT_ALIGNMENT
            add(JLabel("<html><body style='color: #d0d1d8;'>${escapeHtml(text)}</body></html>"))
        })
        messagesPanel.add(Box.createVerticalStrut(6))
        messagesPanel.revalidate()
        messagesPanel.repaint()
    }

    private fun escapeHtml(text: String): String {
        return text
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\n", "<br>")
    }

    // ==================== 生命周期 ====================

    override fun dispose() {
        cliService.unregisterCallback(object : CliMessageCallback {
            override fun onMessage(message: CliMessage) {}
        })
        jcefBridge.dispose()
        logger.info("JcefDemoPanel disposed")
    }
}
