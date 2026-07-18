import { useMemo } from 'react';
import type { SheetConfig } from '../services/multiSheetExporter';
import type { Indicator } from './useIndicators';
import type { BoardData } from './computeBoardData';
import type { Participant } from '../types';
import { computeFullDistribution, type DistributionItem } from '../utils/computeFullDistribution';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SingleIndicatorExportInput {
  indicator: Indicator;
  filteredData: Participant[];
  boardData?: BoardData;
}

export interface SingleIndicatorExportResult {
  sheets: SheetConfig[];
}

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

function buildInfoSheet(indicator: Indicator): SheetConfig {
  const statusLabel =
    indicator.status === 'viable' ? 'Viable' :
    indicator.status === 'pending' ? 'Pendiente' :
    'No viable';

  return {
    name: 'Información',
    headers: ['Campo', 'Valor'],
    rows: [
      ['Nombre del indicador', indicator.name],
      ['Categoría', indicator.category],
      ['Valor actual', String(indicator.value)],
      ['Fórmula', indicator.formula],
      ['Descripción', indicator.description],
      ['Estado', statusLabel],
      ...(indicator.pendingReason
        ? [['Razón de pendiente', indicator.pendingReason] as [string, string]]
        : []),
    ],
    columnWidths: [25, 60],
    sheetType: 'table',
  };
}

function buildCurrentViewSheet(indicator: Indicator): SheetConfig {
  if (!indicator.topItems || indicator.topItems.length === 0) {
    return {
      name: 'Valor actual',
      headers: ['Indicador', 'Valor'],
      rows: [[indicator.name, String(indicator.value)]],
      columnWidths: [40, 20],
      sheetType: 'table',
    };
  }

  const rows: unknown[][] = indicator.topItems.slice(0, 5).map((item, i) => [
    `${i + 1}. ${item.name}`,
    item.value,
    item.pct !== undefined ? `${item.pct.toFixed(1)}%` : '',
  ]);

  // Add "Resto" row if present
  if (indicator.resto !== undefined && indicator.resto > 0) {
    rows.push([
      `Resto (${indicator.topCount || 5}+) ...`,
      indicator.resto,
      '',
    ]);
  }

  return {
    name: 'Vista actual',
    headers: ['Elemento', 'Cantidad', '%'],
    rows,
    columnWidths: [35, 15, 10],
    sheetType: 'table',
  };
}

function buildFullDistributionSheet(
  items: DistributionItem[],
  label: string,
  total: number
): SheetConfig {
  const rows: unknown[][] = items.map((item, i) => [
    `${i + 1}. ${item.name}`,
    item.value,
    item.pct !== undefined ? `${item.pct.toFixed(1)}%` : '',
    item.pct !== undefined ? item.pct : '',
  ]);

  return {
    name: 'Distribución completa',
    headers: ['Elemento', 'Cantidad', '%', 'Pct (numérico)'],
    rows,
    columnWidths: [40, 15, 10, 15],
    sheetType: 'table',
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Builds multi-sheet Excel content for a SINGLE indicator, including:
 *   - Info sheet (name, description, formula, etc.)
 *   - Current view sheet (top N items as shown in the UI)
 *   - Full distribution sheet (ALL items, not just top N)
 */
export function useSingleIndicatorExport(
  input: SingleIndicatorExportInput
): SingleIndicatorExportResult {
  const { indicator, filteredData, boardData } = input;

  return useMemo(() => {
    if (!indicator) return { sheets: [] };

    const sheets: SheetConfig[] = [];

    // 1. Info sheet
    sheets.push(buildInfoSheet(indicator));

    // 2. Current view sheet
    sheets.push(buildCurrentViewSheet(indicator));

    // 3. Full distribution sheet (only if the indicator has distributable data)
    if (indicator.topItems && indicator.topItems.length > 0) {
      const full = computeFullDistribution(filteredData, indicator, boardData);
      if (full && full.items.length > 0) {
        sheets.push(buildFullDistributionSheet(full.items, full.label, full.total));
      }
    }

    return { sheets };
  }, [indicator, filteredData, boardData]);
}
