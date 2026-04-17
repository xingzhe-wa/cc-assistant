package com.github.xingzhewa.ccassistant.services

import com.github.xingzhewa.ccassistant.model.FileReference
import com.intellij.openapi.components.Service
import com.intellij.openapi.fileTypes.FileTypeManager
import com.intellij.openapi.project.Project
import com.intellij.openapi.vfs.LocalFileSystem
import com.intellij.openapi.vfs.VirtualFile
import org.jetbrains.annotations.NotNull
import org.jetbrains.annotations.Nullable
import java.io.File

/**
 * 文件引用服务 - 支持 @file 引用功能
 *
 * 提供项目文件搜索和 @filename 语法解析
 */
@Service(Service.Level.PROJECT)
class FileReferenceService(private val project: Project) {

    companion object {
        /**
         * 获取文件引用服务实例
         */
        fun getInstance(project: Project): FileReferenceService =
            project.getService(FileReferenceService::class.java)
    }

    /**
     * 搜索项目文件
     *
     * @param query 搜索关键词
     * @param maxResults 最大结果数
     * @return 文件列表
     */
    @NotNull
    fun searchFiles(query: String, maxResults: Int = 20): List<FileItem> {
        if (query.isBlank()) return emptyList()

        val basePath = project.basePath ?: return emptyList()
        val baseDir = File(basePath)

        return baseDir.walkTopDown()
            .filter { it.isFile }
            .filter { it.name.contains(query, ignoreCase = true) }
            .filter { !it.name.startsWith(".") }
            .filter { !it.absolutePath.contains("/.") }
            .filter { !it.absolutePath.contains("node_modules") }
            .filter { !it.absolutePath.contains("build") }
            .filter { !it.absolutePath.contains(".gradle") }
            .filter { !it.absolutePath.contains("target") }
            .take(maxResults)
            .map { file ->
                FileItem(
                    name = file.name,
                    path = file.absolutePath,
                    relativePath = file.relativeTo(baseDir).path,
                    extension = file.extension ?: ""
                )
            }
            .toList()
    }

    /**
     * 解析文件引用语法
     *
     * 支持格式:
     * - @filename
     * - @filename:lineNumber
     * - @filename:startLine-endLine
     *
     * @param text 输入文本
     * @return 文件引用列表
     */
    @NotNull
    fun parseFileReference(text: String): List<FileReference> {
        val refs = mutableListOf<FileReference>()

        // 匹配 @filename 或 @filename:line 或 @filename:start-end
        val regex = Regex("@([\\w./\\\\]+)(?::(\\d+)(?::(\\d+))?")
        val matches = regex.findAll(text)

        for (match in matches) {
            val path = match.groupValues[1]
            val startLine = match.groupValues[2].toIntOrNull()
            val endLine = match.groupValues[3].toIntOrNull()

            // 解析文件路径（可能需要基于项目根目录）
            val fullPath = resolveFilePath(path)
            if (fullPath != null) {
                refs.add(FileReference(
                    path = fullPath,
                    startLine = startLine,
                    endLine = endLine
                ))
            }
        }

        return refs
    }

    /**
     * 解析文件路径为完整路径
     *
     * @param path 相对路径或文件名
     * @return 完整路径，不存在则返回 null
     */
    @Nullable
    private fun resolveFilePath(path: String): String? {
        val basePath = project.basePath ?: return null
        val baseDir = File(basePath)

        // 如果是绝对路径，��接返回
        if (File(path).isAbsolute) {
            return if (File(path).exists()) path else null
        }

        // 相对路径
        val file = File(baseDir, path)
        return if (file.exists()) file.absolutePath else null
    }

    /**
     * 获取文件内容作为 prompt 上下文
     *
     * @param path 文件路径
     * @return 文件内容，不存在则返回 null
     */
    @Nullable
    fun getFileContent(path: String): String? {
        return try {
            val file = File(path)
            if (!file.exists()) return null
            file.readText()
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    /**
     * 获取文件内容（带行号范围）
     *
     * @param path 文件路径
     * @param startLine 起始行（1-based）
     * @param endLine 结束行（1-based）
     * @return 文件内容，不存在则返回 null
     */
    @Nullable
    fun getFileContent(path: String, startLine: Int, endLine: Int): String? {
        val content = getFileContent(path) ?: return null
        val lines = content.lines()

        if (startLine <= 0 || endLine > lines.size || startLine > endLine) {
            return content
        }

        return lines.subList(startLine - 1, endLine).joinToString("\n")
    }

    /**
     * 获取文件信息
     *
     * @param path 文件路径
     * @return 文件信息
     */
    @Nullable
    fun getFileInfo(path: String): FileInfo? {
        val file = File(path)
        if (!file.exists()) return null

        return FileInfo(
            name = file.name,
            path = file.absolutePath,
            size = file.length(),
            lastModified = file.lastModified(),
            extension = file.extension ?: ""
        )
    }
}

/**
 * 文件项目
 *
 * @param name 文件名
 * @param path 完整路径
 * @param relativePath 相对路径
 * @param extension 文件扩展名
 */
data class FileItem(
    val name: String,
    val path: String,
    val relativePath: String,
    val extension: String
)

/**
 * 文件信息
 *
 * @param name 文件名
 * @param path 完整路径
 * @param size 文件大小
 * @param lastModified 最后修改时间
 * @param extension 文件扩展名
 */
data class FileInfo(
    val name: String,
    val path: String,
    val size: Long,
    val lastModified: Long,
    val extension: String
)