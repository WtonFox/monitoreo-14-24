# Social Board Specification

## Purpose

Render a dashboard for social indicators: data completeness (phone, address), and gender/age distributions by center and course.

## Requirements

| ID | Requirement | Keyword |
|----|-------------|---------|
| S1 | The board MUST display 2 large KPI/progress cards: Phone completeness % and Address completeness % | MUST |
| S2 | Each completeness card MUST show the percentage and a progress bar visualization | MUST |
| S3 | The board MUST render a horizontal grouped bar chart of gender by centro (top 10) | MUST |
| S4 | The board MUST render a horizontal grouped bar chart of gender by curso (top 10) | MUST |
| S5 | The board MUST render a horizontal bar chart of age group by centro (top 10) | MUST |
| S6 | The board MUST render a horizontal bar chart of age group by curso (top 10) | MUST |
| S7 | Local filters MUST include province selector and year range | MUST |

### Scenario: Social board shows completeness KPIs

- GIVEN `socialData` has phoneCompleteness, addressCompleteness, genderByCentro, genderByCurso, ageGroupByCentro, ageGroupByCurso
- WHEN the board renders
- THEN 2 progress cards show phone % and address % with bars
- AND gender by centro renders as horizontal bars
- AND gender by curso renders as horizontal bars
- AND age group by centro renders as horizontal bars
- AND age group by curso renders as horizontal bars

### Scenario: 100% completeness

- GIVEN all participants have a phone number
- WHEN the phone completeness card renders
- THEN it shows 100% and the progress bar is full
- AND the address completeness card independently reflects its own data

### Scenario: Province filter cross-cuts all charts

- GIVEN the province filter is set
- WHEN all social charts render
- THEN every chart reflects the filtered dataset
- AND centro/course names are scoped to participants in that province
