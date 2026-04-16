package com.github.xingzhewa.ccassistant.services

import com.github.xingzhewa.ccassistant.model.AgentInfo
import com.github.xingzhewa.ccassistant.model.ItemScope
import com.github.xingzhewa.ccassistant.model.SkillInfo
import com.intellij.openapi.components.Service
import com.intellij.openapi.diagnostic.Logger
import com.intellij.openapi.project.Project
import java.io.File

/**
 * 扫描 Claude Code 的 Skills 和 Agents 目录
 *
 * 全局: ~/.claude/skills/ 和 ~/.claude/agents/
 * 项目: <project_root>/.claude/skills/ 和 <project_root>/.claude/agents/
 */
@Service(Service.Level.PROJECT)
class SkillAgentService(private val project: Project) {

    companion object {
        private val logger = Logger.getInstance(SkillAgentService::class.java)
    }

    private val globalDir = File(System.getProperty("user.home"), ".claude")

    fun scanSkills(): List<SkillInfo> {
        val skills = mutableListOf<SkillInfo>()
        skills.addAll(scanSkillsFromDir(globalDir, ItemScope.GLOBAL))
        project.basePath?.let { basePath ->
            skills.addAll(scanSkillsFromDir(File(basePath, ".claude"), ItemScope.PROJECT))
        }
        return skills
    }

    fun scanAgents(): List<AgentInfo> {
        val agents = mutableListOf<AgentInfo>()
        agents.addAll(scanAgentsFromDir(globalDir, ItemScope.GLOBAL))
        project.basePath?.let { basePath ->
            agents.addAll(scanAgentsFromDir(File(basePath, ".claude"), ItemScope.PROJECT))
        }
        return agents
    }

    // ---- Skills ----

    private fun scanSkillsFromDir(baseDir: File, scope: ItemScope): List<SkillInfo> {
        val skillsDir = File(baseDir, "skills")
        if (!skillsDir.isDirectory) return emptyList()

        val results = mutableListOf<SkillInfo>()
        val subDirs = skillsDir.listFiles { f -> f.isDirectory } ?: return emptyList()

        for (subDir in subDirs) {
            val skillFile = File(subDir, "SKILL.md")
            if (!skillFile.isFile) continue

            try {
                val content = skillFile.readText(Charsets.UTF_8)
                val (name, description, trigger) = parseSkillFrontmatter(content)
                val skillName = name.ifBlank { subDir.name }
                val id = "${scope.name.lowercase()}:${subDir.name}"

                results.add(SkillInfo(
                    id = id,
                    name = skillName,
                    description = description.ifBlank { null },
                    trigger = trigger.ifBlank { null },
                    scope = scope,
                    filePath = skillFile.absolutePath
                ))
            } catch (e: Exception) {
                logger.warn("Failed to parse skill: ${skillFile.absolutePath}", e)
            }
        }
        return results
    }

    /**
     * 解析 SKILL.md 的 YAML frontmatter
     * 格式:
     * ```
     * ---
     * name: skill-name
     * description: What this skill does
     * trigger: when to invoke
     * ---
     * ```
     */
    private fun parseSkillFrontmatter(content: String): Triple<String, String, String> {
        var name = ""
        var description = ""
        var trigger = ""

        val regex = Regex("""^---\s*\n(.*?)\n---""", RegexOption.DOT_MATCHES_ALL)
        val match = regex.find(content) ?: return Triple("", "", "")
        val yaml = match.groupValues[1]

        for (line in yaml.lines()) {
            val kv = line.split(":", limit = 2)
            if (kv.size != 2) continue
            val key = kv[0].trim()
            val value = kv[1].trim().removeSurrounding("\"")
            when (key) {
                "name" -> name = value
                "description" -> description = value
                "trigger" -> trigger = value
            }
        }
        return Triple(name, description, trigger)
    }

    // ---- Agents ----

    private fun scanAgentsFromDir(baseDir: File, scope: ItemScope): List<AgentInfo> {
        val agentsDir = File(baseDir, "agents")
        if (!agentsDir.isDirectory) return emptyList()

        val results = mutableListOf<AgentInfo>()
        val mdFiles = agentsDir.listFiles { f -> f.isFile && f.name.endsWith(".md") } ?: return emptyList()

        for (mdFile in mdFiles) {
            try {
                val agentName = mdFile.nameWithoutExtension
                val content = mdFile.readText(Charsets.UTF_8)
                // Description: first non-empty, non-heading line (up to 100 chars)
                val desc = content.lines()
                    .map { it.trim() }
                    .firstOrNull { it.isNotEmpty() && !it.startsWith("#") }
                    ?.take(100) ?: ""
                val id = "${scope.name.lowercase()}:$agentName"

                results.add(AgentInfo(
                    id = id,
                    name = agentName,
                    description = desc.ifBlank { null },
                    scope = scope,
                    filePath = mdFile.absolutePath
                ))
            } catch (e: Exception) {
                logger.warn("Failed to parse agent: ${mdFile.absolutePath}", e)
            }
        }
        return results
    }
}
