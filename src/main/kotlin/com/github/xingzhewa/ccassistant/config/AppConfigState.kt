package com.github.xingzhewa.ccassistant.config

import com.intellij.openapi.components.PersistentStateComponent
import com.intellij.openapi.components.Service

/**
 * 应用配置状态
 */
data class AppConfigState(
    var cliPath: String = "",
    var defaultWorkingDirectory: String = "",
    var autoSaveSession: Boolean = true,
    var restoreLastSessionOnStartup: Boolean = true,
    var language: String = "auto"
)

/**
 * 配置服务 - 管理应用配置持久化
 */
@Service
class ConfigService : PersistentStateComponent<AppConfigState> {

    private var state = AppConfigState()

    override fun getState(): AppConfigState = state

    override fun loadState(state: AppConfigState) {
        this.state = state
    }

    /**
     * 获取 CLI 路径
     */
    fun getCliPath(): String = state.cliPath

    /**
     * 设置 CLI 路径
     */
    fun setCliPath(path: String) {
        this.state = state.copy(cliPath = path)
    }

    /**
     * 获取默认工作目录
     */
    fun getDefaultWorkingDirectory(): String = state.defaultWorkingDirectory

    /**
     * 设置默认工作目录
     */
    fun setDefaultWorkingDirectory(dir: String) {
        state = state.copy(defaultWorkingDirectory = dir)
    }

    /**
     * 是否自动保存会话
     */
    fun isAutoSaveEnabled(): Boolean = state.autoSaveSession

    /**
     * 是否在启动时恢复上次会话
     */
    fun isRestoreOnStartup(): Boolean = state.restoreLastSessionOnStartup

    /**
     * 获取语言设置
     */
    fun getLanguage(): String = state.language

    /**
     * 重置为默认配置
     */
    fun resetToDefaults() {
        state = AppConfigState()
    }
}
