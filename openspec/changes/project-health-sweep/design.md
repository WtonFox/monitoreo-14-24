# Design: M7 — 67k-Record Performance Budget + Active-Slice Aggregation

## What and why

H5 (exploration.md:62-67) identifies that the 67k-record responsiveness requirement has no benchmark proof and no optimization implementation. Three hotspots exist: all 9 board slices compute on every tab, `useMapStats` re-filters data per location (O(l × r)), and total overview aggregation is unmeasured. R-perf-1 through R-perf-5 (spec) define the budget: no task >50ms, commit-to-paint <500ms.

M7 is **benchmark-first**: WU1+WU2 measure the production build, then WU3+WU4 optimize only measured hotspots, then WU5 re-measures. No optimization is applied blind.

| PR | Work Units | Core Δ | Fixtures | Total (est.) |
|:---|---:|---:|---:|---:|
| **M7** — single PR | WU1+WU2+WU3+WU4+WU5 | ~240 | ~130 (excluded) | ~370 |

Fits under the 400-line authored budget in a single PR. Fixtures are excluded per proposal rules.

## Work Units

### WU1 — Benchmark test fixture harness

**File**: `tests/fixtures/participants-perf.ts` (new)

Deterministic 67k generator using a seeded PRNG (mulberry32) so same seed → identical data across runs. Distributes records across provinces (32), municipalities, centers (12), age ranges (14-17, 18-20, 21-24, 25+), sexes (M, F), and statuses.

| Export | Count | Purpose |
|---|---|---|
| `perfFixture10k(seed?: number)` | 10,000 | Smoke / sanity |
| `perfFixture67k(seed?: number)` | 67,000 | Primary budget target |
| `perfFixture100k(seed?: number)` | 100,000 | Stress / headroom |

Each record is structurally valid with controlled distribution. Edge cases (missing/corrupt) are M4's domain.

### WU2 — Run benchmark

**Files**: `tests/benchmark/perf-bench.spec.ts` (new), `openspec/changes/project-health-sweep/notes/m7-benchmark.md` (new)

Two-tier approach:

| Tier | Tool | What it measures | Runs in CI |
|:---|---|---|:---:|
| 1 — Computation | `vitest bench` | Hook-level execution time (useIndicatorBoards, useMapStats, useIndicators) | Yes |
| 2 — Full browser | Playwright script | Commit-to-paint, long tasks, heap memory | Optional |

**Tier 1** extracts the pure computation from each hook and benchmarks it directly via `vitest bench`. Uses the deterministic fixtures. Measures:

| Benchmark | What it reports |
|---|---|
| `computeBoardData(all)` | Time to compute all 9 slices |
| `computeBoardData(demographic)` | Time to compute 1 slice |
| `locationStats single-pass` | Current O(l×r) vs proposed O(r) |
| `computeIndicators` | Full 65-indicator computation |

**Tier 2** is a Playwright script (`tests/benchmark/perf-runner.ts`) that serves the production build and captures browser metrics via Performance API. Run on demand with `npm run bench:browser`.

Both tiers write results to `openspec/changes/project-health-sweep/notes/m7-benchmark.md` as a timestamped table. The initial run captures the **baseline** (before WU3/WU4).

### WU3 — Active-slice aggregation

**Files**: `hooks/useIndicatorBoards.ts`, `contexts/IndicadoresFiltersContext.tsx`

**What**: Extract the pure computation from `useIndicatorBoards` into `computeBoardData(data, activeBoard)`, then only compute derived data (sorted arrays, chart data, cross-references) for the active slice.

**Why**: The single-pass per-record loop (lines 196-336) is O(n) and cheap — the optimization targets the **derived data phase** (lines 338-560) which sorts, maps, and formats 9 sets of accumulation objects when only 1 is needed.

**How**:

1. Extract `computeBoardData(data, activeBoard): BoardData` — pure function, body of current `useMemo`.
2. `useIndicatorBoards` becomes a thin `useMemo(() => computeBoardData(data, activeBoard), [data, activeBoard])` wrapper.
3. Add route-to-slice mapping in `IndicadoresFiltersContext.tsx` using `useLocation().pathname`:

   | Route | activeBoard |
   |---|---|
   | `/indicadores` | `'all'` |
   | `/indicadores/demograficos` | `'demographic'` |
   | `/indicadores/territoriales` | `'territorial'` |
   | `/indicadores/programa` | `'program'` |
   | `/indicadores/sociales` | `'social'` |
   | `/indicadores/calidad-dato` | `'quality'` |
   | `/indicadores/vulnerabilidad` | `'vulnerability'` |
   | `/indicadores/cobertura-temporal` | `'temporal'` |
   | `/indicadores/nivel-educativo` | `'education'` |
   | `/indicadores/desempeno-centro` | `'center'` |
   | other | `undefined` (skip boardData entirely) |

