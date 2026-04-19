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

    // === ENV Smart Merge Tests ===

    @Test
    fun testNeedsEnvUpdate_sameEnv_returnsFalse() {
        val existingEnv = mapOf(
            "ANTHROPIC_BASE_URL" to "https://api.anthropic.com",
            "ANTHROPIC_MODEL" to "claude-sonnet-4-20250514",
            "CUSTOM_USER_KEY" to "user-value"
        )
        val targetEnv = mapOf(
            "ANTHROPIC_BASE_URL" to "https://api.anthropic.com",
            "ANTHROPIC_MODEL" to "claude-sonnet-4-20250514"
        )
        assert(!providerService.needsEnvUpdate(existingEnv, targetEnv)) {
            "Same env should not trigger update"
        }
    }

    @Test
    fun testNeedsEnvUpdate_differentEnv_returnsTrue() {
        val existingEnv = mapOf(
            "ANTHROPIC_BASE_URL" to "https://api.anthropic.com",
            "ANTHROPIC_MODEL" to "claude-sonnet-4-20250514"
        )
        val targetEnv = mapOf(
            "ANTHROPIC_BASE_URL" to "https://api.deepseek.com/anthropic",
            "ANTHROPIC_MODEL" to "deepseek-reasoner"
        )
        assert(providerService.needsEnvUpdate(existingEnv, targetEnv)) {
            "Different env should trigger update"
        }
    }

    @Test
    fun testGetMergedEnv_preservesUserCustomKeys() {
        val existingEnv = mapOf(
            "ANTHROPIC_AUTH_TOKEN" to "user-secret-key",
            "CUSTOM_USER_KEY" to "user-value",
            "ANOTHER_CUSTOM" to "another-value"
        )
        val providerEnv = mapOf(
            "ANTHROPIC_BASE_URL" to "https://api.deepseek.com/anthropic",
            "ANTHROPIC_MODEL" to "deepseek-reasoner"
        )
        val merged = providerService.getMergedEnv(existingEnv, providerEnv)

        // User custom keys should be preserved
        assert(merged["CUSTOM_USER_KEY"] == "user-value") { "CUSTOM_USER_KEY should be preserved" }
        assert(merged["ANOTHER_CUSTOM"] == "another-value") { "ANOTHER_CUSTOM should be preserved" }
        // Provider keys should be updated
        assert(merged["ANTHROPIC_BASE_URL"] == "https://api.deepseek.com/anthropic") { "ANTHROPIC_BASE_URL should be updated" }
        assert(merged["ANTHROPIC_MODEL"] == "deepseek-reasoner") { "ANTHROPIC_MODEL should be updated" }
    }

    @Test
    fun testGetMergedEnv_preservesAuthToken() {
        val existingEnv = mapOf(
            "ANTHROPIC_AUTH_TOKEN" to "user-secret-key",
            "ANTHROPIC_BASE_URL" to "https://api.anthropic.com"
        )
        val providerEnv = mapOf(
            "ANTHROPIC_BASE_URL" to "https://api.deepseek.com/anthropic"
        )
        val merged = providerService.getMergedEnv(existingEnv, providerEnv)

        // ANTHROPIC_AUTH_TOKEN should NEVER be overwritten
        assert(merged["ANTHROPIC_AUTH_TOKEN"] == "user-secret-key") {
            "ANTHROPIC_AUTH_TOKEN should be preserved (not overwritten by provider template)"
        }
        // Provider keys should be updated
        assert(merged["ANTHROPIC_BASE_URL"] == "https://api.deepseek.com/anthropic") {
            "ANTHROPIC_BASE_URL should be updated"
        }
    }
}
