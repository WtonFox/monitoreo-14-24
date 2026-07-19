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
// Helpers
// ---------------------------------------------------------------------------

/** Build a sectioned sheet from multiple sub-tables. */
function sectionedSheet(
  name: string,
  sections: { title: string; headers: string[]; rows: unknown[][] }[],
  colWidths: number[],
): SheetConfig {
  const allRows: unknown[][] = [];
  // Unified generic headers
  const cols = Math.max(...sections.map(s => s.headers.length), 1);
  const genericHeaders: string[] = [];
  for (let i = 0; i < cols; i++) genericHeaders.push(i === 0 ? 'Dato' : `Valor ${i}`);

  for (const sec of sections) {
    if (sec.rows.length === 0 && sec.headers.length <= 1) continue;
    allRows.push([`--- ${sec.title} ---`]);
    allRows.push([...sec.headers, ...Array(cols - sec.headers.length).fill('')]);
    for (const row of sec.rows) {
      allRows.push([...row, ...Array(cols - row.length).fill('')]);
    }
    allRows.push(Array(cols).fill(''));
  }

  return { name, sheetType: 'table', headers: genericHeaders, rows: allRows, columnWidths: colWidths };
}

// ---------------------------------------------------------------------------
// Category-specific tab data builders
// ---------------------------------------------------------------------------

function demographicTabSheets(d: BoardData['demographicData']): SheetConfig[] {
  const s: SheetConfig[] = [];
  // Gender distribution
  s.push({
    name: 'Sexo',
    headers: ['Género', 'Cantidad', '%'],
    rows: [
      ['Mujeres', d.women, d.womenPct.toFixed(1)],
      ['Hombres', d.men, d.menPct.toFixed(1)],
      ['Desconocido', d.unknown, d.unknownPct.toFixed(1)],
    ],
    columnWidths: [20, 15, 10],
    sheetType: 'table',
  });
  // Age buckets (full list)
  if (d.ageBuckets.length > 0) {
    s.push({
      name: 'Edades',
      headers: ['Rango', 'Cantidad'],
      rows: d.ageBuckets.map(b => [b.name, b.value]),
      columnWidths: [20, 15],
      sheetType: 'table',
    });
  }
  // Marital status (full list)
  if (d.maritalStatus.length > 0) {
    s.push({
      name: 'Estado Civil',
      headers: ['Estado', 'Cantidad'],
      rows: d.maritalStatus.map(m => [m.name, m.value]),
      columnWidths: [25, 15],
      sheetType: 'table',
    });
  }
  // Gender × Age cross
  if (d.genderAgeCross.length > 0) {
    s.push({
      name: 'Sexo x Edad',
      headers: ['Rango', 'Mujeres', 'Hombres'],
      rows: d.genderAgeCross.map(c => [c.name, c.Mujeres, c.Hombres]),
      columnWidths: [20, 12, 12],
      sheetType: 'table',
    });
  }
  // Summary metrics
  s.push({
    name: 'Métricas',
    headers: ['Métrica', 'Valor'],
    rows: [
      ['Total participantes', d.total],
      ['Edad promedio registro', d.avgAgeReg.toFixed(1)],
    ],
    columnWidths: [30, 15],
    sheetType: 'table',
  });
  return s;
}

function territorialTabSheets(d: BoardData['territorialData']): SheetConfig[] {
  const s: SheetConfig[] = [];
  if (d.topMunicipios.length > 0) {
    s.push({
      name: 'Top Municipios',
      headers: ['#', 'Municipio', 'Total'],
      rows: d.topMunicipios.map((m, i) => [i + 1, m.name, m.value]),
      columnWidths: [5, 35, 12],
      sheetType: 'table',
    });
  }
  if (d.topCentros.length > 0) {
    s.push({
      name: 'Top Centros',
      headers: ['#', 'Centro', 'Total'],
      rows: d.topCentros.map((c, i) => [i + 1, c.name, c.value]),
      columnWidths: [5, 40, 12],
      sheetType: 'table',
    });
  }
  if (d.topCursos.length > 0) {
    s.push({
      name: 'Top Cursos',
      headers: ['#', 'Curso', 'Total'],
      rows: d.topCursos.map((c, i) => [i + 1, c.name, c.value]),
      columnWidths: [5, 35, 12],
      sheetType: 'table',
    });
  }
  if (d.genderByMunicipio.length > 0) {
    s.push({
      name: 'Sexo x Municipio',
      headers: ['Municipio', 'Mujeres', 'Hombres'],
      rows: d.genderByMunicipio.map(g => [g.name, g.Mujeres, g.Hombres]),
      columnWidths: [30, 12, 12],
      sheetType: 'table',
    });
  }
  s.push({
    name: 'Resumen Territorial',
    headers: ['Métrica', 'Valor'],
    rows: [
      ['Municipios distintos', d.municipioCount],
      ['Centros distintos', d.centroCount],
      ['Cursos distintos', d.cursoCount],
    ],
    columnWidths: [30, 12],
    sheetType: 'table',
  });
  return s;
}

