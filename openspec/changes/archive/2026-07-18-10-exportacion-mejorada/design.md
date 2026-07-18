# Design: Exportación Mejorada — Multi-hoja y Datos Agregados

## Architecture Overview

A `buildWorkbook` pure function (`multiSheetExporter.ts`) converts `SheetConfig[]` into an XLSX workbook via SheetJS. A reusable controlled `ExportSheetSelector` modal renders a checkbox list of available sheets and triggers the builder. MapSection and IndicatorsBoard attach export buttons that pre-configure the selector with contextual presets from `useMapStats` and `boardData`. `fetchAllData` in `exporter.ts` is exported for reuse in the "Raw Participants" sheet.

### New Files

| File | Purpose |
|------|---------|
| `services/multiSheetExporter.ts` | `buildWorkbook(SheetConfig[]) → Workbook` — pure XLSX builder |
| `components/ExportSheetSelector.tsx` | Reusable modal: checkbox sheet list + progress + export |
| `hooks/useMapExport.ts` | Builds map sheet presets from `filteredData` + `useMapStats` |
| `hooks/useIndicatorBoardsExport.ts` | Builds indicator sheet presets from `boardData` slices |

### Modified Files

| File | Changes |
|------|---------|
| `components/MapSection.tsx` | "Exportar Excel" button + `ExportSheetSelector` integration |
| `components/IndicatorsBoard.tsx` | "Exportar Excel" button in header + `ExportSheetSelector` |
| `components/MassExportModal.tsx` | "Excel Avanzado (multi-hoja)" option |
| `services/exporter.ts` | Export `fetchAllData` (currently private) for reuse |

## Architecture Decisions

### AD-1: `buildWorkbook` as pure function

Class with state adds no value — SheetJS is already stateless. Pure function `Workbook = f(SheetConfig[])` is testable without React and aligns with SheetJS API.

### AD-2: SheetConfig as uniform IR

`{ name, headers, rows, columnWidths?, sheetType? }` keeps `multiSheetExporter.ts` free of domain logic. Map and indicator hooks each produce the same shape — builder never knows the source.

### AD-3: ExportSheetSelector as controlled modal

Props-only component: `{ isOpen, sheets, isExporting, onConfirm, onCancel }`. Both consumers own their sheet configs. Progress bar reuses the percentage + counter pattern from `MassExportModal`.

### AD-4: Name truncation ≤31 chars

XLSX limit is 31 chars. Helper `truncateSheetName(name, usedNames)` truncates at 28 and appends ` (N)` on collision.

### AD-5: Chart-data as rows, not images

SheetJS does not render chart images. Image embedding (canvas → blob → XLSX) belongs to change 07 (PDF reports). This change emits chart-data as flat rows for manual Excel charting.

## Data Flow

### Map Export

```
MapSection [Exportar Excel]
  → useMapExport(filteredData, mapStats, mapLevel, selectedLocation)
    → SheetConfig[]: Resumen, Por Provincia, Por Municipio*, Desglose*, Raw
      (* conditional)
  → ExportSheetSelector: user checks sheets → onConfirm
  → buildWorkbook(selected) → XLSX.write → downloadBlob()
```

### Indicators Export

```
IndicatorsBoard [Exportar Excel]
  → useIndicatorBoardsExport(boardData, groups)
    → SheetConfig[]: one per category with data + Raw
  → ExportSheetSelector → buildWorkbook → downloadBlob()
```

## Component Tree

```
MapSection
  ├─ [Exportar Excel] button ← new
  ├─ DominicanRepublicMap, LocationInfoBox, MapFilters
  └─ ExportSheetSelector (conditional overlay)
       props: { sheets, isOpen, isExporting, onConfirm, onCancel }

IndicatorsBoard
  ├─ header [Exportar Excel] ← new
  ├─ CategorySection × N
  └─ ExportSheetSelector (conditional overlay)

MassExportModal
  └─ Excel Avanzado (multi-hoja) ← new option
```

## Interfaces / Contracts

```typescript
// services/multiSheetExporter.ts
interface SheetConfig {
  name: string;             // ≤31 chars
  headers: string[];
  rows: unknown[][];
  columnWidths?: number[];
  sheetType?: 'table' | 'chart-data' | 'chart-image';
}
interface MultiSheetExportInput {
  sheets: SheetConfig[];
  warning?: string;
  fileName?: string;
}
function buildWorkbook(input: MultiSheetExportInput): XLSX.WorkBook;

// components/ExportSheetSelector.tsx
interface ExportSheetSelectorProps {
  isOpen: boolean;
  sheets: SheetConfig[];
  isExporting: boolean;
  onConfirm: (selected: SheetConfig[]) => void;
  onCancel: () => void;
}
```

## Testing Strategy

| Layer | What | How |
|-------|------|-----|
| Unit | `buildWorkbook` | Call with known SheetConfigs, verify cell content and sheet names |
| Unit | Sheet name truncation | Edge cases: exact 31, >31, collision |
| Unit | Map sheet presets | Assert correct presets per mapLevel |
| Unit | Indicator sheet presets | Assert one sheet per category as flat rows |
| Integration | ExportSheetSelector | Mount, toggle, confirm — verify onConfirm payload |
| Regression | Existing CSV/JSON/XLSX | MassExportModal unchanged |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No migration. Existing `exportToExcel` is untouched — multi-sheet is an additional pathway. Single commit deploy.

## Open Questions

- [ ] `fetchAllData` is private — export as-is or wrap for filtered datasets? (Decision: export as-is, map/indicator sheets use in-memory filtered data)
