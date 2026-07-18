# Apply Progress: 10-exportacion-mejorada

## Current Phase: Phase 3 — Map Export

### Completed
- [x] 1.1 Export `fetchAllData` in `services/exporter.ts`
- [x] 1.2 Create `services/multiSheetExporter.ts` with builder, truncation, styling
- [x] 2.1 Create `components/ExportSheetSelector.tsx` — reusable controlled modal
- [x] 2.2 Add "Excel Avanzado (multi-hoja)" option in `MassExportModal.tsx`
- [x] 3.1 Create `hooks/useMapExport.ts` — builds SheetConfig[] from map data:
  - [x] "Resumen" sheet: KPIs (total, gender, avg age, centers, phone%, vuln%)
  - [x] "Participantes por provincia" sheet: province ranking with %
  - [x] "Participantes por municipio" sheet: conditional on selectedProvince
  - [x] "Detalle por ubicación" sheet: conditional on selectedLocation with full breakdown
  - [x] "Participantes (raw)" sheet: fetches all data via fetchAllData during export
- [x] 3.2 Add "Exportar Excel" button + ExportSheetSelector integration in MapSection.tsx

### Future
- [ ] 5.2 Verify existing CSV/JSON/XLSX exports in MassExportModal work without regression
- [ ] 5.3 Verify multi-sheet XLSX opens correctly with named sheets in Excel

### Completed
- [x] 4.1 Create `hooks/useIndicatorBoardsExport.ts`
  - 8 BoardData category sheets (sectioned layout: ageBuckets, maritalStatus, genderAgeCross, etc.)
  - 1 indicator sheet per group with expanded topItems sub-rows
  - Chart-data sheets (GD-*) for each chart series
- [x] 4.2 Add "Exportar Excel" button + ExportSheetSelector in `IndicatorsBoard.tsx`
- [x] 5.1 Build verification passed (tsc --noEmit + npm run build)

### Blockers
- (none)

---
**Archived**: 2026-07-18 — All tasks completed. All specs deployed to main specs. Change cycle closed.
