package com.github.xingzhewa.ccassistant.ui.chat

import com.google.gson.Gson
import com.intellij.openapi.Disposable
import com.intellij.openapi.application.invokeLater
import com.intellij.openapi.diagnostic.thisLogger
import com.intellij.ui.jcef.JBCefApp
import com.intellij.ui.jcef.JBCefBrowser
import com.intellij.ui.jcef.JBCefJSQuery
import java.awt.BorderLayout
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import javax.swing.JComponent
import javax.swing.JLabel
import javax.swing.JPanel

/**
 * JCEF 聊天面板 - 统一的消息渲染 + Java↔JS 桥接
 *
 * 职责:
 * - 创建 JCEF Browser 加载 chat.html
 * - Java → JS: 注入主题变量、i18n 字符串、Provider 数据
 * - Java → JS: 推送消息渲染指令 (appendUserMessage / appendAIMessage / appendStreamingContent / finishStreaming)
 * - JS → Java: 接收用户操作回调 (copyMessage / quoteMessage / regenerate / rewind / insertPrompt / etc)
 * - 主题变更监听: IDE 主题切换时自动更新 JCEF 内 CSS 变量
 */
class JcefChatPanel : Disposable {

    private val logger = thisLogger()
    private val gson = Gson()
    private val timeFormat = SimpleDateFormat("HH:mm", Locale.getDefault())

    private var browser: JBCefBrowser? = null
    private var messageContainer: JPanel? = null
    private var jsQuery: JBCefJSQuery? = null

    private var isInitialized = false
    private val disposed = java.util.concurrent.atomic.AtomicBoolean(false)

    // MOCK_MODE: true = 不注入 javaBridge，让 JS 使用 Mock 模式
    var mockMode: Boolean = false

    // ========== JS → Java 回调接口 ==========

    var onCopyMessage: ((String, String) -> Unit)? = null
    var onQuoteMessage: ((String, String) -> Unit)? = null
    var onRegenerate: ((String) -> Unit)? = null
    var onRewind: ((String) -> Unit)? = null
    var onCopyCode: ((String) -> Unit)? = null
    var onInsertPrompt: ((String) -> Unit)? = null
    var onDiffSummaryUpdate: ((Int, Int) -> Unit)? = null

    // 主题/语言/Provider 变更回调
    var onThemeChange: ((String) -> Unit)? = null
    var onProviderChange: ((String) -> Unit)? = null
    var onModelChange: ((String) -> Unit)? = null
    var onModeChange: ((String) -> Unit)? = null
    var onAgentChange: ((String) -> Unit)? = null
    var onThinkChange: ((Boolean) -> Unit)? = null
    var onSendMessage: ((String, MessageOptions) -> Unit)? = null
    var onCheckCli: (() -> Unit)? = null
    var onDeleteProvider: ((String) -> Unit)? = null
    var onSaveProvider: ((Map<String, String>) -> Unit)? = null
    var onToggleFavorite: ((String, Boolean) -> Unit)? = null
    var onRenameSession: ((String, String) -> Unit)? = null
    var onDeleteSession: ((String) -> Unit)? = null
    var onOpenDiff: ((String) -> Unit)? = null

    data class MessageOptions(
        val stream: Boolean = true,
        val think: Boolean = false,
        val mode: String = "auto",
        val model: String? = null,
        val provider: String? = null
    )

    // ========== 生命周期 ==========

    /**
     * 检查 JCEF 是否可用
     */
    fun isCefSupported(): Boolean = JBCefApp.isSupported()

    /**
     * 创建面板
     */
    fun createPanel(): JComponent {
        val panel = JPanel(BorderLayout())

        if (!isCefSupported()) {
            logger.warn("JCEF not supported, showing fallback UI")
            return createFallbackPanel()
        }

        try {
            // 创建空白 JCEF Browser（稍后用 loadHTML 加载内容）
            browser = JBCefBrowser()

            messageContainer = JPanel(BorderLayout())
            messageContainer!!.add(browser!!.getComponent(), BorderLayout.CENTER)
            panel.add(messageContainer!!, BorderLayout.CENTER)

            // 延迟加载 HTML 内容，确保浏览器完全初始化
            invokeLater {
                // 读取并加载 HTML 内容
                loadHtmlContent()
                // 初始化 JS Bridge
                initializeJSBridge()
                isInitialized = true
                logger.info("JcefChatPanel created and initialized")
            }

        } catch (e: Throwable) {
            logger.error("Failed to create JCEF Browser", e)
            return createFallbackPanel()
        }

        return panel
    }

