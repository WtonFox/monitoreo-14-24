import ExcelJS from 'exceljs';
import html2canvas from 'html2canvas';
import type { SheetConfig } from './multiSheetExporter';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChartImageSource {
  name: string;
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
// Chart capture with memory cleanup
// ---------------------------------------------------------------------------

function disposeCanvas(canvas: HTMLCanvasElement): void {
  try {
    // Free GPU/CPU memory by clearing the canvas
    canvas.width = 0;
    canvas.height = 0;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, 0, 0);
  } catch {
    // Silently ignore — cleanup only
  }
}

export async function captureCharts(
  charts: ChartImageSource[]
): Promise<{ name: string; buffer: ArrayBuffer }[]> {
  const results: { name: string; buffer: ArrayBuffer }[] = [];

  for (const chart of charts) {
    let canvas: HTMLCanvasElement | null = null;
    try {
      await new Promise(r => setTimeout(r, 0));

      canvas = await html2canvas(chart.element, {
        backgroundColor: '#ffffff',
        scale: 1.5,
        useCORS: true,
        logging: false,
      });

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas!.toBlob((b) => resolve(b), 'image/png');
      });

      if (!blob) {
        console.warn(`Empty blob for chart "${chart.name}"`);
        continue;
      }

      const buffer = await blob.arrayBuffer();
      results.push({ name: chart.name, buffer });
    } catch (err) {
      console.warn(`Failed to capture chart "${chart.name}":`, err);
    } finally {
      // CRITICAL: free canvas memory immediately after capture
      if (canvas) disposeCanvas(canvas);
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Excel builder with images (ExcelJS)
// ---------------------------------------------------------------------------

export async function buildExcelWithImages(
  dataSheets: SheetConfig[],
  chartImages: { name: string; buffer: ArrayBuffer }[],
  warning?: string
): Promise<ExcelJS.Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Departamento de Monitoreo y Evaluación - GPS';
  wb.title = 'Programa Oportunidad 14-24 - Gabinete de Política Social';
  wb.description = 'Monitoreo 14-24 - Panel de Indicadores';
  wb.created = new Date();
  const usedNames = new Set<string>();

  if (warning) {
    const ws = wb.addWorksheet(resolveUniqueName('Advertencia', usedNames));
    ws.getCell('A1').value = warning;
    ws.mergeCells('A1:F1');
    ws.getCell('A1').font = { bold: true, color: { argb: 'FFDC2626' } };
  }

  for (const sheet of dataSheets) {
    const name = resolveUniqueName(sheet.name, usedNames);
    const ws = wb.addWorksheet(name);
    await new Promise(r => setTimeout(r, 0));

    const headerRow = ws.addRow(sheet.headers ?? []);
    headerRow.font = { bold: true, size: 11 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF0F0F0' },
    };

    for (const row of (sheet.rows ?? [])) {
      ws.addRow(row.map(cell => {
        if (typeof cell === 'string' && /^[=+\-@]/.test(cell)) return `'${cell}`;
        return cell;
      }));
    }

    if (sheet.columnWidths && sheet.columnWidths.length > 0) {
      ws.columns = sheet.columnWidths.map((wch) => ({ width: wch }));
    } else if ((sheet.headers ?? []).length > 0) {
      ws.columns = sheet.headers.map(h => ({ width: Math.max(String(h).length + 3, 12) }));
    }
  }

  for (const img of chartImages) {
    const name = resolveUniqueName(img.name, usedNames);
    const ws = wb.addWorksheet(name);
    await new Promise(r => setTimeout(r, 0));

    try {
      const imageId = wb.addImage({
        buffer: img.buffer,
        extension: 'png',
      });
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
// Hybrid export with memory cleanup
// ---------------------------------------------------------------------------

export interface HybridExportOptions {
  dataSheets: SheetConfig[];
  charts?: ChartImageSource[];
  warning?: string;
  fileName?: string;
}

export interface HybridExportResult {
  imageExportSucceeded: boolean;
  imageCount: number;
  totalSheets: number;
  error?: string;
}

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
  // Clean up: remove anchor and revoke URL
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function hybridExport(
  options: HybridExportOptions
): Promise<HybridExportResult> {
  const { dataSheets, charts, warning, fileName } = options;

  const defaultFileName = `monitoreo_14-24_${new Date().toISOString().slice(0, 10)}.xlsx`;
  const outName = fileName || defaultFileName;

  // Holds chart buffers — will be cleared after use
  let capturedCharts: { name: string; buffer: ArrayBuffer }[] = [];

  try {
    if (charts && charts.length > 0) {
      capturedCharts = await captureCharts(charts);
    }

    if (capturedCharts.length > 0 || charts?.length === 0) {
      const buffer = await buildExcelWithImages(dataSheets, capturedCharts, warning);
      // Clear chart buffers before download to free memory
      capturedCharts.length = 0;
      downloadBuffer(buffer, outName);

      return {
        imageExportSucceeded: true,
        imageCount: capturedCharts.length,
        totalSheets: dataSheets.length + capturedCharts.length + (warning ? 1 : 0),
      };
    }

    return await fallbackToSheetJS(dataSheets, warning, outName);
  } catch (err) {
    console.error('ExcelJS export failed, falling back to SheetJS:', err);
    return await fallbackToSheetJS(dataSheets, warning, outName);
  } finally {
    // Final cleanup: ensure chart buffers are released
    capturedCharts.length = 0;
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
  const { exportMultiSheet } = await import('./multiSheetExporter');

  try {
    const result = await exportMultiSheet({ sheets, warning, fileName });
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
