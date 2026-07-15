# Indicators Board — Delta Specification

## Purpose

Extend the indicator system to accommodate new indicators (IDs 66+) across demographic, territorial, coverage-gap, desertion-analytics, and education-expansion categories. Update routing, tab navigation, and section-suppression rules.

## Changes from Existing Spec

The existing R1–R8 (routes, 65 indicators, pending display, performance, modal, tab suppression, topCount, calidad format) REMAIN UNCHANGED.

### ADDED: R9 — New Indicator IDs (66+)

The system MUST accept indicator IDs 66 through 83 as valid, preserving the original 65 without modification.

#### Scenario: 65 original indicators unchanged

- GIVEN the `computeIndicators()` function
- WHEN it returns the full indicator array
- THEN indicator IDs 1–65 SHALL be identical in value, formula, and description to the pre-expansion version
- AND IDs 66–83 SHALL be appended after ID 65

#### Scenario: New indicators grouped correctly

- GIVEN indicator IDs 66–68 are `demograficos`
- WHEN the board renders
- THEN they SHALL appear under the Demográficos section
- AND SHALL NOT appear in any other category

### ADDED: R10 — New Section-Suppression Rules

The system MUST extend the suppression rules in OverviewTab, DetailTab, and TrendTab to cover new indicator IDs.

#### Scenario: New topItems-based indicators suppress value text

- GIVEN a new indicator ID 66–83 with `topItems` populated
- WHEN the modal renders
- THEN the value text SHALL NOT display above the table
- (Same behavior as existing R5 for all indicators with topItems)

#### Scenario: TrendTab suppression for ID 79

- GIVEN indicator ID 79 (desertion trend)
- WHEN TrendTab renders
- THEN the "Top centros" section SHALL be suppressed (the trend data replaces it)

### ADDED: R11 — Route and Tab Updates

The system MUST update routing for the unified calidad board and add any new board routes as needed.

#### Scenario: Unified calidad route

- GIVEN a user navigates to `/indicadores/calidad-dato`
- WHEN the route resolves
- THEN `CalidadIntegradaBoard` SHALL render (NOT CalidadDatoBoard)

#### Scenario: Old ND route redirects

- GIVEN a user navigates to `/indicadores/calidad-nd`
- WHEN the route resolves
- THEN the app SHALL redirect to `/indicadores/calidad-dato`

### ADDED: R12 — Total Indicator Count

The system MUST report the correct total count (65 existing + N new = 65 + 18 = 83 total indicators).

#### Scenario: Summary card count

- GIVEN the indicators summary or debug view
- WHEN it renders
- THEN the total count SHALL be 83
- AND exactly 65 SHALL be legacy (IDs 1–65)
- AND exactly 18 SHALL be new (IDs 66–83)

### REMOVED: INDICADORES_CALIDAD_ND route (repurposed)

The `INDICADORES_CALIDAD_ND` route constant SHALL point to `/indicadores/calidad-dato` (the unified board). The `/indicadores/calidad-nd` path SHALL redirect.
