package com.github.xingzhewa.ccassistant.ui.chat

import com.intellij.openapi.Disposable
import java.awt.BorderLayout
import java.util.concurrent.atomic.AtomicBoolean
import javax.swing.JComponent
import javax.swing.JLabel
import javax.swing.JPanel

/**
 * JCEF 消息渲染器管理器 (M2-A1 骨架版)
 * 负责创建和管理 JCEF Browser 实例，用于渲染聊天消息
 *
 * 当前为骨架版本，仅供编译验证
 * 完整JCEF功能在后续任务中实现
 */
class JcefMessageRenderer : Disposable {

    private val isDisposed = AtomicBoolean(false)
    private var cefLoaded = false

    /**
     * 检查 JCEF 是否可用
     */
    fun isCefSupported(): Boolean {
        return try {
            // 尝试加载 JBCefApp 类
            Class.forName("org.jetbrains.cef.JBCefApp")
            true
        } catch (e: ClassNotFoundException) {
            false
        }
    }

    /**
     * 创建消息渲染面板
     * 当前返回占位面板，完整JCEF在后续实现
     */
    fun createPanel(): JComponent {
        return JPanel(BorderLayout()).apply {
            val statusLabel = if (isCefSupported()) {
                JLabel("JCEF Ready ✓ - 点击发送消息开始对话")
            } else {
                JLabel("JCEF Loading...")
            }
            add(statusLabel, BorderLayout.NORTH)

            // 添加提示
            add(JLabel("<html><div style='padding: 20px; text-align: center; color: #666;'>" +
                    "📨 JCEF 消息渲染区 (M2-A1)<br><br>" +
                    "输入消息并点击发送，AI 响应将显示在此区域<br>" +
                    "完整功能: Markdown渲染、代码高亮、流式输出</div></html>"), BorderLayout.CENTER)
        }
    }

    /**
     * 追加消息 (骨架版)
     */
    fun appendMessage(role: String, content: String) {
        // todo: 后续实现完整消息追加
    }

    /**
     * 清空消息 (骨架版)
     */
    fun clear() {
        // todo: 后续实现
    }

    override fun dispose() {
        isDisposed.set(true)
    }
}