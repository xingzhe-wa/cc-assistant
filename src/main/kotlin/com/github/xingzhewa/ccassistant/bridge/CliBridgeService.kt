package com.github.xingzhewa.ccassistant.bridge

import com.intellij.openapi.Disposable
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.components.Service
import com.intellij.openapi.diagnostic.thisLogger
import java.io.File
import java.util.concurrent.ConcurrentLinkedQueue
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean

/**
 * 消息回调接口 - UI 层通过此接口接收 CLI 消息
 */
interface CliMessageCallback {
    fun onMessage(message: CliMessage)
}

/**
 * CLI 桥接服务 - 直接管理 Claude Code CLI 进程
 *
 * 核心职责:
 * 1. 检测 CLI 安装 (claude / claude-code)
 * 2. 启动 CLI 进程 (ProcessBuilder + stream-json)
 * 3. 解析 NDJSON 输出并分发消息
 * 4. 管理进程生命周期
 *
 * CLI 调用方式:
 * ```
 * claude -p "prompt" --output-format stream-json
 * ```
 *
 * 使用示例:
 * ```kotlin
 * val service = CliBridgeService.getInstance()
 * service.registerCallback(object : CliMessageCallback {
 *     override fun onMessage(message: CliMessage) {
 *         when (message) {
 *             is CliMessage.TextDelta -> appendText(message.text)
 *             is CliMessage.Result -> showResult(message)
 *             is CliMessage.Error -> showError(message)
 *             else -> {}
 *         }
 *     }
 * })
 * service.executePrompt("say hi")
 * ```
 */
@Service(Service.Level.APP)
class CliBridgeService : Disposable {

    private val logger = thisLogger()
    private val parser = NdjsonParser()
    private val callbacks = ConcurrentLinkedQueue<CliMessageCallback>()
    private val isExecuting = AtomicBoolean(false)

    @Volatile
    private var currentProcess: Process? = null

    @Volatile
    private var detectedCli: String? = null

    companion object {
        private val CLI_NAMES = listOf("claude", "claude-code")
        private const val DETECTION_TIMEOUT_SECONDS = 5L
        private const val PROCESS_DESTROY_TIMEOUT_SECONDS = 3L

        fun getInstance(): CliBridgeService =
            ApplicationManager.getApplication().getService(CliBridgeService::class.java)
    }

    // ========== CLI 检测 ==========

    /**
     * 检测 Claude Code CLI 是否已安装
     * @return CLI 二进制名称，未找到返回 null
     */
    fun detectCli(): String? {
        if (detectedCli != null) return detectedCli

        for (name in CLI_NAMES) {
            try {
                val process = ProcessBuilder(name, "--version")
                    .redirectErrorStream(true)
                    .start()
                val exited = process.waitFor(DETECTION_TIMEOUT_SECONDS, TimeUnit.SECONDS)
                if (exited && process.exitValue() == 0) {
                    detectedCli = name
                    logger.info("Detected Claude Code CLI: $name")
                    return name
                }
                process.destroyForcibly()
            } catch (_: Exception) {
                // CLI not found in PATH, try next
            }
        }

        logger.warn("Claude Code CLI not found. Tried: ${CLI_NAMES.joinToString()}")
        return null
    }

    /**
     * 获取 CLI 版本信息
     */
    fun getCliVersion(): String? {
        val cli = detectCli() ?: return null
        return try {
            val process = ProcessBuilder(cli, "--version")
                .redirectErrorStream(true)
                .start()
            val output = process.inputStream.bufferedReader().readText().trim()
            process.waitFor(DETECTION_TIMEOUT_SECONDS, TimeUnit.SECONDS)
            output
        } catch (e: Exception) {
            logger.warn("Failed to get CLI version", e)
            null
        }
    }

    /**
     * 检查 CLI 是否可用
     */
    fun isCliAvailable(): Boolean = detectCli() != null

    // ========== Prompt 执行 ==========

