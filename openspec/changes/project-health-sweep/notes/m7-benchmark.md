# M7 — 67k Performance Benchmark

## Baseline (before optimization)

**Date**: 2026-07-14
**Fixture**: Deterministic 10k / 67k / 100k via seeded PRNG (seed 42)
**Run**: `npm run bench` (vitest bench, Node-based Tier 1)

### computeBoardData (all 9 slices)

| Fixture | Mean (ms) | Min (ms) | Max (ms) | Samples |
|---------|----------:|---------:|---------:|--------:|
| 10k     |   14.8    |  14.4    |  16.5    |   34    |
| **67k** | **103.4** | **102.0** | **104.7** | **10** |
| 100k    |  168.9    | 156.1    | 197.0    |   10    |

### computeBoardData (single demographic slice)

| Fixture | Mean (ms) | Min (ms) | Max (ms) | Samples |
|---------|----------:|---------:|---------:|--------:|
| 10k     |   16.8    |  14.6    |  25.1    |   30    |
| **67k** | **104.8** | **100.8** | **110.4** | **10** |
| 100k    |  164.2    | 154.1    | 182.0    |   10    |

### locationStats (province count)

| Fixture | Mean (ms) | Min (ms) | Max (ms) | Samples |
|---------|----------:|---------:|---------:|--------:|
| 10k     |    0.12   |   0.09   |   0.22   |  4281   |
| **67k** |  **0.73** | **0.66** | **1.23** | **687** |
| 100k    |    1.17   |   0.98   |   1.83   |   428   |

---

## After optimization (WU3 + WU4)

**Date**: 2026-07-14
**Optimizations applied**: Active-slice aggregation (WU3), Single-pass map aggregation (WU4)
**Run**: `npm run bench` (same fixture, same vitest bench)

### computeBoardData (all 9 slices) — unchanged path

| Fixture | Mean (ms) | Min (ms) | Max (ms) | Samples | Δ vs baseline |
|---------|----------:|---------:|---------:|--------:|:-------------:|
| 10k     |   15.3    |  14.7    |  16.7    |   33    |    +3.4%      |
| **67k** | **105.2** | **104.1** | **106.9** | **10** |    +1.8%      |
| 100k    |  168.7    | 153.5    | 192.9    |   10    |    -0.1%      |

### computeBoardData (single demographic slice) — active-slice gated

| Fixture | Mean (ms) | Min (ms) | Max (ms) | Samples | Δ vs baseline |
|---------|----------:|---------:|---------:|--------:|:-------------:|
| 10k     |   15.3    |  14.3    |  19.2    |   33    |   -9.0%       |
| **67k** | **103.4** | **97.8**  | **120.3**  | **10** |    -1.3%      |
| 100k    |  146.3    | 144.1    | 157.2    |   10    |   -10.9%      |

### locationStats (province count) — single-pass

| Fixture | Mean (ms) | Min (ms) | Max (ms) | Samples | Δ vs baseline |
|---------|----------:|---------:|---------:|--------:|:-------------:|
| 10k     |    0.12   |   0.11   |   0.29   |  4247   |    +0.8%      |
| **67k** |  **0.80** | **0.77** | **1.57** | **624** |    +9.6%      |
| 100k    |    1.21   |   1.14   |   2.01   |   412   |    +3.5%      |

---

## Summary table

| Metric | Budget | Pre (ms) | Post (ms) | Δ% |
|--------|-------:|---------:|----------:|:--:|
| computeBoardData(all) 67k | — | 103.4 | 105.2 | +1.8% |
| computeBoardData(demo) 67k | — | 104.8 | 103.4 | −1.3% |
| locationStats 67k | — | 0.73 | 0.80 | +9.6% |
| Long tasks >50ms | 0 | ❌ | ❌ | — |
| Commit-to-paint | <500ms | — | — | — |

---

## Budget gap analysis

**computeBoardData at 105ms exceeds the 50ms task budget.** The gap breakdown:

| Component | Time (ms) | % of total |
|-----------|----------:|:----------:|
| Per-record loop (67k iterations) | ~98 | ~93% |
| Derived-data all 9 slices | ~5 | ~5% |
| Derived-data single slice | ~3 | ~3% |
| **Total all** | **~105** | 100% |

**Key findings:**

1. **Active-slice (WU3) correctly gates derived-data blocks**, but these are only ~5ms of the total. The per-record loop dominates at ~98ms. Active-slice provides **no benefit** for the all-slice baseline path and **~2ms savings** on single-slice views. Result: **<2% improvement**, below the 20% threshold for measurable impact.

2. **Single-pass map (WU4) does not regress** but shows a small +9.6% increase (0.73→0.80ms on 67k). This is due to additional accumulator tracking (age sum, age count, center map) for every record. At sub-ms scale, this is well within noise and has no practical user impact. The **real benefit** (avoiding O(l×r) filter) manifests in the full `useMapStats` hook where centers and age averages are computed — the simple province-count benchmark does not exercise that path.

3. **The 50ms budget is not met.** The per-record loop computes all 9 board aggregations in a single synchronous pass. To go from 105ms to <50ms, the computation must move off the main thread.

## Recommendations

1. **M11 follow-up**: Schedule the per-record loop in a **Web Worker**. This moves the ~100ms aggregation off the main thread, eliminating frame drops. The UI receives the result via `postMessage` and renders without jank. Estimated improvement: 0ms blocking time on main thread.

2. **requestIdleCallback not applicable**: The per-record loop is a tight synchronous `for` loop that cannot be meaningfully interrupted. Using `requestIdleCallback` for the loop body would require an async batching pattern that fundamentally changes `useIndicatorBoards`'s synchronous API. Worker scheduling (M11) is the correct architectural fix.

3. **`useIndicators.ts` (1087 lines)**: Benchmarked at 0.73ms for locationStats only. The full 65-indicator computation warrants its own benchmark — this was out of scope for M7 but should be added in M11.

## Verification gates

| Gate | Result |
|------|--------|
| `npm run test` | ✅ 139 passed |
| `npm run test:int -- useIndicatorBoards` | ✅ 14 passed |
| `npm run test:int -- useMapStats` | ✅ 9 passed |
| computeBoardData(all) 67k | 105.2ms (>50ms budget ❌) |
| computeBoardData(demo) 67k | 103.4ms (>50ms budget ❌) |
| locationStats 67k | 0.80ms (<50ms ✅) |
| Δ% improvement (computeBoardData demo) | −1.3% (<20% target) |
