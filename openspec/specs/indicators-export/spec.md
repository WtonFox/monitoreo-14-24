# Spec: Indicators Export

## Description

Export indicator data from the IndicatorsBoard as a multi-sheet XLSX. An "Exportar indicadores" button in the board header opens an ExportSheetSelector modal pre-configured with one sheet per indicator category. Table-based indicators produce a data sheet with their `topItems` rows; chart-based indicators produce a data sheet with the underlying chart series. Chart-image embedding is explicitly out of scope (covered by PDF reports change).

## Dependencies

- `openspec/specs/multi-sheet-export/spec.md` — workbook builder and SheetConfig type
- `services/exporter.ts` — `fetchAllData` for raw participant download
- `hooks/useIndicators.ts` — `IndicatorGroup[]`, `Indicator`, `IndicatorCategory`
- `contexts/IndicadoresFiltersContext` — `boardData` for chart-series data
- `components/IndicatorsBoard.tsx` — host component for export button

## Data Contracts

### Input

```typescript
interface IndicatorsExportInput {
  groups: IndicatorGroup[];         // All indicator groups from useIndicators
  boardData: Participant[];         // Filtered board data for chart series
  categoryLabels: Record<IndicatorCategory, string>;  // Human-readable labels
}
```

### Sheet Generation Rule

| Indicator Type | Sheets Produced | Content |
|---|---|---|
| Category with indicators (any) | 1 per category | All indicators in that category: ID, name, value, formula, topItems (flattened) |
| Category with indicators | 1 per category | Indicator ID, name, value, formula, status, description |
| Charts in category | 1 data sheet per chart | Chart underlying series as columns (labels + values) |
| Tables in category | 1 sheet per table | Full `topItems` array: rank, name, count, percentage |

### Output

XLSX workbook with up to N sheets (1 per selected category). Sheet names match category labels truncated to 31 chars.

## Behavior

### Export Button

- **Scenario**: IndicatorsBoard renders with groups
  - Given `groups` has at least one category
  - When the board header renders
  - Then an "Exportar indicadores" button SHALL appear in the header area
  - And clicking it SHALL open ExportSheetSelector with one sheet per category

### Sheet Pre-selection

- **Scenario**: Categories are pre-checked by default
  - Given 8 indicator categories
  - When ExportSheetSelector opens in indicators context
  - Then all 8 category sheets SHALL be checked by default
  - And the user MAY uncheck any category before exporting

### Category Sheet Content

- **Scenario**: Category sheet for Demográficos
  - Given the "Demográficos" category with 12 indicators
  - When the Demográficos sheet builds
  - Then each row SHALL contain: ID, name, value, formula, status
  - And if the indicator has `topItems`, each `topItem` SHALL expand into sub-rows with rank, item name, count, and percentage
  - And `resto` values for top-N indicators SHALL appear as a summary row within that indicator's block

- **Scenario**: Category sheet for empty indicators
  - Given a category where all indicators show `0` or `"N/A"`
  - When the sheet builds
  - Then the sheet SHALL contain all indicators with their zero/NA values
  - And SHALL NOT suppress the category sheet

### Board Data Sheets

- **Scenario**: Chart-series data sheet
  - Given a category with a chart component (e.g., gender distribution pie)
  - When `boardData` is available
  - Then the workbook SHOULD include an additional sheet named `{category}_datos` with the raw series
  - And series columns SHALL be label and value

### Raw Data Integration

- **Scenario**: User adds raw participant sheet
  - Given the ExportSheetSelector shows a "Participantes (raw)" option
  - When the user checks it and confirms
  - Then `fetchAllData` SHALL download all records
  - And a "Participantes" sheet SHALL be appended with flat participant data

## Loading States

- **State**: Large indicator dataset building
  - Given 83 indicators with `topItems` across 10 categories
  - When the workbook builds
  - Then the UI SHALL show a progress indicator
  - And workbook generation SHALL complete within 3 seconds for all category sheets

## Error States

- **Error**: boardData unavailable for chart series
  - **Effect**: The chart-series sheet SHALL NOT be included; a message SHALL log: "Chart data unavailable — boardContext empty"
  - **Recovery**: Category sheets still export; user sees no raw chart data sheet

- **Error**: Empty groups array
  - **Effect**: Button SHALL be disabled with tooltip "No hay indicadores para exportar"
  - **Recovery**: No modal opens; no error thrown

- **Error**: Group label produces invalid sheet name
  - **Effect**: Name sanitized: invalid XLSX characters (`[]:*?/\`) removed or replaced with spaces
  - **Recovery**: Sheet exports under sanitized name — no data loss

## Non-requirements

Chart-image embedding in XLSX (covered by `openspec/changes/07-pdf-reports/`). Indicator computation logic — specs export computed values only. Historical trend data. Board layout or card positioning preservation. Per-indicator sheet granularity (only per-category sheets).
