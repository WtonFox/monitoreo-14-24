/**
 * Characterization spec for useIndicatorBoards (M5 — demographic denominators).
 *
 * Tests the M5 contract: unknown sex bucket, unknown age bucket, stable center
 * keys, valid-age averages, and minor exclusion.
 */
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useIndicatorBoards } from './useIndicatorBoards';
import { validParticipant } from '../tests/helpers/participants';
import type { Participant } from '../types';

// ── Helpers ──

const makeParticipant = (overrides: Partial<Participant>): Participant =>
  validParticipant(overrides);

// ── Tests ──

describe('useIndicatorBoards — M5 demographic denominators', () => {
  describe('R-demographic-1: Unknown sex bucket', () => {
    it('routes F and FEMENINO to women, M and MASCULINO to men, all else to unknown', () => {
      const data: Participant[] = [
        makeParticipant({ id: 1, sexo: 'M' }),
        makeParticipant({ id: 2, sexo: 'F' }),
        makeParticipant({ id: 3, sexo: null }),
        makeParticipant({ id: 4, sexo: '' }),
        makeParticipant({ id: 5, sexo: 'X' }),
        makeParticipant({ id: 6, sexo: 'MASCULINO' }),
        makeParticipant({ id: 7, sexo: 'FEMENINO' }),
      ];

      const { result } = renderHook(() => useIndicatorBoards(data));

      expect(result.current.demographicData.women).toBe(2);
      expect(result.current.demographicData.men).toBe(2);
      expect(result.current.demographicData.unknown).toBe(3);
      expect(result.current.demographicData.total).toBe(7);
    });

    it('uses known-sex total for percentages', () => {
      const data: Participant[] = [
        makeParticipant({ id: 1, sexo: 'M' }),
        makeParticipant({ id: 2, sexo: null }),
      ];

      const { result } = renderHook(() => useIndicatorBoards(data));
      // Known sex total = 1, so womenPct = 0/1 = 0, menPct = 1/1 = 100
      expect(result.current.demographicData.womenPct).toBe(0);
      expect(result.current.demographicData.menPct).toBe(100);
      expect(result.current.demographicData.total).toBe(2);
    });
  });

  describe('R-demographic-2: Unknown age bucket', () => {
    it('routes 0/null/undefined/outlier to Unknown bucket', () => {
      const data: Participant[] = [
        makeParticipant({ id: 1, edad: 0 }),
        makeParticipant({ id: 2, edad: 15 }),
        makeParticipant({ id: 3, edad: null as unknown as number }),
        makeParticipant({ id: 4, edad: 25 }),
        makeParticipant({ id: 5, edad: undefined as unknown as number }),
      ];

      const { result } = renderHook(() => useIndicatorBoards(data));
      const ab = result.current.demographicData.ageBuckets;

      const unknown = ab.find(b => b.name === 'Unknown');
      expect(unknown?.value).toBe(3);

      const bucket25 = ab.find(b => b.name === '25+');
      expect(bucket25?.value).toBe(1);

      const bucket1417 = ab.find(b => b.name === '14-17');
      expect(bucket1417?.value).toBe(1);
    });

    it('excludes age 0 from minor count', () => {
      const data: Participant[] = [
        makeParticipant({ id: 1, edad: 0 }),
        makeParticipant({ id: 2, edad: 15, tutor: 'Tutor Test' }),
        makeParticipant({ id: 3, edad: 17, tutor: 'Tutor Test' }),
      ];

      const { result } = renderHook(() => useIndicatorBoards(data));
      // 2 minors (ages 15, 17), both have tutors → 100%
      expect(result.current.programData.minorsWithTutorPct).toBe(100);
    });
  });

  describe('R-demographic-5: Stable center keys', () => {
    it('preserves distinct entries for centers with colliding 18-char prefixes', () => {
      const centerA = 'Centro Educativo Juan Pablo II';
      const centerB = 'Centro Educativo Juan Pablo I';

      const data: Participant[] = [
        makeParticipant({ id: 1, centro: centerA }),
        makeParticipant({ id: 2, centro: centerA }),
        makeParticipant({ id: 3, centro: centerB }),
      ];

      const { result } = renderHook(() => useIndicatorBoards(data));

      // Both should appear in topCenters (3 entries, top 10 includes both)
      const centers = result.current.centerData.topCenters;
      const centerANames = centers.filter(c => c.name.startsWith('Centro Educativo'));
      expect(centerANames.length).toBe(2);
    });

    it('does not duplicate or misattribute gender data with truncated names', () => {
      const centerA = 'Centro Educativo Juan Pablo II';
      const centerB = 'Centro Educativo Juan Pablo I';

      const data: Participant[] = [
        makeParticipant({ id: 1, centro: centerA, sexo: 'F' }),
        makeParticipant({ id: 2, centro: centerB, sexo: 'M' }),
      ];

      const { result } = renderHook(() => useIndicatorBoards(data));

      const gbc = result.current.centerData.genderByCenter;
      const centerAEntry = gbc.find(c => c.name.startsWith('Centro Educativo') && c.Mujeres > 0);
      const centerBEntry = gbc.find(c => c.name.startsWith('Centro Educativo') && c.Hombres > 0);

      expect(centerAEntry?.Mujeres).toBe(1);
      expect(centerAEntry?.Hombres).toBe(0);
      expect(centerBEntry?.Mujeres).toBe(0);
      expect(centerBEntry?.Hombres).toBe(1);
    });
  });

  describe('Valid-age average', () => {
    it('computes avgAgeReg from valid edadRegistro > 0 only', () => {
      const data: Participant[] = [
        makeParticipant({ id: 1, edadRegistro: 20 }),
        makeParticipant({ id: 2, edadRegistro: 0 }),
        makeParticipant({ id: 3, edadRegistro: 30 }),
      ];

      const { result } = renderHook(() => useIndicatorBoards(data));
      // (20 + 30) / 2 = 25
      expect(result.current.demographicData.avgAgeReg).toBe(25);
    });
  });

  describe('Edge cases', () => {
    it('handles empty data gracefully', () => {
      const { result } = renderHook(() => useIndicatorBoards([]));
      expect(result.current.demographicData.total).toBe(0);
      expect(result.current.demographicData.women).toBe(0);
      expect(result.current.demographicData.men).toBe(0);
      expect(result.current.demographicData.unknown).toBe(0);
    });

    it('handles all-unknown sex data', () => {
      const data: Participant[] = [
        makeParticipant({ id: 1, sexo: null }),
        makeParticipant({ id: 2, sexo: '' }),
      ];

      const { result } = renderHook(() => useIndicatorBoards(data));
      expect(result.current.demographicData.unknown).toBe(2);
      expect(result.current.demographicData.women).toBe(0);
      expect(result.current.demographicData.men).toBe(0);
    });
  });
});
