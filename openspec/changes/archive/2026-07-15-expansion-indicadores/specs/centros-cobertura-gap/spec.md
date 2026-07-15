# Centros Cobertura Gap — Specification

## Purpose

Expand coverage gap analysis beyond "centers without minors" (R1–R3 of existing CentrosSinMenores spec). Add region-level gap analysis and year-over-year trend. New indicators start at ID 72.

## Requirements

### R1: Centers Without Minors by Region (ID 72)

The system MUST aggregate "centers without 14–17 participants" by planning region, showing count and percentage of centers in each region.

#### Scenario: Region aggregation

- GIVEN Cibao Norte has 20 centers, 5 have zero 14–17 participants; Ozama has 30 centers, 2 have zero
- WHEN indicator ID 72 computes
- THEN `topItems` SHALL include "Cibao Norte" with 5 centers (25.0%)
- AND "Ozama" SHALL show 2 centers (6.7%)

#### Scenario: Region fully covered

- GIVEN a region where every center has at least one 14–17 participant
- WHEN indicator ID 72 computes
- THEN that region SHALL show 0 centers (0.0%)

### R2: Coverage Gap Trend (ID 73)

The system MUST compute the year-over-year change in the count of centers without 14–17 participants, showing data for each available year.

#### Scenario: Trend data renders

- GIVEN 2023: 15 centers without minors, 2024: 12 centers, 2025: 8 centers
- WHEN indicator ID 73 computes
- THEN `topItems` SHALL show decreasing trend: 2023→15, 2024→12, 2025→8
- AND the label SHALL describe the direction (e.g. "Mejorando")

#### Scenario: Single year of data

- GIVEN only one year of data is available (2025)
- WHEN indicator ID 73 computes
- THEN the trend SHALL show only the single year
- AND the label SHALL read "Sin tendencia disponible"

### R3: Province-Level Detail for Gap (ID 74)

The system MUST break down the gap by province within each region, identifying provinces with the highest concentration of uncovered centers.

#### Scenario: Province breakdown

- GIVEN Santiago (Cibao Norte) has 3 centers without minors, Puerto Plata has 2, Espaillat has 0
- WHEN indicator ID 74 computes
- THEN Santiago SHALL rank first with 3 centers
- AND Espaillat SHALL show 0

#### Scenario: Province fully covered

- GIVEN all centers in a province have 14–17 participants
- WHEN indicator ID 74 computes
- THEN that province SHALL show 0
- AND SHALL NOT be excluded from the list (zero is valid data)

### R4: Filter Scoping

All gap indicators MUST respect `useIndicadoresFilters()`.

#### Scenario: Filters affect gap metrics

- GIVEN provincia="Santiago"
- WHEN indicator ID 72 computes
- THEN only centers in Santiago contribute to Cibao Norte's gap count
