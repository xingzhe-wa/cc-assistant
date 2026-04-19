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

    @Test
    fun testGetProviderEnvVars_returnsCorrectEnvForClaude() {
        val envVars = providerService.getProviderEnvVars("claude")
        assert(envVars != null) { "Should return env vars for claude" }
        val vars = envVars!!
        assert(vars["ANTHROPIC_BASE_URL"] == "https://api.anthropic.com") { "Should have correct base URL" }
        assert(vars["ANTHROPIC_MODEL"] == "claude-sonnet-4-20250514") { "Should have correct model" }
        assert(vars["ANTHROPIC_SMALL_FAST_MODEL"] == "claude-3-5-haiku-20241022") { "Should have fast model" }
    }

    @Test
    fun testGetProviderEnvVars_returnsCorrectEnvForDeepSeek() {
        val envVars = providerService.getProviderEnvVars("deepseek")
        assert(envVars != null) { "Should return env vars for deepseek" }
        val vars = envVars!!
        assert(vars["ANTHROPIC_BASE_URL"] == "https://api.deepseek.com/anthropic") { "Should have correct base URL" }
        assert(vars["ANTHROPIC_MODEL"] == "deepseek-reasoner") { "Should have correct model" }
    }

    @Test
    fun testGetProviderEnvVars_doesNotContainAuthToken() {
        val envVars = providerService.getProviderEnvVars("claude")
        assert(envVars != null) { "Should return env vars" }
        val vars = envVars!!
        assert(!vars.containsKey("ANTHROPIC_AUTH_TOKEN")) { "Should NOT contain ANTHROPIC_AUTH_TOKEN" }
    }

    @Test
    fun testGetProviderEnvVars_returnsNullForUnknownProvider() {
        val envVars = providerService.getProviderEnvVars("unknown-provider")
        assert(envVars == null) { "Should return null for unknown provider" }
    }
}
