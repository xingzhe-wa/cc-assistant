package com.github.xingzhewa.ccassistant.startup

import com.intellij.openapi.diagnostic.thisLogger
import com.intellij.openapi.project.Project
import com.intellij.openapi.startup.ProjectActivity

/**
 * 项目启动活动 - IDE 启动时执行
 *
 * M1 阶段: 检测 Claude Code CLI 是否已安装
 */
class MyProjectActivity : ProjectActivity {

    override suspend fun execute(project: Project) {
        thisLogger().info("CC Assistant initialized for project: ${project.name}")
    }
}
