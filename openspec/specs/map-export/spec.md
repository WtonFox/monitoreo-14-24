# Spec: Map Export

## Description

Export contextual data from the interactive map section as a multi-sheet XLSX. An "Exportar datos del mapa" button in MapSection opens an ExportSheetSelector modal where the user chooses which aggregate sheets to include: summary KPIs, counts by province, counts by municipality, a detailed per-location breakdown (conditional on selected location), and raw participant data.

## Dependencies

- `openspec/specs/multi-sheet-export/spec.md` — workbook builder and SheetConfig type
- `services/exporter.ts` — `fetchAllData` for raw participant download
- `hooks/useMapStats.ts` — `mapData`, `locationStats`, national rates
- `components/MapSection.tsx` — host component for export button

## Data Contracts

### Input (from `useMapStats`)

```typescript
interface MapExportInput {
  filteredData: Participant[];           // Currently filtered participant set
  mapData: Record<string, number>;       // Counts per location at current level
  locationStats: Record<string, LocationStats>;  // Detailed per-location stats
  selectedLocation: string | null;       // Currently selected location (tap/click)
  mapLevel: 'region' | 'province' | 'municipality';
  nationalRates: {                       // National averages for comparison columns
    phoneRate: number;
    vulnerabilityRate: number;
    avgAge: number;
    genderRate: { M: number; F: number; other: number };
  };
}
```

### Output

XLSX workbook with up to 5 selectable sheets (in selection order):

| Sheet Name | Condition | Content |
|---|---|---|
| Resumen | Always | Total filtered, gender split, unique centers, avg age, top province, top status |
| Participantes por provincia | `mapLevel !== 'municipality'` or forced | Province name, participant count, % of total |
| Participantes por municipio | `selectedProvince` is set | Municipality name, participant count, % of province total |
| Detalle por ubicación | `selectedLocation !== null` | Location stats table (total, gender, age range, top centers, phone%, vulnerability%, education breakdown, status breakdown, year counts) |
| Participantes (raw) | Always | Full participant flat data (same columns as existing single-sheet export) |

## Behavior

### Export Button Visibility

- **Scenario**: MapSection renders with data
  - Given MapSection has non-empty `data` prop
  - When the toolbar renders
  - Then a "Exportar datos del mapa" button SHALL appear in the map controls area
  - And clicking it SHALL open the ExportSheetSelector modal

### Sheet Selection Defaults

- **Scenario**: Modal opens with pre-configured sheets
  - Given `selectedLocation === null`
  - When ExportSheetSelector renders for map context
  - Then "Resumen" and "Participantes por provincia" SHALL be pre-checked
  - And "Detalle por ubicación" SHALL NOT appear in the list

- **Scenario**: Location selected adds detail sheet
  - Given `selectedLocation` is a non-empty string
  - When the modal opens
  - Then "Detalle por ubicación" SHALL appear in the sheet list
  - And it SHALL be checked by default

### Resumen Sheet Content

- **Scenario**: Summary KPI sheet built
  - Given filtered data with 1500 participants across 12 provinces
  - When the workbook builds with Resumen sheet
  - Then the sheet SHALL contain: total count, male/female counts, unique centers, avg age, top province (name + count), top status (name + count)
  - And each KPI SHALL have a label column and a value column

### Province/Municipality Sheet Content

- **Scenario**: Province counts sheet
  - Given `mapData` with counts per province
  - When the provincia sheet builds
  - Then each row SHALL contain: province name, participant count, percentage of total filtered
  - And rows SHALL be sorted by count descending

- **Scenario**: Municipality sheet only when province is selected
  - Given `selectedProvince` is null
  - When the modal renders
  - Then "Participantes por municipio" SHALL NOT be offered
  - Given a province is selected
  - When the modal renders
  - Then the municipio sheet SHALL be available

### Raw Sheet Content

- **Scenario**: Raw participant sheet
  - Given the user checks "Participantes (raw)"
  - When export proceeds
  - Then the service SHALL call `fetchAllData` to download all records from API
  - And the sheet SHALL use the same columns as `exportToExcel` in `services/exporter.ts`

## Loading States

- **State**: Raw data is downloading
  - Given the user selected "Participantes (raw)" and clicked export
  - When `fetchAllData` runs
  - Then the modal SHALL show the existing `ExportProgress` bar with page/record count
  - And aggregate sheets SHALL be built first while raw data downloads in background

## Error States

- **Error**: Raw data download fails partially
  - **Effect**: Warning sheet prepended — "Exportación incompleta: se esperaban N registros, se descargaron M"
  - **Recovery**: Workbook still generated with available data; all aggregate sheets function normally

- **Error**: No filtered data
  - **Effect**: Button remains visible but disabled
  - **Recovery**: Tooltip "No hay datos filtrados para exportar"

## Non-requirements

Map screenshot/image export. Province/municipality shape geometries. Custom file naming per export instance. Export of unfiltered data without explicit user selection of raw sheet.