4. In `computeBoardData`, skip derived-data blocks for non-active slices (the per-record loop always runs in full — it's O(n) with Record lookups). The check is a simple `if` guard per block.

**Existing tests**: `useIndicatorBoards.spec.ts` calls `useIndicatorBoards(data)` with 1 arg — continues to work (defaults to `'all'`). Add new tests that call `computeBoardData(data, 'demographic')` and assert only demographic fields are populated; assert others return zero/empty.

### WU4 — Map aggregation one-pass

**File**: `hooks/useMapStats.ts`

**Why**: Source comment at line 96-97 acknowledges the O(l × r) hotspot: `data.filter(p => pLoc === loc)` runs per location in a separate loop (lines 95-131). For 32 provinces × 67k records = ~2.1M filter checks that should be 67k.

**How**: Merge the second loop's work into the first loop (lines 55-92). The `stats[key]` accumulator already builds per-location totals — just add center and age accumulators:

```
During the first pass — add per-location:
  centerCount (if p.centro)
  edadSum (if p.edad > 0)
  edadCount (if p.edad > 0)
```

Then the second pass reduces to: `avg = edadSum / edadCount`, `topCenters = sort(slice(entries(centerCounts)))`. No `data.filter()`.

**Correctness gate**: R-perf-3 scenario 2 — pre-optimization and post-optimization results must match on the same 10k fixture.

### WU5 — Re-measure and consolidate

Re-run WU2 benchmarks against the WU3+WU4 production build. Compare pre/post:

| Metric | Budget | Pre | Post |
|---|---|---|---|
| computeBoardData(all) 67k | — | T1 | T2 |
| computeBoardData(single) 67k | — | T1 | T2 |
| locationStats 67k | — | T1 | T2 |
| Long tasks >50ms | 0 | — | — |
| Commit-to-paint | <500ms | — | — |

**Gate**: If all metrics within budget, done. If any aggregation exceeds 50ms, apply `requestIdleCallback` or Worker scheduling for the heaviest slice (R-perf-5). Update benchmark notes.

## Work Units as Commits

| Commit | WU | Rollback boundary |
|---|---|---|
| `feat(perf): add deterministic 67k fixture generator` | WU1 | `tests/fixtures/participants-perf.ts` |
| `feat(perf): add benchmark suite and baseline measurement` | WU2 | `tests/benchmark/`, `notes/m7-benchmark.md`, `package.json` |
| `perf: compute only the active board slice` | WU3 | `hooks/useIndicatorBoards.ts`, `contexts/IndicadoresFiltersContext.tsx` |
| `perf: replace O(l×r) map aggregation with single-pass` | WU4 | `hooks/useMapStats.ts` |
| `chore: re-benchmark and consolidate results` | WU5 | Update `notes/m7-benchmark.md` |

## Files touched

| File | WUs | Type |
|---|---|---|
| `tests/fixtures/participants-perf.ts` | WU1 | New |
| `tests/benchmark/perf-bench.spec.ts` | WU2 | New |
| `tests/benchmark/perf-runner.ts` | WU2 (tier 2) | New |
| `package.json` | WU2 | Add `bench` + `bench:browser` scripts |
| `openspec/changes/project-health-sweep/notes/m7-benchmark.md` | WU2, WU5 | New |
| `hooks/useIndicatorBoards.ts` | WU3 | Modify |
| `contexts/IndicadoresFiltersContext.tsx` | WU3 | Modify |
| `hooks/useMapStats.ts` | WU4 | Modify |

## Boundary rules — M7 does NOT touch

| Area | Reason |
|---|---|
| `AuthContext`, `ProtectedRoute`, `constants.ts` | Auth (M2) |
| `utils/dataUtils.ts`, `utils/normalize.ts` | Normalization (M4) |
| `hooks/useIndicators.ts` formula values | Formulas (M5) — benchmark only, no changes |
| Charts, statsCards, board renderers | Rendering — no visual changes |
| Exporter (`services/exporter.ts`, `utils/exportUtils.ts`) | Export (M8) |
| `hooks/useDashboardData.ts`, `services/database.ts` | Sync (M6) |
| `.env`, credentials | Security boundary |
| `pages/indicadores/RegistroDiarioBoard.tsx` | Independent aggregation |
| No React state changes — `useIndicatorBoards` stays pure | Correctness |

## M11 — Worker scheduling

### What and why

M7 benchmark (notes/m7-benchmark.md:92-96) proved the per-record loop in `computeBoardData` takes ~98ms of the ~105ms total. Active-slice gating saved only ~2ms because the per-record loop ALWAYS iterates all 67k records regardless of active board. Moving the entire `computeBoardData` call to a Web Worker eliminates the 98ms blocking time from the main thread.

### Architecture

```
┌─────────────────────────────────────────────────┐
│ Main Thread                                      │
│                                                   │
│  useIndicatorBoards                               │
│    └─ useBoardDataWorker                          │
│         ├─ typeof Worker === 'undefined'?         │
│         │   └─ computeBoardData(data)  ←  sync    │
│         │                                          │
│         └─ new Worker('...worker.ts')              │
│              ├─ postMessage({ data, activeBoard })  │
│              └─ onmessage → setBoardData(result)   │
│                                                    │
└──────────────────────────────┬────────────────────┘
                               │ postMessage
                               ▼
┌─────────────────────────────────────────────────┐
│ Worker Thread                                    │
│                                                   │
│  computeBoardData.worker.ts                       │
│    └─ onmessage → computeBoardData(data)          │
│         └─ postMessage(result)                    │
│                                                    │
└─────────────────────────────────────────────────┘
```

### File structure

- **`hooks/computeBoardData.ts`** — Pure function + all types + helpers (extracted from useIndicatorBoards.ts). No React, no Worker. Importable anywhere.
- **`workers/computeBoardData.worker.ts`** — Vite Worker entry. Imports `computeBoardData` from hooks/computeBoardData.ts. Handles postMessage protocol.
- **`hooks/useBoardDataWorker.ts`** — React hook. Creates Worker via `new Worker(new URL('../workers/computeBoardData.worker.ts', import.meta.url), { type: 'module' })`. Manages lifecycle, postMessage, onmessage, fallback.
- **`hooks/useIndicatorBoards.ts`** — Re-exports types. Delegates to `useBoardDataWorker`. Import consumers unchanged.

### Sequencing

1. Extract pure function → `hooks/computeBoardData.ts` (with types, helpers, empty slices)
2. Create Worker file → `workers/computeBoardData.worker.ts`
3. Create hook → `hooks/useBoardDataWorker.ts`
4. Update `hooks/useIndicatorBoards.ts` — use new hook, re-export types
5. Update tests — import `computeBoardData` from new location, test fallback
6. Verify: `npm run test`, `npm run typecheck`, `npm run build`

### Worker protocol

```typescript
// Main → Worker
type WorkerRequest = { data: Participant[], activeBoard: BoardCategory | 'all' };

// Worker → Main
type WorkerResponse = { data: BoardData } | { error: string };
```

### Fallback path

When Worker is unavailable:
- `typeof Worker === 'undefined'` → SSR/prerender/file://
- `new Worker(...)` throws → CSP restrictions, older browsers

The hook catches both and calls `computeBoardData(data, activeBoard)` synchronously, returning `{ data, loading: false, error: null }`.

### Existing tests

All existing tests import `computeBoardData` from `useIndicatorBoards.ts`. After refactor, re-export from there. Tests that use the hook (`useIndicatorBoards`) get the Worker path automatically in real browsers, but in jsdom/vitest, Worker is undefined so they naturally hit the fallback path — no test changes needed for existing tests.

New tests: verify fallback path directly by testing `useBoardDataWorker` with a stub Worker environment.

### Risk register

| Risk | L | Mitigation |
|------|---|-----------|
| Worker file not bundled correctly | Low | `npm run build` + check output for worker chunk |
| Worker termination on unmount | Low | `useEffect` cleanup terminates worker |
| postMessage transfer cost | Low | 67k Participant objects serialized → ~2-5ms extra. Acceptable tradeoff for removing 98ms main-thread block. |
| Tests fail because Worker is undefined in jsdom | Low | Fallback path covered; tests pass without real Worker. |

## Risk register

| Risk | L | Mitigation |
|---|---|---|
| Benchmark shows no issue at 67k (false negative) | Low | Realistic fixture distribution; if pass, document and move on. |
| Vitest bench not available in current vitest version | Low | Check `vitest bench` support; fall back to manual `performance.now()` timing in spec. |
| Active-slice refactor breaks existing consumers | Med | Default `'all'` preserves current behavior. TypeScript covers shape. |
| Map one-pass changes age average precision | Low | Correctness gate: pre/post must match on same 10k fixture. |
| Playwright as optional dep — tier 2 may not run | Low | Tier 1 (vitest bench) is the actionable gate. Tier 2 is informational. |
| `computeBoardData` extraction changes call patterns in tests | Low | Additive; existing `useIndicatorBoards(data)` calls still work unchanged. |

## Verification gate

| Gate | Expected |
|---|---|
| `npm run test:unit -- participants-perf` | Exit 0; fixture generator creates correct record count |
| `npm run bench` | Exit 0; outputs timing table |
| `npm run build:ci` | Exit 0 |
| `npm run typecheck` | Exit 0 |
| `npm run test -- useIndicatorBoards` | Exit 0 (M5 tests pass unchanged) |
| `npm run test -- useMapStats` | Exit 0 (correctness preserved) |
| `npm run test:integration -- useMapStats` | Map pre/post results match on 10k fixture |
| Benchmark improvement | Post-optimization metrics show measurable improvement (>=20% reduction in derived-data time) |
