# Tasks: Top Indicators Improvements

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~60 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | auto-forecast |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

## Phase 1: Foundation — Type System

- [x] 1.1 Add `topCount?: number` to `Indicator` interface in `hooks/useIndicators.ts`

## Phase 2: Computation — Top-N value changes

- [x] 2.1 In `utils/indicator-computations.ts`, add `topCount: 10` to indicator objects with IDs 11, 12, 15, 16, 17, 18, 61
- [x] 2.2 Pass `n=10` to `buildTopItems(record, total, 10)` and `calcResto(record, 10)` for those 7 IDs

## Phase 3: Presentation — Conditional UI

- [x] 3.1 `components/IndicatorModal.tsx`: guard value block (L97-111) behind `!indicator.topItems?.length`; change "Top 5" header to `Top ${indicator.topCount ?? 5}`
- [x] 3.2 `components/indicator-modal/OverviewTab.tsx`: filter out "Top Municipios" (IDs 11,12), "Top Centros" (15,16), and "Top Cursos" (17,18) sections when indicator ID matches
- [x] 3.3 `components/indicator-modal/DetailTab.tsx`: filter out "Discapacidades" (ID 44) and "Enfermedades" (ID 46) from Top listas sections when indicator ID matches
- [x] 3.4 `components/indicator-modal/TrendTab.tsx`: hide "Top centros" section when `indicator.id === 61`

## Phase 4: Verification

- [x] 4.1 Run `tsc --noEmit` to verify TypeScript strict mode passes
- [x] 4.2 Verify modal shows "Top 10" header and 10 rows for IDs 11,12,15,16,17,18,61
- [x] 4.3 Verify all suppressed sections do not appear for matching indicator IDs
- [x] 4.4 Verify non-target indicators still show "Top 5" and all sections normally
