# Spec: Multi-Sheet Export

## Description

Core service that constructs multi-sheet XLSX workbooks from a dynamic sheet configuration array. Downstream features (map-export, indicators-export) consume this service to generate structured spreadsheets with styled headers, custom column widths, and conditional warning sheets.

## Dependencies

- `services/exporter.ts` — `fetchAllData`, `sanitizeFormula`, `ExportProgress`
- `utils/exportUtils.ts` — `downloadBlob`
- SheetJS (`xlsx` v0.18.5)

## Data Contracts

### Input

```typescript
interface SheetConfig {
  name: string;              // Sheet tab name (MUST not exceed 31 chars)
  headers: string[];         // Column header labels, first row
  rows: any[][];             // Row data, each entry aligned to headers by index
  columnWidths?: number[];   // Optional per-column width in wch units
  sheetType?: 'table' | 'chart-data' | 'chart-image';
}

interface MultiSheetExportInput {
  sheets: SheetConfig[];              // MUST have at least one entry
  warning?: string;                   // Partial-export warning message
  fileName?: string;                  // Override default filename
}

interface MultiSheetExportReceipt {
  sheetsCreated: number;
  warningSheetIncluded: boolean;
  truncatedNames: string[];           // Names that were truncated to 31 chars
}
```

### Output

- XLSX blob downloaded via `downloadBlob` as `monitoreo_14-24_{YYYY-MM-DD}.xlsx`
- Workbook structure: optional "Advertencia" sheet first, then data sheets in input order

## Behavior

### Workbook Construction

- **Scenario**: Valid SheetConfigs produce multi-sheet workbook
  - Given three SheetConfig entries with distinct names, headers, and rows
  - When `buildWorkbook({ sheets })` executes
  - Then the workbook SHALL contain three sheets with those names in input order
  - And each sheet SHALL have bold headers in the first row
  - And column widths SHALL be set from `columnWidths` or default to header-length-based auto-fit

- **Scenario**: Single-sheet workbook for minimal config
  - Given one SheetConfig with five rows
  - When the workbook builds
  - Then the workbook SHALL contain exactly one data sheet
  - And no warning sheet SHALL be prepended

### Warning Sheet

- **Scenario**: Warning message triggers advertencia sheet
  - Given `warning` is a non-empty string
  - When the workbook builds
  - Then the first sheet SHALL be named "Advertencia"
  - And the warning text SHALL be a merged cell spanning all columns in row 0
  - And `receipt.warningSheetIncluded` SHALL be `true`

### Sheet Name Limits

- **Scenario**: Name exceeds XLSX 31-char limit
  - Given a SheetConfig with name length > 31
  - When the sheet appends
  - Then the name SHALL be truncated to 31 characters
  - And a trailing `_N` SHALL be appended if truncation causes a duplicate
  - And `receipt.truncatedNames` SHALL include the original name

### Formula Injection Prevention

- **Scenario**: Values with leading formula chars
  - Given a cell value starting with `=`, `+`, `-`, or `@`
  - When the sheet builds
  - Then the value SHALL be prefixed with `'` via `sanitizeFormula`
  - And SHALL NOT execute as a formula in Excel

## Loading States

- **State**: Workbook generation in progress
  - Given an ExportSheetSelector is building a workbook with 67k raw records
  - When SheetJS processes the data
  - Then the UI SHALL show a progress bar reusing the existing `ExportProgress` pattern
  - And the UI SHALL remain responsive during generation

## Error States

- **Error**: Empty sheets array
  - **Effect**: Throws `MultiSheetExportError: No sheets configured`
  - **Recovery**: Caller MUST validate sheets.length > 0 before invoking

- **Error**: Header/row column mismatch
  - **Effect**: Rows shorter than headers.length are padded with `""`; longer rows are truncated
  - **Recovery**: No throw — partial data exported, caller SHOULD log a warning

- **Error**: SheetJS write failure (OOM on large data)
  - **Effect**: Error propagated with `{ message, cause }`
  - **Recovery**: Caller catches and renders error state in modal

## Non-requirements

Chart-image or map-image embedding. CSV/JSON export. Cell-level validation or formatting beyond bold headers and alternating rows. Password or workbook protection. Sheet reordering or deletion after construction.
