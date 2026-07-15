# Deserción Analytics — Specification

## Purpose

Add deep desertion analytics beyond the existing center-level ranking (desercion-centros spec). Break down by course, age group, sex, planning region, and year-over-year trend. New indicators start at ID 75.

## Requirements

### R1: Desertion by Course (ID 75)

The system MUST compute desertion rate `(Retirados + Desertores + Bajas) / total * 100` per `rutaFormativa`.

#### Scenario: Courses ranked by desertion

- GIVEN "Panadería" course has 50 desertions out of 200 total (25%), "Informática" has 30/300 (10%)
- WHEN indicator ID 75 computes
- THEN "Panadería" SHALL rank above "Informática"
- AND each entry SHALL show course name, desertion rate, and total participants

#### Scenario: Course with zero desertions

- GIVEN a course has zero participants with Retirado/Desertor/Baja status
- WHEN indicator ID 75 computes
- THEN that course SHALL show 0.0%
- AND SHALL appear in the ranking

### R2: Desertion by Age Group (ID 76)

The system MUST compute desertion rate by age bucket (14–17, 18–20, 21–24, 25+).

#### Scenario: Age-group breakdown

- GIVEN 14–17 group: 20 desertions out of 400 (5%); 18–20 group: 60 desertions out of 300 (20%)
- WHEN indicator ID 76 computes
- THEN 18–20 SHALL show higher desertion (20%) than 14–17 (5%)
- AND each entry SHALL show desertion count and rate

#### Scenario: Empty age bucket

- GIVEN zero participants aged 21–24
- WHEN indicator ID 76 computes
- THEN the 21–24 entry SHALL show "Sin datos" or be omitted
- AND SHALL NOT display 0.0% (no denominator to compute)

### R3: Desertion by Sex (ID 77)

The system MUST compute desertion rate separately for women and men.

#### Scenario: Sex-based desertion

- GIVEN women: 40 desertions out of 600 (6.67%); men: 50 desertions out of 400 (12.5%)
- WHEN indicator ID 77 computes
- THEN men SHALL show higher desertion (12.5%)
- AND women SHALL show 6.67%

#### Scenario: Unknown sex participants

- GIVEN participants with unknown sex (not Femenino/Masculino)
- WHEN indicator ID 77 computes
- THEN they SHALL be grouped as "Otro"
- AND the entry SHALL display alongside women/men entries

### R4: Desertion by Planning Region (ID 78)

The system MUST compute desertion rate per planning region using `findRegion()`.

#### Scenario: Regional desertion ranking

- GIVEN Ozama: 100 desertions out of 5000 (2%); Enriquillo: 30 desertions out of 300 (10%)
- WHEN indicator ID 78 computes
- THEN Enriquillo SHALL rank higher than Ozama
- AND each entry SHALL include region name, desertion count, rate, and total

#### Scenario: Unmapped province

- GIVEN participants whose province maps to "Desconocido"
- WHEN indicator ID 78 computes
- THEN they SHALL appear under "Desconocido" at the bottom of the ranking

### R5: Desertion Trend (ID 79)

The system MUST compute year-over-year desertion rate for the aggregate program.

#### Scenario: Trend over multiple years

- GIVEN 2023: 120 desertions / 2000 total (6.0%), 2024: 150/2500 (6.0%), 2025: 100/3000 (3.3%)
- WHEN indicator ID 79 computes
- THEN `topItems` SHALL show each year with rate and total
- AND the label SHALL indicate the direction ("Mejorando" for decreasing rate)

#### Scenario: Only one year

- GIVEN data from a single year only
- WHEN indicator ID 79 computes
- THEN it SHALL display that year's rate
- AND SHALL note "Sin tendencia disponible"

### R6: Filter Scoping

All desertion analytics indicators MUST respect `useIndicadoresFilters()`.

#### Scenario: Filters isolate region

- GIVEN provincia="Santiago" (Cibao Norte), año="2024"
- WHEN indicator ID 78 computes
- THEN only Cibao Norte data for 2024 SHALL be used
