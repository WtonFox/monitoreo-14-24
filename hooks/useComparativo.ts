import { useState, useMemo, useCallback } from 'react';
import type { Participant } from '../types';
import type { FilterWorkerFilters } from '../workers/filterWorker';
import { useParticipantStore } from '../stores/participantStore';
import { useFilterWorker } from './useFilterWorker';
import { isWomen, isMen, isActiveStatus } from '../utils/normalize';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Dimension = 'provincia' | 'municipio' | 'año' | 'anioInclusion' | 'centro' | 'estado' | 'nivelEstudio';

export interface KPIValues {
  total: number;
  avgAge: number;
  womenCount: number;
  menCount: number;
  womenPct: number;
  menPct: number;
  desertionCount: number;
  desertionRate: number;
  activeCount: number;
  centerCount: number;
}

export type DeltaValue = number | null;

export interface DeltaValues {
  total: DeltaValue;
  avgAge: DeltaValue;
  womenPct: DeltaValue;
  menPct: DeltaValue;
  desertionRate: DeltaValue;
  activeCount: DeltaValue;
  centerCount: DeltaValue;
}

export interface UseComparativoResult {
  dimension: Dimension;
  valA: string;
  valB: string;
  dataA: Participant[];
  dataB: Participant[];
  kpiA: KPIValues | null;
  kpiB: KPIValues | null;
  deltas: DeltaValues | null;
  availableValues: string[];
  setDimension: (d: Dimension) => void;
  setValA: (v: string) => void;
  setValB: (v: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isDesertionStatus(estado: string | null | undefined): boolean {
  if (!estado) return false;
  const s = estado.trim().toLowerCase();
  return ['retirado', 'desertor', 'baja', 'cancelado', 'inactivo', 'no admitido', 'abandonó', 'abandono'].includes(s);
}

function computeKPI(data: Participant[]): KPIValues {
  const total = data.length;
  if (total === 0) {
    return { total: 0, avgAge: 0, womenCount: 0, menCount: 0, womenPct: 0, menPct: 0, desertionCount: 0, desertionRate: 0, activeCount: 0, centerCount: 0 };
  }

  let ageSum = 0, ageCount = 0, womenCount = 0, menCount = 0;
  let desertionCount = 0, activeCount = 0;
  const centers = new Set<string>();

  for (const p of data) {
    if (p.edad > 0) { ageSum += p.edad; ageCount++; }
    if (isWomen(p.sexo)) womenCount++;
    if (isMen(p.sexo)) menCount++;
    if (isDesertionStatus(p.estado)) desertionCount++;
    if (isActiveStatus(p.estado)) activeCount++;
    if (p.centro) centers.add(p.centro);
  }

  return {
    total,
    avgAge: ageCount > 0 ? ageSum / ageCount : 0,
    womenCount, menCount,
    womenPct: total > 0 ? (womenCount / total) * 100 : 0,
    menPct: total > 0 ? (menCount / total) * 100 : 0,
    desertionCount,
    desertionRate: total > 0 ? (desertionCount / total) * 100 : 0,
    activeCount,
    centerCount: centers.size,
  };
}

function computeDelta(a: number, b: number): number | null {
  if (b === 0) return null;
  return ((a - b) / b) * 100;
}

function computeDeltas(kpiA: KPIValues, kpiB: KPIValues): DeltaValues {
  return {
    total: computeDelta(kpiA.total, kpiB.total),
    avgAge: computeDelta(kpiA.avgAge, kpiB.avgAge),
    womenPct: computeDelta(kpiA.womenPct, kpiB.womenPct),
    menPct: computeDelta(kpiA.menPct, kpiB.menPct),
    desertionRate: computeDelta(kpiA.desertionRate, kpiB.desertionRate),
    activeCount: computeDelta(kpiA.activeCount, kpiB.activeCount),
    centerCount: computeDelta(kpiA.centerCount, kpiB.centerCount),
  };
}

function buildFilters(dim: Dimension, val: string): FilterWorkerFilters {
  if (!val) return {};
  switch (dim) {
    case 'provincia':     return { provincia: val };
    case 'municipio':     return { municipio: val };
    case 'año':           return { yearIngreso: val };
    case 'anioInclusion': return { yearInclusion: val };
    case 'centro':        return { centro: val };
    case 'estado':        return { estado: val };
    case 'nivelEstudio':  return { nivelEstudio: val };
    default:              return {};
  }
}

// ---------------------------------------------------------------------------
// Available values extraction
// ---------------------------------------------------------------------------

function extractValues(data: Participant[], dim: Dimension): string[] {
  const set = new Set<string>();
  for (const p of data) {
    switch (dim) {
      case 'provincia':
        if (p.provincia) set.add(p.provincia);
        break;
      case 'municipio':
        if (p.municipio) set.add(p.municipio);
        break;
      case 'año':
        if (p.fechaRegistro) {
          const year = new Date(p.fechaRegistro).getFullYear().toString();
          if (year !== 'NaN') set.add(year);
        }
        break;
      case 'anioInclusion':
        if (p.fechaInclusion) {
          const year = new Date(p.fechaInclusion).getFullYear().toString();
          if (year !== 'NaN') set.add(year);
        }
        break;
      case 'centro':
        if (p.centro) set.add(p.centro);
        break;
      case 'estado':
        if (p.estado) set.add(p.estado);
        break;
      case 'nivelEstudio':
        if (p.nivelEstudio && p.nivelEstudio !== 'N/A') set.add(p.nivelEstudio);
        break;
    }
  }
  return Array.from(set).sort();
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useComparativo(): UseComparativoResult {
  const dashboardData = useParticipantStore(s => s.dashboardData);

  const [dimension, setDimension] = useState<Dimension>('provincia');
  const [valA, setValA] = useState('');
  const [valB, setValB] = useState('');

  // Reset values when dimension changes
  const handleSetDimension = useCallback((d: Dimension) => {
    setDimension(d);
    setValA('');
    setValB('');
  }, []);

  // Build filters for A and B using the SAME dimension
  const filtersA = useMemo(() => buildFilters(dimension, valA), [dimension, valA]);
  const filtersB = useMemo(() => buildFilters(dimension, valB), [dimension, valB]);

  // Filter each dataset via useFilterWorker
  const { filteredData: dataA } = useFilterWorker(dashboardData, filtersA);
  const { filteredData: dataB } = useFilterWorker(dashboardData, filtersB);

  // Compute KPIs
  const kpiA = useMemo(() => (valA ? computeKPI(dataA) : null), [valA, dataA]);
  const kpiB = useMemo(() => (valB ? computeKPI(dataB) : null), [valB, dataB]);

  // Compute deltas when both sides are active
  const deltas = useMemo(() => {
    if (!kpiA || !kpiB) return null;
    return computeDeltas(kpiA, kpiB);
  }, [kpiA, kpiB]);

  // Available values for the selected dimension
  const availableValues = useMemo(() => extractValues(dashboardData, dimension), [dashboardData, dimension]);

  return {
    dimension, valA, valB,
    dataA, dataB,
    kpiA, kpiB, deltas,
    availableValues,
    setDimension: handleSetDimension,
    setValA, setValB,
  };
}