    /**
     * 加载 HTML 内容到 JCEF
     * 使用 loadHTML() 避免 JAR 内相对路径加载问题
     * 字体文件会被转换为 Base64 并内联到 CSS 中
     */
    private fun loadHtmlContent() {
        try {
            // 读取 chat.html 内容
            val htmlContent = this::class.java.classLoader
                .getResourceAsStream("web/chat.html")
                ?.bufferedReader()
                ?.readText()

            if (htmlContent == null) {
                logger.error("Failed to read web/chat.html")
                return
            }

            // 读取并内联 CSS（构建时已将字体文件内联为 Base64）
            val cssContent = this::class.java.classLoader
                .getResourceAsStream("web/assets/index.css")
                ?.bufferedReader()
                ?.readText()
                ?: ""

            // 读取并内联 JS
            val jsContent = this::class.java.classLoader
                .getResourceAsStream("web/assets/index.js")
                ?.bufferedReader()
                ?.readText()
                ?: ""

            // 构建完整的 HTML（内联所有资源）
            val inlineHtml = buildString {
                append("<!DOCTYPE html>\n")
                append("<html lang=\"en\">\n")
                append("<head>\n")
                append("  <meta charset=\"UTF-8\" />\n")
                append("  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n")
                append("  <title>CC Assistant</title>\n")

                // 内联 CSS
                if (cssContent.isNotEmpty()) {
                    append("  <style>\n")
                    append(cssContent)
                    append("  </style>\n")
                }

                append("</head>\n")
                append("<body>\n")
                append("  <div id=\"root\"></div>\n")

                // 内联 JS
                if (jsContent.isNotEmpty()) {
                    append("  <script type=\"module\">\n")
                    append(jsContent)
                    append("  </script>\n")
                }

                append("</body>\n")
                append("</html>")
            }

            // 使用 loadHTML 加载内联内容
            browser?.loadHTML(inlineHtml)
            logger.info("HTML content loaded successfully, size: ${inlineHtml.length} chars")

        } catch (e: Throwable) {
            logger.error("Failed to load HTML content", e)
        }
    }

    private fun initializeJSBridge() {
        val browserInstance = browser ?: return

        // JS → Java 通信
        jsQuery = JBCefJSQuery.create(browserInstance)
        jsQuery?.addHandler { request ->
            try {
                handleJSMessage(request)
            } catch (e: Throwable) {
                logger.error("Error handling JS message", e)
            }
            null
        }

        // 注入 javaBridge (Mock 模式下跳过)
        if (!mockMode) {
            injectJavaBridge()
        }

        // 注入 marked 和 hljs 实例
        injectLibraries()
    }

    private fun injectLibraries() {
        val script = """
            if (typeof marked !== 'undefined') {
                window.markedInstance = marked;
            }
            if (typeof hljs !== 'undefined') {
                window.hljsInstance = hljs;
            }
        """.trimIndent()
        executeScript(script)
    }

    private fun injectJavaBridge() {
        val queryRef = "cefQuery"
        val script = """
            window.javaBridge = {
                // 消息操作
                onCopyMessage: function(id, content) {
                    $queryRef.inject("copyMessage:" + JSON.stringify({id: id, content: content}));
                },
                onQuoteMessage: function(id, content) {
                    $queryRef.inject("quoteMessage:" + JSON.stringify({id: id, content: content}));
                },
                onRegenerate: function(id) {
                    $queryRef.inject("regenerate:" + id);
                },
                onRewind: function(id) {
                    $queryRef.inject("rewind:" + id);
                },
                onCopyCode: function(code) {
                    $queryRef.inject("copyCode:" + code);
                },
                onInsertPrompt: function(text) {
                    $queryRef.inject("insertPrompt:" + text);
                },
                onDiffSummaryUpdate: function(summary) {
                    $queryRef.inject("diffSummary:" + JSON.stringify({add: summary.add, del: summary.del}));
                },
                // 主题
                onThemeChange: function(themeId) {
                    $queryRef.inject("themeChange:" + themeId);
                },
                // Provider
                onProviderChange: function(providerId) {
                    $queryRef.inject("providerChange:" + providerId);
                },
                onModelChange: function(modelId) {
                    $queryRef.inject("modelChange:" + modelId);
                },
                onModeChange: function(mode) {
                    $queryRef.inject("modeChange:" + mode);
                },
                onAgentChange: function(agentId) {
                    $queryRef.inject("agentChange:" + agentId);
                },
                onThinkChange: function(enabled) {
                    $queryRef.inject("thinkChange:" + enabled);
                },
                // 发送消息
                onSendMessage: function(text, options) {
                    $queryRef.inject("sendMessage:" + JSON.stringify({text: text, options: options}));
                },
                // 设置
                onCheckCli: function() {
                    $queryRef.inject("checkCli:");
                },
                onDeleteProvider: function(id) {
                    $queryRef.inject("deleteProvider:" + id);
                },
                onSaveProvider: function(data) {
                    $queryRef.inject("saveProvider:" + JSON.stringify(data));
                },
                // 会话
                onToggleFavorite: function(id, fav) {
                    $queryRef.inject("toggleFavorite:" + JSON.stringify({id: id, fav: fav}));
                },
                onRenameSession: function(id, title) {
                    $queryRef.inject("renameSession:" + JSON.stringify({id: id, title: title}));
                },
                onDeleteSession: function(id) {
                    $queryRef.inject("deleteSession:" + id);
                },
                // Diff
                onOpenDiff: function(file) {
                    $queryRef.inject("openDiff:" + file);
                }
            };
            window.javaBridgePresent = true;
            console.log('[JcefChatPanel] javaBridge injected');
        """.trimIndent()

        executeScript(script)
    }

