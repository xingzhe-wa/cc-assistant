package com.github.xingzhewa.ccassistant.action

import com.github.xingzhewa.ccassistant.ui.chat.ReactChatPanel
import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.actionSystem.CommonDataKeys
import com.intellij.openapi.wm.ToolWindowManager

/**
 * Project View 文件右键 → "Send to CC Assistant"
 * 将选中文件路径注入到聊天输入框
 */
class SendFileToChatAction : AnAction() {

    override fun actionPerformed(e: AnActionEvent) {
        val project = e.project ?: return
        val files = e.getData(CommonDataKeys.VIRTUAL_FILE_ARRAY) ?: return
        if (files.isEmpty()) return

        // 激活 ToolWindow（确保内容已初始化）
        val toolWindow = ToolWindowManager.getInstance(project).getToolWindow("CC Assistant")
        toolWindow?.activate(null)

        // 尝试获取面板（可能需要等 ToolWindow 初始化完成）
        val panel = ReactChatPanel.getInstance(project) ?: return

        for (file in files) {
            panel.insertFileReference(file.path)
        }
    }

    override fun update(e: AnActionEvent) {
        val project = e.project
        val files = e.getData(CommonDataKeys.VIRTUAL_FILE_ARRAY)
        // 始终显示菜单项（有文件选中时），仅控制 enabled 状态
        val hasFiles = !files.isNullOrEmpty()
        val panel = project?.let { ReactChatPanel.getInstance(it) }
        e.presentation.isVisible = hasFiles
        e.presentation.isEnabled = hasFiles && panel != null
    }

    override fun getActionUpdateThread() = com.intellij.openapi.actionSystem.ActionUpdateThread.BGT
}
