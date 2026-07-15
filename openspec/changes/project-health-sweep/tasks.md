# Tasks: M7 — 67k-Record Performance Budget (project-health-sweep)

## Review Workload Forecast

| Field | Value |
|---|---|
| Decision needed before apply | No |
| Chained PRs recommended | No |
| Chain strategy | stacked-to-main |
| 400-line budget risk | Low |
| Estimated changed lines (authored) | ~240 (fixtures ~130 excluded) |
| PR count | 1 |

### Rationale

M7 fits in a single PR. Benchmark fixtures are excluded from the 400-line budget per proposal rules (~130 lines). Authored changes (benchmark scripts, hook modifications, map optimization) total ~240 lines, well under the limit.

### Work Units

| Unit | Goal | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|
| 1 | Deterministic 67k fixture generator | `npm run test -- participants-perf` | `npm run build:ci` | `tests/fixtures/participants-perf.ts` |
| 2 | Benchmark baseline | `npm run bench` | `npm run build:ci` | `tests/benchmark/`, `notes/m7-benchmark.md` |
| 3 | Active-slice aggregation | `npm run test -- useIndicatorBoards` | `npm run build:ci` | `hooks/useIndicatorBoards.ts`, `contexts/IndicadoresFiltersContext.tsx` |
| 4 | Map aggregation one-pass | `npm run test -- useMapStats` | `npm run build:ci` | `hooks/useMapStats.ts` |
| 5 | Re-measure and consolidate | `npm run bench` | `npm run build:ci` | `notes/m7-benchmark.md` |

## Phase 1: Benchmark Foundation

### WU1 — Benchmark test fixture harness

- [x] 1.1 Create `tests/fixtures/participants-perf.ts` with a seeded PRNG (mulberry32).
- [x] 1.2 Define distribution pools: 32 province names, 3 municipalities per province, 12 center names, age-ranges 14-17/18-20/21-24/25+, sexes `M`/`F`, statuses `Activo`/`Egresado`/`Identificado`.
- [x] 1.3 Export `perfFixture10k(seed?)`, `perfFixture67k(seed?)`, `perfFixture100k(seed?)` — each returns `Participant[]`.
- [x] 1.4 Added tests: count (10k/67k/100k), determinism, distribution, field presence.

### WU2 — Run benchmark

- [x] 2.1 Create `tests/benchmark/perf-bench.bench.ts` with vitest bench suites:
  - `computeBoardData(all)` — 67k all-slices time
  - `computeBoardData(demographic)` — 67k single-slice time
  - `locationStats(province)` — 67k map aggregation time
  - Same for 10k and 100k fixtures for reference
- [x] 2.2 Create `tests/benchmark/perf-runner.ts` (Playwright, tier 2 stub).
- [x] 2.3 Add `"bench": "vitest bench"` and `"bench:browser"` to `package.json`.
- [x] 2.4 Create `openspec/changes/project-health-sweep/notes/m7-benchmark.md` with baseline + after tables.
- [x] 2.5 Run `npm run bench` — captured baseline (103ms 67k). All benchmarks complete.

## Phase 2: Optimization

### WU3 — Active-slice aggregation

- [x] 3.1 In `hooks/useIndicatorBoards.ts`:
  - Added `export type BoardCategory`.
  - Extracted `export function computeBoardData(data, activeBoard)`.
  - `useIndicatorBoards` now calls `computeBoardData`.
  - `needs('demographic')` etc. gates each derived-data block.
- [x] 3.2 In `IndicadoresFiltersContext.tsx`:
  - Imported `useLocation` from `react-router-dom`.
  - Added `routeBoardMap` with `BoardCategory` route mapping.
  - Derived `activeBoard` from `location.pathname`.
  - Passed `activeBoard` to `useIndicatorBoards`.
- [x] 3.3 Added 5 tests in `useIndicatorBoards.spec.ts`:
  - `computeBoardData(data, 'all')` populates all slices.
  - `computeBoardData(data, 'demographic')` only populates demographic.
  - `computeBoardData(data, 'territorial')` only populates territorial.
  - Matches `useIndicatorBoards` output.
- [x] 3.4 Ran `npm run test` — 139 passed (14 useIndicatorBoards).

### WU4 — Map aggregation one-pass

- [x] 4.1 In `hooks/useMapStats.ts`: merged center/age accumulators into first pass.
- [x] 4.2 Replaced second loop: post-process computes avg, topCenters from accumulators.
- [x] 4.3 Added 7 correctness tests in `useMapStats.spec.ts` (topCenters, age ranges, determinism, empty, null centro).
- [x] 4.4 Ran `npm run test` — 139 passed (9 useMapStats).

## Phase 3: Consolidation

### WU5 — Re-measure and consolidate

- [x] 5.1 Re-ran `npm run bench` with optimized code.
- [x] 5.2 Compared pre/post values. Updated `notes/m7-benchmark.md` with both columns and gap analysis.
- [x] 5.3 Gate check: computeBoardData 67k = 105ms (>50ms). The heaviest slice is the per-record loop (~98ms), which is a tight synchronous for loop. requestIdleCallback is not applicable — it cannot interrupt a running `for` loop. Moved per-record loop to a Worker is the correct arch fix (M11).
- [x] 5.4 Skipped: requestIdleCallback cannot meaningfully split a tight synchronous for loop. Documented remaining gap in benchmark notes with Worker scheduling recommendation (M11).

## Out of Scope

- No auth changes (`AuthContext`, `ProtectedRoute`, `constants.ts`).
- No formula corrections (`useIndicators.ts` indicator values or formulas).
- No normalization changes (`dataUtils.ts`, `normalize.ts`).
- No visual changes: charts, statsCards, boards, modals.
- No exporter changes.
- No sync or persistence changes.
- No a11y changes.
- No `.env` access.
- No Worker implementation (only `requestIdleCallback` if WU5 gate fails).
- No `useIndicators.ts` refactor (1,087 lines) — benchmark only; optimization deferred to follow-up if budget fails.

## Risk Register

| Risk | Mitigation |
|---|---|
| `vitest bench` not available in installed vitest version | Check `vitest --help`; fall back to `performance.now()` in a `describe/it` block with multiple iterations |
| Playwright install fails in CI | Tier 2 is informational; tier 1 (vitest bench) is the actionable gate |
| `computeBoardData` extraction changes semantics | Default `'all'` preserves current behavior; already passes existing tests |
| Map one-pass changes age average precision | Correctness gate: pre/post deep-equal on 10k fixture |
| Active-slice does not measurably improve 67k time | The per-record loop is already efficient; derived-data savings may be marginal. Document and accept if <20% improvement — map optimization (WU4) is the primary win |
