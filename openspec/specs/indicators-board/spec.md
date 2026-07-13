# Indicators Board Specification

## Requirements

### R1: Route & Navigation

Router MUST register `/indicadores`. Sidebar SHALL include "Indicadores" link.

- GIVEN the app sidebar
- WHEN the route is added
- THEN an "Indicadores" link SHALL appear
- AND navigating to `/indicadores` SHALL render the indicator board

### R2: Indicator Display

Page SHALL display 34 indicators in 4 groups: Demográficos, Territoriales, Estado del Programa, Sociales. Each card SHALL show name, computed value, formula, description.

- GIVEN participant data in DashboardContext
- WHEN `/indicadores` opens
- THEN 34 cards SHALL render in 4 sections
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
