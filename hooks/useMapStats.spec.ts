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

// ── WU4: Single-pass correctness gate (R-perf-3) ──

describe('useMapStats — single-pass optimization (WU4)', () => {
  it('groups participants by province with correct counts', () => {
    const data: Participant[] = [
      makeParticipant({ id: 1, provincia: 'Santo Domingo', centro: 'Centro A' }),
      makeParticipant({ id: 2, provincia: 'Santo Domingo', centro: 'Centro A' }),
      makeParticipant({ id: 3, provincia: 'Santiago', centro: 'Centro B' }),
      makeParticipant({ id: 4, provincia: 'La Vega', centro: 'Centro C' }),
    ];

    const { result } = renderHook(() =>
      useMapStats(data, 'province', null)
    );

    expect(result.current.locationStats['Santo Domingo'].total).toBe(2);
    expect(result.current.locationStats['Santiago'].total).toBe(1);
    expect(result.current.locationStats['La Vega'].total).toBe(1);
  });

  it('populates topCenters for each location (single-pass accumulators)', () => {
    const data: Participant[] = [
      makeParticipant({ id: 1, provincia: 'Santo Domingo', centro: 'Centro A' }),
      makeParticipant({ id: 2, provincia: 'Santo Domingo', centro: 'Centro A' }),
      makeParticipant({ id: 3, provincia: 'Santo Domingo', centro: 'Centro B' }),
    ];

    const { result } = renderHook(() =>
      useMapStats(data, 'province', null)
    );

    const stats = result.current.locationStats['Santo Domingo'];
    expect(stats.topCenters).toHaveLength(2);
    const topA = stats.topCenters.find(c => c.name === 'Centro A');
    expect(topA?.count).toBe(2);
  });

  it('handles null centro gracefully with Sin asignar grouping', () => {
    const data: Participant[] = [
      makeParticipant({ id: 1, provincia: 'Santo Domingo', centro: null as unknown as string }),
      makeParticipant({ id: 2, provincia: 'Santo Domingo', centro: 'Centro A' }),
    ];

    const { result } = renderHook(() =>
      useMapStats(data, 'province', null)
    );

    const stats = result.current.locationStats['Santo Domingo'];
    const sinAsignar = stats.topCenters.find(c => c.name === 'Sin asignar');
    expect(sinAsignar?.count).toBe(1);
  });

  it('computes ageRanges correctly with valid and invalid ages', () => {
    const data: Participant[] = [
      makeParticipant({ id: 1, edad: 25, provincia: 'Santo Domingo' }),
      makeParticipant({ id: 2, edad: 0, provincia: 'Santo Domingo' }),
      makeParticipant({ id: 3, edad: 30, provincia: 'Santo Domingo' }),
    ];

    const { result } = renderHook(() =>
      useMapStats(data, 'province', null)
    );

    const stats = result.current.locationStats['Santo Domingo'];
    expect(stats.ageRanges.min).toBe(25);
    expect(stats.ageRanges.max).toBe(30);
    expect(stats.ageRanges.avg).toBe(28); // (25+30)/2, rounded
  });

  it('is deterministic: same data produces same locationStats', () => {
    const data: Participant[] = [
      makeParticipant({ id: 1, provincia: 'Santo Domingo', centro: 'Centro A', edad: 20 }),
      makeParticipant({ id: 2, provincia: 'Santiago', centro: 'Centro B', edad: 25 }),
      makeParticipant({ id: 3, provincia: 'Santo Domingo', centro: 'Centro A', edad: 30 }),
    ];

    const { result: r1 } = renderHook(() => useMapStats(data, 'province', null));
    const { result: r2 } = renderHook(() => useMapStats(data, 'province', null));

    // Compare serializable data (not functions like getColor)
    expect(r1.current.locationStats).toEqual(r2.current.locationStats);
    expect(r1.current.mapData).toEqual(r2.current.mapData);
  });

  it('returns empty locationStats for empty data', () => {
    const { result } = renderHook(() => useMapStats([], 'province', null));
    expect(result.current.locationStats).toEqual({});
  });

  it('computes topCenters sorted by count descending, limited to 3', () => {
    const data: Participant[] = [
      makeParticipant({ id: 1, provincia: 'Santo Domingo', centro: 'Centro A' }),
      makeParticipant({ id: 2, provincia: 'Santo Domingo', centro: 'Centro A' }),
      makeParticipant({ id: 3, provincia: 'Santo Domingo', centro: 'Centro A' }),
      makeParticipant({ id: 4, provincia: 'Santo Domingo', centro: 'Centro B' }),
      makeParticipant({ id: 5, provincia: 'Santo Domingo', centro: 'Centro B' }),
      makeParticipant({ id: 6, provincia: 'Santo Domingo', centro: 'Centro C' }),
      makeParticipant({ id: 7, provincia: 'Santo Domingo', centro: 'Centro D' }),
      makeParticipant({ id: 8, provincia: 'Santo Domingo', centro: 'Centro E' }),
    ];

    const { result } = renderHook(() =>
      useMapStats(data, 'province', null)
    );

    const stats = result.current.locationStats['Santo Domingo'];
    expect(stats.topCenters.length).toBeLessThanOrEqual(3);
    expect(stats.topCenters[0].name).toBe('Centro A');
    expect(stats.topCenters[0].count).toBeGreaterThanOrEqual(stats.topCenters[1].count);
  });
});
