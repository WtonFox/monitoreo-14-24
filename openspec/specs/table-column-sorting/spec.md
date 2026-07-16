# Table Column Sorting Specification

## Purpose

Adds column header sorting (ascending/descending) to the DataTable. Clicking a header cycles through asc → desc → asc. Sort applies to `filteredData` (not just the current page). An arrow icon indicates direction.

## Requirements

### R1: Toggle sort on header click

Clicking a column header SHALL sort the table data by that column. First click SHALL sort ascending; second click SHALL sort descending.

#### Scenario: Ascending sort
- GIVEN the table displays unsorted participants
- WHEN user clicks "Nombres" header
- THEN rows SHALL reorder A→Z by nombres

#### Scenario: Descending sort
- GIVEN the table is sorted ascending by "Nombres"
- WHEN user clicks "Nombres" header again
- THEN rows SHALL reorder Z→A by nombres

#### Scenario: Toggle different column
- GIVEN the table is sorted by "Edad" descending
- WHEN user clicks "Provincia" header
- THEN sort SHALL switch to Provincia ascending
- AND the previous sort key SHALL be replaced (not stacked)

### R2: Sort over filteredData

Sorting MUST operate on `filteredData` (data after filter/search is applied), not on raw `dashboardData`.

#### Scenario: Filtered sort
- GIVEN a filter reduces visible rows to Provincia="Santiago"
- WHEN user sorts by "Edad"
- THEN only the 8 Santiago rows SHALL be reordered
- AND hidden rows SHALL NOT affect the sort

### R3: Sort indicator

A visual indicator MUST show current sort column and direction.

#### Scenario: Ascending indicator
- GIVEN the table is sorted ascending by "Edad"
- THEN the Edad header SHALL display a ▲ or ↑ icon adjacent to the label

#### Scenario: Descending indicator
- GIVEN the table is sorted descending by "Edad"
- THEN the Edad header SHALL display a ▼ or ↓ icon

#### Scenario: No sort indicator
- GIVEN no column is being sorted
- THEN all column headers SHALL show a neutral/default icon indicating sortability (e.g., ⇅ dimmed)

### R4: Sort on paginated data

Sort MUST reorder across ALL filtered rows, then paginate the sorted result.

#### Scenario: Sort + pagination
- GIVEN 150 filtered rows across 2 pages (pageSize=100)
- WHEN user sorts by "Cédula" ascending
- THEN page 1 SHALL display the first 100 rows of the fully sorted list
- AND page 2 SHALL display rows 101-150

### R5: Default column visibility

Three columns SHALL be visible by default in addition to current defaults: Municipio, Ruta Formativa, Fecha Registro.

#### Scenario: Default visible columns
- GIVEN a fresh table load with no column toggles set
- WHEN the table renders
- THEN Municipio, Ruta Formativa, and Fecha Registro SHALL be visible

#### Scenario: Column toggle override
- GIVEN user has toggled visibility settings
- WHEN the table re-renders
- THEN visibility state SHALL respect user's toggle choices (not reset to defaults)