function programTabSheets(d: BoardData['programData']): SheetConfig[] {
  const s: SheetConfig[] = [];
  if (d.statusDistribution.length > 0) {
    s.push({
      name: 'Dist. Estado',
      headers: ['Estado', 'Cantidad'],
      rows: d.statusDistribution.map(st => [st.name, st.value]),
      columnWidths: [25, 15],
      sheetType: 'table',
    });
  }
  if (d.evolutionByYear.length > 0) {
    s.push({
      name: 'Evolución x Año',
      headers: ['Año', 'Activos', 'Egresados', 'Retirados'],
      rows: d.evolutionByYear.map(e => [e.name, e.Activos, e.Egresados, e.Retirados]),
      columnWidths: [10, 12, 12, 12],
      sheetType: 'table',
    });
  }
  if (d.statusByCurso.length > 0) {
    s.push({
      name: 'Estado x Curso',
      headers: ['Curso', 'Activos', 'Egresados'],
      rows: d.statusByCurso.map(sc => [sc.name, sc.Activos, sc.Egresados]),
      columnWidths: [35, 12, 12],
      sheetType: 'table',
    });
  }
  if (d.activeVsGraduatedByCentro.length > 0) {
    s.push({
      name: 'Act/Egr x Centro',
      headers: ['Centro', 'Activos', 'Egresados'],
      rows: d.activeVsGraduatedByCentro.map(c => [c.name, c.Activos, c.Egresados]),
      columnWidths: [35, 12, 12],
      sheetType: 'table',
    });
  }
  s.push({
    name: 'Métricas Programa',
    headers: ['Métrica', 'Valor'],
    rows: [
      ['% Activos', d.activePct.toFixed(1)],
      ['% Egresados', d.graduatedPct.toFixed(1)],
      ['% Menores con tutor', d.minorsWithTutorPct.toFixed(1)],
      ['% Tutores con teléfono', d.tutorsWithPhonePct.toFixed(1)],
    ],
    columnWidths: [30, 12],
    sheetType: 'table',
  });
  return s;
}

function qualityTabSheets(d: BoardData['qualityData']): SheetConfig[] {
  const s: SheetConfig[] = [];
  s.push({
    name: 'Completitud Campos',
    headers: ['Campo', '% Completitud', 'Total', 'ND'],
    rows: d.fieldBreakdown.map(f => [f.name, f.pct.toFixed(1), f.total, f.ndCount]),
    columnWidths: [30, 15, 12, 12],
    sheetType: 'table',
  });
  s.push({
    name: 'Métricas Calidad',
    headers: ['Métrica', 'Valor'],
    rows: [
      ['% Cédula', d.cedulaPct.toFixed(1)],
      ['% Fecha Nac.', d.birthDatePct.toFixed(1)],
      ['% Educación', d.educationPct.toFixed(1)],
      ['% Alergias', d.allergiesPct.toFixed(1)],
      ['% Discapacidades', d.disabilitiesPct.toFixed(1)],
      ['% Enfermedades', d.diseasesPct.toFixed(1)],
    ],
    columnWidths: [30, 12],
    sheetType: 'table',
  });
  return s;
}

function vulnerabilityTabSheets(d: BoardData['vulnerabilityData']): SheetConfig[] {
  const s: SheetConfig[] = [];
  const add = (name: string, label: string, data: { name: string; value: number }[]) => {
    if (data.length > 0) {
      s.push({
        name,
        headers: [label, 'Cantidad'],
        rows: data.map(x => [x.name, x.value]),
        columnWidths: [35, 12],
        sheetType: 'table',
      });
    }
  };
  add('Discapacidades', 'Discapacidad', d.topDisabilities);
  add('Enfermedades', 'Enfermedad', d.topDiseases);
  add('Alergias', 'Alergia', d.topAllergies);
  add('Prog. Sociales', 'Programa', d.topSocialPrograms);
  s.push({
    name: 'Métricas Vulnerab.',
    headers: ['Métrica', 'Valor'],
    rows: [
      ['% Discapacidades', d.disabilitiesPct.toFixed(1)],
      ['% Enfermedades', d.diseasesPct.toFixed(1)],
      ['% Alergias', d.allergiesPct.toFixed(1)],
      ['% Prog. Sociales', d.socialProgramsPct.toFixed(1)],
    ],
    columnWidths: [30, 12],
    sheetType: 'table',
  });
  return s;
}

