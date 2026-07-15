# Delta for indicators-board

## ADDED Requirements

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

## MODIFIED Requirements

None.

## REMOVED Requirements

None.

## RENAMED Requirements

None.