    /**
     * 执行单次 Prompt (非交互模式)
     *
     * 使用 `claude -p "prompt" --output-format stream-json` 执行单次查询，
     * 流式解析 NDJSON 输出并通过回调分发消息。
     *
     * @param prompt 用户输入
     * @param workingDir 工作目录 (可选，默认为当前项目目录)
     * @param model 模型名称 (可选)
     * @param agent Agent名称 (可选，非 "default" 时传递)
     * @param sessionId 会话ID (可选，用于--resume恢复)
     * @param mode 工作模式 (可选: "auto"/"plan"/"agent")
     * @param think 是否启用扩展思考 (可选，当前 CLI 无对应 flag，保留参数位)
     * @param permissionMode 权限模式 (可选，覆盖 mode 的默认映射)
     * @param envVars 环境变量映射 (可选，会被合并到进程环境，ANTHROPIC_AUTH_TOKEN 不会通过此参数传递)
     * @return true 如果进程成功启动
     */
    fun executePrompt(
        prompt: String,
        workingDir: String? = null,
        model: String? = null,
        agent: String? = null,
        sessionId: String? = null,
        mode: String? = null,
        think: Boolean? = null,
        permissionMode: String? = null,
        envVars: Map<String, String>? = null
    ): Boolean {
        if (!isExecuting.compareAndSet(false, true)) {
            notifyError("Another prompt is already executing")
            return false
        }

        val cli = detectCli()
        if (cli == null) {
            isExecuting.set(false)
            notifyError("Claude Code CLI not found. Please install Claude Code first.")
            return false
        }

        // 停止已有进程
        stopCurrentProcess()

        // 构建命令
        val command = mutableListOf<String>()

        // sessionId 优先：使用 --resume 恢复会话
        if (sessionId != null) {
            command.addAll(listOf(cli, "--resume", sessionId, "--output-format", "stream-json"))
        } else {
            // 首次会话：使用 -p 模式
            command.addAll(listOf(cli, "-p", prompt, "--output-format", "stream-json"))
        }

        // model 参数
        model?.let {
            command.add("--model")
            command.add(it)
        }

        // agent 参数（非 "default" 时传递）
        agent?.let {
            if (it != "default") {
                command.add("--agent")
                command.add(it)
            }
        }

        // 权限模式：permissionMode 显式指定时优先；否则根据 mode 映射
        val effectivePermissionMode = permissionMode ?: when (mode) {
            "auto", "agent" -> "accept-all"
            "plan" -> null  // plan 模式不传 permission-mode，CLI 会暂停等确认
            else -> "accept-all"  // 默认 auto 行为
        }
        effectivePermissionMode?.let {
            command.add("--permission-mode")
            command.add(it)
        }

        logger.info("Starting CLI process: ${command.take(3).joinToString(" ")}... mode=$mode, agent=$agent")

        try {
            val builder = ProcessBuilder(command)
            workingDir?.let { builder.directory(File(it)) }
            builder.redirectErrorStream(false)

            // 合并环境变量（不包含 ANTHROPIC_AUTH_TOKEN，它应保持在 settings.json 中）
            envVars?.let { vars ->
                if (vars.isNotEmpty()) {
                    val env = builder.environment()
                    vars.forEach { (key, value) ->
                        // ANTHROPIC_AUTH_TOKEN 必须通过 settings.json 管理，不传 env var
                        if (key != "ANTHROPIC_AUTH_TOKEN") {
                            env[key] = value
                        }
                    }
                }
            }

            val process = builder.start()
            currentProcess = process

            // 启动 stdout 读取线程
            Thread({ readProcessOutput(process) }, "CC-CLI-Output").start()

            // 启动 stderr 读取线程
            Thread({ readProcessError(process) }, "CC-CLI-Error").start()

            return true
        } catch (e: Exception) {
            logger.error("Failed to start CLI process", e)
            isExecuting.set(false)
            notifyError("Failed to start CLI: ${e.message}")
            return false
        }
    }

    /**
     * 中断当前操作
     */
    fun interrupt() {
        currentProcess?.let {
            logger.info("Interrupting CLI process...")
            it.destroy()
        }
    }

    /**
     * 检查是否有进程正在运行
     */
    fun isRunning(): Boolean = currentProcess?.isAlive == true

    // ========== 回调管理 ==========

    /**
     * 注册消息回调
     */
    fun registerCallback(callback: CliMessageCallback) {
        callbacks.add(callback)
    }

    /**
     * 移除消息回调
     */
    fun unregisterCallback(callback: CliMessageCallback) {
        callbacks.remove(callback)
    }

    // ========== 内部方法 ==========

    private fun readProcessOutput(process: Process) {
        try {
            val reader = process.inputStream.bufferedReader()
            var line: String?
            while (reader.readLine().also { line = it } != null) {
                val messages = parser.parseLine(line!!)
                messages.forEach { message ->
                    callbacks.forEach { callback ->
                        try {
                            callback.onMessage(message)
                        } catch (e: Exception) {
                            logger.error("Callback error", e)
                        }
                    }
                }
            }
        } catch (e: Exception) {
            if (currentProcess?.isAlive == true) {
                logger.error("Error reading CLI output", e)
            }
        } finally {
            isExecuting.set(false)
            logger.info("CLI output reader finished")
        }
    }

    private fun readProcessError(process: Process) {
        try {
            val reader = process.errorStream.bufferedReader()
            var line: String?
            while (reader.readLine().also { line = it } != null) {
                logger.warn("CLI stderr: $line")
            }
        } catch (_: Exception) {
            // Process terminated
        }
    }

    private fun stopCurrentProcess() {
        currentProcess?.let { process ->
            if (process.isAlive) {
                process.destroy()
                try {
                    process.waitFor(PROCESS_DESTROY_TIMEOUT_SECONDS, TimeUnit.SECONDS)
                } catch (_: InterruptedException) {
                    Thread.currentThread().interrupt()
                }
                if (process.isAlive) {
                    process.destroyForcibly()
                }
            }
        }
        currentProcess = null
    }

    private fun notifyError(message: String) {
        callbacks.forEach { callback ->
            try {
                callback.onMessage(CliMessage.Error(message))
            } catch (e: Exception) {
                logger.error("Callback error", e)
            }
        }
    }

    override fun dispose() {
        stopCurrentProcess()
        callbacks.clear()
    }
}
