import { useMemo } from 'react';
import type { Participant } from '../types';
import { useBoardDataWorker } from './useBoardDataWorker';
import type {
  BoardCategory,
  BoardData,
  DemographicSlice,
  TerritorialSlice,
  ProgramSlice,
  SocialSlice,
  QualitySlice,
  VulnerabilitySlice,
  TemporalSlice,
  EducationSlice,
  CenterSlice,
} from './computeBoardData';
import { computeBoardData } from './computeBoardData';

export type {
  BoardCategory,
  BoardData,
  DemographicSlice,
  TerritorialSlice,
  ProgramSlice,
  SocialSlice,
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
  const { data: result } = useBoardDataWorker(data, activeBoard);
  const fallback = useMemo(() => computeBoardData(data, activeBoard), [data, activeBoard]);
  return result ?? fallback;
}
