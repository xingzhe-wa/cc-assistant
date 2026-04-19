package com.github.xingzhewa.ccassistant.ui.chat

import com.github.xingzhewa.ccassistant.bridge.CliBridgeService
import com.github.xingzhewa.ccassistant.bridge.CliMessage
import com.github.xingzhewa.ccassistant.bridge.CliMessageCallback
import com.github.xingzhewa.ccassistant.model.ProviderService
import com.github.xingzhewa.ccassistant.services.SkillAgentService
import com.google.gson.Gson
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.application.invokeLater
import com.intellij.openapi.diagnostic.thisLogger
import com.intellij.ui.jcef.JBCefApp
import java.awt.BorderLayout
import javax.swing.JPanel

/**
 * React 聊天面板 - JCEF + React 前端集成
 *
 * 职责:
 * - 创建 JCEF Browser 加载 React 应用
 * - 桥接 CliBridgeService ↔ JcefChatPanel ↔ React App
 * - 管理会话状态、消息流、主题等
 */
class ReactChatPanel(
    private val workingDir: String? = null
) : JPanel(BorderLayout()) {

    private val logger = thisLogger()
    private val gson = Gson()

    private val cliService: CliBridgeService = CliBridgeService.getInstance()
    private var jcefPanel: JcefChatPanel? = null
    private var cliCallback: CliMessageCallback? = null

    // 当前会话状态
    private var currentSessionId: String? = null
    private var currentMessageId: String? = null

    // 防止重复推送数据（onPageLoaded 可能触发多次）
    private var isDataPushed = false

    companion object {
        private val panels = java.util.concurrent.ConcurrentHashMap<String, ReactChatPanel>()

        /** 注册面板实例，供 Action 查找 */
        fun register(projectName: String, panel: ReactChatPanel) {
            panels[projectName] = panel
        }

        /** 注销面板实例 */
        fun unregister(projectName: String) {
            panels.remove(projectName)
        }

        /** 获取指定项目的面板实例 */
        fun getInstance(project: com.intellij.openapi.project.Project): ReactChatPanel? {
            return panels[project.name]
        }
    }

    init {
        initJcefPanel()
        initCliBridge()
    }

    /**
     * 设置关联项目（由 MyToolWindowFactory 调用）
     */
    var associatedProject: com.intellij.openapi.project.Project? = null
        set(value) {
            field = value
            value?.let { register(it.name, this) }
        }

    /**
     * 注入文件路径到输入框
     */
    fun insertFileReference(path: String) {
        jcefPanel?.insertFileReference(path)
    }

    /**
     * 注入代码引用到输入框（带行号范围）
     */
    fun insertCodeReference(source: String, lineStart: Int, lineEnd: Int) {
        jcefPanel?.insertCodeReference(source, lineStart, lineEnd)
    }

    /**
     * 注入代码片段到输入框
     * @deprecated 使用 insertCodeReference(source, lineStart, lineEnd) 替代
     */
    fun insertCodeReference(code: String, source: String) {
        jcefPanel?.insertCodeReference(code, source)
    }

    private fun initJcefPanel() {
        if (!JBCefApp.isSupported()) {
            logger.warn("JCEF not supported")
            add(JPanel().apply {
                add(javax.swing.JLabel("JCEF 不可用，请升级到 IDEA 2024.1+"))
            }, BorderLayout.CENTER)
            return
        }

        // 创建真正的 JcefChatPanel
        jcefPanel = JcefChatPanel().apply {
            // 设置 JS → Java 回调
            setupCallbacks()

            // 页面加载完成后再推送数据，避免与 React mount 竞态
            onPageLoaded = {
                if (!isDataPushed) {
                    isDataPushed = true
                    pushProvidersToFrontend()
                    scanAndPushSkillsAgents()
                }
            }
        }

        val panel = jcefPanel!!.createPanel()
        add(panel, BorderLayout.CENTER)

        logger.info("ReactChatPanel initialized with JcefChatPanel")
    }

    private fun JcefChatPanel.setupCallbacks() {
        // 消息操作回调
        onCopyMessage = { id, content ->
            logger.info("Copy message: $id")
            java.awt.Toolkit.getDefaultToolkit().systemClipboard.setContents(
                java.awt.datatransfer.StringSelection(content),
                null
            )
        }

        onQuoteMessage = { id, content ->
            logger.info("Quote message: $id")
            // TODO: 实现引用功能
        }

        onRegenerate = { id ->
            logger.info("Regenerate: $id")
            // TODO: 实现重新生成
        }

        onRewind = { id ->
            logger.info("Rewind: $id")
            // TODO: 实现回退功能
        }

        onCopyCode = { code ->
            java.awt.Toolkit.getDefaultToolkit().systemClipboard.setContents(
                java.awt.datatransfer.StringSelection(code),
                null
            )
        }

        onSendMessage = { text, options ->
            logger.info("Send message: ${text.take(50)}...")
            handleSendMessage(text, options)
        }

        onStopGeneration = {
            logger.info("Stop generation requested")
            cliService.interrupt()
        }

        // 主题/设置回调
        onThemeChange = { themeId ->
            logger.info("Theme change: $themeId")
            // TODO: 实现主题切换
        }

        onProviderChange = { providerId ->
            logger.info("Provider change: $providerId")
            ProviderService.getInstance().switchProvider(providerId)
        }

        onProviderCreate = { data ->
            val id = data["id"]
            if (id != null) {
                logger.info("Provider create: $id")
                val provider = ProviderService.PRESET_PROVIDERS.find { it.id == id }
                    ?: com.github.xingzhewa.ccassistant.model.ProviderConfig(
                        id = id,
                        name = data["name"] ?: "",
                        endpoint = data["endpoint"] ?: data["url"] ?: "",
                        defaultModel = data["defaultModel"] ?: ""
                    )
                ProviderService.getInstance().saveProvider(provider, data["apiKey"])
            }
        }

        onProviderUpdate = { data ->
            val id = data["id"]
            if (id != null) {
                logger.info("Provider update: $id")
                val provider = ProviderService.PRESET_PROVIDERS.find { it.id == id }
                    ?: com.github.xingzhewa.ccassistant.model.ProviderConfig(
                        id = id,
                        name = data["name"] ?: "",
                        endpoint = data["endpoint"] ?: data["url"] ?: "",
                        defaultModel = data["defaultModel"] ?: ""
                    )
                ProviderService.getInstance().saveProvider(provider, data["apiKey"])
            }
        }

        onProviderDelete = { providerId ->
            logger.info("Provider delete: $providerId")
            ProviderService.getInstance().deleteProvider(providerId)
        }

        onCheckCli = {
            checkCliStatus()
        }

        // 会话操作回调
        onDeleteSession = { id ->
            logger.info("Delete session: $id")
            // TODO: 实现会话删除
        }

        onToggleFavorite = { id, fav ->
            logger.info("Toggle favorite: $id = $fav")
            // TODO: 实现收藏切换
        }

        onRenameSession = { id, title ->
            logger.info("Rename session: $id -> $title")
            // TODO: 实现会话重命名
        }

        // 文件搜索回调（供 @file 引用弹窗使用）
        onSearchFiles = { query ->
            handleSearchFiles(query)
        }

        // 打开设置页面回调
        onOpenSettings = { tab ->
            logger.info("Open settings: $tab")
            jcefPanel?.openSettings(tab)
        }

        // Skill 切换回调
        onSkillChange = { skillId ->
            logger.info("Skill change: $skillId")
            // TODO: 实现 Skill 切换逻辑
        }

        // Agent CRUD 回调
        onAgentCreate = { data ->
            val id = data["id"]
            val project = associatedProject
            if (id != null && project != null) {
                logger.info("Agent create: $id")
                val service = SkillAgentService(project)
                service.createAgent(
                    id = id,
                    name = data["name"] ?: "",
                    description = data["description"] ?: "",
                    systemPrompt = data["systemPrompt"] ?: data["description"] ?: ""
                )
            }
        }

        onAgentUpdate = { data ->
            val id = data["id"]
            val project = associatedProject
            if (id != null && project != null) {
                logger.info("Agent update: $id")
                val service = SkillAgentService(project)
                service.updateAgent(
                    id = id,
                    name = data["name"] ?: "",
                    description = data["description"] ?: "",
                    systemPrompt = data["systemPrompt"] ?: data["description"] ?: ""
                )
            }
        }

        onAgentDelete = { agentId ->
            val project = associatedProject
            if (project != null) {
                logger.info("Agent delete: $agentId")
                val service = SkillAgentService(project)
                service.deleteAgent(agentId)
            }
        }

        // Skill CRUD 回调
        onSkillCreate = { data ->
            val id = data["id"]
            val project = associatedProject
            if (id != null && project != null) {
                logger.info("Skill create: $id")
                val service = SkillAgentService(project)
                service.createSkill(
                    id = id,
                    name = data["name"] ?: "",
                    description = data["description"] ?: "",
                    instructions = data["instructions"] ?: data["description"] ?: "",
                    trigger = data["trigger"]
                )
            }
        }

        onSkillUpdate = { data ->
            val id = data["id"]
            val project = associatedProject
            if (id != null && project != null) {
                logger.info("Skill update: $id")
                val service = SkillAgentService(project)
                service.updateSkill(
                    id = id,
                    name = data["name"] ?: "",
                    description = data["description"] ?: "",
                    instructions = data["instructions"] ?: data["description"] ?: "",
                    trigger = data["trigger"]
                )
            }
        }

        onSkillDelete = { skillId ->
            val project = associatedProject
            if (project != null) {
                logger.info("Skill delete: $skillId")
                val service = SkillAgentService(project)
                service.deleteSkill(skillId)
            }
        }
    }

    private fun initCliBridge() {
        cliCallback = object : CliMessageCallback {
            override fun onMessage(message: CliMessage) {
                ApplicationManager.getApplication().invokeLater {
                    handleCliMessage(message)
                }
            }
        }
        cliCallback?.let { cliService.registerCallback(it) }
    }

    private fun handleSendMessage(text: String, options: JcefChatPanel.MessageOptions) {
        if (text.isBlank()) return

        // 1. 清空输入框（用户消息由前端 chatStore 添加，不在此处重复添加）
        jcefPanel?.clearInput()

        // 2. 执行 CLI（使用选项中的 model，如果未指定则从当前 provider 的默认模型获取）
        val modelToUse = options.model ?: getDefaultModelForProvider(options.provider)
        cliService.executePrompt(
            prompt = text,
            workingDir = workingDir,
            model = modelToUse,
            agent = options.agent,
            sessionId = currentSessionId,
            mode = options.mode,
            think = options.think
        )
    }

    /**
     * 加载会话到当前面板（用于会话恢复）
     */
    fun loadSession(sessionId: String) {
        this.currentSessionId = sessionId
        logger.info("Loaded session: $sessionId")
    }

    /**
     * 获取指定 Provider 的默认模型
     */
    private fun getDefaultModelForProvider(providerId: String?): String? {
        if (providerId == null) return null
        return try {
            val provider = ProviderService.PRESET_PROVIDERS.find { it.id == providerId }
            val models = ProviderService.PRESET_MODELS[providerId]
            models?.firstOrNull()?.id
        } catch (e: Exception) {
            logger.warn("Failed to get default model for provider $providerId", e)
            null
        }
    }

    /**
     * 处理文件搜索请求（@file 引用弹窗）
     * 使用 IntelliJ 的 FilenameIndex 搜索项目文件
     */
    private fun handleSearchFiles(query: String) {
        val project = associatedProject ?: return
        if (query.isBlank()) return

        com.intellij.openapi.application.ApplicationManager.getApplication().executeOnPooledThread {
            try {
                val results = mutableListOf<Map<String, String>>()
                val searchQuery = query.lowercase()

                // 使用 FilenameIndex 搜索文件名
                com.intellij.openapi.application.ApplicationManager.getApplication().runReadAction {
                    com.intellij.openapi.project.DumbService.getInstance(project).runReadActionInSmartMode(java.lang.Runnable {
                        val allFiles = com.intellij.ide.util.PsiNavigationSupport.getInstance()
                        // 简化实现：使用 VirtualFile 遍历项目根目录
                        val baseDir = project.baseDir
                        val maxResults = 20

                        fun searchDir(dir: com.intellij.openapi.vfs.VirtualFile, depth: Int = 0) {
                            if (results.size >= maxResults || depth > 8) return
                            for (child in dir.children) {
                                if (results.size >= maxResults) break
                                if (child.name.lowercase().contains(searchQuery)) {
                                    val relPath = child.path.removePrefix(baseDir.path + "/")
                                    results.add(mapOf(
                                        "name" to child.name,
                                        "path" to relPath,
                                        "type" to if (child.isDirectory) "directory" else "file"
                                    ))
                                }
                                if (child.isDirectory && !child.name.startsWith(".") && child.name != "node_modules" && child.name != "build") {
                                    searchDir(child, depth + 1)
                                }
                            }
                        }
                        searchDir(baseDir)
                    })
                }

                invokeLater {
                    jcefPanel?.setFileList(results)
                }
            } catch (e: Throwable) {
                logger.error("Failed to search files", e)
            }
        }
    }

    private fun handleCliMessage(message: CliMessage) {
        when (message) {
            is CliMessage.TextDelta -> {
                // 流式输出
                val id = jcefPanel?.appendStreamingContent(
                    "assistant",
                    message.text,
                    currentMessageId
                )
                // 存储当前消息 ID 用于完成
                id?.let { currentMessageId = it }
            }
            is CliMessage.ThinkingDelta -> {
                // Thinking 内容
                jcefPanel?.appendStreamingContent(
                    "thinking",
                    message.text,
                    null
                )
            }
            is CliMessage.ToolUseStart -> {
                // 工具使用中
                jcefPanel?.appendStreamingContent(
                    "tool",
                    "Using ${message.name}...",
                    null
                )
            }
            is CliMessage.Result -> {
                // 完成流式输出
                jcefPanel?.finishStreaming(currentMessageId)
                currentMessageId = null
                // 保存 sessionId 用于续接
                message.sessionId?.let { currentSessionId = it }
                logger.info("Message complete, cost: ${message.costUsd}")
            }
            is CliMessage.Error -> {
                jcefPanel?.finishStreaming(currentMessageId)
                currentMessageId = null
                jcefPanel?.appendErrorMessage(message.message)
                logger.error("CLI Error: ${message.message}")
            }
            else -> { /* 忽略其他类型 */ }
        }
    }

    private fun checkCliStatus() {
        if (cliService.isCliAvailable()) {
            val version = cliService.getCliVersion()
            logger.info("CLI available: $version")
            // TODO: 通过 JCEF 显示 CLI 状态
        } else {
            logger.warn("CLI not available")
            // TODO: 通过 JCEF 显示 CLI 不可用提示
        }
    }

    /**
     * 清理资源
     */
    fun dispose() {
        associatedProject?.let { unregister(it.name) }
        cliCallback?.let { cliService.unregisterCallback(it) }
        cliCallback = null
        jcefPanel?.dispose()
        jcefPanel = null
    }

    /**
     * 扫描 Skills/Agents 并推送到前端
     */
    private fun scanAndPushSkillsAgents() {
        val project = associatedProject ?: return
        try {
            val service = SkillAgentService(project)
            val skills = service.scanSkills()
            val agents = service.scanAgents()

            if (skills.isNotEmpty() || agents.isNotEmpty()) {
                jcefPanel?.setSkillsAndAgents(
                    skills = skills.map {
                        JcefChatPanel.SkillBridgeData(
                            id = it.id,
                            name = it.name,
                            description = it.description,
                            trigger = it.trigger,
                            scope = it.scope.name.lowercase()
                        )
                    },
                    agents = agents.map {
                        JcefChatPanel.AgentBridgeData(
                            id = it.id,
                            name = it.name,
                            description = it.description,
                            scope = it.scope.name.lowercase()
                        )
                    }
                )
                logger.info("Pushed ${skills.size} skills and ${agents.size} agents to frontend")
            }
        } catch (e: Exception) {
            logger.warn("Failed to scan skills/agents", e)
        }
    }

    /**
     * 推送预置 Provider 数据到前端
     */
    private fun pushProvidersToFrontend() {
        try {
            // 从预置配置转换为前端数据格式
            val providers = ProviderService.PRESET_PROVIDERS.map {
                JcefChatPanel.ProviderData(it.id, it.name, it.endpoint)
            }

            val models = ProviderService.PRESET_MODELS.mapValues { (_, models) ->
                models.map { JcefChatPanel.ModelData(it.id, it.name) }
            }

            val agents = ProviderService.PRESET_AGENTS.map {
                JcefChatPanel.AgentData(it.id, it.name ?: it.id)
            }

            if (providers.isNotEmpty()) {
                jcefPanel?.setProviders(providers, models, agents)
                logger.info("Pushed ${providers.size} providers to frontend")
            }
        } catch (e: Exception) {
            logger.warn("Failed to push providers to frontend", e)
        }
    }
}
