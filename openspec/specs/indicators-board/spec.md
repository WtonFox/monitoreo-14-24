# Indicators Board Specification

## Requirements

### R1: Route & Navigation

Router MUST register `/indicadores`. Sidebar SHALL include "Indicadores" link.

- GIVEN the app sidebar
- WHEN the route is added
- THEN an "Indicadores" link SHALL appear
- AND navigating to `/indicadores` SHALL render the indicator board

#### Scenario: `/indicadores/sociales` is no longer a valid route

- GIVEN a user navigating to `/indicadores/sociales`
- WHEN the route resolves
- THEN the app SHALL redirect to `/indicadores`
- OR SHALL show a 404 page
- AND `INDICADORES_SOCIALES` SHALL NOT exist in `ROUTES`

### R2: Indicator Display

Page SHALL display 65 indicators in 8 groups: Demográficos, Territoriales, Estado del Programa, Calidad del Dato, Salud y Vulnerabilidad, Cobertura Temporal, Nivel Educativo, Desempeño por Centro. Each card SHALL show name, computed value, formula, description.

- GIVEN participant data in DashboardContext
- WHEN `/indicadores` opens
- THEN 65 cards SHALL render in 8 sections
- AND each SHALL display name, value, formula, description

### R3: Pending Indicators

Indicators #13–#14 (sector-based) SHALL show `"Pendiente de variables: sector"`.

- GIVEN the indicators board
- WHEN #13 and #14 render
- THEN they SHALL NOT show a computed value
- AND they SHALL display "Pendiente de variables: sector"

### R4: Performance

Computations MUST use `useMemo`. For >10k records, use `requestIdleCallback` or a Web Worker.

- GIVEN 67k participants
- WHEN `useIndicators()` runs
- THEN UI SHALL stay responsive (< 50ms frame drops)
- AND computation SHALL complete within 500ms

- GIVEN zero participants
- WHEN `useIndicators()` runs
- THEN all indicators SHALL show `0` or `"N/A"`
- AND no errors SHALL occur

### R5: Modal Value Display

When `indicator.topItems` exists (array length > 0), the modal MUST NOT display `indicator.value` as a formatted text block above the table. When `topItems` is absent or empty, the text SHALL render normally.

#### Scenario: topItems present hides value text

- GIVEN an indicator with `topItems` containing items
- WHEN IndicatorModal opens
- THEN `indicator.value` text SHALL NOT render
- AND only the structured table SHALL appear

#### Scenario: no topItems shows value text

- GIVEN an indicator with no `topItems` property
- WHEN IndicatorModal opens
- THEN `indicator.value` text SHALL render normally

#### Scenario: empty topItems shows value text

- GIVEN an indicator with `topItems: []`
- WHEN IndicatorModal opens
- THEN `indicator.value` text SHALL render normally

### R6: Tab Section Suppression

Each tab MUST conditionally suppress sections that duplicate the indicator's `topItems` content, identified by indicator ID.

#### Scenario: OverviewTab suppresses Top Municipios for IDs 11,12

- GIVEN indicator with ID 11 or 12
- WHEN OverviewTab renders
- THEN the "Top Municipios" section SHALL NOT be included

#### Scenario: OverviewTab suppresses Top Centros for IDs 15,16

- GIVEN indicator with ID 15 or 16
- WHEN OverviewTab renders
- THEN the "Top Centros" section SHALL NOT be included

#### Scenario: OverviewTab suppresses Top Cursos for IDs 17,18

- GIVEN indicator with ID 17 or 18
- WHEN OverviewTab renders
- THEN the "Top Cursos" section SHALL NOT be included

#### Scenario: DetailTab suppresses Discapacidades for ID 44

- GIVEN indicator with ID 44
- WHEN DetailTab renders
- THEN the "Discapacidades" section SHALL NOT be included

#### Scenario: DetailTab suppresses Enfermedades for ID 46

- GIVEN indicator with ID 46
- WHEN DetailTab renders
- THEN the "Enfermedades" section SHALL NOT be included

#### Scenario: TrendTab suppresses Top centros for ID 61

- GIVEN indicator with ID 61
- WHEN TrendTab renders
- THEN the "Top centros" section SHALL NOT be included

#### Scenario: non-matching indicator shows all sections

- GIVEN indicator with ID 5 (no suppression rule)
- WHEN any tab renders
- THEN all sections SHALL render without suppression

### R7: Top Count Support

The `Indicator` type SHALL accept optional `topCount?: number`. Computation SHALL pass `topCount ?? 5` as parameter `n`. Modal header SHALL display `"Top {topCount ?? 5}"`. For IDs 11,12,15,16,17,18,61 the computation SHALL pass `n=10`.

#### Scenario: topCount=10 renders Top 10 header and rows

- GIVEN indicator with `topCount: 10` and 10 computed items
- WHEN modal renders
- THEN header SHALL display "Top 10"
- AND table SHALL render 10 rows

#### Scenario: default renders Top 5

- GIVEN indicator with no `topCount` property
- WHEN modal renders
- THEN header SHALL display "Top 5"
- AND table SHALL render up to 5 rows

#### Scenario: table adapts to fewer items than topCount

- GIVEN indicator with `topCount: 10` but only 7 items from computation
- WHEN modal renders
- THEN header SHALL display "Top 10"
- AND table SHALL render 7 rows

### R8: Calidad-Dato Completeness Format

Indicators with IDs 37–42 (calidad-dato completitud) SHALL display their value as `"X de Y (Z%)"` where X is the count of records with data, Y is the total population, and Z% is the percentage. This is a presentation-format change only — no structural or computational change.

- GIVEN an indicator with ID in [37, 38, 39, 40, 41, 42]
- WHEN the indicator card renders
- THEN the value SHALL display as `"{count} de {total} ({percentage}%)"`
- AND the `completitudPct` function SHALL return both count and total alongside the percentage

#### Scenario: zero records with data

- GIVEN `qualityCedula = 0` and `total = 100`
- WHEN indicator ID 37 renders
- THEN value SHALL display `"0 de 100 (0.0%)"`

#### Scenario: all records have data

- GIVEN `qualityEducation = 200` and `total = 200`
- WHEN indicator ID 39 renders
- THEN value SHALL display `"200 de 200 (100.0%)"`

### R9: New Indicator IDs (66+)

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

### R10: New Section-Suppression Rules

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

### R11: Route and Tab Updates

The system MUST update routing for the unified calidad board and add any new board routes as needed.

#### Scenario: Unified calidad route

- GIVEN a user navigates to `/indicadores/calidad-dato`
- WHEN the route resolves
- THEN `CalidadIntegradaBoard` SHALL render (NOT CalidadDatoBoard)

#### Scenario: Old ND route redirects

- GIVEN a user navigates to `/indicadores/calidad-nd`
- WHEN the route resolves
- THEN the app SHALL redirect to `/indicadores/calidad-dato`

### R12: Total Indicator Count

The system MUST report the correct total count (65 existing + N new = 65 + 18 = 83 total indicators).

#### Scenario: Summary card count

- GIVEN the indicators summary or debug view
- WHEN it renders
- THEN the total count SHALL be 83
- AND exactly 65 SHALL be legacy (IDs 1–65)
- AND exactly 18 SHALL be new (IDs 66–83)

The `INDICADORES_CALIDAD_ND` route constant SHALL point to `/indicadores/calidad-dato` (the unified board). The `/indicadores/calidad-nd` path SHALL redirect.
