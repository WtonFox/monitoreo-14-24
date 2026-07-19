import ExcelJS from 'exceljs';
import html2canvas from 'html2canvas';
import type { SheetConfig } from './multiSheetExporter';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChartImageSource {
  /** Sheet tab name (≤31 chars, sanitized) */
  name: string;
  /** DOM element containing the chart to capture */
  element: HTMLElement;
}

export interface ImageExportResult {
  success: boolean;
  imageCount: number;
  sheetCount: number;
  error?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const INVALID_SHEET_CHARS = /[\\\/\?\*\[\]:]/g;
const MAX_NAME = 31;

function sanitizeSheetName(name: string): string {
  if (!name || name.length === 0) return 'Sheet';
  return name.replace(INVALID_SHEET_CHARS, ' ').slice(0, MAX_NAME).trim();
}

function resolveUniqueName(base: string, used: Set<string>): string {
  let name = sanitizeSheetName(base);
  if (!name) name = 'Sheet';
  let counter = 1;
  while (used.has(name)) {
    const suffix = ` (${counter})`;
    const maxBase = MAX_NAME - suffix.length;
    name = (sanitizeSheetName(base).slice(0, Math.max(maxBase, 0)) + suffix).trim();
    counter++;
  }
  used.add(name);
  return name;
}

// ---------------------------------------------------------------------------
// Chart capture
// ---------------------------------------------------------------------------

/**
 * Captures one or more DOM chart elements as PNG ArrayBuffers.
 * Uses html2canvas which is already a project dependency.
 * Returns an array of { name, buffer } pairs.
 */
export async function captureCharts(
  charts: ChartImageSource[]
): Promise<{ name: string; buffer: ArrayBuffer }[]> {
  const results: { name: string; buffer: ArrayBuffer }[] = [];

  for (const chart of charts) {
    try {
      const canvas = await html2canvas(chart.element, {
        backgroundColor: '#ffffff',
        scale: 2, // Retina quality
        useCORS: true,
        logging: false,
      });

      return new Promise((resolve, reject) => {
        canvas.toBlob(async (blob) => {
          if (!blob) {
            reject(new Error(`Failed to capture chart: ${chart.name}`));
            return;
          }
          const buffer = await blob.arrayBuffer();
          results.push({ name: chart.name, buffer });
          resolve(results);
        }, 'image/png');
      });
    } catch (err) {
      console.warn(`Failed to capture chart "${chart.name}":`, err);
      // Continue with other charts
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Excel builder with images (ExcelJS)
// ---------------------------------------------------------------------------

/**
 * Builds an XLSX workbook with data sheets + chart image sheets using ExcelJS.
 *
 * Data sheets use the same SheetConfig interface as multiSheetExporter.
 * Each chart image is placed in its own sheet as a centered PNG.
 *
 * Falls back gracefully: if a chart fails to capture, it's skipped but
 * data sheets are still included.
 */
export async function buildExcelWithImages(
  dataSheets: SheetConfig[],
  chartImages: { name: string; buffer: ArrayBuffer }[],
  warning?: string
): Promise<ExcelJS.Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Monitoreo 14-24';
  wb.created = new Date();
  const usedNames = new Set<string>();

  // ── Warning sheet ───────────────────────────────────────────────────
  if (warning) {
    const ws = wb.addWorksheet(resolveUniqueName('Advertencia', usedNames));
    ws.getCell('A1').value = warning;
    ws.mergeCells('A1:F1');
    ws.getCell('A1').font = { bold: true, color: { argb: 'FFDC2626' } };
  }

  // ── Data sheets ──────────────────────────────────────────────────────
  for (const sheet of dataSheets) {
    const name = resolveUniqueName(sheet.name, usedNames);
    const ws = wb.addWorksheet(name);

    // Headers
    const headerRow = ws.addRow(sheet.headers ?? []);
    headerRow.font = { bold: true, size: 11 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF0F0F0' },
    };

    // Data rows
    for (const row of (sheet.rows ?? [])) {
      ws.addRow(row.map(cell => {
        // Sanitize formula injection
        if (typeof cell === 'string' && /^[=+\-@]/.test(cell)) {
          return `'${cell}`;
        }
        return cell;
      }));
    }

    // Column widths
    if (sheet.columnWidths && sheet.columnWidths.length > 0) {
      ws.columns = sheet.columnWidths.map((wch) => ({ width: wch }));
    } else if ((sheet.headers ?? []).length > 0) {
      ws.columns = sheet.headers.map(h => ({ width: Math.max(String(h).length + 3, 12) }));
    }
  }

  // ── Chart image sheets ──────────────────────────────────────────────
  for (const img of chartImages) {
    const name = resolveUniqueName(img.name, usedNames);
    const ws = wb.addWorksheet(name);

    try {
      // Add image to workbook
      const imageId = wb.addImage({
        buffer: img.buffer,
        extension: 'png',
      });

      // Place image starting at A1, scaled to fit
      ws.addImage(imageId, {
        tl: { col: 0, row: 0 },
        ext: { width: 600, height: 400 },
      });
    } catch (err) {
      console.warn(`Failed to embed image "${img.name}":`, err);
      ws.getCell('A1').value = `(Imagen no disponible: ${img.name})`;
    }
  }

  return await wb.xlsx.writeBuffer();
}

// ---------------------------------------------------------------------------
// Hybrid export: tries image capture, falls back to data-only
// ---------------------------------------------------------------------------

export interface HybridExportOptions {
  /** Data-only sheets (always included) */
  dataSheets: SheetConfig[];
  /** DOM chart elements to capture as images */
  charts?: ChartImageSource[];
  /** Warning message for partial exports */
  warning?: string;
  /** File name for download */
  fileName?: string;
}

export interface HybridExportResult {
  imageExportSucceeded: boolean;
  imageCount: number;
  totalSheets: number;
  error?: string;
}

/**
 * Tries to build an Excel file with embedded chart images (via ExcelJS).
 * If image capture fails, falls back to SheetJS data-only export.
 */
export async function hybridExport(
  options: HybridExportOptions
): Promise<HybridExportResult> {
  const { dataSheets, charts, warning, fileName } = options;

  const defaultFileName = `monitoreo_14-24_${new Date().toISOString().slice(0, 10)}.xlsx`;
  const outName = fileName || defaultFileName;

  try {
    // Try Option A: capture chart images + build with ExcelJS
    let capturedCharts: { name: string; buffer: ArrayBuffer }[] = [];

    if (charts && charts.length > 0) {
      capturedCharts = await captureCharts(charts);
    }

    if (capturedCharts.length > 0 || charts?.length === 0) {
      // At least some charts captured, or no charts requested — build with ExcelJS
      const buffer = await buildExcelWithImages(dataSheets, capturedCharts, warning);
      downloadBuffer(buffer, outName);

      return {
        imageExportSucceeded: capturedCharts.length > 0,
        imageCount: capturedCharts.length,
        totalSheets: dataSheets.length + capturedCharts.length + (warning ? 1 : 0),
      };
    }

    // No charts captured — Option C fallback: use SheetJS
    console.warn('No charts captured, falling back to data-only export');
    return await fallbackToSheetJS(dataSheets, warning, outName);
  } catch (err) {
    console.error('ExcelJS export failed, falling back to SheetJS:', err);
    return await fallbackToSheetJS(dataSheets, warning, outName);
  }
}

// ---------------------------------------------------------------------------
// Fallback: SheetJS data-only export
// ---------------------------------------------------------------------------

async function fallbackToSheetJS(
  sheets: SheetConfig[],
  warning?: string,
  fileName?: string
): Promise<HybridExportResult> {
  // Dynamic import to avoid circular dependency
  const { exportMultiSheet } = await import('./multiSheetExporter');

  try {
    const result = await exportMultiSheet({
      sheets,
      warning,
      fileName,
    });

    return {
      imageExportSucceeded: false,
      imageCount: 0,
      totalSheets: result.sheetCount + (warning ? 1 : 0),
    };
  } catch (err) {
    return {
      imageExportSucceeded: false,
      imageCount: 0,
      totalSheets: 0,
      error: String(err),
    };
  }
}

// ---------------------------------------------------------------------------
// Download helper
// ---------------------------------------------------------------------------

function downloadBuffer(data: ArrayBuffer | Uint8Array, fileName: string): void {
  const blob = new Blob([data as BlobPart], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
