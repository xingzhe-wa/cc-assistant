package com.github.xingzhewa.ccassistant.toolWindow

import com.github.xingzhewa.ccassistant.ui.chat.ReactChatPanel
import com.intellij.openapi.project.Project
import com.intellij.openapi.wm.ToolWindow
import com.intellij.openapi.wm.ToolWindowFactory
import com.intellij.ui.content.ContentFactory

/**
 * CC Assistant ToolWindow 工厂
 */
class MyToolWindowFactory : ToolWindowFactory {

    override fun createToolWindowContent(project: Project, toolWindow: ToolWindow) {
        val chatPanel = ReactChatPanel(workingDir = project.basePath)
        val content = ContentFactory.getInstance().createContent(chatPanel, null, false)
        toolWindow.contentManager.addContent(content)
    }

    override fun shouldBeAvailable(project: Project) = true
}
