package com.github.xingzhewa.ccassistant.action

import com.github.xingzhewa.ccassistant.ui.chat.ReactChatPanel
import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.actionSystem.CommonDataKeys
import com.intellij.openapi.wm.ToolWindowManager

/**
 * 编辑器选中文本右键 → "Send to CC Assistant"
 * 将选中的代码片段（带文件来源信息）注入到聊天输入框
 */
class SendSelectionToChatAction : AnAction() {

    override fun actionPerformed(e: AnActionEvent) {
        val project = e.project ?: return
        val editor = e.getData(CommonDataKeys.EDITOR) ?: return
        val selectedText = editor.selectionModel.selectedText ?: return
        val file = e.getData(CommonDataKeys.VIRTUAL_FILE) ?: return

        // 激活 ToolWindow（确保内容已初始化）
        val toolWindow = ToolWindowManager.getInstance(project).getToolWindow("CC Assistant")
        toolWindow?.activate(null)

        val panel = ReactChatPanel.getInstance(project) ?: return

        // 计算选中区域的起始/结束行号（1-based）
        val startPos = editor.selectionModel.selectionStartPosition ?: return
        val endPos = editor.selectionModel.selectionEndPosition ?: return
        val startLine = startPos.line + 1
        val endLine = endPos.line + 1

        panel.insertCodeReference(file.path, startLine, endLine)
    }

    override fun update(e: AnActionEvent) {
        val project = e.project
        val editor = e.getData(CommonDataKeys.EDITOR)
        val hasSelection = editor?.selectionModel?.hasSelection() == true
        val panel = project?.let { ReactChatPanel.getInstance(it) }
        // 始终显示菜单项（有选中时），仅控制 enabled 状态
        e.presentation.isVisible = hasSelection
        e.presentation.isEnabled = hasSelection && panel != null
    }

    override fun getActionUpdateThread() = com.intellij.openapi.actionSystem.ActionUpdateThread.BGT
}
