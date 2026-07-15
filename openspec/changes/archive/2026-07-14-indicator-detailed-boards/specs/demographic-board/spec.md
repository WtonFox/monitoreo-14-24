# Demographic Board Specification

## Purpose

Render a full dashboard for demographic indicators (gender, age, marital status) with KPI cards and Recharts visualizations, filterable by year and sex.

## Requirements

| ID | Requirement | Keyword |
|----|-------------|---------|
| DE1 | The board MUST display 4 KPI cards: Total participants, % Women, % Men, Average age at registration | MUST |
| DE2 | The board MUST render a gender pie chart using Recharts `<PieChart>` | MUST |
| DE3 | The board MUST render an age group bar chart with buckets `14-17`, `18-20`, `21-24`, `25+` | MUST |
| DE4 | The board MUST render a marital status pie chart from `estadoCivil` data | MUST |
| DE5 | The board MUST render a stacked bar chart for gender × age group cross-tabulation | MUST |
| DE6 | Local filters MUST include a year range select (derived from `fechaRegistro`) and a sex selector | MUST |
| DE7 | Filter state MUST use local `useState`, not global `FiltersContext` | MUST |
| DE8 | The layout MUST use a responsive grid: `grid-cols-1 lg:grid-cols-2` | MUST |

### Scenario: All charts render with data

- GIVEN `demographicData` has non-empty gender, ageBuckets, estadoCivil, genderByAge
- WHEN the board renders
- THEN 4 KPI cards show formatted numbers
- AND the gender pie chart renders with correct segments
- AND the age bar chart shows 4 buckets
- AND the stacked bar chart shows Femenino + Masculino per age bucket

### Scenario: Year filter narrows data

- GIVEN the year range is set to `2024-2024`
- WHEN the filter changes
- THEN the board re-renders with data filtered to participants with `fechaRegistro` in 2024
- AND all charts update accordingly

### Scenario: Sex filter isolates gender

- GIVEN the sex selector is set to "Femenino"
- WHEN the filter applies
- THEN the gender pie chart shows 100% Femenino
- AND other charts reflect only female participants

### Scenario: Empty data after filters

- GIVEN the year filter selects a range with no matching participants
- WHEN the board renders
- THEN each chart area shows a "Sin datos" fallback message
- AND the UI does not crash
