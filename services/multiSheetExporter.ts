import * as XLSX from 'xlsx';
import { downloadBlob } from '../utils/exportUtils';
import { sanitizeFormula } from './exporter';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface SheetConfig {
  name: string;
  headers: string[];
  rows: unknown[][];
  columnWidths?: number[];
  sheetType?: 'table' | 'chart-data' | 'chart-image';
}

export class MultiSheetExportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MultiSheetExportError';
  }
}

export interface MultiSheetExportInput {
  sheets: SheetConfig[];
  warning?: string;
  fileName?: string;
}

export interface MultiSheetExportResult {
  sheetCount: number;
  totalRows: number;
  fileName: string;
  warningSheetIncluded: boolean;
  truncatedNames: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const INVALID_SHEET_CHARS = /[\\\/\?\*\[\]:]/g;
const MAX_SHEET_NAME_LENGTH = 31;

/**
 * Truncates a sheet name to ≤31 characters and replaces invalid Excel
 * sheet-name characters (\, /, ?, *, [, ], :) with a space.
 */
export function truncateSheetName(name: string): string {
  if (!name || name.length === 0) return 'Sheet';
  const sanitized = name.replace(INVALID_SHEET_CHARS, ' ');
  return sanitized.slice(0, MAX_SHEET_NAME_LENGTH).trim();
}

/**
 * Applies basic visual attributes to a worksheet.
 *
 * NOTE: SheetJS Community Edition does not support cell-level font styles
 * (bold, colors) or fill patterns. The `!rows` property only supports row
 * height in this edition. For full formatting (bold headers, alternating
 * row colors), consider:
 *   - Upgrading to SheetJS Pro
 *   - Applying styles post-download with a library like ExcelJS
 *
 * This function sets a slightly taller header row as a visual cue.
 */
export function applyBasicStyling(ws: XLSX.WorkSheet, config: SheetConfig): void {
  if (config.headers && config.headers.length > 0) {
    ws['!rows'] = [{ hpt: 20 }];
  }
}

// ---------------------------------------------------------------------------
// Workbook builder (pure function)
// ---------------------------------------------------------------------------

/**
 * Builds an XLSX workbook from a multi-sheet configuration.
 *
 * - Each `SheetConfig` becomes a sheet (name truncated to ≤31 chars).
 * - If `warning` is provided, an "Advertencia" sheet is prepended as the
 *   first sheet with the warning text in a merged cell.
 * - Every cell value is sanitized via `sanitizeFormula` to prevent formula
 *   injection.
 * - Column widths are applied from `columnWidths` or auto-fitted to headers.
 */
export interface BuildWorkbookResult {
  wb: XLSX.WorkBook;
  truncatedNames: string[];
  warningSheetIncluded: boolean;
}

export function buildWorkbook(input: MultiSheetExportInput): BuildWorkbookResult {
  const wb = XLSX.utils.book_new();
  const sheets = input.sheets ?? [];
  const usedNames = new Set<string>();
  const truncatedNames: string[] = [];
  let warningSheetIncluded = false;

  // ── Warning sheet (prepended first if present) ──────────────────────
  if (input.warning && input.warning.length > 0) {
    const ws = XLSX.utils.aoa_to_sheet([[input.warning]]);
    // Span across several columns so the message is visible
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }];
    XLSX.utils.book_append_sheet(wb, ws, 'Advertencia');
    usedNames.add('Advertencia');
    warningSheetIncluded = true;
  }

  // ── Data sheets ─────────────────────────────────────────────────────
  if (sheets.length === 0) {
    throw new MultiSheetExportError('No sheets configured');
  }

  for (const config of sheets) {
    // Resolve unique sheet name (truncate + collision avoidance)
    const baseName = truncateSheetName(config.name);
    if (baseName !== config.name) {
      truncatedNames.push(config.name);
    }
    let uniqueName = baseName;
    let counter = 1;
    while (usedNames.has(uniqueName)) {
      const suffix = ` (${counter})`;
      const maxBase = MAX_SHEET_NAME_LENGTH - suffix.length;
      uniqueName = (baseName.slice(0, Math.max(maxBase, 0)) + suffix).trim();
      if (config.name !== uniqueName && !truncatedNames.includes(config.name)) {
        truncatedNames.push(config.name);
      }
      counter++;
    }
    usedNames.add(uniqueName);

    // Build cell data: headers + sanitized rows
    const headers = config.headers ?? [];
    const rows = config.rows ?? [];

    // Handle header/row column mismatch: pad short rows, truncate long rows
    const sanitizedRows = rows.map(row => {
      const sanitized = row.map(cell => sanitizeFormula(cell));
      if (sanitized.length < headers.length) {
        return [...sanitized, ...Array(headers.length - sanitized.length).fill('')];
      }
      if (sanitized.length > headers.length) {
        if (headers.length > 0) {
          console.warn(`Row truncated: expected ${headers.length} columns, got ${sanitized.length}`);
        }
        return sanitized.slice(0, headers.length);
      }
      return sanitized;
    });

    const aoa = [headers, ...sanitizedRows];
    const ws = XLSX.utils.aoa_to_sheet(aoa);

    // Column widths
    if (config.columnWidths && config.columnWidths.length > 0) {
      ws['!cols'] = config.columnWidths.map(wch => ({ wch }));
    } else if (headers.length > 0) {
      // Auto-fit based on header text length
      ws['!cols'] = headers.map(h => ({ wch: Math.max(String(h).length + 2, 10) }));
    }

    // Apply basic styling (bold headers attempt)
    applyBasicStyling(ws, config);

    XLSX.utils.book_append_sheet(wb, ws, uniqueName);
  }

  return { wb, truncatedNames, warningSheetIncluded };
}

// ---------------------------------------------------------------------------
// Export orchestrator
// ---------------------------------------------------------------------------

/**
 * Builds a multi-sheet workbook, writes it to an ArrayBuffer, and triggers a
 * browser download via `downloadBlob`.
 *
 * Returns a result summary with sheet count, total data rows, and the file
 * name used.
 */
export async function exportMultiSheet(
  input: MultiSheetExportInput
): Promise<MultiSheetExportResult> {
  const { wb, truncatedNames, warningSheetIncluded } = buildWorkbook(input);

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const fileName =
    input.fileName ||
    `monitoreo_14-24_${new Date().toISOString().slice(0, 10)}.xlsx`;

  downloadBlob(blob, fileName);

  // Calculate total data rows across all configured sheets
  let totalRows = 0;
  for (const sheet of input.sheets ?? []) {
    totalRows += (sheet.rows ?? []).length;
  }

  return {
    sheetCount: input.sheets?.length ?? 0,
    totalRows,
    fileName,
    warningSheetIncluded,
    truncatedNames
  };
}
