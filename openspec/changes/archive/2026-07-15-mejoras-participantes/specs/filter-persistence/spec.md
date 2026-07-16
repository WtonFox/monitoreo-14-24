# Filter Persistence Specification

## Purpose

Persists the participant filter state to `sessionStorage` on every change and restores it when the component mounts. Filters survive in-page navigation and browser tab refresh but clear on tab close.

## Requirements

### R1: Save on filter change

Every filter change (search text, dropdown selection, checkbox toggle, date range) MUST immediately serialize the complete filter state to `sessionStorage`.

#### Scenario: Text search persists
- GIVEN user types "Maria" in the search input
- WHEN debounce time elapses
- THEN `sessionStorage('participantes_filters')` SHALL contain the current search term

#### Scenario: Multiple filter save
- GIVEN user sets provincia="Santiago", sexo="F", and search="Maria"
- WHEN any of the three changes
- THEN the serialized state SHALL include all three active filters

### R2: Restore on mount

When the component mounts, it MUST read `sessionStorage('participantes_filters')` and apply stored values to all filter controls.

#### Scenario: Full restore
- GIVEN previous session stored provincia="Santiago" and sexo="F"
- WHEN the component mounts
- THEN the Provincia dropdown SHALL show "Santiago"
- AND the Sexo dropdown SHALL show "F"
- AND the data SHALL be filtered to match

#### Scenario: No stored state
- GIVEN `sessionStorage('participantes_filters')` is empty or missing
- WHEN the component mounts
- THEN all filters SHALL be in their default/empty state

#### Scenario: Corrupt data
- GIVEN `sessionStorage('participantes_filters')` contains unparseable data (e.g., truncated JSON)
- WHEN the component mounts
- THEN the system MUST catch the parse error silently
- AND fall back to default filter state
- AND clear the corrupt `sessionStorage` entry

### R3: Clear on reset

When the user triggers "clear all filters", the system MUST clear the filter state visually AND remove `sessionStorage('participantes_filters')`.

#### Scenario: Clear on reset
- GIVEN filters are active and persisted
- WHEN user clicks "Limpiar filtros" or equivalent
- THEN `sessionStorage('participantes_filters')` SHALL be removed
- AND all filter controls SHALL reset to defaults

### R4: Storage key scope

The storage key `'participantes_filters'` SHALL be scoped to the Participantes page to avoid collisions with other pages that may persist filter state.

#### Scenario: No cross-page collision
- GIVEN another page also uses `sessionStorage` for filter persistence
- WHEN switching between pages
- THEN each page SHALL restore only its own filter state
