import { useMemo } from 'react';
import type { SheetConfig } from '../services/multiSheetExporter';
import type { BoardData } from './useIndicatorBoards';
import type {
  DemographicSlice,
  TerritorialSlice,
  ProgramSlice,
  QualitySlice,
  VulnerabilitySlice,
  TemporalSlice,
  EducationSlice,
  CenterSlice,
} from './computeBoardData';
import type { IndicatorGroup } from './useIndicators';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseIndicatorBoardsExportOptions {
  boardData: BoardData;
  groups: IndicatorGroup[];
}

export interface UseIndicatorBoardsExportResult {
  sheets: SheetConfig[];
  preselectNames: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Ensure every row has at least `n` columns (pads with ''). */
function padRow(row: unknown[], n: number): unknown[] {
  const r = [...row];
  while (r.length < n) r.push('');
  return r;
}

/** Build a section title row that spans all columns. */
function sectionRow(title: string, cols: number): unknown[] {
  const r = [title];
  for (let i = 1; i < cols; i++) r.push('');
  return r;
}

/**
 * Wraps an array of sections into a single SheetConfig.
 * Each section has: section title row, column headers row, data rows, blank separator.
 */
function buildSectionedSheet(
  name: string,
  cols: number,
  colWidths: number[],
  sections: {
    title: string;
    headers: string[];
    rows: unknown[][];
  }[],
): SheetConfig {
  const allRows: unknown[][] = [];

  for (const section of sections) {
    allRows.push(sectionRow(`--- ${section.title} ---`, cols));
    allRows.push(padRow(section.headers, cols));
    for (const row of section.rows) {
      allRows.push(padRow(row, cols));
    }
    allRows.push(sectionRow('', cols)); // blank separator
  }

  // Unified headers for the sheet — use a generic row
  const genericHeaders: string[] = [];
  for (let i = 0; i < cols; i++) {
    genericHeaders.push(i === 0 ? 'Dato' : `Valor ${i}`);
  }

  return {
    name,
    sheetType: 'table' as const,
    headers: genericHeaders,
    rows: allRows,
    columnWidths: colWidths,
  };
}

// ---------------------------------------------------------------------------
// Category sheet builders
// ---------------------------------------------------------------------------

function buildDemograficoSheet(d: DemographicSlice): SheetConfig {
  return buildSectionedSheet('Demográficos', 3, [40, 15, 15], [
    {
      title: 'Rangos de Edad',
      headers: ['Rango', 'Cantidad'],
      rows: d.ageBuckets.map(b => [b.name, b.value]),
    },
    {
      title: 'Estado Civil',
      headers: ['Estado', 'Cantidad'],
      rows: d.maritalStatus.map(s => [s.name, s.value]),
    },
    {
      title: 'Sexo por Grupo de Edad',
      headers: ['Rango', 'Mujeres', 'Hombres'],
      rows: d.genderAgeCross.map(c => [c.name, c.Mujeres, c.Hombres]),
    },
  ]);
}

function buildTerritorialSheet(d: TerritorialSlice): SheetConfig {
  return buildSectionedSheet('Territoriales', 3, [40, 15, 15], [
    {
      title: 'Top 10 Municipios',
      headers: ['Municipio', 'Total'],
      rows: d.topMunicipios.map(m => [m.name, m.value]),
    },
    {
      title: 'Top 10 Centros',
      headers: ['Centro', 'Total'],
      rows: d.topCentros.map(c => [c.name, c.value]),
    },
    {
      title: 'Sexo por Municipio',
      headers: ['Municipio', 'Mujeres', 'Hombres'],
      rows: d.genderByMunicipio.map(g => [g.name, g.Mujeres, g.Hombres]),
    },
  ]);
}

function buildProgramSheet(d: ProgramSlice): SheetConfig {
  return buildSectionedSheet('Estado Programa', 4, [40, 12, 12, 12], [
    {
      title: 'Distribución por Estado',
      headers: ['Estado', 'Cantidad'],
      rows: d.statusDistribution.map(s => [s.name, s.value]),
    },
    {
      title: 'Evolución por Año',
      headers: ['Año', 'Activos', 'Egresados', 'Retirados'],
      rows: d.evolutionByYear.map(e => [e.name, e.Activos, e.Egresados, e.Retirados]),
    },
    {
      title: 'Estado por Curso',
      headers: ['Curso', 'Activos', 'Egresados'],
      rows: d.statusByCurso.map(s => [s.name, s.Activos, s.Egresados]),
    },
  ]);
}

function buildQualitySheet(d: QualitySlice): SheetConfig {
  return buildSectionedSheet('Calidad Dato', 4, [30, 15, 12, 12], [
    {
      title: 'Completitud por Campo',
      headers: ['Campo', '% Completitud', 'Total', 'ND'],
      rows: d.fieldBreakdown.map(f => [f.name, f.pct.toFixed(1), f.total, f.ndCount]),
    },
  ]);
}

function buildVulnerabilitySheet(d: VulnerabilitySlice): SheetConfig {
  return buildSectionedSheet('Vulnerabilidad', 3, [40, 15, 15], [
    {
      title: 'Top Discapacidades',
      headers: ['Discapacidad', 'Cantidad'],
      rows: d.topDisabilities.map(t => [t.name, t.value]),
    },
    {
      title: 'Top Enfermedades',
      headers: ['Enfermedad', 'Cantidad'],
      rows: d.topDiseases.map(t => [t.name, t.value]),
    },
    {
      title: 'Top Alergias',
      headers: ['Alergia', 'Cantidad'],
      rows: d.topAllergies.map(t => [t.name, t.value]),
    },
  ]);
}

function buildTemporalSheet(d: TemporalSlice): SheetConfig {
  return buildSectionedSheet('Cobertura Temporal', 3, [30, 15, 15], [
    {
      title: 'Registros por Año',
      headers: ['Año', 'Registros'],
      rows: d.registrationsByYear.map(r => [r.name, r.value]),
    },
    {
      title: 'Crecimiento Anual',
      headers: ['Año', 'Crecimiento %'],
      rows: d.yearGrowth.map(y => [y.name, y.growth.toFixed(1)]),
    },
    {
      title: 'Registros por Trimestre',
      headers: ['Trimestre', 'Registros'],
      rows: d.registrationsByQuarter.map(q => [q.name, q.value]),
    },
  ]);
}

function buildEducationSheet(d: EducationSlice): SheetConfig {
  return buildSectionedSheet('Nivel Educativo', 3, [40, 12, 12], [
    {
      title: 'Distribución por Nivel',
      headers: ['Nivel', 'Cantidad'],
      rows: d.educationDistribution.map(e => [e.name, e.value]),
    },
    {
      title: 'Nivel por Estado',
      headers: ['Nivel', 'Activos', 'Egresados'],
      rows: d.educationByStatus.map(e => [e.name, e.Activos, e.Egresados]),
    },
    {
      title: 'Nivel por Sexo',
      headers: ['Nivel', 'Mujeres', 'Hombres'],
      rows: d.educationBySex.map(e => [e.name, e.Mujeres, e.Hombres]),
    },
  ]);
}

function buildCenterSheet(d: CenterSlice): SheetConfig {
  return buildSectionedSheet('Desempeño Centro', 4, [40, 12, 12, 12], [
    {
      title: 'Top Centros',
      headers: ['Centro', 'Total', 'Activos', 'Egresados'],
      rows: d.topCenters.map(c => [c.name, c.total, c.activos, c.egresados]),
    },
    {
      title: 'Sexo por Centro',
      headers: ['Centro', 'Mujeres', 'Hombres'],
      rows: d.genderByCenter.map(g => [g.name, g.Mujeres, g.Hombres]),
    },
    {
      title: 'Edad Promedio por Centro',
      headers: ['Centro', 'Edad Prom'],
      rows: d.avgAgeByCenter.map(a => [a.name, a.avgAge.toFixed(1)]),
    },
  ]);
}

// ---------------------------------------------------------------------------
// Indicator-group sheet builder
// ---------------------------------------------------------------------------

function buildIndicatorGroupSheet(group: IndicatorGroup): SheetConfig {
  const HEADERS = ['#', 'Indicador', 'Item', 'Valor', '%', 'Fórmula'];
  const rows: unknown[][] = [];

  for (const indicator of group.items) {
    if (indicator.topItems && indicator.topItems.length > 0) {
      // Summary row for the indicator
      rows.push([
        indicator.id,
        indicator.name,
        '',
        indicator.value,
        '',
        indicator.formula,
      ]);
      // Sub-rows per top item
      indicator.topItems.forEach((item, i) => {
        rows.push([
          '',
          '',
          `${i + 1}. ${item.name}`,
          item.value,
          item.pct !== undefined ? item.pct.toFixed(1) : '',
          '',
        ]);
      });
      // Resto row if applicable
      if (indicator.resto && indicator.resto > 0) {
        rows.push(['', '', 'Resto', indicator.resto, '', '']);
      }
    } else {
      // Simple indicator — single row
      rows.push([
        indicator.id,
        indicator.name,
        '',
        indicator.value,
        '',
        indicator.formula,
      ]);
    }
  }

  return {
    name: `Indicadores – ${group.label}`,
    sheetType: 'table',
    headers: HEADERS,
    rows,
    columnWidths: [6, 40, 30, 15, 10, 30],
  };
}

// ---------------------------------------------------------------------------
// Chart-data sheet builders
// ---------------------------------------------------------------------------

/** Helper: add a simple (name, value) chart-data sheet. */
function addChartSeries(
  sheets: SheetConfig[],
  name: string,
  labelCol: string,
  valueCol: string,
  data: { name: string; value: number }[],
): void {
  if (data.length === 0) return;
  sheets.push({
    name,
    sheetType: 'chart-data',
    headers: [labelCol, valueCol],
    rows: data.map(d => [d.name, d.value]),
    columnWidths: [30, 15],
  });
}

function buildChartDataSheets(boardData: BoardData): SheetConfig[] {
  const sheets: SheetConfig[] = [];

  // ── Demographic ──
  addChartSeries(sheets, 'GD - Edades', 'Rango', 'Cantidad', boardData.demographicData.ageBuckets);
  addChartSeries(sheets, 'GD - Estado Civil', 'Estado', 'Cantidad', boardData.demographicData.maritalStatus);
  if (boardData.demographicData.genderAgeCross.length > 0) {
    sheets.push({
      name: 'GD - Sexo x Edad',
      sheetType: 'chart-data',
      headers: ['Rango', 'Mujeres', 'Hombres'],
      rows: boardData.demographicData.genderAgeCross.map(c => [c.name, c.Mujeres, c.Hombres]),
      columnWidths: [15, 12, 12],
    });
  }

  // ── Territorial ──
  addChartSeries(sheets, 'GD - Municipios', 'Municipio', 'Total', boardData.territorialData.topMunicipios);
  addChartSeries(sheets, 'GD - Centros', 'Centro', 'Total', boardData.territorialData.topCentros);
  if (boardData.territorialData.genderByMunicipio.length > 0) {
    sheets.push({
      name: 'GD - Sexo x Municipio',
      sheetType: 'chart-data',
      headers: ['Municipio', 'Mujeres', 'Hombres'],
      rows: boardData.territorialData.genderByMunicipio.map(g => [g.name, g.Mujeres, g.Hombres]),
      columnWidths: [30, 12, 12],
    });
  }

  // ── Program ──
  addChartSeries(sheets, 'GD - Estados', 'Estado', 'Cantidad', boardData.programData.statusDistribution);
  if (boardData.programData.evolutionByYear.length > 0) {
    sheets.push({
      name: 'GD - Evolución x Año',
      sheetType: 'chart-data',
      headers: ['Año', 'Activos', 'Egresados', 'Retirados'],
      rows: boardData.programData.evolutionByYear.map(e => [e.name, e.Activos, e.Egresados, e.Retirados]),
      columnWidths: [10, 12, 12, 12],
    });
  }
  if (boardData.programData.statusByCurso.length > 0) {
    sheets.push({
      name: 'GD - Estado x Curso',
      sheetType: 'chart-data',
      headers: ['Curso', 'Activos', 'Egresados'],
      rows: boardData.programData.statusByCurso.map(s => [s.name, s.Activos, s.Egresados]),
      columnWidths: [40, 12, 12],
    });
  }

  // ── Quality ──
  if (boardData.qualityData.fieldBreakdown.length > 0) {
    sheets.push({
      name: 'GD - Calidad Campos',
      sheetType: 'chart-data',
      headers: ['Campo', '% Completitud', 'Total', 'ND'],
      rows: boardData.qualityData.fieldBreakdown.map(f => [f.name, f.pct.toFixed(1), f.total, f.ndCount]),
      columnWidths: [30, 15, 12, 12],
    });
  }

  // ── Vulnerability ──
  addChartSeries(sheets, 'GD - Discapacidades', 'Discapacidad', 'Cantidad', boardData.vulnerabilityData.topDisabilities);
  addChartSeries(sheets, 'GD - Enfermedades', 'Enfermedad', 'Cantidad', boardData.vulnerabilityData.topDiseases);
  addChartSeries(sheets, 'GD - Alergias', 'Alergia', 'Cantidad', boardData.vulnerabilityData.topAllergies);

  // ── Temporal ──
  addChartSeries(sheets, 'GD - Registros x Año', 'Año', 'Registros', boardData.temporalData.registrationsByYear);
  addChartSeries(sheets, 'GD - Crecimiento %', 'Año', 'Crecimiento %',
    boardData.temporalData.yearGrowth.map(y => ({ name: y.name, value: y.growth })));
  addChartSeries(sheets, 'GD - x Trimestre', 'Trimestre', 'Registros', boardData.temporalData.registrationsByQuarter);

  // ── Education ──
  addChartSeries(sheets, 'GD - Niveles', 'Nivel', 'Cantidad', boardData.educationData.educationDistribution);
  if (boardData.educationData.educationByStatus.length > 0) {
    sheets.push({
      name: 'GD - Nivel x Estado',
      sheetType: 'chart-data',
      headers: ['Nivel', 'Activos', 'Egresados'],
      rows: boardData.educationData.educationByStatus.map(e => [e.name, e.Activos, e.Egresados]),
      columnWidths: [30, 12, 12],
    });
  }
  if (boardData.educationData.educationBySex.length > 0) {
    sheets.push({
      name: 'GD - Nivel x Sexo',
      sheetType: 'chart-data',
      headers: ['Nivel', 'Mujeres', 'Hombres'],
      rows: boardData.educationData.educationBySex.map(e => [e.name, e.Mujeres, e.Hombres]),
      columnWidths: [30, 12, 12],
    });
  }

  // ── Center ──
  if (boardData.centerData.topCenters.length > 0) {
    sheets.push({
      name: 'GD - Top Centros',
      sheetType: 'chart-data',
      headers: ['Centro', 'Total', 'Activos', 'Egresados'],
      rows: boardData.centerData.topCenters.map(c => [c.name, c.total, c.activos, c.egresados]),
      columnWidths: [40, 12, 12, 12],
    });
  }
  if (boardData.centerData.genderByCenter.length > 0) {
    sheets.push({
      name: 'GD - Sexo x Centro',
      sheetType: 'chart-data',
      headers: ['Centro', 'Mujeres', 'Hombres'],
      rows: boardData.centerData.genderByCenter.map(g => [g.name, g.Mujeres, g.Hombres]),
      columnWidths: [40, 12, 12],
    });
  }
  if (boardData.centerData.avgAgeByCenter.length > 0) {
    sheets.push({
      name: 'GD - Edad x Centro',
      sheetType: 'chart-data',
      headers: ['Centro', 'Edad Prom'],
      rows: boardData.centerData.avgAgeByCenter.map(a => [a.name, a.avgAge.toFixed(1)]),
      columnWidths: [40, 12],
    });
  }

  return sheets;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

const BRANDING_HEADER = 'Programa Oportunidad 14-24 — Gabinete de Política Social';
const BRANDING_SUBTITLE = 'Monitoreo 14-24 — Panel de Indicadores';
const BRANDING_FOOTER = 'Departamento de Monitoreo y Evaluación — GPS';

function buildBrandingSheet(): SheetConfig {
  return {
    name: 'Información',
    sheetType: 'table',
    headers: ['', ''],
    rows: [
      [BRANDING_HEADER, ''],
      [BRANDING_SUBTITLE, ''],
      ['', ''],
      ['Descripción', 'Exportación completa de indicadores del panel de monitoreo'],
      ['Generado', new Date().toLocaleString('es-DO')],
      ['', ''],
      [BRANDING_FOOTER, ''],
    ],
    columnWidths: [45, 45],
  };
}

export function useIndicatorBoardsExport({
  boardData,
  groups,
}: UseIndicatorBoardsExportOptions): UseIndicatorBoardsExportResult {
  return useMemo(() => {
    const sheets: SheetConfig[] = [];

    // 0 — Branding sheet
    sheets.push(buildBrandingSheet());

    // 1 — BoardData category sheets (table type)
    sheets.push(buildDemograficoSheet(boardData.demographicData));
    sheets.push(buildTerritorialSheet(boardData.territorialData));
    sheets.push(buildProgramSheet(boardData.programData));
    sheets.push(buildQualitySheet(boardData.qualityData));
    sheets.push(buildVulnerabilitySheet(boardData.vulnerabilityData));
    sheets.push(buildTemporalSheet(boardData.temporalData));
    sheets.push(buildEducationSheet(boardData.educationData));
    sheets.push(buildCenterSheet(boardData.centerData));

    // 2 — Indicator group sheets (table type)
    for (const group of groups) {
      if (group.items.length > 0) {
        sheets.push(buildIndicatorGroupSheet(group));
      }
    }

    // 3 — Chart-data sheets
    sheets.push(...buildChartDataSheets(boardData));

    // Preselect: all table-type sheets (BoardData + indicators)
    const preselectNames = sheets
      .filter(s => s.sheetType === 'table')
      .map(s => s.name);

    return { sheets, preselectNames };
  }, [boardData, groups]);
}
