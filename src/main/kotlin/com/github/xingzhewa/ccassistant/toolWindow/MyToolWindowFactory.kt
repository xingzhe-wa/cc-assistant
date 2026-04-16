package com.github.xingzhewa.ccassistant.toolWindow

import com.github.xingzhewa.ccassistant.ui.chat.ReactChatPanel
import com.intellij.openapi.diagnostic.thisLogger
import com.intellij.openapi.project.Project
import com.intellij.openapi.wm.ToolWindow
import com.intellij.openapi.wm.ToolWindowFactory
import com.intellij.ui.content.ContentFactory

/**
 * CC Assistant ToolWindow 工厂
 */
class MyToolWindowFactory : ToolWindowFactory {

    private val logger = thisLogger()

    override fun createToolWindowContent(project: Project, toolWindow: ToolWindow) {
        logger.info("=== Creating ToolWindow content for project: ${project.name} ===")

        val chatPanel = ReactChatPanel(workingDir = project.basePath)
        chatPanel.associatedProject = project
        logger.info("ReactChatPanel created, size: ${chatPanel.size}, component count: ${chatPanel.componentCount}")

        val content = ContentFactory.getInstance().createContent(chatPanel, "", false)
        toolWindow.contentManager.addContent(content)

        logger.info("Content added to ToolWindow, available: ${toolWindow.isAvailable}")

        // 自动显示 Tool Window（调试用）
        com.intellij.openapi.application.invokeLater {
            toolWindow.show {
                logger.info("ToolWindow shown successfully")
            }
        }
    }

    override fun shouldBeAvailable(project: Project) = true
}
