package com.github.xingzhewa.ccassistant.model

import com.google.gson.Gson
import com.google.gson.annotations.SerializedName
import com.intellij.openapi.components.Service
import com.intellij.openapi.diagnostic.thisLogger
import java.io.File

/**
 * Claude Code 配置文件模型
 *
 * 支持 settings.json 格式:
 * {
 *   "env": { ... },
 *   "permissions": { ... },
 *   "skills": [ ... ],
 *   "agents": [ ... ]
 * }
 */
data class ClaudeSettings(
    @SerializedName("env")
    val env: Map<String, String> = emptyMap(),

    @SerializedName("permissions")
    val permissions: PermissionsConfig? = null,

    @SerializedName("skills")
    val skills: List<SkillConfig>? = null,

    @SerializedName("agents")
    val agents: List<AgentConfig>? = null,

    @SerializedName("mcpServers")
    val mcpServers: List<McpServerConfig>? = null
)

/**
 * 权限配置
 */
data class PermissionsConfig(
    @SerializedName("allow")
    val allow: List<String> = emptyList(),

    @SerializedName("deny")
    val deny: List<String> = emptyList()
)

/**
 * Skill 配置
 */
data class SkillConfig(
    @SerializedName("id")
    val id: String,

    @SerializedName("name")
    val name: String? = null,

    @SerializedName("description")
    val description: String? = null,

    @SerializedName("trigger")
    val trigger: String? = null,

    @SerializedName("command")
    val command: String? = null,

    @SerializedName("enabled")
    val enabled: Boolean = true
)

/**
 * Agent 配置
 */
data class AgentConfig(
    @SerializedName("id")
    val id: String,

    @SerializedName("name")
    val name: String? = null,

    @SerializedName("description")
    val description: String? = null,

    @SerializedName("model")
    val model: String? = null,

    @SerializedName("systemPrompt")
    val systemPrompt: String? = null,

    @SerializedName("enabled")
    val enabled: Boolean = true
)

/**
 * MCP Server 配置
 */
data class McpServerConfig(
    @SerializedName("id")
    val id: String,

    @SerializedName("name")
    val name: String? = null,

    @SerializedName("command")
    val command: String? = null,

    @SerializedName("args")
    val args: List<String>? = null,

    @SerializedName("env")
    val env: Map<String, String>? = null,

    @SerializedName("enabled")
    val enabled: Boolean = true
)

/**
 * Provider 配置 (简化版，用于 UI 显示)
 */
data class ProviderConfig(
    val id: String,
    val name: String,
    val endpoint: String,
    val defaultModel: String,
    val fastModel: String = "",
    val enabled: Boolean = true
)

/**
 * 模型信息
 */
data class ModelInfo(
    val id: String,
    val name: String,
    val providerId: String
)

/**
 * Provider 服务 - 管理多Provider切换
 *
 * 通过覆盖 ~/.claude/settings.json 实现 Provider 切换
 */
@Service
class ProviderService {

    private val logger = thisLogger()
    private var _activeProviderId: String = "claude"

