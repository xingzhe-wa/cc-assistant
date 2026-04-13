package com.github.xingzhewa.ccassistant.model

import com.intellij.openapi.components.Service

/**
 * Provider 类型
 */
enum class ProviderType {
    CLAUDE,
    OPENAI,
    CUSTOM
}

/**
 * Provider 配置
 */
data class ProviderConfig(
    val id: String,
    val name: String,
    val apiKey: String = "",
    val endpoint: String = "",
    val defaultModel: String = "",
    val type: ProviderType = ProviderType.CLAUDE,
    val enabled: Boolean = true
)

/**
 * 模型信息
 */
data class ModelInfo(
    val id: String,
    val name: String,
    val provider: ProviderType
)

/**
 * Provider 服务 - 管理多Provider
 */
@Service
class ProviderService {

    private val providers = mutableMapOf<String, ProviderConfig>()
    private var _activeProviderId: String = "claude"

    companion object {
        val DEFAULT_CLAUDE_MODELS = listOf(
            ModelInfo("claude-opus-4-20250514", "Claude Opus 4", ProviderType.CLAUDE),
            ModelInfo("claude-sonnet-4-20250514", "Claude Sonnet 4", ProviderType.CLAUDE),
            ModelInfo("claude-3-5-haiku-20241022", "Claude Haiku 3.5", ProviderType.CLAUDE)
        )

        val DEFAULT_OPENAI_MODELS = listOf(
            ModelInfo("gpt-4o", "GPT-4o", ProviderType.OPENAI),
            ModelInfo("gpt-4o-mini", "GPT-4o Mini", ProviderType.OPENAI),
            ModelInfo("o1", "o1", ProviderType.OPENAI)
        )
    }

    init {
        // 初始化默认 Provider
        providers["claude"] = ProviderConfig(
            id = "claude",
            name = "Claude (Anthropic)",
            endpoint = "https://api.anthropic.com",
            defaultModel = "claude-sonnet-4-20250514",
            type = ProviderType.CLAUDE
        )
        providers["openai"] = ProviderConfig(
            id = "openai",
            name = "OpenAI",
            endpoint = "https://api.openai.com",
            defaultModel = "gpt-4o",
            type = ProviderType.OPENAI
        )
    }

    /**
     * 获取活跃的 Provider
     */
    val activeProvider: ProviderConfig
        get() = providers[_activeProviderId] ?: providers["claude"]!!

    /**
     * 获取活跃 Provider ID
     */
    val activeProviderId: String
        get() = _activeProviderId

    /**
     * 切换 Provider
     */
    fun switchProvider(providerId: String) {
        if (providers.containsKey(providerId)) {
            _activeProviderId = providerId
        }
    }

    /**
     * 获取所有 Provider
     */
    val allProviders: List<ProviderConfig>
        get() = providers.values.toList()

    /**
     * 获取可用的模型列表
     */
    fun getAvailableModels(providerId: String): List<ModelInfo> {
        return when (providerId) {
            "claude" -> DEFAULT_CLAUDE_MODELS
            "openai" -> DEFAULT_OPENAI_MODELS
            else -> emptyList()
        }
    }

    /**
     * 添加自定义 Provider
     */
    fun addProvider(config: ProviderConfig) {
        providers[config.id] = config
    }

    /**
     * 更新 Provider
     */
    fun updateProvider(config: ProviderConfig) {
        if (providers.containsKey(config.id)) {
            providers[config.id] = config
        }
    }

    /**
     * 移除 Provider
     */
    fun removeProvider(providerId: String) {
        if (providerId != "claude" && providerId != "openai") {
            providers.remove(providerId)
            if (_activeProviderId == providerId) {
                _activeProviderId = "claude"
            }
        }
    }

    /**
     * 设置 API Key
     */
    fun setApiKey(providerId: String, apiKey: String) {
        providers[providerId]?.let { config ->
            providers[providerId] = config.copy(apiKey = apiKey)
        }
    }

    /**
     * 获取 API Key
     */
    fun getApiKey(providerId: String): String {
        return providers[providerId]?.apiKey ?: ""
    }
}
