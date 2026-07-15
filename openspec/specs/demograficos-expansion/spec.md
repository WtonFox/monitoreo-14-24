# Demográficos Expansión — Specification

## Purpose

Extend demographic indicators with age-bucket distribution, sex ratio per age group, and marital status × sex cross-tabulation. New indicators start at ID 66.

## Requirements

### R1: Age-Bucket Distribution (ID 66)

The system MUST compute a detailed age-bucket breakdown: 14–17, 18–20, 21–24, 25+. Each bucket SHALL show count and percentage of total participants.

#### Scenario: Age distribution renders correctly

- GIVEN 1000 participants with ages: 300 aged 14–17, 400 aged 18–20, 200 aged 21–24, 100 aged 25+
- WHEN indicator ID 66 computes
- THEN the value SHALL show "14–17: 300 (30.0%) | 18–20: 400 (40.0%) | 21–24: 200 (20.0%) | 25+: 100 (10.0%)"
- AND `topItems` SHALL contain 4 entries with matching `name` and `value` fields

#### Scenario: All participants in one bucket

- GIVEN all 500 participants are aged 14–17
- WHEN indicator ID 66 computes
- THEN "14–17" SHALL show 100%
- AND all other buckets SHALL show 0

### R2: Sex Ratio by Age Group (ID 67)

The system MUST compute the ratio women:men for each age bucket (14–17, 18–20, 21–24, 25+).

#### Scenario: Sex ratio per bucket

- GIVEN 14–17 bucket: 200 women, 100 men → ratio 2.0
- WHEN indicator ID 67 computes
- THEN `topItems` SHALL include "14–17" with value "2.0:1"

#### Scenario: Zero men in bucket

- GIVEN 14–17 bucket: 50 women, 0 men
- WHEN indicator ID 67 computes
- THEN the ratio SHALL display "∞:1" or "Solo mujeres"
- AND the system SHALL NOT divide by zero

### R3: Marital Status × Sex Cross-Tabulation (ID 68)

The system MUST cross-tabulate `estadoCivil` by sex, showing count per combination.

#### Scenario: Cross-tab renders

- GIVEN data where 100 women are Soltera, 50 women are Casada, 80 men are Soltero, 30 men are Casado
- WHEN indicator ID 68 computes
- THEN `topItems` SHALL include "Soltera (Mujeres): 100", "Soltero (Hombres): 80", "Casada (Mujeres): 50", "Casado (Hombres): 30"

#### Scenario: Unknown sex participants

- GIVEN participants with unknown sex and valid marital status
- WHEN indicator ID 68 computes
- THEN they SHALL be grouped under "Otro" or their original marital status with "Sexo desconocido" label

### R4: Filter Scoping

All new indicators MUST respect the active filter set (provincia, municipio, año, sexo) from `useIndicadoresFilters()`.

#### Scenario: Filtered demographics match

- GIVEN provincia="Santiago", año="2024"
- WHEN indicators compute
- THEN IDs 66–68 SHALL reflect only the filtered subset
- AND values SHALL differ from the unfiltered computation when the subset has different composition
