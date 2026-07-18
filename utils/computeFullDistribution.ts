import type { Participant } from '../types';
import type { Indicator } from '../hooks/useIndicators';
import type { BoardData } from '../hooks/computeBoardData';

// ---------------------------------------------------------------------------
// Inline helpers (same logic as indicator-computations.ts)
// ---------------------------------------------------------------------------

const isEmptyValue = (val: string | null | undefined): boolean =>
  val === null || val === undefined || val.trim() === '' || val === 'N/A' || val === 'N/D';

const sanitizeValue = (s: string): string =>
  s.replace(/&#x[0-9A-Fa-f]+;/g, '').trim();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DistributionItem {
  name: string;
  value: number;
  pct?: number;
}

export interface FullDistribution {
  label: string;
  items: DistributionItem[];
  total: number;
}

// ---------------------------------------------------------------------------
// Generic counters
// ---------------------------------------------------------------------------

function countByField(data: Participant[], field: keyof Participant): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const p of data) {
    const val = p[field];
    if (val && typeof val === 'string' && !isEmptyValue(val)) {
      counts[val] = (counts[val] || 0) + 1;
    }
  }
  return counts;
}

function countByCommaField(
  data: Participant[],
  field: keyof Participant
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const p of data) {
    const val = p[field];
    if (val && typeof val === 'string' && !isEmptyValue(val)) {
      const items = val.split(',').map(s => sanitizeValue(s)).filter(Boolean);
      for (const item of items) {
        counts[item] = (counts[item] || 0) + 1;
      }
    }
  }
  return counts;
}

// ---------------------------------------------------------------------------
// Distribution sources
// ---------------------------------------------------------------------------

type DistributionSource =
  | { type: 'board-slice'; extract: (b: BoardData) => DistributionItem[] }
  | { type: 'field'; field: keyof Participant }
  | { type: 'comma-field'; field: keyof Participant };

/**
 * Maps an indicator to its distribution source for full-data computation.
 *
 * Priority order:
 *   1. BoardData (has the full arrays already computed)
 *   2. Direct participant field counting
 *   3. Comma-separated field counting (vulnerabilities, diseases, etc.)
 */
function getDistributionSource(indicator: Indicator): DistributionSource | null {
  const name = indicator.name.toLowerCase();
  const desc = (indicator.description || '').toLowerCase();
  const combined = `${name} ${desc}`;

  // ── Territorial ────────────────────────────────────────────────────
  if (combined.includes('municipio') && !combined.includes('sexo') && !combined.includes('género')) {
    return { type: 'field', field: 'municipio' };
  }
  if (combined.includes('centro') && !combined.includes('sexo') && !combined.includes('género') && !combined.includes('edad')) {
    return { type: 'field', field: 'centro' };
  }
  if (combined.includes('curso') || combined.includes('ruta formativa')) {
    return { type: 'field', field: 'rutaFormativa' };
  }

  // ── Demographics ───────────────────────────────────────────────────
  if (combined.includes('estado civil') || combined.includes('estado cívil')) {
    return { type: 'field', field: 'estadoCivil' };
  }
  if (combined.includes('edad') && (combined.includes('registro') || combined.includes('actual'))) {
    // Age distribution is computed from edad field
    return null; // Special case: age buckets
  }

  // ── Program ────────────────────────────────────────────────────────
  if (combined.includes('estado') && !combined.includes('civil') && !combined.includes('salud')) {
    return { type: 'field', field: 'estado' };
  }
  if (combined.includes('año') && combined.includes('registro')) {
    return null; // Special case: year distribution
  }

  // ── Education ──────────────────────────────────────────────────────
  if (combined.includes('nivel educativo') || combined.includes('nivel estudio') || combined.includes('educación')) {
    return { type: 'field', field: 'nivelEstudio' };
  }

  // ── Vulnerability (comma-separated fields) ─────────────────────────
  if (combined.includes('discapacidad') || combined.includes('tipo de discapacidad')) {
    return { type: 'comma-field', field: 'discapacidades' };
  }
  if (combined.includes('enfermedad') || combined.includes('tipo de enfermedad')) {
    return { type: 'comma-field', field: 'enfermedades' };
  }
  if (combined.includes('alergia') || combined.includes('tipo de alergia')) {
    return { type: 'comma-field', field: 'alergias' };
  }
  if (combined.includes('programa social')) {
    return { type: 'comma-field', field: 'programasSociales' };
  }

  // ── Quality ────────────────────────────────────────────────────────
  if (combined.includes('calidad') && combined.includes('dato')) {
    return null; // Quality has a custom structure in BoardData
  }

  return null;
}

// ---------------------------------------------------------------------------
// Extract full distribution from BoardData
// ---------------------------------------------------------------------------

