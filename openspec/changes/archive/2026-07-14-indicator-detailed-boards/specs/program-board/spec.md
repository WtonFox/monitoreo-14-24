# Program Board Specification

## Purpose

Render a dashboard for program status indicators: active/graduated rates, tutor coverage, and cross-entity breakdowns.

## Requirements

| ID | Requirement | Keyword |
|----|-------------|---------|
| P1 | The board MUST display 4 KPI cards: %Active, %Graduated, %Minors with tutor, %Tutors with phone | MUST |
| P2 | The board MUST render a status distribution pie chart from `programData.status` | MUST |
| P3 | The board MUST render a grouped bar chart of Active vs Graduated by top 10 centros | MUST |
| P4 | The board MUST render a grouped bar chart of Active vs Graduated by top 10 municipios | MUST |
| P5 | Local filters MUST include province selector, center search/select, and year range | MUST |

### Scenario: Program board shows status breakdown

- GIVEN `programData` has status, activeGraduatedByCentro, activeGraduatedByMunicipio
- WHEN the board renders
- THEN 4 KPI cards show formatted percentages
- AND the status pie chart shows estado distribution
- AND grouped bar charts show Activos and Egresados side by side per entity

### Scenario: Center filter isolates one center

- GIVEN the center search/select is set to a specific center
- WHEN the filter applies
- THEN the status distribution only counts participants from that center
- AND the centro grouped bar shows only the selected center
- AND the municipio grouped bar reflects the selected center's municipality

### Scenario: All zeros edge case

- GIVEN no participants are Active or Graduated (all are Retirado or other)
- WHEN KPI cards compute
- THEN %Active and %Graduated display `0.0%`
- AND the pie chart still renders all status categories found
