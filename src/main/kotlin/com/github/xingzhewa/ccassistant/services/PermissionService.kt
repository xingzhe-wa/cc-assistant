package com.github.xingzhewa.ccassistant.services

import com.intellij.openapi.components.Service
import com.intellij.openapi.project.Project
import com.google.gson.Gson

/**
 * 权限确认服务 - 支持 Plan 模式工具调用确认
 *
 * MVP 使用 yolo (accept-all)，Plan 模式才需要此服务
 */
@Service(Service.Level.PROJECT)
class PermissionService(private val project: Project) {

    private val gson = Gson()

    companion object {
        /**
         * 获取权限服务实例
         */
        fun getInstance(project: Project): PermissionService =
            project.getService(PermissionService::class.java)
    }

    /**
     * 显示权限确认弹窗
     *
     * @param toolName 工具名称
     * @param toolInput 工具输入
     * @param onResult 回调 (true = 批准, false = 拒绝)
     */
    fun showPermissionDialog(
        toolName: String,
        toolInput: Map<String, Any>,
        onResult: (Boolean) -> Unit
    ) {
        // MVP 阶段默认批准，不需要弹窗
        // M5 Plan 模式才需要实现完整弹窗
        onResult(true)
    }

    /**
     * 创建权限请求
     *
     * @param toolName 工具名称
     * @param toolInput 工具输入
     * @return 权限请求
     */
    fun createPermissionRequest(
        toolName: String,
        toolInput: Map<String, Any>
    ): PermissionRequest {
        return PermissionRequest(
            toolName = toolName,
            toolInput = toolInput,
            description = generateDescription(toolName, toolInput),
            riskLevel = assessRiskLevel(toolName, toolInput)
        )
    }

    /**
     * 评估风险等级
     */
    private fun assessRiskLevel(toolName: String, toolInput: Map<String, Any>): RiskLevel {
        return when (toolName) {
            "read_file", "glob", "grep" -> RiskLevel.LOW
            "edit_file", "insert_content" -> RiskLevel.MEDIUM
            "run_command", "bash" -> RiskLevel.HIGH
            else -> RiskLevel.MEDIUM
        }
    }

    /**
     * 生成可读描述
     */
    private fun generateDescription(toolName: String, toolInput: Map<String, Any>): String {
        return when (toolName) {
            "read_file" -> {
                val path = toolInput["path"] ?: "未知文件"
                "读取文件: $path"
            }
            "edit_file" -> {
                val path = toolInput["path"] ?: "未知文件"
                "编辑文件: $path"
            }
            "run_command" -> {
                val command = toolInput["command"] ?: "未知命令"
                "执行命令: $command"
            }
            "bash" -> {
                val command = toolInput["command"] ?: "未知命令"
                "执行 Bash: $command"
            }
            else -> "工具: $toolName"
        }
    }

    /**
     * 检查是否需要确认
     *
     * @param toolName 工具名称
     * @return 是否需要确认
     */
    fun needsConfirmation(toolName: String): Boolean {
        return toolName in listOf("edit_file", "run_command", "bash", "create_file", "delete_file")
    }
}

/**
 * 权限请求
 *
 * @param toolName 工具名称
 * @param toolInput 工具输入
 * @param description 描述
 * @param riskLevel 风险等级
 */
data class PermissionRequest(
    val toolName: String,
    val toolInput: Map<String, Any>,
    val description: String,
    val riskLevel: RiskLevel
)

/**
 * 风险等级
 */
enum class RiskLevel {
    LOW,
    MEDIUM,
    HIGH
}