import { useMemo } from 'react';
import type { Participant } from '../types';
import { computeIndicators } from '../utils/indicator-computations';

export type IndicatorCategory = 'demograficos' | 'territoriales' | 'programa' | 'calidad-dato' | 'vulnerabilidad' | 'cobertura-temporal' | 'nivel-educativo' | 'desempeno-centro';

export interface Indicator {
  id: number;
  name: string;
  category: IndicatorCategory;
  value: string | number;
  topItems?: { name: string; value: number; pct?: number }[];
  resto?: number;
  topCount?: number;
  topDataNote?: string;
  formula: string;
  description: string;
  status: 'viable' | 'pending' | 'no-viable';
  pendingReason?: string;
}

export interface IndicatorGroup {
  category: IndicatorCategory;
  label: string;
  items: Indicator[];
}

export interface UseIndicatorsResult {
  indicators: Indicator[];
  groups: IndicatorGroup[];
  lastUpdated: Date;
}

export function useIndicators(data: Participant[]): UseIndicatorsResult {
  return useMemo(() => computeIndicators(data), [data]);
}


