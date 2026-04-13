package com.github.xingzhewa.ccassistant.model

import org.junit.Test

class ProviderServiceTest {

    private val providerService = ProviderService()

    @Test
    fun testDefaultProvidersInitialized() {
        val providers = providerService.allProviders
        assert(providers.size == 1) { "Expected 1 provider (Claude only), got ${providers.size}" }

        val claude = providers.find { it.id == "claude" }
        assert(claude != null) { "Claude provider not found" }
        assert(claude!!.name == "Claude (Anthropic)") { "Expected Claude (Anthropic), got ${claude.name}" }
        assert(claude.type == ProviderType.CLAUDE) { "Expected CLAUDE type" }
    }

    @Test
    fun testActiveProviderDefaultsToClaude() {
        val activeProvider = providerService.activeProvider
        assert(activeProvider.id == "claude") { "Expected claude, got ${activeProvider.id}" }
    }

    @Test
    fun testSwitchProvider() {
        // 只支持 Claude，不支持切换到其他默认 Provider
        providerService.switchProvider("claude")
        assert(providerService.activeProviderId == "claude") { "Expected claude, got ${providerService.activeProviderId}" }
    }

    @Test
    fun testGetAvailableModelsForClaude() {
        val models = providerService.getAvailableModels("claude")
        assert(models.size == 3) { "Expected 3 models, got ${models.size}" }
        assert(models.any { it.name.contains("Opus") }) { "Opus model not found" }
        assert(models.any { it.name.contains("Sonnet") }) { "Sonnet model not found" }
        assert(models.any { it.name.contains("Haiku") }) { "Haiku model not found" }
    }

    @Test
    fun testGetAvailableModelsForUnknownReturnsEmpty() {
        val models = providerService.getAvailableModels("unknown")
        assert(models.isEmpty()) { "Expected empty list, got ${models.size}" }
    }

    @Test
    fun testSetAndGetApiKey() {
        providerService.setApiKey("claude", "sk-test-key")
        assert(providerService.getApiKey("claude") == "sk-test-key") { "API key not set correctly" }
    }

    @Test
    fun testAddCustomProvider() {
        val customProvider = ProviderConfig(
            id = "custom",
            name = "Custom Provider",
            apiKey = "custom-key",
            endpoint = "https://custom.api.com",
            defaultModel = "custom-model",
            type = ProviderType.CUSTOM
        )

        providerService.addProvider(customProvider)
        val providers = providerService.allProviders

        assert(providers.size == 2) { "Expected 2 providers after add, got ${providers.size}" }
        assert(providers.any { it.id == "custom" }) { "Custom provider not found" }
    }

    @Test
    fun testRemoveCustomProvider() {
        val customProvider = ProviderConfig(
            id = "custom",
            name = "Custom Provider",
            type = ProviderType.CUSTOM
        )

        providerService.addProvider(customProvider)
        assert(providerService.allProviders.size == 2) { "Expected 2 providers after add" }

        providerService.removeProvider("custom")
        assert(providerService.allProviders.size == 1) { "Expected 1 provider after remove" }
    }

    @Test
    fun testCannotRemoveDefaultProvider() {
        providerService.removeProvider("claude")

        // 默认 Provider 不应被删除
        assert(providerService.allProviders.size == 1) { "Default provider should not be removable" }
    }
}
