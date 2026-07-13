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
