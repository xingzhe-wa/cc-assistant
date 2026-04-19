## ADDED Requirements

### Requirement: Frontend stores initialize without mock data

The frontend chat store (`chatStore.ts`) SHALL initialize with empty sessions and providers. The store SHALL wait for Java backend to push data via JCEF bridge before displaying any content.

#### Scenario: Chat store starts empty
- **WHEN** `useChatStore` is first called
- **THEN** `sessions` SHALL be initialized as an empty array `[]`
- **AND** `currentProvider` SHALL be an empty string `""`
- **AND** no mock data from `mock.ts` SHALL be used as initial state

#### Scenario: Empty state shown until data arrives
- **WHEN** the JCEF page loads but backend data has not yet arrived
- **THEN** the frontend SHALL show empty state (no sessions, no providers in dropdown)

### Requirement: Mock data module is deprecated

The `frontend/src/mock.ts` module SHALL be deprecated. All mock data exports (`mockProviders`, `mockSessions`, `mockAgents`, `getMockModelsByProvider`) SHALL be removed from the module. Any imports of these mocks in other frontend files SHALL be replaced with real data from the backend.

#### Scenario: mockProviders import removed from chatStore
- **WHEN** `chatStore.ts` is analyzed for mock imports
- **THEN** there SHALL be no import from `@/mock` or `@/types/mock` that provides `mockProviders`, `mockSessions`, or `mockDiffFiles`
- **AND** the store's initial state SHALL NOT reference any mock data

#### Scenario: MockProvider type removed from frontend types
- **WHEN** frontend type definitions are reviewed
- **THEN** `MockProvider` interface from `@/types/mock` SHALL be removed
- **AND** all provider-related types SHALL align with `dataService.ts` `Provider` interface

### Requirement: CCProviders.setData properly populated

The Java backend `ReactChatPanel.pushProvidersToFrontend()` SHALL correctly populate `CCProviders.setData()` with the actual `PRESET_PROVIDERS` list.

#### Scenario: setData receives ProviderService.PRESET_PROVIDERS
- **WHEN** `pushProvidersToFrontend()` executes
- **THEN** `jcefPanel.setProviders()` SHALL be called with:
  - `providers`: list of `ProviderData(id, name, endpoint)` from each `PRESET_PROVIDERS`
  - `models`: map of `providerId -> list of ModelData(id, name)` from `PRESET_MODELS`
  - `agents`: list of `AgentData(id, name)` from `PRESET_AGENTS`
