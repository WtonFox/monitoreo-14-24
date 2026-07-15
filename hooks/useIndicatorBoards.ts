import { useMemo } from 'react';
import type { Participant } from '../types';
import { computeBoardData } from './computeBoardData';
import type {
  BoardCategory,
  BoardData,
  DemographicSlice,
  TerritorialSlice,
  ProgramSlice,
  QualitySlice,
  VulnerabilitySlice,
  TemporalSlice,
  EducationSlice,
  CenterSlice,
} from './computeBoardData';

export type {
  BoardCategory,
  BoardData,
  DemographicSlice,
  TerritorialSlice,
  ProgramSlice,
  QualitySlice,
  VulnerabilitySlice,
  TemporalSlice,
  EducationSlice,
  CenterSlice,
};

export { computeBoardData };

export function useIndicatorBoards(
  data: Participant[],
  activeBoard: BoardCategory | 'all' = 'all',
): BoardData {
  return useMemo(() => computeBoardData(data, activeBoard), [data, activeBoard]);
}