function extractFromBoardData(
  boardData: BoardData,
  indicator: Indicator
): DistributionItem[] | null {
  const name = indicator.name.toLowerCase();
  const desc = (indicator.description || '').toLowerCase();
  const combined = `${name} ${desc}`;

  // Demographics
  if (combined.includes('estado civil') || combined.includes('estado cívil')) {
    return boardData.demographicData.maritalStatus.map(i => ({
      name: i.name,
      value: i.value,
      pct: boardData.demographicData.total > 0
        ? (i.value / boardData.demographicData.total) * 100
        : 0,
    }));
  }
  if (combined.includes('edad') && combined.includes('registro')) {
    return boardData.demographicData.ageBuckets.map(i => ({
      name: i.name,
      value: i.value,
    }));
  }

  // Territorial
  if (combined.includes('municipio') && !combined.includes('sexo') && !combined.includes('género')) {
    return boardData.territorialData.topMunicipios.map(i => ({
      name: i.name,
      value: i.value,
    }));
  }
  if (combined.includes('centro') && !combined.includes('sexo') && !combined.includes('género') && !combined.includes('edad') && !combined.includes('desempeño')) {
    return boardData.territorialData.topCentros.map(i => ({
      name: i.name,
      value: i.value,
    }));
  }
  if (combined.includes('curso') || combined.includes('ruta formativa')) {
    return boardData.territorialData.topCursos.map(i => ({
      name: i.name,
      value: i.value,
    }));
  }

  // Program
  if (combined.includes('estado') && !combined.includes('civil') && !combined.includes('salud')) {
    return boardData.programData.statusDistribution.map(i => ({
      name: i.name,
      value: i.value,
    }));
  }

  // Quality
  if (combined.includes('calidad') && combined.includes('dato')) {
    return boardData.qualityData.fieldBreakdown.map(i => ({
      name: i.name,
      value: i.total,
      pct: i.pct,
    }));
  }

  // Vulnerability (BoardData stores top N, but still more complete than indicator.topItems)
  if (combined.includes('discapacidad') || combined.includes('tipo de discapacidad')) {
    return boardData.vulnerabilityData.topDisabilities.map(i => ({
      name: i.name,
      value: i.value,
    }));
  }
  if (combined.includes('enfermedad') || combined.includes('tipo de enfermedad')) {
    return boardData.vulnerabilityData.topDiseases.map(i => ({
      name: i.name,
      value: i.value,
    }));
  }
  if (combined.includes('alergia') || combined.includes('tipo de alergia')) {
    return boardData.vulnerabilityData.topAllergies.map(i => ({
      name: i.name,
      value: i.value,
    }));
  }
  if (combined.includes('programa social')) {
    return boardData.vulnerabilityData.topSocialPrograms.map(i => ({
      name: i.name,
      value: i.value,
    }));
  }

  // Temporal
  if (combined.includes('año') && combined.includes('registro')) {
    return boardData.temporalData.registrationsByYear.map(i => ({
      name: i.name,
      value: i.value,
    }));
  }

  // Education
  if (combined.includes('nivel educativo') || combined.includes('nivel estudio') || combined.includes('educación')) {
    return boardData.educationData.educationDistribution.map(i => ({
      name: i.name,
      value: i.value,
    }));
  }

  return null;
}

// ---------------------------------------------------------------------------
// Compute full distribution for a single indicator
// ---------------------------------------------------------------------------

/**
 * Computes the full distribution (ALL items, not just top N) for a given
 * indicator from the available data sources.
 *
 * Priority:
 *   1. BoardData — has pre-computed arrays with all items
 *   2. Participant data — recompute from filtered participants
 *
 * Returns `null` when the indicator has no distributable data (e.g., pure
 * computed values like averages, percentages).
 */
export function computeFullDistribution(
  data: Participant[],
  indicator: Indicator,
  boardData?: BoardData
): FullDistribution | null {
  if (!indicator.topItems || indicator.topItems.length === 0) {
    return null;
  }

  // Try BoardData first
  if (boardData) {
    const boardItems = extractFromBoardData(boardData, indicator);
    if (boardItems && boardItems.length > 0) {
      const total = boardItems.reduce((s, i) => s + i.value, 0);
      return {
        label: `${indicator.name} — Distribución completa`,
        items: boardItems,
        total,
      };
    }
  }

  // Fallback: recompute from participant data
  const source = getDistributionSource(indicator);
  if (!source) return null;

  let rawCounts: Record<string, number>;
  switch (source.type) {
    case 'field':
      rawCounts = countByField(data, source.field);
      break;
    case 'comma-field':
      rawCounts = countByCommaField(data, source.field);
      break;
    default:
      return null;
  }

  const entries = Object.entries(rawCounts)
    .sort(([, a], [, b]) => b - a);

  const total = entries.reduce((s, [, v]) => s + v, 0);
  const items: DistributionItem[] = entries.map(([name, value]) => ({
    name,
    value,
    pct: total > 0 ? (value / total) * 100 : 0,
  }));

  return { label: `${indicator.name} — Distribución completa`, items, total };
}
