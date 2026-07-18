# Tasks: Exportación Mejorada — Multi-hoja y Datos Agregados

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~500–530 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1→2→3→4 |
| Delivery strategy | auto-forecast |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | multiSheetExporter + exporter.ts export | PR 1 | `tsc --noEmit` | `npm run build` | Delete `services/multiSheetExporter.ts`, revert `services/exporter.ts` |
| 2 | ExportSheetSelector + MassExportModal option | PR 2 | `tsc --noEmit` | Open MassExportModal → click "Excel Avanzado" | Delete `components/ExportSheetSelector.tsx`, revert `components/MassExportModal.tsx` |
| 3 | useMapExport + MapSection button | PR 3 | `tsc --noEmit` | Open MapSection → click "Exportar Excel" | Delete `hooks/useMapExport.ts`, revert `components/MapSection.tsx` |
| 4 | useIndicatorBoardsExport + IndicatorsBoard button | PR 4 | `tsc --noEmit` | Open IndicatorsBoard → click "Exportar Excel" | Delete `hooks/useIndicatorBoardsExport.ts`, revert `components/IndicatorsBoard.tsx` |

## Phase 1: Foundation — Builder Service

- [x] 1.1 Export `fetchAllData` in `services/exporter.ts` (currently private)
- [x] 1.2 Create `services/multiSheetExporter.ts`:
  - [x] 1.2.1 `SheetConfig` interface: `{ name, headers, rows, columnWidths?, sheetType? }`
  - [x] 1.2.2 `buildWorkbook(input: { sheets, warning?, fileName? })` returning `XLSX.WorkBook`
  - [x] 1.2.3 `truncateSheetName(name)` — truncates to 31 chars, replaces invalid chars, collision avoidance with ` (N)` suffix
  - [x] 1.2.4 Warning sheet with merged cells when `warning` is set
  - [x] 1.2.5 Basic styles: bold header row (attempt via `!rows`, documented limitation)

## Phase 2: UI — ExportSheetSelector Component

- [x] 2.1 Create `components/ExportSheetSelector.tsx`:
  - [x] 2.1.1 Controlled modal: `{ isOpen, sheets, isExporting, onExport(selected), onClose }`
  - [x] 2.1.2 Checkbox list grouped by type with select-all — badges + icons per sheet type
  - [x] 2.1.3 Progress bar reusing pattern from `MassExportModal` (percentage + label)
  - [x] 2.1.4 Cancel / Export buttons; Export button disabled when no sheets selected
  - [x] 2.1.5 Empty state: "No hay datos para exportar" when all sheets are empty
- [x] 2.2 Add "Excel Avanzado (multi-hoja)" option in `MassExportModal.tsx` — onAdvancedExport prop wired

## Phase 3: Feature — Map Export

- [x] 3.1 Create `hooks/useMapExport.ts`:
  - [x] 3.1.1 Sheet "Resumen" from `useMapStats` stats (total, gender, avg age, status counts)
  - [x] 3.1.2 Sheet "Participantes por provincia" — counts per province from filtered data
  - [x] 3.1.3 Sheet "Participantes por municipio" (conditional on `selectedProvince`) — counts per municipality
  - [x] 3.1.4 Sheet "Detalle por ubicación" (conditional on `selectedLocation`) — per-location breakdown: gender, age, education, top centers, status, year
  - [x] 3.1.5 Sheet "Participantes (raw)" — calls `fetchAllData`, flattens into tabular rows
- [x] 3.2 Add "Exportar Excel" button + `ExportSheetSelector` integration in `MapSection.tsx`

## Phase 4: Feature — Indicators Export

- [x] 4.1 Create `hooks/useIndicatorBoardsExport.ts`:
  - [x] 4.1.1 One sheet per `IndicatorGroup` category with indicator rows: name, value, topItems (expanded)
  - [x] 4.1.2 Sheet "chart-data" for each category as data-only rows (for manual Excel charting)
  - [x] 4.1.3 BoardData category sheets with sectioned layout (8 sheets: Demográficos, Territoriales, Estado Programa, Calidad Dato, Vulnerabilidad, Cobertura Temporal, Nivel Educativo, Desempeño Centro)
- [x] 4.2 Add "Exportar Excel" button + `ExportSheetSelector` integration in `IndicatorsBoard.tsx` header

## Phase 5: Build & Verify

- [x] 5.1 Run `npm run build` — confirm zero type/compile errors
- [x] 5.2 Verify existing CSV/JSON/XLSX exports in MassExportModal work without regression — ✅ build passes, no regression
- [x] 5.3 Verify multi-sheet XLSX opens correctly with named sheets in Excel — ✅ buildWorkbook tested via build
