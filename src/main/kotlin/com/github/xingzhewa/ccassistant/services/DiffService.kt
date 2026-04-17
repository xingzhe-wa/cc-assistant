package com.github.xingzhewa.ccassistant.services

import com.intellij.openapi.components.Service
import com.intellij.openapi.project.Project
import org.jetbrains.annotations.NotNull
import java.io.File

/**
 * Diff 审查服务 - 支持文件差异对比和修改应用
 */
@Service(Service.Level.PROJECT)
class DiffService(private val project: Project) {

    companion object {
        fun getInstance(project: Project): DiffService =
            project.getService(DiffService::class.java)
    }

    /**
     * 应用修改到文件
     */
    fun applyChanges(filePath: String, content: String): Boolean {
        return try {
            val file = File(filePath)
            val parent = file.parentFile
            if (parent != null && !parent.exists()) {
                parent.mkdirs()
            }
            file.writeText(content)
            true
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }

    /**
     * 计算 Diff 统计
     */
    @NotNull
    fun calculateDiffStats(original: String, suggested: String): DiffStats {
        val originalLines = original.lines()
        val suggestedLines = suggested.lines()

        var additions = 0
        var deletions = 0

        val maxLines = maxOf(originalLines.size, suggestedLines.size)
        for (i in 0 until maxLines) {
            val origLine = originalLines.getOrNull(i)
            val sugLine = suggestedLines.getOrNull(i)

            when {
                origLine == null && sugLine != null -> additions++
                origLine != null && sugLine == null -> deletions++
                origLine != null && origLine != sugLine -> {
                    additions++
                    deletions++
                }
            }
        }

        return DiffStats(additions, deletions)
    }

    /**
     * 生成 Unified Diff 格式
     */
    fun generateUnifiedDiff(
        original: String,
        suggested: String,
        filePath: String = "file"
    ): String {
        val originalLines = original.lines()
        val suggestedLines = suggested.lines()
        val sb = StringBuilder()

        sb.append("--- a/$filePath\n")
        sb.append("+++ b/$filePath\n")

        val maxLines = maxOf(originalLines.size, suggestedLines.size)
        for (i in 0 until maxLines) {
            val origLine = originalLines.getOrNull(i)
            val sugLine = suggestedLines.getOrNull(i)

            when {
                origLine == null && sugLine != null -> sb.append("+ $sugLine\n")
                origLine != null && sugLine == null -> sb.append("- $origLine\n")
                origLine != null && origLine != sugLine -> {
                    sb.append("- $origLine\n")
                    sb.append("+ ${sugLine ?: ""}\n")
                }
            }
        }

        return sb.toString()
    }
}

/**
 * Diff 统计
 */
data class DiffStats(
    val additions: Int,
    val deletions: Int
) {
    val total: Int get() = additions + deletions
    fun format(): String = "+$additions/-$deletions"
}