    companion object {
        // Claude Code 设置文件路径
        val CLAUDE_SETTINGS_FILE = File(
            System.getProperty("user.home"),
            ".claude/settings.json"
        )

        // 预置 Provider 配置 (用于推送到前端)
        val PRESET_PROVIDERS = listOf(
            ProviderConfig(
                id = "claude",
                name = "Claude (Anthropic)",
                endpoint = "https://api.anthropic.com",
                defaultModel = "claude-sonnet-4-20250514",
                fastModel = "claude-3-5-haiku-20241022"
            ),
            ProviderConfig(
                id = "deepseek",
                name = "DeepSeek",
                endpoint = "https://api.deepseek.com/anthropic",
                defaultModel = "deepseek-reasoner",
                fastModel = "deepseek-chat"
            ),
            ProviderConfig(
                id = "gemini",
                name = "Google Gemini",
                endpoint = "https://generativelanguage.googleapis.com/v1beta/openai",
                defaultModel = "gemini-2.5-pro",
                fastModel = "gemini-2.5-flash"
            ),
            ProviderConfig(
                id = "glm",
                name = "GLM (智谱)",
                endpoint = "https://open.bigmodel.cn/api/anthropic",
                defaultModel = "GLM-4.7",
                fastModel = "glm-4.5-air"
            ),
            ProviderConfig(
                id = "kimi",
                name = "Moonshot Kimi",
                endpoint = "https://api.moonshot.cn/anthropic",
                defaultModel = "kimi-k2-turbo-preview",
                fastModel = "kimi-k2-turbo-preview"
            ),
            ProviderConfig(
                id = "qwen",
                name = "阿里百炼 Qwen",
                endpoint = "https://dashscope.aliyuncs.com/api/v2/apps/claude-code-proxy",
                defaultModel = "qwen3-coder-plus",
                fastModel = "qwen3-coder-plus"
            )
        )

        // 预置模型列表 (用于 UI 下拉)
        val PRESET_MODELS = mapOf(
            "claude" to listOf(
                ModelInfo("claude-opus-4-20250514", "Claude Opus 4", "claude"),
                ModelInfo("claude-sonnet-4-20250514", "Claude Sonnet 4", "claude"),
                ModelInfo("claude-3-5-haiku-20241022", "Claude Haiku 3.5", "claude")
            ),
            "deepseek" to listOf(
                ModelInfo("deepseek-reasoner", "DeepSeek Reasoner", "deepseek"),
                ModelInfo("deepseek-chat", "DeepSeek Chat", "deepseek")
            ),
            "gemini" to listOf(
                ModelInfo("gemini-2.5-pro", "Gemini 2.5 Pro", "gemini"),
                ModelInfo("gemini-2.5-flash", "Gemini 2.5 Flash", "gemini")
            ),
            "glm" to listOf(
                ModelInfo("GLM-4.7", "GLM-4.7", "glm"),
                ModelInfo("GLM-4.7", "GLM-4.7", "glm"),
                ModelInfo("glm-4.5-air", "GLM-4.5 Air", "glm")
            ),
            "kimi" to listOf(
                ModelInfo("kimi-k2-turbo-preview", "Kimi K2 Turbo", "kimi")
            ),
            "qwen" to listOf(
                ModelInfo("qwen3-coder-plus", "Qwen3 Coder Plus", "qwen"),
                ModelInfo("qwen3-coder", "Qwen3 Coder", "qwen")
            )
        )

        // 预置 Agents
        val PRESET_AGENTS = listOf(
            AgentConfig("general", "General", "通用助手"),
            AgentConfig("review", "Review", "代码审查"),
            AgentConfig("codegen", "Code", "代码生成")
        )
    }

    /**
     * 获取活跃 Provider ID
     */
    val activeProviderId: String
        get() = _activeProviderId

    /**
     * 获取活跃 Provider 配置
     */
    val activeProvider: ProviderConfig
        get() = PRESET_PROVIDERS.find { it.id == _activeProviderId }
            ?: PRESET_PROVIDERS.first()

    /**
     * 获取所有预置 Provider
     */
    val allProviders: List<ProviderConfig>
        get() = PRESET_PROVIDERS

    /**
     * 获取指定 Provider 的模型列表
     */
    fun getModelsForProvider(providerId: String): List<ModelInfo> {
        return PRESET_MODELS[providerId] ?: emptyList()
    }

    /**
     * 切换 Provider
     * 只覆盖 env 属性，保留现有配置中的 permissions, skills, agents 和其他 env 变量
     */
    fun switchProvider(providerId: String): Boolean {
        val provider = PRESET_PROVIDERS.find { it.id == providerId } ?: return false

        try {
            // 读取现有配置 (保留 permissions, skills, agents, env)
            val existingSettings = loadSettings() ?: ClaudeSettings()

            // 从资源加载预置模板中的 env
            val templateEnv = loadProviderEnv(providerId) ?: return false

            // 合并 env：模板覆盖现有，但保留现有的 ANTHROPIC_AUTH_TOKEN 等
            val mergedEnv = existingSettings.env.toMutableMap()
            mergedEnv.putAll(templateEnv)

            // 写回：只更新 env，保留其他配置
            val newSettings = existingSettings.copy(env = mergedEnv)
            val saved = saveSettings(newSettings)

            if (saved) {
                _activeProviderId = providerId
                logger.info("Switched to provider: $providerId, env updated")
            }
            return saved
        } catch (e: Exception) {
            logger.error("Failed to switch provider: $providerId", e)
            return false
        }
    }

