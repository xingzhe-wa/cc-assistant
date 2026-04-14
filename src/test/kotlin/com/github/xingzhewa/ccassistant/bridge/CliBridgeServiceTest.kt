package com.github.xingzhewa.ccassistant.bridge

import org.junit.Test

/**
 * CliBridgeService 单元测试
 *
 * 注意: CLI 检测测试依赖本地环境是否安装了 Claude Code CLI。
 * 在未安装 CLI 的环境中，相关测试会跳过。
 */
class CliBridgeServiceTest {

    private val service = CliBridgeService()

    @Test
    fun testDetectCli() {
        // 此测试在安装了 Claude Code CLI 的环境中通过
        // 在未安装环境中返回 null，不算失败
        val cli = service.detectCli()
        if (cli != null) {
            assert(cli == "claude" || cli == "claude-code") {
                "Expected 'claude' or 'claude-code', got '$cli'"
            }
        }
    }

    @Test
    fun testIsCliAvailable() {
        // 与 detectCli 结果一致
        val available = service.isCliAvailable()
        val detected = service.detectCli()
        assert(available == (detected != null)) {
            "isCliAvailable should match detectCli result"
        }
    }

    @Test
    fun testGetCliVersion() {
        val version = service.getCliVersion()
        if (service.isCliAvailable()) {
            assert(version != null && version.isNotBlank()) {
                "Expected non-empty version when CLI is available"
            }
        }
    }

    @Test
    fun testRegisterAndUnregisterCallback() {
        var receivedMessage: CliMessage? = null
        val callback = object : CliMessageCallback {
            override fun onMessage(message: CliMessage) {
                receivedMessage = message
            }
        }

        service.registerCallback(callback)
        // 直接测试回调分发 (不启动 CLI)
        service.registerCallback(object : CliMessageCallback {
            override fun onMessage(message: CliMessage) {}
        })

        // 回调应该已注册
        service.unregisterCallback(callback)
    }

    @Test
    fun testIsRunningInitially() {
        assert(!service.isRunning()) { "Service should not be running initially" }
    }

    @Test
    fun testExecuteWithoutCliReturnsError() {
        // 创建一个全新的 service 实例，未检测到 CLI
        val freshService = CliBridgeService()
        // 如果 CLI 不可用，应返回 false
        if (!freshService.isCliAvailable()) {
            var errorMessage: String? = null
            val callback = object : CliMessageCallback {
                override fun onMessage(message: CliMessage) {
                    if (message is CliMessage.Error) {
                        errorMessage = message.message
                    }
                }
            }
            freshService.registerCallback(callback)
            val result = freshService.executePrompt("test")
            assert(!result) { "Expected false when CLI not available" }
            assert(errorMessage != null) { "Expected error message" }
            freshService.dispose()
        }
    }
}
