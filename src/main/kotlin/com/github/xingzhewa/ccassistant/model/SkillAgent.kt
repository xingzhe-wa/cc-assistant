package com.github.xingzhewa.ccassistant.model

/**
 * Skills/Agents 数据模型 — 按照 Claude Code 官方规范解析
 *
 * Skill 识别规则: 仅 `.claude/skills/<name>/SKILL.md` 文件，解析 YAML frontmatter
 * Agent 识别规则: `.claude/agents/` 下的任意 `.md` 文件
 */

enum class ItemScope { GLOBAL, PROJECT }

data class SkillInfo(
    val id: String,
    val name: String,
    val description: String?,
    val trigger: String?,
    val scope: ItemScope,
    val filePath: String
)

data class AgentInfo(
    val id: String,
    val name: String,
    val description: String?,
    val scope: ItemScope,
    val filePath: String
)
