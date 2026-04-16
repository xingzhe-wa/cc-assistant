package com.github.xingzhewa.ccassistant.ui.chat

import com.google.gson.JsonObject
import com.google.gson.JsonParser
import com.intellij.openapi.Disposable
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.diagnostic.thisLogger
import java.awt.BorderLayout
import java.lang.reflect.Method
import javax.swing.JPanel

/**
 * JCEF 桥接器 - 处理 Java ↔ JS 双向通信
 *
 * 使用反射加载 JCEF 类，支持运行时降级
 *
 * @throws JcefNotAvailableException 当 JCEF 不可用时抛出
 */
class JcefBridge : Disposable {

    private val logger = thisLogger()

    // JCEF 反射对象
    private var jbCefAppClass: Class<*>? = null
    private var jbCefBrowserClass: Class<*>? = null
    private var jbCefJSQueryClass: Class<*>? = null

    // JCEF 实例
    private var browserInstance: Any? = null
    private var componentMethod: Method? = null

    // JS 回调接口
    var onMessageFromJS: ((String, String) -> Unit)? = null
    var onThemeChange: ((Boolean) -> Unit)? = null

    private val isInitialized = java.util.concurrent.atomic.AtomicBoolean(false)
    private val isDisposed = java.util.concurrent.atomic.AtomicBoolean(false)

    /**
     * 检查 JCEF 是否可用
     */
    fun isSupported(): Boolean {
        return try {
            loadJcefClasses()
            true
        } catch (e: Throwable) {
            logger.warn("JCEF not supported: ${e.message}")
            false
        }
    }

    /**
     * 加载 JCEF 类
     */
    @Throws(JcefNotAvailableException::class)
    private fun loadJcefClasses() {
        if (jbCefAppClass != null) return

        try {
            jbCefAppClass = Class.forName("org.jetbrains.cef.JBCefApp")
            jbCefBrowserClass = Class.forName("org.jetbrains.cef.JBCefBrowser")
            jbCefJSQueryClass = Class.forName("org.jetbrains.cef.JBCefJSQuery")

            logger.info("JCEF classes loaded successfully")
        } catch (e: ClassNotFoundException) {
            throw JcefNotAvailableException("JCEF classes not found", e)
        }
    }

    /**
     * 创建 JCEF Browser 面板
     *
     * @param htmlPath 资源路径，如 "/web/jcef-demo.html"
     */
    fun createBrowserPanel(htmlPath: String): JPanel {
        val panel = JPanel(BorderLayout())

        if (!isSupported()) {
            logger.warn("JCEF is not supported")
            return panel
        }

        try {
            // 获取 JBCefApp 单例
            val appMethod = jbCefAppClass!!.getMethod("getInstance")
            appMethod.invoke(null)

            // 加载资源 URL
            val url = loadResource(htmlPath)
            if (url == null) {
                logger.error("Failed to load resource: $htmlPath")
                return panel
            }

            // 创建 JBCefBrowser
            val browserConstructor = jbCefBrowserClass!!.getConstructor(String::class.java)
            browserInstance = browserConstructor.newInstance(url)

            // 获取 component
            componentMethod = jbCefBrowserClass!!.getMethod("getComponent")
            val component = componentMethod!!.invoke(browserInstance)

            if (component is java.awt.Component) {
                panel.add(component, BorderLayout.CENTER)
                isInitialized.set(true)
                logger.info("JCEF Browser created: $url")
            }

        } catch (e: Throwable) {
            logger.error("Failed to create JCEF Browser", e)
        }

        return panel
    }

    /**
     * 加载资源 URL
     */
    private fun loadResource(path: String): String? {
        return try {
            val appMethod = jbCefAppClass!!.getMethod("loadResource", String::class.java)
            appMethod.invoke(null, path) as? String
        } catch (e: Throwable) {
            logger.warn("Failed to load resource via JBCefApp: ${e.message}")
            // 降级: 使用 file:// URL
            val resourceFile = java.io.File(
                System.getProperty("user.dir") + "/src/main/resources" + path
            )
            if (resourceFile.exists()) {
                resourceFile.toURI().toString()
            } else {
                logger.error("Resource file not found: $resourceFile")
                null
            }
        }
    }

    /**
     * 发送消息到 JS
     *
     * @param functionName JS 全局函数名
     * @param data 发送给 JS 的数据
     */
    fun sendToJS(functionName: String, data: Any) {
        if (!isInitialized.get()) {
            logger.warn("Browser not initialized")
            return
        }

        try {
            val json = com.google.gson.Gson().toJson(data)
            val script = """
                if (typeof $functionName === 'function') {
                    $functionName($json);
                }
            """.trimIndent()

            val executeMethod = jbCefBrowserClass!!.getMethod(
                "executeJavaScript",
                String::class.java
            )
            executeMethod.invoke(browserInstance, script)

            logger.info("Sent to JS: $functionName")

        } catch (e: Throwable) {
            logger.error("Failed to send to JS: ${e.message}", e)
        }
    }

    /**
     * 执行任意 JavaScript
     */
    fun executeScript(script: String) {
        if (!isInitialized.get()) return

        try {
            val executeMethod = jbCefBrowserClass!!.getMethod(
                "executeJavaScript",
                String::class.java
            )
            executeMethod.invoke(browserInstance, script)
        } catch (e: Throwable) {
            logger.error("Failed to execute script: ${e.message}", e)
        }
    }

    /**
     * 刷新页面
     */
    fun reload() {
        if (!isInitialized.get()) return

        try {
            val reloadMethod = jbCefBrowserClass!!.getMethod("reload")
            reloadMethod.invoke(browserInstance)
        } catch (e: Throwable) {
            logger.error("Failed to reload: ${e.message}", e)
        }
    }

    /**
     * 通知主题变化
     */
    fun notifyThemeChange(isDark: Boolean) {
        sendToJS("onThemeChange", mapOf("isDark" to isDark))
        onThemeChange?.invoke(isDark)
    }

    /**
     * 测试消息发送
     */
    fun testSendMessage(message: String) {
        sendToJS("onJavaMessage", mapOf(
            "type" to "test",
            "content" to message,
            "timestamp" to System.currentTimeMillis()
        ))
    }

    override fun dispose() {
        if (isDisposed.getAndSet(true)) return

        try {
            // 清理 Browser
            if (browserInstance != null) {
                val disposeMethod = jbCefBrowserClass!!.getMethod("dispose")
                disposeMethod.invoke(browserInstance)
            }

            browserInstance = null
            componentMethod = null
            jbCefAppClass = null
            jbCefBrowserClass = null
            jbCefJSQueryClass = null

            logger.info("JcefBridge disposed")
        } catch (e: Throwable) {
            logger.error("Error disposing JcefBridge", e)
        }
    }
}

/**
 * JCEF 不可用异常
 */
class JcefNotAvailableException(
    message: String,
    cause: Throwable? = null
) : Exception(message, cause)
