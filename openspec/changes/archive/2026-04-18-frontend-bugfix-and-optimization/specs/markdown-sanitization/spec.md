## ADDED Requirements

### Requirement: Markdown content sanitization
The system SHALL sanitize all Markdown-rendered HTML before insertion to prevent XSS attacks.

### Requirement: Allow safe HTML elements
Sanitization SHALL allow safe HTML elements: p, br, strong, em, code, pre, ul, ol, li, blockquote, h1-h6, a, table, thead, tbody, tr, th, td.

### Requirement: Strip dangerous attributes
Sanitization SHALL strip all event handler attributes (onclick, onerror, etc.) and javascript: URLs.

### Requirement: Safe code rendering
Code blocks SHALL be rendered with textContent only, preserving syntax styling through CSS classes only.

## REMOVED Requirements

(None)