function temporalTabSheets(d: BoardData['temporalData']): SheetConfig[] {
  const s: SheetConfig[] = [];
  if (d.registrationsByYear.length > 0) {
    s.push({
      name: 'Registros x Año',
      headers: ['Año', 'Registros'],
      rows: d.registrationsByYear.map(r => [r.name, r.value]),
      columnWidths: [12, 15],
      sheetType: 'table',
    });
  }
  if (d.yearGrowth.length > 0) {
    s.push({
      name: 'Crecimiento Anual',
      headers: ['Año', 'Crecimiento %'],
      rows: d.yearGrowth.map(y => [y.name, y.growth.toFixed(1)]),
      columnWidths: [12, 15],
      sheetType: 'table',
    });
  }
  if (d.registrationsByQuarter.length > 0) {
    s.push({
      name: 'Registros x Trimestre',
      headers: ['Trimestre', 'Registros'],
      rows: d.registrationsByQuarter.map(q => [q.name, q.value]),
      columnWidths: [15, 15],
      sheetType: 'table',
    });
  }
  s.push({
    name: 'Métricas Temporales',
    headers: ['Métrica', 'Valor'],
    rows: [
      ['Edad prom. registro', d.avgAgeAtRegistration.toFixed(1)],
      ['Días prom. a inclusión', d.avgDaysToInclusion.toFixed(0)],
    ],
    columnWidths: [30, 12],
    sheetType: 'table',
  });
  return s;
}

function educationTabSheets(d: BoardData['educationData']): SheetConfig[] {
  const s: SheetConfig[] = [];
  if (d.educationDistribution.length > 0) {
    s.push({
      name: 'Nivel Educativo',
      headers: ['Nivel', 'Cantidad'],
      rows: d.educationDistribution.map(e => [e.name, e.value]),
      columnWidths: [35, 12],
      sheetType: 'table',
    });
  }
  if (d.educationByStatus.length > 0) {
    s.push({
      name: 'Nivel x Estado',
      headers: ['Nivel', 'Activos', 'Egresados'],
      rows: d.educationByStatus.map(e => [e.name, e.Activos, e.Egresados]),
      columnWidths: [35, 12, 12],
      sheetType: 'table',
    });
  }
  if (d.educationBySex.length > 0) {
    s.push({
      name: 'Nivel x Sexo',
      headers: ['Nivel', 'Mujeres', 'Hombres'],
      rows: d.educationBySex.map(e => [e.name, e.Mujeres, e.Hombres]),
      columnWidths: [35, 12, 12],
      sheetType: 'table',
    });
  }
  return s;
}

function centerTabSheets(d: BoardData['centerData']): SheetConfig[] {
  const s: SheetConfig[] = [];
  if (d.topCenters.length > 0) {
    s.push({
      name: 'Top Centros',
      headers: ['#', 'Centro', 'Total', 'Activos', 'Egresados'],
      rows: d.topCenters.map((c, i) => [i + 1, c.name, c.total, c.activos, c.egresados]),
      columnWidths: [5, 40, 12, 12, 12],
      sheetType: 'table',
    });
  }
  if (d.genderByCenter.length > 0) {
    s.push({
      name: 'Sexo x Centro',
      headers: ['Centro', 'Mujeres', 'Hombres'],
      rows: d.genderByCenter.map(g => [g.name, g.Mujeres, g.Hombres]),
      columnWidths: [40, 12, 12],
      sheetType: 'table',
    });
  }
  if (d.avgAgeByCenter.length > 0) {
    s.push({
      name: 'Edad x Centro',
      headers: ['Centro', 'Edad Prom'],
      rows: d.avgAgeByCenter.map(a => [a.name, a.avgAge.toFixed(1)]),
      columnWidths: [40, 12],
      sheetType: 'table',
    });
  }
  return s;
}

// ---------------------------------------------------------------------------
// Dispatch: sheets per category
// ---------------------------------------------------------------------------

