# Deserción Centros — Delta Specification

## Purpose

Extend the existing desertion center ranking with new breakdown sections: desertion by course, age group, planning region, and year-over-year trend.

## Changes from Existing Spec

The existing R1 (Desertion KPI), R2 (Top-10 Ranking), R3 (General/Province Toggle), and R4 (Filter Scoping) REMAIN UNCHANGED.

### ADDED: R5 — Desertion by Course Section

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

### ADDED: R6 — Desertion by Age Group Section

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

### ADDED: R7 — Desertion by Planning Region Section

The board MUST add a section showing desertion rate per planning region (using `findRegion()`).

#### Scenario: Region desertion ranking

- GIVEN 10 planning regions with varying data
- WHEN the region section renders
- THEN regions SHALL be sorted by desertion rate descending
- AND each row SHALL show region name, desertion count, total, and rate

### ADDED: R8 — Desertion Trend Section

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
