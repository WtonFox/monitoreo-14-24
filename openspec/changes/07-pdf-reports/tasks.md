# Tasks: 07 PDF Reports

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~190 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

## Phase 1: Foundation

- [x] 1.1 `npm install jspdf@^4.2 jspdf-autotable@^5.0` (version adjusted — ^2.7 no longer available; jspdf-autotable 5.x accepts jspdf ^2 \|\| ^3 \|\| ^4)
- [x] 1.2 Create `services/pdfExport.ts`: `exportParticipantsPDF(data, title)` — table PDF with columns (nombre, cedula, edad, sexo, provincia, estado, centro), header (app name + date), footer (total count, page X of Y)
- [x] 1.3 Add `exportAlertsPDF(alerts, title)` to `services/pdfExport.ts` — section-based PDF grouped by severity, each alert: severity label, title, description, recommendation, top affected, value/threshold

## Phase 2: Component

- [x] 2.1 Create `components/ExportPDFButton.tsx` — `<ExportPDFButton onExport={fn} label icon />`, triggers pdfExport, shows loading spinner during generation, blob download via anchor click

## Phase 3: Integration

- [x] 3.1 `pages/Participantes.tsx` — import ExportPDFButton, render next to existing export controls, pass `filters.filteredData` with title "Reporte de Participantes — {date}"
- [x] 3.2 `pages/Alertas.tsx` — import ExportPDFButton in header area, pass `filteredAlerts` with title "Reporte de Alertas — {date}"

## Phase 4: Verification

- [x] 4.1 `npm run build` — confirm no type errors or bundling issues
- [ ] 4.2 Manual: click Exportar PDF on Participantes — verify PDF downloads with correct table data
- [ ] 4.3 Manual: click Exportar PDF on Alertas — verify PDF downloads with severity-grouped alert cards
