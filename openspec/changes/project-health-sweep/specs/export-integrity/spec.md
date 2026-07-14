# Export Integrity (M8)

Three fixes: correct XLSX routing, partial-failure receipts with count reconciliation, and formula-injection neutralization. All exports route through `sanitizeParticipant` (M4) before serialization.

## R-EI1: Format-correct XLSX export

The "Excel (XLSX)" button in `DataTable.tsx` must produce a `.xlsx` file with MIME type `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, using SheetJS (already in `package.json`). Both the current-view Excel button and the mass-export Excel option must generate the same format.

| Topic | Decision |
|-------|----------|
| Library | `xlsx` (SheetJS) — already a dependency |
| MIME type | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |
| Extension | `.xlsx` |
| Current-view data | `allFilteredData \|\| data` (same source as CSV/JSON local exports) |

## R-EI2: Partial-failure receipts

Mass export (`exporter.ts` `fetchAllData`) loops through API pages. When a page fails, it is currently skipped silently and the final progress report lies about `totalRecords`. Every mass-export call must:

1. Track `totalRecordsExpected` (from the first response's `totalItems`) vs `totalRecordsDownloaded`.
2. Track `failedPages` (page numbers that errored).
3. Return or report a receipt with `partialFailure: boolean`.
4. When `partialFailure === true`, prepend a warning row/note in the exported file.
5. Surface the failure info in the UI progress display.

| Topic | Decision |
|-------|----------|
| Receipt shape | `{ totalRecordsExpected, totalRecordsDownloaded, failedPages, partialFailure }` |
| File warning | CSV: first row comment `# ADVERTENCIA: ...`. XLSX: row 1 merged cell with warning text. JSON: `metadata.warning` field. |
| UI surface | Add `failedPageCount` and `warning` to `ExportProgress`; render warning in DataTable progress overlay and MassExportModal |

## R-EI3: Formula-injection neutralization

String values that start with `=`, `+`, `-`, or `@` are at risk of spreadsheet formula injection. All CSV and XLSX export paths (both local and mass) must prefix these values with a single quote `'` so that spreadsheets treat them as text.

| Topic | Decision |
|-------|----------|
| Affected formats | CSV (via papaparse/string concatenation) and XLSX (via SheetJS) |
| Sanitizer | `sanitizeFormula(v: string): string` — if v starts with `=`, `+`, `-`, or `@`, prepend `'` |
| Applied at | Value level, after `sanitizeParticipant`, before serialization |
| Local CSV | DataTable.tsx `generateLocalCSV` row builder |
| Local XLSX | DataTable.tsx `handleLocalXLSX` row builder |
| Mass CSV/XLSX | exporter.ts all three export functions |

## Scenarios

### S-1: Excel button produces .xlsx file

Given the user clicks "Excel (XLSX)" in the current view dropdown,
When the download completes,
Then the file extension is `.xlsx`,
And the MIME type is `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`,
And the file opens correctly in a spreadsheet reader.

### S-2: CSV button produces .csv file

Given the user clicks "CSV (Vista actual)" in the current view dropdown,
When the download completes,
Then the file extension is `.csv`,
And the content is semicolon-delimited CSV with BOM.

### S-3: Mass export succeeds completely

Given a mass export where all API pages respond successfully,
When the export completes,
Then `totalRecordsExpected === totalRecordsDownloaded`,
And `partialFailure === false`,
And `failedPages` is empty,
And no warning is added to the exported file.

### S-4: Mass export has a page failure

Given a mass export where one API page returns an error,
When the export completes,
Then `partialFailure === true`,
And `failedPages` contains the failing page number,
And the exported file contains a warning message about partial data,
And the progress UI shows the failure information.

### S-5: CSV with formula injection payloads

Given a participant record where a string field starts with `=`, `+`, `-`, or `@`,
When the CSV export is generated (local or mass),
Then the exported value is prefixed with `'` (e.g., `=SUM(A1:A10)` → `'=SUM(A1:A10)`).

### S-6: XLSX with formula injection payloads

Given a participant record where a string field starts with `=`, `+`, `-`, or `@`,
When the XLSX export is generated (local or mass),
Then the cell value is prefixed with `'` so the spreadsheet renders it as text.
