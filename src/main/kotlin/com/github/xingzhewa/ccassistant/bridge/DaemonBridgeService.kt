package com.github.xingzhewa.ccassistant.bridge

import com.intellij.openapi.Disposable
import com.intellij.openapi.components.Service
import com.intellij.openapi.diagnostic.thisLogger
import java.io.OutputStreamWriter
import java.util.concurrent.ConcurrentLinkedQueue
import java.util.concurrent.Executors

/**
 * Daemon 消息类型
 */
sealed class DaemonMessage {
    data class Chunk(val content: String) : DaemonMessage()
    data class Thinking(val content: String) : DaemonMessage()
    data class ToolUse(val toolName: String, val toolInput: String) : DaemonMessage()
    data class Complete(val content: String, val usage: Map<String, Any>) : DaemonMessage()
    data class Error(val message: String) : DaemonMessage()
    object Ready : DaemonMessage()
}

/**
 * 消息回调接口
 */
interface MessageCallback {
    fun onChunk(content: String) {}
    fun onThinking(content: String) {}
    fun onToolUse(toolName: String, toolInput: String) {}
    fun onComplete(content: String, usage: Map<String, Any>) {}
    fun onError(message: String) {}
    fun onReady() {}
}

/**
 * Daemon 桥接服务 - 管理 Node.js Daemon 进程
 */
@Service
class DaemonBridgeService : Disposable {

    private val logger = thisLogger()
    private var daemonProcess: Process? = null
    private var processWriter: OutputStreamWriter? = null
    private val messageCallbacks = ConcurrentLinkedQueue<MessageCallback>()
    private val executor = Executors.newCachedThreadPool()

    private var isReady = false

    /**
     * 启动 Daemon
     */
    fun startDaemon(): Boolean {
        if (daemonProcess?.isAlive == true) {
            return true
        }

        logger.info("Starting Daemon process...")

        try {
            // TODO: 后续实现实际的 daemon.js 启动逻辑
            // 目前是占位实现
            isReady = true
            logger.info("Daemon process started (placeholder)")
            return true
        } catch (e: Exception) {
            logger.error("Failed to start Daemon process", e)
            return false
        }
    }

    /**
     * 停止 Daemon
     */
    fun stopDaemon() {
        daemonProcess?.let { process ->
            if (process.isAlive) {
                logger.info("Stopping Daemon process...")
                process.destroy()
                try {
                    process.waitFor()
                } catch (e: InterruptedException) {
                    Thread.currentThread().interrupt()
                }
            }
        }
        daemonProcess = null
        processWriter?.close()
        processWriter = null
        isReady = false
    }

    /**
     * 发送消息到 Daemon
     */
    fun sendMessage(content: String) {
        if (!isReady) {
            logger.warn("Daemon not ready, cannot send message")
            return
        }

        executor.execute {
            try {
                processWriter?.write(content)
                processWriter?.write("\n")
                processWriter?.flush()
            } catch (e: Exception) {
                logger.error("Failed to send message to Daemon", e)
                messageCallbacks.forEach { it.onError(e.message ?: "Unknown error") }
            }
        }
    }

    /**
     * 注册消息回调
     */
    fun registerCallback(callback: MessageCallback) {
        messageCallbacks.add(callback)
    }

    /**
     * 移除消息回调
     */
    fun unregisterCallback(callback: MessageCallback) {
        messageCallbacks.remove(callback)
    }

    /**
     * 检查 Daemon 是否就绪
     */
    fun isReady(): Boolean = isReady

    /**
     * 检查 Daemon 是否运行中
     */
    fun isRunning(): Boolean = daemonProcess?.isAlive == true

    override fun dispose() {
        stopDaemon()
        executor.shutdown()
    }
}
