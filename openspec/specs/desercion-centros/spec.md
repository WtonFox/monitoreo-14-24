# Deserción Centros — Specification

## Purpose

Rank centers by desertion rate `(Retirados + Desertores + Bajas) / total * 100`, providing a program-wide KPI and top-10 ranking.

## Requirements

### R1: Program-Wide Desertion KPI

The system MUST compute a general desertion rate: `(Retirados + Desertores + Bajas) / total_participants * 100` across all filtered data.

#### Scenario: Mixed statuses

- GIVEN 1000 total participants, with 50 Retirados, 30 Desertores, 20 Bajas
- WHEN the KPI renders
- THEN the value SHALL be `10.0%`
- AND the label SHALL read "Tasa de deserción general"

#### Scenario: Zero desertions

- GIVEN all participants are "Activo" or "Egresado"
- WHEN the KPI renders
- THEN the value SHALL be `0.0%`

### R2: Top-10 Ranking

The system MUST render a ranked list (table or chart) of the 10 centers with the highest desertion rate.

#### Scenario: Full top 10 renders correctly

- GIVEN 15 centers with varying desertion rates, highest being 45%
- WHEN the ranking renders
- THEN exactly 10 rows SHALL appear
- AND the first row SHALL show the center with 45% desertion
- AND each row SHALL show center name, desertion rate, and participant count

#### Scenario: Fewer than 10 centers

- GIVEN only 4 centers exist in filtered data
- WHEN the ranking renders
- THEN all 4 SHALL appear
- AND no empty rows SHALL be added

### R3: General / Per-Province Toggle

The system MUST provide a toggle between "General" and "Por provincia" views.

#### Scenario: Per-province shows top per region

- GIVEN toggle is set to "Por provincia", AND province "Santiago" has 8 centers
- WHEN the ranking renders
- THEN it SHALL show centers only from "Santiago"
- AND the title SHALL indicate the active province

#### Scenario: Province with one center

- GIVEN toggle is set to "Por provincia", AND the selected province has 1 center with 0 desertions
- WHEN the ranking renders
- THEN the single row SHALL show `0.0%`
- AND the table SHALL NOT be empty

### R4: Filter Scoping

The system MUST respect all active filters (provincia, municipio, año) and recompute both KPI and ranking accordingly.

#### Scenario: Filters narrow dataset

- GIVEN provincia="La Altagracia", año="2024"
- WHEN the board renders
- THEN the KPI SHALL reflect only that subset
- AND the ranking SHALL include only centers matching both filters

#### Scenario: Empty filtered set

- GIVEN filters match zero participants
- WHEN the board renders
- THEN the KPI SHALL show `0.0%`
- AND the ranking SHALL show "Sin datos"

### R5: Desertion by Course Section

The board MUST add a section showing desertion rate per `rutaFormativa` (course).

#### Scenario: Course desertion ranking

- GIVEN 5 courses with varying desertion rates
- WHEN the course section renders
- THEN courses SHALL be sorted by desertion rate descending
- AND each row SHALL show course name, desertion count, total participants, and rate
- AND the top 10 courses SHALL display by default

#### Scenario: Course with zero desertions

- GIVEN a course with zero Retirado/Desertor/Baja participants
- WHEN the course section renders
- THEN that course SHALL show 0.0%
- AND SHALL still appear (no suppression)

### R6: Desertion by Age Group Section

The board MUST add a section showing desertion rate per age bucket (14–17, 18–20, 21–24, 25+).

#### Scenario: Age group desertion

- GIVEN the filtered dataset
- WHEN the age group section renders
- THEN each bucket SHALL show desertion count, total, and rate
- AND buckets SHALL be sorted by age ascending

#### Scenario: Empty bucket

- GIVEN no participants in the 25+ age range
- WHEN the age group section renders
- THEN the 25+ bucket SHALL show "—" or "Sin datos"
- AND SHALL NOT show 0.0% (no denominator)

### R7: Desertion by Planning Region Section

The board MUST add a section showing desertion rate per planning region (using `findRegion()`).

#### Scenario: Region desertion ranking

- GIVEN 10 planning regions with varying data
- WHEN the region section renders
- THEN regions SHALL be sorted by desertion rate descending
- AND each row SHALL show region name, desertion count, total, and rate

### R8: Desertion Trend Section

The board MUST add a trend chart or table showing aggregate desertion rate per year.

#### Scenario: Trend renders correctly

- GIVEN 2023: 6.0%, 2024: 6.0%, 2025: 3.3%
- WHEN the trend section renders
- THEN each year SHALL display with its rate
- AND a directional label SHALL appear

#### Scenario: Single year

- GIVEN only 2025 data
- WHEN the trend section renders
- THEN it SHALL show only 2025
- AND the label SHALL read "Sin tendencia disponible"

### R9: Filter Scoping for All New Sections

All new sections MUST respect `useIndicadoresFilters()`.

#### Scenario: Province filter on region desertion

- GIVEN provincia="Santiago"
- WHEN the region section renders
- THEN only Cibao Norte desertion data (filtered to Santiago) SHALL display
