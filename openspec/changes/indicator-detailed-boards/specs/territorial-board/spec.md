# Territorial Board Specification

## Purpose

Render a dashboard for territorial/district indicators showing municipality, center, and course distributions with gender breakdowns.

## Requirements

| ID | Requirement | Keyword |
|----|-------------|---------|
| T1 | The board MUST display 3 KPI cards: #Municipios, #Centros, #Cursos (distinct count) | MUST |
| T2 | The board MUST render a horizontal bar chart of top 10 municipios by participant count | MUST |
| T3 | The board MUST render a horizontal bar chart of top 10 centros | MUST |
| T4 | The board MUST render a horizontal bar chart of top 10 cursos (rutaFormativa) | MUST |
| T5 | The board MUST render a grouped bar chart of gender by municipio (top 10) | MUST |
| T6 | All bar charts MUST use layout="vertical" (horizontal bars) with Recharts | MUST |
| T7 | Local filters MUST include a province selector and year range | MUST |

### Scenario: All territorial charts render

- GIVEN `territorialData.topMunicipios`, `topCentros`, `topCursos`, `genderByMunicipio` are non-empty
- WHEN the board renders
- THEN 3 KPI cards show distinct counts
- AND top 10 municipios render as horizontal bars
- AND top 10 centros render as horizontal bars
- AND genderByMunicipio renders as grouped bars

### Scenario: Province filter narrows scope

- GIVEN the province selector is set to a specific province
- WHEN data is filtered
- THEN top municipios only shows municipalities within that province
- AND centro/cursos counts reflect only participants from that province

### Scenario: Provincia with few municipalities

- GIVEN the selected province has fewer than 10 municipalities
- WHEN the top 10 municipio chart renders
- THEN it shows all available municipalities without padding
- AND empty chart states are handled gracefully