function buildTabSheets(indicator: Indicator, boardData: BoardData): SheetConfig[] {
  switch (indicator.category) {
    case 'demograficos': return demographicTabSheets(boardData.demographicData);
    case 'territoriales': return territorialTabSheets(boardData.territorialData);
    case 'programa': return programTabSheets(boardData.programData);
    case 'calidad-dato': return qualityTabSheets(boardData.qualityData);
    case 'vulnerabilidad': return vulnerabilityTabSheets(boardData.vulnerabilityData);
    case 'cobertura-temporal': return temporalTabSheets(boardData.temporalData);
    case 'nivel-educativo': return educationTabSheets(boardData.educationData);
    case 'desempeno-centro': return centerTabSheets(boardData.centerData);
    default: return [];
  }
}

// ---------------------------------------------------------------------------
// Individual sheet builders
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

function buildFullDistributionSheet(items: DistributionItem[]): SheetConfig {
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

function buildRawFilteredSheet(data: Participant[], indicator: Indicator): SheetConfig {
  const relevantFields: (keyof Participant)[] = [
    'id', 'cedula', 'nombres', 'apellidos', 'edad', 'sexo',
    'provincia', 'municipio', 'centro', 'estado', 'rutaFormativa',
    'edadRegistro', 'fechaRegistro', 'fechaInclusion',
    'nivelEstudio', 'estadoCivil', 'tutor', 'telefonos',
  ];

  // Add vulnerability fields if relevant
  if (['vulnerabilidad', 'calidad-dato'].includes(indicator.category)) {
    relevantFields.push('discapacidades', 'enfermedades', 'alergias', 'programasSociales');
  }

  const headers = relevantFields.map(f => {
    const labels: Record<string, string> = {
      id: 'ID', cedula: 'Cédula', nombres: 'Nombres', apellidos: 'Apellidos',
      edad: 'Edad', sexo: 'Sexo', provincia: 'Provincia', municipio: 'Municipio',
      centro: 'Centro', estado: 'Estado', rutaFormativa: 'Ruta Formativa',
      edadRegistro: 'Edad Registro', fechaRegistro: 'Fecha Registro',
      fechaInclusion: 'Fecha Inclusión', nivelEstudio: 'Nivel Estudio',
      estadoCivil: 'Estado Civil', tutor: 'Tutor', telefonos: 'Teléfonos',
      discapacidades: 'Discapacidades', enfermedades: 'Enfermedades',
      alergias: 'Alergias', programasSociales: 'Programas Sociales',
    };
    return labels[f] || f;
  });

  const rows: unknown[][] = data.slice(0, 2000).map(p =>
    relevantFields.map(f => String((p as any)[f] ?? ''))
  );

  return {
    name: 'Datos filtrados',
    headers,
    rows,
    columnWidths: headers.map(h => Math.min(Math.max(h.length + 2, 6), 25)),
    sheetType: 'table',
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Builds a comprehensive multi-sheet Excel export for a SINGLE indicator.
 *
 * Sheets included per indicator:
 *   1. Información — metadata (name, formula, description, status)
 *   2. Vista actual — top N items as seen in the UI
 *   3. Distribución completa — ALL items sorted (no resto truncation)
 *   4–N. Tab sheets — all tables visible in the indicator's tab section
 *   N+1. GD-* sheets — chart-friendly data (Option C fallback)
 *   Last. Datos filtrados — raw Participant rows used in calculations
 */
export function useSingleIndicatorExport(
  input: SingleIndicatorExportInput
): SingleIndicatorExportResult {
  const { indicator, filteredData, boardData } = input;

  return useMemo(() => {
    if (!indicator) return { sheets: [] };

    const sheets: SheetConfig[] = [];

    // 1. Info
    sheets.push(buildInfoSheet(indicator));

    // 2. Current view (top N)
    sheets.push(buildCurrentViewSheet(indicator));

    // 3. Full distribution
    if (indicator.topItems && indicator.topItems.length > 0 && boardData) {
      const full = computeFullDistribution(filteredData, indicator, boardData);
      if (full && full.items.length > 0) {
        sheets.push(buildFullDistributionSheet(full.items));
      }
    }

    // 4. Tab data sheets — ALL tables visible in the detail tab
    if (boardData) {
      const tabSheets = buildTabSheets(indicator, boardData);
      sheets.push(...tabSheets);
    }

    // 5. Raw filtered participants (used for calculations)
    if (filteredData.length > 0) {
      sheets.push(buildRawFilteredSheet(filteredData, indicator));
    }

    return { sheets };
  }, [indicator, filteredData, boardData]);
}
