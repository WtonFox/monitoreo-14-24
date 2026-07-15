# Territoriales Regiones — Specification

## Purpose

Add region-level aggregation using the 10 planning regions defined in `REGION_PROVINCES` (constants.ts). Map each participant's province to a region via `findRegion()` in geoUtils.ts. New indicators start at ID 69.

## Requirements

### R1: Participation by Planning Region (ID 69)

The system MUST aggregate participant counts per planning region and render a ranked list.

#### Scenario: Regions ranked by participation

- GIVEN mapping: Ozama (Distrito Nacional + Santo Domingo) = 5000, Cibao Norte (Santiago, Puerto Plata, Espaillat) = 3000, El Valle (San Juan, Elías Piña) = 200
- WHEN indicator ID 69 computes
- THEN Ozama SHALL rank #1 (5000 participants)
- AND Cibao Norte SHALL rank #2
- AND El Valle SHALL rank last
- AND each entry SHALL show region name, participant count, and percentage of total

#### Scenario: Unmapped province edge case

- GIVEN a participant's province does not match any `REGION_PROVINCES` entry
- WHEN indicator ID 69 computes
- THEN that participant SHALL be counted under "Desconocido"
- AND the "Desconocido" entry SHALL appear last in ranking

### R2: Region-Level Sex Distribution (ID 70)

The system MUST compute women and men percentages per planning region.

#### Scenario: Sex distribution per region

- GIVEN Ozama: 3000 women, 2000 men
- WHEN indicator ID 70 computes
- THEN `topItems` SHALL include "Ozama" with women=60.0% and men=40.0%

#### Scenario: Region with only one sex

- GIVEN a region has 100 participants, all women
- WHEN indicator ID 70 computes
- THEN women SHALL show 100%
- AND men SHALL show 0%

### R3: Region-Level Age Distribution (ID 71)

The system MUST compute the percentage of 14–17 and 18–24 participants per planning region.

#### Scenario: Age distribution per region

- GIVEN Cibao Norte: 800 aged 14–17, 1200 aged 18–24 out of 2000 total
- WHEN indicator ID 71 computes
- THEN `topItems` SHALL include "Cibao Norte" with 14-17=40.0%, 18-24=60.0%

#### Scenario: Region with zero participants

- GIVEN a planning region has zero participants in the filtered dataset
- WHEN indicator ID 71 computes
- THEN that region SHALL NOT appear in the ranking
- AND the KPI SHALL NOT be distorted by empty regions

### R4: Filter Scoping

All region-level indicators MUST respect `useIndicadoresFilters()` (provincia, año, municipio).

#### Scenario: Province filter narrows region

- GIVEN provincia="Santiago" (Cibao Norte)
- WHEN indicators compute
- THEN Cibao Norte SHALL reflect only Santiago's data
- AND all other regions SHALL show zero
