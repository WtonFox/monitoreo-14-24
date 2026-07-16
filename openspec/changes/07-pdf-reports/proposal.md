# Proposal: 07 PDF Reports

## Intent

Allow users to download professional PDF reports of filtered participant lists and system alerts. Currently CSV/XLSX/JSON exports exist but no printable document format suitable for sharing with management, stakeholders, or physical filing.

## Scope

### In Scope
- Install `jspdf` + `jspdf-autotable`
- Create `services/pdfExport.ts` — generate PDF from Participant[] or Alert[] data
- Create `components/ExportPDFButton.tsx` — reusable dropdown button for PDF export
- Wire into `pages/Participantes.tsx` — export filtered participant list as PDF (table + totals + date)
- Wire into `pages/Alertas.tsx` — export alert report as PDF (severity list + recommendations)

### Out of Scope
- Dashboard PDF with embedded charts (Recharts-to-image deferred)
- Server-side PDF generation
- Bulk/mass export of participant DB as PDF (too large for print)

## Capabilities

### New Capabilities
- `pdf-export`: On-demand PDF generation for participant lists and alert reports with professional table formatting, metadata headers, and download trigger.

### Modified Capabilities
- None

## Approach

Use `jspdf` (lightweight, no React reconciler) + `jspdf-autotable` for table rendering. The PDF service receives already-filtered data from the page's current state — no API fetching needed. The button component wraps `pdfExport` and triggers download via blob URL.

**Participant PDF**: header with app name + date + filter summary, autoTable with selected columns, footer with total count.
**Alert PDF**: header + date, grouped by severity, each alert as a section card (severity badge, title, description, value, recommendation, top affected).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `package.json` | Modified | Add `jspdf` + `jspdf-autotable` |
| `services/pdfExport.ts` | **New** | PDF generation functions |
| `components/ExportPDFButton.tsx` | **New** | Reusable PDF export trigger |
| `pages/Participantes.tsx` | Modified | Add ExportPDFButton above DataTable |
| `pages/Alertas.tsx` | Modified | Add ExportPDFButton in header area |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Large datasets produce multi-MB PDFs | Low | Data is already filtered/paginated; PDF only operates on displayed filtered set, never raw DB |
| Font/encoding issues with Spanish characters | Low | jspdf supports embedded standard fonts; test with á, é, í, ó, ú, ñ |

## Rollback Plan

- Remove `jspdf` + `jspdf-autotable` from package.json
- Delete `services/pdfExport.ts` and `components/ExportPDFButton.tsx`
- Revert `pages/Participantes.tsx` and `pages/Alertas.tsx` to remove button wiring

## Dependencies

- `jspdf` ^2.7
- `jspdf-autotable` ^3.8

## Success Criteria

- [ ] Clicking "Exportar PDF" on Participantes downloads a PDF with the filtered data table
- [ ] Clicking "Exportar PDF" on Alertas downloads a PDF with alert cards grouped by severity
- [ ] PDF renders correctly with Spanish text (accents, ñ)
- [ ] No regressions on existing CSV/XLSX export functionality
