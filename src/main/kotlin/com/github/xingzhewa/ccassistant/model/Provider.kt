package com.github.xingzhewa.ccassistant.model

import com.intellij.openapi.components.Service
import java.io.File

/**
 * Provider 配置
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

    private var _activeProviderId: String = "claude"

    companion object {
        // Claude Code 设置文件路径
        val CLAUDE_SETTINGS_FILE = File(
            System.getProperty("user.home"),
            ".claude/settings.json"
        )

        // 预置 Provider 配置
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
     * 从 resources/providers/ 读取预置模板，合并到 ~/.claude/settings.json
     *
     * 保留现有配置中的 ANTHROPIC_AUTH_TOKEN 和 permissions
     */
    fun switchProvider(providerId: String): Boolean {
        val provider = PRESET_PROVIDERS.find { it.id == providerId } ?: return false
        val settingsFile = CLAUDE_SETTINGS_FILE

        try {
            // 读取现有配置 (保留 auth token 和 permissions)
            val existingContent = if (settingsFile.exists()) {
                settingsFile.readText()
            } else {
                "{}"
            }

            // 从资源加载预置模板
            val template = loadProviderTemplate(providerId) ?: return false

            // 合并: 模板 + 保留现有 auth token
            val mergedContent = mergeWithTemplate(existingContent, template)

            // 写入配置
            settingsFile.parentFile?.mkdirs()
            settingsFile.writeText(mergedContent)

            _activeProviderId = providerId
            return true
        } catch (e: Exception) {
            return false
        }
    }

    /**
     * 从 settings.json 读取当前 Provider 信息
     */
    fun getCurrentProviderFromSettings(): ProviderConfig? {
        val settingsFile = CLAUDE_SETTINGS_FILE
        if (!settingsFile.exists()) return null

        return try {
            val content = settingsFile.readText()
            // 简单解析: 提取 ANTHROPIC_BASE_URL 判断 Provider
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
     * 合并模板与现有配置
     *
     * 策略:
     * - 使用模板的 env 配置 (新 Provider 的 URL 和模型)
     * - 保留现有配置中的 ANTHROPIC_AUTH_TOKEN
     * - 保留现有配置中的 permissions
     */
    private fun mergeWithTemplate(existingContent: String, template: String): String {
        // 提取现有 auth token
        val existingAuthToken = Regex(
            """"ANTHROPIC_AUTH_TOKEN"\s*:\s*"([^"]+)""""
        ).find(existingContent)?.groupValues?.get(1)

        if (existingAuthToken != null) {
            // 将 auth token 注入到模板中
            val envBlock = Regex("""("env"\s*:\s*\{)""").find(template)?.groupValues?.get(1)
            if (envBlock != null) {
                return template.replaceFirst(
                    """("env"\s*:\s*\{)""",
                    """$1${System.lineSeparator()}    "ANTHROPIC_AUTH_TOKEN": "$existingAuthToken","""
                )
            }
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
