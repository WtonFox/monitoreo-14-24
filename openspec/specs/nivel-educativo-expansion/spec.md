# Nivel Educativo Expansión — Specification

## Purpose

Extend education indicators with province-level breakdown, region-level aggregation, desertion correlation by education level, and trend analysis. New indicators start at ID 80.

## Requirements

### R1: Education Level by Province (ID 80)

The system MUST compute the distribution of `nivelEstudio` per province, showing the top education level per province.

#### Scenario: Province education profile

- GIVEN Santiago: 500 participants with "Secundaria", 300 with "Universitaria", 200 with "Básica"
- WHEN indicator ID 80 computes
- THEN Santiago SHALL show "Secundaria" as the top level (50.0%)
- AND each entry SHALL include province name, top level, percentage, and participant count

#### Scenario: Province with no education data

- GIVEN a province where all participants have empty/null `nivelEstudio`
- WHEN indicator ID 80 computes
- THEN that province SHALL show "Sin datos"
- AND SHALL appear with zero participants

### R2: Education Level by Planning Region (ID 81)

The system MUST aggregate education level distribution per planning region using `findRegion()`.

#### Scenario: Region education profile

- GIVEN Ozama: 2000 "Secundaria" (40%), 1500 "Universitaria" (30%), 1000 "Básica" (20%), 500 other
- WHEN indicator ID 81 computes
- THEN Ozama SHALL show "Secundaria" as the top level (40.0%)
- AND each education level SHALL show count and percentage

#### Scenario: Region without data

- GIVEN a planning region with zero participants
- WHEN indicator ID 81 computes
- THEN that region SHALL NOT appear in the result
- AND SHALL NOT cause division errors

### R3: Desertion Correlation by Education Level (ID 82)

The system MUST compute the desertion rate per `nivelEstudio` level, showing which education levels have the highest attrition.

#### Scenario: Desertion-education correlation

- GIVEN "Básica": 40 desertions / 200 total (20%), "Secundaria": 100/1000 (10%), "Universitaria": 20/500 (4%)
- WHEN indicator ID 82 computes
- THEN "Básica" SHALL rank #1 with 20% desertion
- AND "Universitaria" SHALL show the lowest rate

#### Scenario: No desertions in a level

- GIVEN "Universitaria" has 300 participants, zero with Retirado/Desertor/Baja
- WHEN indicator ID 82 computes
- THEN "Universitaria" SHALL show 0.0%
- AND SHALL still appear in the ranking

### R4: Education Level Trend (ID 83)

The system MUST compute the year-over-year participation distribution by education level.

#### Scenario: Education trend over years

- GIVEN 2023: 30% "Básica", 50% "Secundaria", 20% "Universitaria"; 2024: 25%, 55%, 20%
- WHEN indicator ID 83 computes
- THEN `topItems` SHALL show each year with level distribution
- AND SHALL highlight the most common level per year

#### Scenario: Single year of data

- GIVEN only one year of data
- WHEN indicator ID 83 computes
- THEN the indicator SHALL display that single year's distribution
- AND SHALL note "Sin tendencia disponible"

### R5: Filter Scoping

All education expansion indicators MUST respect `useIndicadoresFilters()`.

#### Scenario: Province filter on education

- GIVEN provincia="Santiago"
- WHEN indicator ID 80 computes
- THEN only Santiago's education data SHALL be shown
- AND no other province entries SHALL appear
