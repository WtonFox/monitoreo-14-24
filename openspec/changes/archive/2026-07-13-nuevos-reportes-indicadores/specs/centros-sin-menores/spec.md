# Centros Sin Menores — Specification

## Purpose

Identify centers with zero participants aged 14–17 in the program, surfacing coverage gaps.

## Requirements

### R1: KPI — Centers Without Coverage

The system MUST compute a KPI showing the count of centers that have zero participants in the 14–17 age range.

#### Scenario: Some centers lack minors

- GIVEN `filteredData` contains participants across 10 centers, AND 3 centers have no participant aged 14–17
- WHEN the board renders
- THEN the KPI SHALL display `3`
- AND the KPI label SHALL read "Centros sin cobertura de menores"

#### Scenario: All centers have minors

- GIVEN every center has at least one participant aged 14–17
- WHEN the board renders
- THEN the KPI SHALL display `0`

### R2: Center Table

The system MUST render a table listing centers without 14–17 coverage, sorted by total participant count descending.

#### Scenario: Centers listed correctly

- GIVEN centers "A", "B" are without 14–17 participants, with totals 50 and 20 respectively
- WHEN the table renders
- THEN "A" SHALL appear before "B"
- AND each row SHALL show center name and total participants outside the 14–17 range

#### Scenario: No centers without minors

- GIVEN all centers have at least one 14–17 participant
- WHEN the board renders
- THEN the table SHALL show "Sin datos" empty state
- AND SHALL NOT render rows

### R3: Province Filter

The system MUST respect the province filter from `useIndicadoresFilters()`, scoping both KPI and table to the selected province.

#### Scenario: Filter narrows results

- GIVEN province filter is set to "Santiago", AND only center "C" (in Santiago) lacks minors
- WHEN the board renders
- THEN the KPI SHALL show `1`
- AND the table SHALL list only center "C"

#### Scenario: Filtered province fully covered

- GIVEN province filter is set to "La Vega", AND all centers in La Vega have 14–17 participants
- WHEN the board renders
- THEN the KPI SHALL show `0`
- AND the table SHALL show "Sin datos"
