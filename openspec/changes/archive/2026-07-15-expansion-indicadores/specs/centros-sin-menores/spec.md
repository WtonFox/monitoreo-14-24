# Centros Sin Menores — Delta Specification

## Purpose

Extend the existing "Centros Sin Menores" specification with region-level coverage gap analysis and year-over-year trend of uncovered centers.

## Changes from Existing Spec

The existing R1 (KPI), R2 (Center Table), and R3 (Province Filter) REMAIN UNCHANGED.

### ADDED: R4 — Region-Level Gap Summary

The board MUST add a section showing a summary of centers without 14–17 participants grouped by planning region (using `findRegion()`).

#### Scenario: Region gap summary

- GIVEN Cibao Norte has 5 centers without minors out of 20, Ozama has 2 out of 30
- WHEN the region section renders
- THEN Cibao Norte SHALL show "5/20 (25.0%)"
- AND Ozama SHALL show "2/30 (6.7%)"
- AND regions SHALL be sorted by gap percentage descending

#### Scenario: Region fully covered

- GIVEN all centers in a region have 14–17 participants
- WHEN the region section renders
- THEN that region SHALL show "0/10 (0.0%)"
- AND SHALL appear at the bottom of the sorted list

### ADDED: R5 — Year-Over-Year Gap Trend

The board MUST add a trend chart or table showing the count of centers without 14–17 participants per year.

#### Scenario: Gap trend renders

- GIVEN 2023: 15 centers without minors, 2024: 12, 2025: 8
- WHEN the trend section renders
- THEN each year SHALL show the count
- AND a label SHALL indicate if coverage is "Mejorando" (decreasing trend), "Empeorando" (increasing), or "Estable"

#### Scenario: Single year in filter

- GIVEN only one year is selected in the filter
- WHEN the trend section renders
- THEN only that year's data SHALL display
- AND the trend label SHALL read "Sin tendencia disponible"

### ADDED: R6 — Filter Scoping for New Sections

The region gap summary and trend MUST respect the active province and year filters.

#### Scenario: Province filter narrows region gap

- GIVEN provincia="Santiago" (Cibao Norte)
- WHEN the region section renders
- THEN the Cibao Norte row SHALL reflect only Santiago's centers
- AND all other regions SHALL be hidden or show zero