    /**
     * 读取当前 Claude Settings 配置
     */
    fun loadSettings(): ClaudeSettings? {
        val settingsFile = CLAUDE_SETTINGS_FILE
        if (!settingsFile.exists()) return null

        return try {
            val gson = com.google.gson.Gson()
            gson.fromJson(settingsFile.readText(), ClaudeSettings::class.java)
        } catch (e: Exception) {
            null
        }
    }

    /**
     * 保存 Claude Settings 配置
     */
    fun saveSettings(settings: ClaudeSettings): Boolean {
        return try {
            val settingsFile = CLAUDE_SETTINGS_FILE
            settingsFile.parentFile?.mkdirs()

            val gson = com.google.gson.GsonBuilder()
                .setPrettyPrinting()
                .create()
            settingsFile.writeText(gson.toJson(settings))
            true
        } catch (e: Exception) {
            false
        }
    }

    /**
     * 读取 env 配置
     */
    fun getEnv(): Map<String, String> {
        return loadSettings()?.env ?: emptyMap()
    }

    /**
     * 读取指定 env 值
     */
    fun getEnv(key: String): String? {
        return getEnv()[key]
    }

    /**
     * 读取 skills 配置
     */
    fun getSkills(): List<SkillConfig> {
        return loadSettings()?.skills ?: emptyList()
    }

    /**
     * 读取 agents 配置
     */
    fun getAgents(): List<AgentConfig> {
        return loadSettings()?.agents ?: emptyList()
    }

    /**
     * 读取 permissions 配置
     */
    fun getPermissions(): PermissionsConfig? {
        return loadSettings()?.permissions
    }

    /**
     * 读取 MCP Servers 配置
     */
    fun getMcpServers(): List<McpServerConfig> {
        return loadSettings()?.mcpServers ?: emptyList()
    }

    /**
     * 从 settings.json 读取当前 Provider 信息
     */
    fun getCurrentProviderFromSettings(): ProviderConfig? {
        val settingsFile = CLAUDE_SETTINGS_FILE
        if (!settingsFile.exists()) return null

        return try {
            val content = settingsFile.readText()
            parseProviderFromSettings(content)
        } catch (e: Exception) {
            null
        }
    }

    /**
     * 从资源加载 Provider 模板 JSON
     */
    private fun loadProviderTemplate(providerId: String): String? {
        return try {
            val resourcePath = "/providers/settings-$providerId.json"
            javaClass.getResourceAsStream(resourcePath)?.bufferedReader()?.readText()
        } catch (e: Exception) {
            null
        }
    }

    /**
     * 从资源加载 Provider 模板的 env 部分
     */
    private fun loadProviderEnv(providerId: String): Map<String, String>? {
        return try {
            val template = loadProviderTemplate(providerId) ?: return null
            val gson = com.google.gson.Gson()
            val settings = gson.fromJson(template, ClaudeSettings::class.java)
            settings.env
        } catch (e: Exception) {
            logger.warn("Failed to load provider env for $providerId", e)
            null
        }
    }

    /**
     * 合并模板与现有配置
     *
     * 策略:
     * - 使用模板的 env 配置 (新 Provider 的 URL 和模型)
     * - 保留现有配置中的 ANTHROPIC_AUTH_TOKEN
     * - 保留现有配置中的 permissions
     * - 保留现有配置中的 skills
     * - 保留现有配置中的 agents
     */
    private fun mergeWithTemplate(existingContent: String, template: String): String {
        // 提取现有 auth token
        val existingAuthToken = Regex(
            """"ANTHROPIC_AUTH_TOKEN"\s*:\s*"([^"]+)""""
        ).find(existingContent)?.groupValues?.get(1)

        if (existingAuthToken != null) {
            // 将 auth token 注入到模板中
            return template.replaceFirst(
                """"ANTHROPIC_AUTH_TOKEN": [^,]+,""".replace("{", "\\{").replace("}", "\\}"),
                """\"ANTHROPIC_AUTH_TOKEN\": \"$existingAuthToken\","""
            )
        }

        return template
    }

    /**
     * 从 settings.json 内容解析 Provider
     */
    private fun parseProviderFromSettings(content: String): ProviderConfig? {
        val baseUrl = Regex("ANTHROPIC_BASE_URL[^\"]*\"([^\"]+)\"").find(content)?.groupValues?.get(1)
        return PRESET_PROVIDERS.find { it.endpoint == baseUrl }
    }
}