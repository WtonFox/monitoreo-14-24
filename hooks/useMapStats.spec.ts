/**
 * Characterization spec for useMapStats (M5 — valid-age avg denominator).
 */
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMapStats } from './useMapStats';
import { validParticipant } from '../tests/helpers/participants';
import type { Participant } from '../types';

const makeParticipant = (overrides: Partial<Participant>): Participant =>
  validParticipant(overrides);

describe('useMapStats — M5 denominator corrections', () => {
  describe('R-demographic-3: Valid-age average in map stats', () => {
    it('uses valid-age count for avg, not total records in the location', () => {
      const data: Participant[] = [
        makeParticipant({ id: 1, edad: 25, provincia: 'Santo Domingo' }),
        makeParticipant({ id: 2, edad: 0, provincia: 'Santo Domingo' }),
        makeParticipant({ id: 3, edad: 30, provincia: 'Santo Domingo' }),
        makeParticipant({ id: 4, edad: null as unknown as number, provincia: 'Santo Domingo' }),
      ];

      const { result } = renderHook(() =>
        useMapStats(data, 'province', null)
      );

      const stats = result.current.locationStats['Santo Domingo'];
      // avg = (25 + 30) / 2 = 27.5, rounded to 28
      expect(stats.ageRanges.avg).toBe(28);
    });

    it('avg is 0 when all ages are invalid in a location', () => {
      const data: Participant[] = [
        makeParticipant({ id: 1, edad: 0, provincia: 'Santo Domingo' }),
        makeParticipant({ id: 2, edad: 0, provincia: 'Santo Domingo' }),
      ];

      const { result } = renderHook(() =>
        useMapStats(data, 'province', null)
      );

      const stats = result.current.locationStats['Santo Domingo'];
      expect(stats.ageRanges.avg).toBe(0);
    });
  });
});
