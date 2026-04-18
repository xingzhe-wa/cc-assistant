## ADDED Requirements

### Requirement: Skill selector shall display all available skills

The Skill dropdown in chat UI SHALL display all skills loaded from backend.

#### Scenario: Skill selector populated on load
- **WHEN** frontend receives cc-skills event with skill data
- **THEN** Skill dropdown SHALL display all skills from the data
- **AND** current skill SHALL be pre-selected based on ConfigService state

### Requirement: Skill selector shall have "Configure New Skill" option

The Skill dropdown SHALL include a "Configure New Skill" option at the bottom that allows users to jump to Settings page.

#### Scenario: User clicks "Configure New Skill"
- **WHEN** user selects "Configure New Skill" from dropdown
- **THEN** JavaScript SHALL call `jcefBridge.openSettings('skills')`
- **AND** Java backend SHALL receive 'openSettings' action with tab='skills'
- **AND** Settings page SHALL open with Skills tab active

### Requirement: Skill selector shall show skill name and trigger

The Skill dropdown SHALL show skill name and trigger pattern for each skill option.

#### Scenario: Display skill options with details
- **WHEN** Skill dropdown is rendered
- **THEN** each option SHALL display skill.name
- **AND** tooltip SHALL show skill.trigger if available