    private fun handleJSMessage(request: String): String? {
        logger.info("JS message: ${request.take(100)}")

        val colonIndex = request.indexOf(':')
        if (colonIndex < 0) return null

        val action = request.substring(0, colonIndex)
        val data = request.substring(colonIndex + 1)

        when (action) {
            "copyMessage" -> {
                val msg = gson.fromJson(data, CopyMessageData::class.java)
                invokeLater { onCopyMessage?.invoke(msg.id, msg.content) }
            }
            "quoteMessage" -> {
                val msg = gson.fromJson(data, CopyMessageData::class.java)
                invokeLater { onQuoteMessage?.invoke(msg.id, msg.content) }
            }
            "regenerate" -> invokeLater { onRegenerate?.invoke(data) }
            "rewind" -> invokeLater { onRewind?.invoke(data) }
            "copyCode" -> invokeLater { onCopyCode?.invoke(data) }
            "insertPrompt" -> invokeLater { onInsertPrompt?.invoke(data) }
            "diffSummary" -> {
                val summary = gson.fromJson(data, DiffSummaryData::class.java)
                invokeLater { onDiffSummaryUpdate?.invoke(summary.add, summary.del) }
            }
            "themeChange" -> invokeLater { onThemeChange?.invoke(data) }
            "providerChange" -> invokeLater { onProviderChange?.invoke(data) }
            "modelChange" -> invokeLater { onModelChange?.invoke(data) }
            "modeChange" -> invokeLater { onModeChange?.invoke(data) }
            "agentChange" -> invokeLater { onAgentChange?.invoke(data) }
            "thinkChange" -> invokeLater { onThinkChange?.invoke(data.toBoolean()) }
            "sendMessage" -> {
                val msg = gson.fromJson(data, SendMessageData::class.java)
                invokeLater {
                    onSendMessage?.invoke(
                        msg.text,
                        MessageOptions(
                            stream = msg.options?.stream ?: true,
                            think = msg.options?.think ?: false,
                            mode = msg.options?.mode ?: "auto",
                            model = msg.options?.model,
                            provider = msg.options?.provider
                        )
                    )
                }
            }
            "checkCli" -> invokeLater { onCheckCli?.invoke() }
            "deleteProvider" -> invokeLater { onDeleteProvider?.invoke(data) }
            "saveProvider" -> {
                val map = gson.fromJson(data, Map::class.java)
                invokeLater { onSaveProvider?.invoke(map as Map<String, String>) }
            }
            "toggleFavorite" -> {
                val fav = gson.fromJson(data, FavData::class.java)
                invokeLater { onToggleFavorite?.invoke(fav.id, fav.fav) }
            }
            "renameSession" -> {
                val rs = gson.fromJson(data, RenameSessionData::class.java)
                invokeLater { onRenameSession?.invoke(rs.id, rs.title) }
            }
            "deleteSession" -> invokeLater { onDeleteSession?.invoke(data) }
            "openDiff" -> invokeLater { onOpenDiff?.invoke(data) }
            else -> logger.warn("Unknown action: $action")
        }

        return null
    }

    // ========== Java → JS API ==========

    /**
     * 注入主题变量
     */
    fun applyTheme(themeVariables: Map<String, String>, isDark: Boolean) {
        val varsJson = gson.toJson(themeVariables)
        executeScript("CCApp.applyTheme({variables: $varsJson, isDark: $isDark})")
    }

    /**
     * 设置主题 ID
     */
    fun setTheme(themeId: String) {
        executeScript("CCApp.setTheme('$themeId')")
    }

