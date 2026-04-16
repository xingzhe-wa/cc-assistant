package com.github.xingzhewa.ccassistant.services

import com.intellij.openapi.components.Service
import com.intellij.openapi.diagnostic.thisLogger
import javax.swing.UIManager

/**
 * 主题服务 - 监听 IDE 主题变化，提供 CSS 变量映射
 */
@Service(Service.Level.APP)
class ThemeService {

    private val logger = thisLogger()

    // 主题变更监听器
    private val themeChangeListeners = mutableListOf<ThemeChangeListener>()

    interface ThemeChangeListener {
        fun onThemeChange(themeId: String, isDark: Boolean)
    }

    /**
     * 获取当前主题 ID
     */
    fun getCurrentThemeId(): String {
        val laf = UIManager.getLookAndFeel()
        val lafId = laf?.id?.lowercase() ?: "dark"

        return when {
            lafId.contains("darcula") || lafId.contains("dark") || lafId.contains("vuescreated") -> "dark"
            lafId.contains("highcontrast") || lafId.contains("contrast") -> "high-contrast"
            else -> "light"
        }
    }

    /**
     * 是否为深色主题
     */
    fun isDarkTheme(): Boolean {
        return getCurrentThemeId() == "dark"
    }

    /**
     * 获取主题 CSS 变量映射
     */
    val themeVariables: Map<String, String>
        get() {
            val themeId = getCurrentThemeId()
            return when (themeId) {
                "dark" -> darkThemeVariables
                "light" -> lightThemeVariables
                "high-contrast" -> highContrastVariables
                else -> darkThemeVariables
            }
        }

    /**
     * 刷新主题 (通知所有监听器)
     */
    fun notifyThemeChange() {
        val themeId = getCurrentThemeId()
        val isDark = isDarkTheme()
        themeChangeListeners.forEach { listener ->
            try {
                listener.onThemeChange(themeId, isDark)
            } catch (e: Throwable) {
                logger.error("Error in theme change listener", e)
            }
        }
    }

    /**
     * 添加主题变更监听器
     */
    fun addThemeChangeListener(listener: ThemeChangeListener) {
        themeChangeListeners.add(listener)
    }

    /**
     * 移除主题变更监听器
     */
    fun removeThemeChangeListener(listener: ThemeChangeListener) {
        themeChangeListeners.remove(listener)
    }

    companion object {
        // 深色主题变量
        private val darkThemeVariables = mapOf(
            "--theme-bg" to "#111214",
            "--theme-surface" to "#17181d",
            "--theme-elevated" to "#1e2028",
            "--theme-hover" to "#272933",
            "--theme-border" to "#23252e",
            "--theme-text-primary" to "#d0d1d8",
            "--theme-text-secondary" to "#87899a",
            "--theme-text-muted" to "#494b5a",
            "--theme-accent" to "#c9873a",
            "--theme-accent2" to "#daa04e",
            "--theme-success" to "#50b85e",
            "--theme-error" to "#d95555",
            "--theme-info" to "#4db8cc",
            "--theme-purple" to "#9b80e8",
            "--theme-add" to "rgba(80, 184, 94, 0.1)",
            "--theme-del" to "rgba(217, 85, 85, 0.1)"
        )

        // 亮色主题变量
        private val lightThemeVariables = mapOf(
            "--theme-bg" to "#ffffff",
            "--theme-surface" to "#f7f8fa",
            "--theme-elevated" to "#ffffff",
            "--theme-hover" to "#f0f1f3",
            "--theme-border" to "#e5e6eb",
            "--theme-text-primary" to "#1a1a1a",
            "--theme-text-secondary" to "#5c5c5c",
            "--theme-text-muted" to "#9999a3",
            "--theme-accent" to "#b86e1a",
            "--theme-accent2" to "#cc8a30",
            "--theme-success" to "#2e8b4e",
            "--theme-error" to "#c04040",
            "--theme-info" to "#2a8fa0",
            "--theme-purple" to "#7a5ce0",
            "--theme-add" to "rgba(46, 139, 78, 0.1)",
            "--theme-del" to "rgba(192, 64, 64, 0.1)"
        )

        // 高对比度主题变量
        private val highContrastVariables = mapOf(
            "--theme-bg" to "#000000",
            "--theme-surface" to "#1a1a1a",
            "--theme-elevated" to "#2a2a2a",
            "--theme-hover" to "#3a3a3a",
            "--theme-border" to "#5a5a5a",
            "--theme-text-primary" to "#ffffff",
            "--theme-text-secondary" to "#cccccc",
            "--theme-text-muted" to "#888888",
            "--theme-accent" to "#ffaa44",
            "--theme-accent2" to "#ffcc66",
            "--theme-success" to "#66dd77",
            "--theme-error" to "#ff6666",
            "--theme-info" to "#66ccdd",
            "--theme-purple" to "#bb99ff",
            "--theme-add" to "rgba(102, 221, 119, 0.2)",
            "--theme-del" to "rgba(255, 102, 102, 0.2)"
        )
    }
}
