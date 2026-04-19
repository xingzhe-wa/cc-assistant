## ADDED Requirements

### Requirement: Skill create writes to filesystem
When a user creates a new Skill in the settings UI, the system SHALL create a directory at `~/.claude/skills/<id>/` with a `SKILL.md` file.

#### Scenario: Create new skill
- **WHEN** user fills in skill name, description, and instructions, then clicks "Save"
- **THEN** a directory `~/.claude/skills/<id>/` is created
- **AND** a file `~/.claude/skills/<id>/SKILL.md` is created with YAML frontmatter and markdown body

#### Scenario: Skill file format
- **WHEN** a skill with name="explain-code" and description="Explains code" is created
- **THEN** the SKILL.md contains:
```
---
name: explain-code
description: Explains code
---
# Explain Code

Explains code ...
```

### Requirement: Skill update modifies filesystem
When a user updates an existing Skill, the system SHALL update the corresponding `SKILL.md` file.

#### Scenario: Update skill description
- **WHEN** user changes the description of an existing skill
- **THEN** `~/.claude/skills/<id>/SKILL.md` is updated with the new frontmatter

### Requirement: Skill delete removes filesystem directory
When a user deletes a Skill, the system SHALL delete the corresponding skill directory.

#### Scenario: Delete existing skill
- **WHEN** user deletes a skill with id "my-skill"
- **THEN** the directory `~/.claude/skills/my-skill/` is deleted (including SKILL.md and all supporting files)

### Requirement: Java handles skill CRUD actions
The Java `handleJSMessage` SHALL handle `skillCreate`, `skillUpdate`, and `skillDelete` actions.

#### Scenario: skillCreate handled
- **WHEN** frontend sends `skillCreate:{...}` via cefQuery
- **THEN** Java calls `onSkillCreate?.invoke(map)` callback which writes to filesystem

#### Scenario: skillUpdate handled
- **WHEN** frontend sends `skillUpdate:{...}` via cefQuery
- **THEN** Java calls `onSkillUpdate?.invoke(map)` callback

#### Scenario: skillDelete handled
- **WHEN** frontend sends `skillDelete:skillId` via cefQuery
- **THEN** Java calls `onSkillDelete?.invoke(id)` callback

### Requirement: scanSkills reads from filesystem
The SkillAgentService.scanSkills() SHALL read existing skills from `~/.claude/skills/` directories on disk.

#### Scenario: Load skills from disk
- **WHEN** `~/.claude/skills/` contains skill directories with SKILL.md files
- **THEN** scanSkills() returns a list of SkillConfig parsed from these files