    /**
     * 注入 i18n 字符串
     */
    fun applyI18n(messages: Map<String, String>) {
        val json = gson.toJson(messages)
        executeScript("CCApp.applyI18n($json)")
    }

    /**
     * 注入 Provider 数据
     */
    fun setProviders(providers: List<ProviderData>, models: Map<String, List<ModelData>>, agents: List<AgentData>) {
        val provJson = gson.toJson(providers)
        val modelJson = gson.toJson(models)
        val agentJson = gson.toJson(agents)
        executeScript("CCProviders.setData($provJson, $modelJson, $agentJson, [])")
    }

    /**
     * 追加用户消息
     */
    fun appendUserMessage(id: String, content: String, timestamp: String? = null) {
        val time = timestamp ?: formatTime(System.currentTimeMillis())
        executeScript("CCChat.appendMessage('user', ${gson.toJson(content)}, {id: ${gson.toJson(id)}, timestamp: ${gson.toJson(time)}})")
    }

    /**
     * 追加 AI 消息
     */
    fun appendAIMessage(id: String, content: String, timestamp: String? = null, thinking: String? = null) {
        val time = timestamp ?: formatTime(System.currentTimeMillis())
        executeScript("CCChat.appendMessage('assistant', ${gson.toJson(content)}, {id: ${gson.toJson(id)}, timestamp: ${gson.toJson(time)}, thinking: ${gson.toJson(thinking)}})")
    }

    /**
     * 流式追加内容
     */
    fun appendStreamingContent(role: String, content: String, messageId: String?): String {
        val id = messageId ?: "stream-${System.currentTimeMillis()}"
        executeScript("CCChat.appendStreamingContent('$role', ${gson.toJson(content)}, ${gson.toJson(id)})")
        return id
    }

    /**
     * 完成流式输出
     */
    fun finishStreaming(messageId: String?) {
        if (messageId != null) {
            executeScript("CCChat.finishStreaming(${gson.toJson(messageId)})")
        }
    }

    /**
     * 清空消息
     */
    fun clearMessages() {
        executeScript("CCChat.clearMessages()")
    }

    /**
     * 显示空状态
     */
    fun showEmpty() {
        executeScript("CCChat.showEmpty()")
    }

    /**
     * 刷新页面
     */
    fun reload() {
        try {
            browser?.getCefBrowser()?.let { cef ->
                val method = cef.javaClass.getMethod("reload")
                method.invoke(cef)
            }
        } catch (e: Throwable) {
            logger.error("Failed to reload browser", e)
        }
    }

    /**
     * 执行任意 JavaScript
     */
    fun executeScript(script: String) {
        if (!isInitialized) return
        try {
            browser?.getCefBrowser()?.let { cef ->
                val method = cef.javaClass.getMethod("executeJavaScript", String::class.java, String::class.java, Int::class.javaPrimitiveType)
                method.invoke(cef, script, "", 0)
            }
        } catch (e: Throwable) {
            logger.error("Failed to execute script: ${e.message}", e)
        }
    }

    // ========== 工具方法 ==========

    private fun formatTime(timestamp: Long): String = timeFormat.format(Date(timestamp))

    private fun createFallbackPanel(): JPanel {
        return JPanel(BorderLayout()).apply {
            add(JLabel("<html><div style='padding: 20px; text-align: center; color: #666;'>JCEF 不可用，请升级到 IDEA 2024.1+</div></html>"), BorderLayout.CENTER)
        }
    }

    override fun dispose() {
        if (disposed.getAndSet(true)) return
        try {
            jsQuery?.dispose()
            jsQuery = null
            browser?.let {
                try { it.dispose() } catch (e: Throwable) { logger.warn("Error disposing browser", e) }
            }
            browser = null
            messageContainer = null
            logger.info("JcefChatPanel disposed")
        } catch (e: Throwable) {
            logger.error("Error disposing JcefChatPanel", e)
        }
    }

    // ========== 数据类 ==========

    private data class CopyMessageData(val id: String, val content: String)
    private data class DiffSummaryData(val add: Int, val del: Int)
    private data class SendMessageData(val text: String, val options: SendOptions?)
    private data class SendOptions(val stream: Boolean?, val think: Boolean?, val mode: String?, val model: String?, val provider: String?)
    private data class FavData(val id: String, val fav: Boolean)
    private data class RenameSessionData(val id: String, val title: String)

    data class ProviderData(
        val id: String,
        val name: String,
        val url: String,
        val key: String? = null,
        val st: String = "ok"  // ok, err, off
    )

    data class ModelData(
        val id: String,
        val name: String? = null
    )

    data class AgentData(
        val id: String,
        val name: String
    )
}
