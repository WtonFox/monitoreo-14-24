# Participant Stats Bar Specification

## Purpose

Displays a horizontal summary bar between filter pills and the accordion showing aggregate statistics computed over `filteredData`: total count, sex breakdown, average age, and unique centers.

## Requirements

### R1: Display aggregated stats

The Stats Bar MUST show total participants, M/F count, average age, and unique centers count. Values SHALL be derived from `filteredData` (post-filter).

#### Scenario: Default state (no filters)
- GIVEN 1,234 total participants, no active filters
- WHEN the table renders
- THEN the Stats Bar SHALL display "1,234 participantes | M: 600 | F: 634 | Edad prom: 22.5 | 45 centros únicos"

#### Scenario: After filtering
- GIVEN a filter reduces rows to 48 participants from 2 centers
- WHEN the filter is applied
- THEN the Stats Bar SHALL update to "48 participantes | M: 22 | F: 26 | Edad prom: 24.1 | 2 centros únicos"

#### Scenario: Zero results after filter
- GIVEN a filter returns zero matching participants
- WHEN the filter applies
- THEN the Stats Bar SHALL display "0 participantes | M: 0 | F: 0 | Edad prom: — | 0 centros únicos"

### R2: Reactive to filter changes

Stats SHALL recompute automatically when `filteredData` changes, with no manual refresh needed.

#### Scenario: Real-time update
- GIVEN the Stats Bar shows 1,234 participants
- WHEN user adds a filter that reduces results to 100
- THEN the Stats Bar SHALL update to reflect 100 participants within the same render cycle

### R3: Result counter display

A prominent counter showing total filtered participant count MUST appear above the table, visually distinct (larger font / bold).

#### Scenario: Counter visible
- GIVEN 1,234 participants exist after filtering
- WHEN the table section renders
- THEN a counter reading "1,234 participantes" SHALL be visible above the table

#### Scenario: Counter updates with filter
- GIVEN counter shows "1,234 participantes"
- WHEN user types to search and results drop to 56
- THEN the counter SHALL update to "56 participantes"

#### Scenario: Empty state
- GIVEN zero filtered participants
- WHEN the counter renders
- THEN it SHALL display "0 participantes"

### R4: Loading state — skeleton

While `dashboardData` is empty and `isLoaded` is false, the Stats Bar SHALL NOT render computed values. A skeleton placeholder SHALL display instead.

#### Scenario: Skeleton during load
- GIVEN `dashboardData.length === 0` and `isLoaded === false`
- WHEN the page renders
- THEN a CSS skeleton (shimmer/pulse animation) SHALL replace the Stats Bar content

#### Scenario: Skeleton transitions to data
- GIVEN skeleton is displayed during initial load
- WHEN `dashboardData` becomes populated
- THEN the skeleton SHALL be replaced with computed stats in a single render
