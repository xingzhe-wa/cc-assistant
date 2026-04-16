package com.github.xingzhewa.ccassistant.services

import com.intellij.openapi.components.Service
import com.intellij.openapi.diagnostic.thisLogger
import com.github.xingzhewa.ccassistant.MyBundle
import java.io.InputStreamReader
import java.nio.charset.StandardCharsets
import java.util.PropertyResourceBundle

/**
 * 国际化服务 - 从 MyBundle.properties 读取所有消息字符串
 */
@Service(Service.Level.APP)
class I18nService {

    private val logger = thisLogger()

    // 缓存的消息映射
    private var cachedMessages: Map<String, String>? = null

    /**
     * 获取所有消息字符串
     */
    val allMessages: Map<String, String>
        get() {
            cachedMessages?.let { return it }

            val messages = mutableMapOf<String, String>()

            try {
                // 从类路径加载 MyBundle.properties
                val stream = javaClass.classLoader.getResourceAsStream("messages/MyBundle.properties")
                if (stream != null) {
                    val bundle = PropertyResourceBundle(InputStreamReader(stream, StandardCharsets.UTF_8))
                    val keys = bundle.keys
                    while (keys.hasMoreElements()) {
                        val key = keys.nextElement() as String
                        messages[key] = bundle.getString(key)
                    }
                    stream.close()
                    logger.info("Loaded ${messages.size} i18n messages")
                } else {
                    logger.warn("MyBundle.properties not found in classpath")
                }
            } catch (e: Throwable) {
                logger.error("Failed to load i18n messages", e)
            }

            cachedMessages = messages
            return messages
        }

    /**
     * 获取单个消息
     */
    fun getMessage(key: String, vararg params: Any): String {
        return try {
            MyBundle.message(key, *params)
        } catch (e: Throwable) {
            logger.warn("Missing i18n key: $key")
            key
        }
    }

    /**
     * 获取当前语言环境
     */
    fun getLocale(): String {
        return java.util.Locale.getDefault().toLanguageTag()
    }

    /**
     * 清除缓存 (下次调用时重新加载)
     */
    fun clearCache() {
        cachedMessages = null
    }
}
