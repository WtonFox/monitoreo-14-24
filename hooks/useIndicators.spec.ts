/**
 * Characterization spec for useIndicators (M5 — valid-age avg + sex denominator).
 */
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useIndicators } from './useIndicators';
import { validParticipant } from '../tests/helpers/participants';
import type { Participant } from '../types';

const makeParticipant = (overrides: Partial<Participant>): Participant =>
  validParticipant(overrides);

describe('useIndicators — M5 denominator corrections', () => {
  describe('R-demographic-3: Valid-age average denominator', () => {
    it('uses valid-age count for avgAgeNow, not total records', () => {
      const data: Participant[] = [
        makeParticipant({ id: 1, edad: 25 }),
        makeParticipant({ id: 2, edad: 0 }),
        makeParticipant({ id: 3, edad: 30 }),
        makeParticipant({ id: 4, edad: null as unknown as number }),
      ];

      const { result } = renderHook(() => useIndicators(data));
      const indicator4 = result.current.indicators.find(i => i.id === 4);
      // avgAgeNow = (25 + 30) / 2 = 27.5, NOT (25+30+0+0)/4 = 13.75
      expect(indicator4?.value).toContain('27.5');
    });
  });

  describe('R-demographic-1: Unknown sex denominator', () => {
    it('uses known-sex total for women/men percentages', () => {
      const data: Participant[] = [
        makeParticipant({ id: 1, sexo: 'F' }),
        makeParticipant({ id: 2, sexo: 'M' }),
        makeParticipant({ id: 3, sexo: null }),
        makeParticipant({ id: 4, sexo: '' }),
      ];

      const { result } = renderHook(() => useIndicators(data));
      const womenInd = result.current.indicators.find(i => i.id === 2);
      const menInd = result.current.indicators.find(i => i.id === 3);

      // Known sex total = 2, women = 1/2 = 50%, men = 1/2 = 50%
      expect(womenInd?.value).toBe('50.0%');
      expect(menInd?.value).toBe('50.0%');
    });
  });

  describe('Edge cases', () => {
    it('returns N/A for avgAge when all ages are invalid', () => {
      const data: Participant[] = [
        makeParticipant({ id: 1, edad: 0 }),
        makeParticipant({ id: 2, edad: 0 }),
      ];

      const { result } = renderHook(() => useIndicators(data));
      const indicator4 = result.current.indicators.find(i => i.id === 4);
      expect(indicator4?.value).toContain('N/A');
    });
  });
});
