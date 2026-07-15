/**
 * Tier 1 benchmarks — pure computation timing (R-perf-1).
 *
 * Measures the raw aggregation time for each hotspot using the
 * deterministic 67k / 10k / 100k fixtures.  Runs under `vitest bench`.
 *
 * After WU3+WU4 optimizations, the benchmarks call exported pure
 * functions (computeBoardData with active-slice gating + single-pass map).
 */
import { bench, describe, beforeAll } from 'vitest';
import {
  perfFixture10k,
  perfFixture67k,
  perfFixture100k,
} from '../fixtures/participants-perf';
import type { Participant } from '../../types';
import { computeBoardData } from '../../hooks/useIndicatorBoards';
import type { BoardCategory } from '../../hooks/useIndicatorBoards';

// ── Fixtures (loaded once before all benches) ──
let data10k: Participant[];
let data67k: Participant[];
let data100k: Participant[];

beforeAll(() => {
  data10k = perfFixture10k();
  data67k = perfFixture67k();
  data100k = perfFixture100k();
});

// ── Benchmarked helpers ──

function computeBoardDataBench(
  data: Participant[],
  activeBoard: BoardCategory | 'all' = 'all',
) {
  return computeBoardData(data, activeBoard);
}

function computeLocationStats(data: Participant[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const p of data) {
    if (!p || !p.provincia) continue;
    counts[p.provincia] = (counts[p.provincia] || 0) + 1;
  }
  return counts;
}

// ══════════════════════════════════════════════════════════
//  Benchmarks
// ══════════════════════════════════════════════════════════

describe('computeBoardData (all slices)', () => {
  bench('10k all', () => { computeBoardDataBench(data10k, 'all'); });
  bench('67k all', () => { computeBoardDataBench(data67k, 'all'); });
  bench('100k all', () => { computeBoardDataBench(data100k, 'all'); });
});

describe('computeBoardData (single demographic slice)', () => {
  bench('10k demographic', () => { computeBoardDataBench(data10k, 'demographic'); });
  bench('67k demographic', () => { computeBoardDataBench(data67k, 'demographic'); });
  bench('100k demographic', () => { computeBoardDataBench(data100k, 'demographic'); });
});

describe('locationStats (map aggregation)', () => {
  bench('10k province count', () => { computeLocationStats(data10k); });
  bench('67k province count', () => { computeLocationStats(data67k); });
  bench('100k province count', () => { computeLocationStats(data100k); });
});
