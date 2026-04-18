## ADDED Requirements

### Requirement: Single JS bundle output
The build system SHALL produce a single JavaScript bundle file for JCEF deployment.

### Requirement: Inline CSS in HTML
All CSS SHALL be inlined within the HTML file via `<style>` tags, not external `<link>` references.

### Requirement: No ES module dynamic imports
The built JavaScript SHALL NOT use ES module dynamic imports (`import()`) as they fail in JCEF resource context.

### Requirement: Stable resource filenames
Assets SHALL use stable filenames (content hash optional) to ensure consistent loading.

## REMOVED Requirements

(None)
