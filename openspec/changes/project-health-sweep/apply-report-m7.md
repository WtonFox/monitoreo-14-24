# Apply Report — M7: 67k-Record Performance Budget

**Change**: project-health-sweep
**Milestone**: M7
**Date**: 2026-07-14
**Mode**: Standard (no Strict TDD)
**Delivery**: Single PR (stacked-to-main), ~240 authored lines (fixtures ~130 excluded)

---

## Completed Work Units

### WU1 — Benchmark fixture
- Created `tests/fixtures/participants-perf.ts` with `mulberry32` seeded PRNG
- Exports: `generateParticipants`, `perfFixture10k`, `perfFixture67k`, `perfFixture100k`
- Distribution: 32 provinces, 3 municipalities/province, 12 centers, 4 age ranges, 2 sexes, 3 statuses
- Added `tests/fixtures/participants-perf.spec.ts` (8 tests: counts, determinism, distribution)

### WU2 — Benchmark baseline
- Created `tests/benchmark/perf-bench.bench.ts` with vitest bench suites
- Created `tests/benchmark/perf-runner.ts` (Playwright Tier 2 stub)
- Added `bench` and `bench:browser` scripts to `package.json`
- Created `openspec/changes/project-health-sweep/notes/m7-benchmark.md`
- Baseline: computeBoardData 67k = 103ms (exceeds 50ms budget)

### WU3 — Active-slice aggregation (R-perf-2)
- Modified `hooks/useIndicatorBoards.ts`:
  - Added `export type BoardCategory`
  - Extracted `export function computeBoardData(data, activeBoard)`
  - Gated derived-data blocks behind `needs(category)` checks
  - Added empty-slice factories for inactive boards
  - `useIndicatorBoards` is now a thin `useMemo` wrapper
- Modified `contexts/IndicadoresFiltersContext.tsx`:
  - Added `useLocation()` route-to-board mapping
  - Passes `activeBoard` to `useIndicatorBoards`
- Added 5 new tests verifying single-slice gating

### WU4 — Map one-pass (R-perf-3)
- Modified `hooks/useMapStats.ts`:
  - Merged center count and age sum/count accumulators into first pass
  - Post-process only: compute avg, topCenters from accumulators
  - No `data.filter()` per location — single O(records) pass
- Added 7 new tests: topCenters, age ranges, determinism, edge cases

### WU5 — Re-measure and consolidate
- Re-ran same benchmarks after optimizations
- Updated `notes/m7-benchmark.md` with before/after comparison and gap analysis
- Gate check: computeBoardData 67k at 105ms still exceeds 50ms budget
- Documented that the per-record loop (98ms) dominates — Worker scheduling (M11) is the correct fix
- requestIdleCallback skipped: cannot interrupt a tight synchronous `for` loop

---

## Files Changed

| File | Action | What Was Done |
|------|--------|---------------|
| `tests/fixtures/participants-perf.ts` | Created | Deterministic 10k/67k/100k generator (mulberry32 PRNG) |
| `tests/fixtures/participants-perf.spec.ts` | Created | 8 fixture sanity tests |
| `tests/benchmark/perf-bench.bench.ts` | Created | Vitest bench suites (3 benchmarks × 3 fixtures) |
| `tests/benchmark/perf-runner.ts` | Created | Playwright Tier 2 stub |
| `package.json` | Modified | Added `bench` + `bench:browser` scripts |
| `vitest.config.ts` | Modified | Added `tests/fixtures/*.spec.ts` to unit include |
| `openspec/changes/project-health-sweep/notes/m7-benchmark.md` | Created | Baseline + after + gap analysis |
| `hooks/useIndicatorBoards.ts` | Modified | Extracted `computeBoardData` with active-slice gating |
| `contexts/IndicadoresFiltersContext.tsx` | Modified | Route-to-board mapping with `useLocation` |
| `hooks/useIndicatorBoards.spec.ts` | Modified | Added 5 active-slice tests |
| `hooks/useMapStats.ts` | Modified | Single-pass map aggregation |
| `hooks/useMapStats.spec.ts` | Modified | Added 7 correctness tests |
| `openspec/changes/project-health-sweep/tasks.md` | Modified | All 13 tasks marked complete |

---

## Benchmark Results

| Metric | Budget | Pre (ms) | Post (ms) | Δ% |
|--------|-------:|---------:|----------:|:--:|
| computeBoardData(all) 67k | — | 103.4 | 105.2 | +1.8% |
| computeBoardData(demo) 67k | — | 104.8 | 103.4 | −1.3% |
| locationStats 67k | — | 0.73 | 0.80 | +9.6% |
| Long tasks >50ms | 0 | ❌ | ❌ | — |

---

## Budget Gap

- **computeBoardData 67k: 105ms** — exceeds 50ms budget
- Per-record loop dominates (98ms of 105ms)
- Active-slice gating saves ~2ms (derived-data phase only)
- **Fix**: Worker scheduling (M11) to move aggregation off main thread
- requestIdleCallback not applicable: cannot interrupt synchronous `for` loop

---

## Deviations from Design

1. **Bench file extension**: Used `.bench.ts` instead of `.spec.ts` — vitest bench requires `.bench.ts` extension for automatic discovery.
2. **computeIndicators benchmark**: Not included in bench suite. The `useIndicators.ts` (1087 lines) wraps everything in a `useMemo` that requires React reconciler. Pure computation extraction would require modifying the file (out of scope). Benchmarked locationStats as a representative data-path metric instead.
3. **requestIdleCallback not implemented**: The design's conditional step (task 5.4) is skipped because the heaviest slice (per-record for loop) cannot be split across idle callbacks. Documented Worker scheduling (M11) as the correct fix.
4. **`activeBoard === null`**: Routes not in the board map default to `undefined` (which triggers `'all'` behavior) instead of `null`/skip. Preserves backward compatibility without type changes to the context interface.

---

## Verification Gates

| Gate | Result |
|------|--------|
| `npm run test` | ✅ 139 passed |
| `npm run typecheck` | ✅ 0 errors |
| `npm run build` | ✅ Built in 1.28s |
| `npm run bench` | ✅ All benchmarks complete |

---

## Remaining Work

- **M11 (Worker scheduling)**: Move per-record loop to a Web Worker to achieve <50ms main-thread budget
- **Full `useIndicators.ts` baseline**: Benchmark the 65-indicator computation on 67k records
- **Tier 2 browser benchmarks**: Implement Playwright script to capture commit-to-paint, long tasks, heap

## Status

**13/13 tasks complete. Ready for verify.**
