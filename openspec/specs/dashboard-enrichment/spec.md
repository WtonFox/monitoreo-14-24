# Dashboard Enrichment Specification

## Requirements

### R1: DataTable Columns

DataTable MUST add 7 optional columns. `estadoCivil` SHALL be visible by default; 6 others hidden. Users MAY toggle via ColumnSelector.

- GIVEN the DataTable at `/participantes`
- WHEN rendered
- THEN `estadoCivil` column SHALL be visible
- AND the other 6 SHALL be hidden until toggled

### R2: StatsCards KPIs

StatsCards MUST add 4 KPIs: avg `edadRegistro`, % with `discapacidades`, % with `enfermedades`, top `programasSociales`. Existing KPIs SHALL keep position.

- GIVEN filtered participant data
- WHEN StatsCards renders
- THEN 4 new KPI cards SHALL appear without displacing existing ones

### R3: ChartsSection Charts

ChartsSection MUST add `estadoCivil` (pie), `nivelEstudio` (bar), `programasSociales` (bar) after existing charts.

- GIVEN data with the 3 fields populated
- WHEN ChartsSection renders
- THEN 3 new chart blocks SHALL appear below existing ones

### R4: Layout Integrity

Dashboard grid layout and scroll behavior SHALL remain unchanged.

- GIVEN the dashboard at `/estadisticas`
- WHEN new elements render
- THEN the layout SHALL match the existing structure exactly
