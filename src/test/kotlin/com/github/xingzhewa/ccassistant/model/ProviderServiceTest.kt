package com.github.xingzhewa.ccassistant.model

import org.junit.Test

class ProviderServiceTest {

    private val providerService = ProviderService()

    @Test
    fun testPresetProvidersInitialized() {
        val providers = providerService.allProviders
        assert(providers.size == 6) { "Expected 6 preset providers" }
    }

    @Test
    fun testActiveProviderDefaultsToClaude() {
        val activeProvider = providerService.activeProvider
        assert(activeProvider.id == "claude") { "Expected claude" }
    }

    @Test
    fun testSwitchProviderUpdatesActiveId() {
        providerService.switchProvider("deepseek")
        assert(providerService.activeProviderId == "deepseek") { "Expected deepseek" }
    }

    @Test
    fun testGetModelsForClaude() {
        val models = providerService.getModelsForProvider("claude")
        assert(models.size == 3) { "Expected 3 models" }
    }

    @Test
    fun testGetModelsForUnknownReturnsEmpty() {
        val models = providerService.getModelsForProvider("unknown")
        assert(models.isEmpty()) { "Expected empty" }
    }

    @Test
    fun testProviderCount() {
        val providers = providerService.allProviders
        assert(providers.size == 6) { "Expected 6 providers" }
    }
}
