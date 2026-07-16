# Tasks: Modo Comparativo

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~340–440 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Hook + Chart component + Page + Router | Single PR | `npx vitest run --reporter=verbose` (any unit tests) | Load `/comparativo` with real data in browser | Revert `router.tsx`, delete `hooks/useComparativo.ts`, `components/ComparativoCharts.tsx`, `pages/Comparativo.tsx` |

## Phase 1: Core Logic

- [x] 1.1 Create `hooks/useComparativo.ts` — wraps `useFilterWorker` twice (A/B), exposes `{ dataA, dataB, statsA, statsB, diffs }`. Stats via `useMemo`: total, gender split, avg age, desertion rate (`estado === 'DESERTADO'`), active count, unique centers. Deltas computed as `(a - b) / b` with `B === 0 ? null` guard. Reads `dashboardData` from `useParticipantStore`.
- [x] 1.2 Guard deltas — return `null` when divisor is 0, render as `'N/A'` in UI. Avoid `Infinity` on percentage calc.

## Phase 2: UI Components

- [x] 2.1 Create `components/ComparativoCharts.tsx` — receives `dataA`/`dataB`, renders two-column grid reusing `<GenderChart>`, `<AgeChart>`, `<StatusChart>`. Left column shows data A, right column data B. `showLabels` set to `false` for compact layout.
- [x] 2.2 Add `COMPARATIVO` to `types/routes.ts` (`/comparativo`, roles: all). Add `Comparativo` icon import in `components/Sidebar.tsx`, include it in `MAIN_NAV_ITEMS`.

## Phase 3: Page + Route

- [x] 3.1 Create `pages/Comparativo.tsx` — top selector row with two `<select>` columns side-by-side (dimension: provincia/año/centro, plus value picker). Below: two-column KPI grid with A value, B value, and colored % delta. Below: two-column chart grid via `<ComparativoCharts>`. Empty state when `dashboardData` is empty.
- [x] 3.2 Add lazy import + route in `router.tsx` under `ProtectedRoute` at path `comparativo`.

## Phase 4: Verification

- [ ] 4.1 Verify `/comparativo` renders with data loaded. Select different provincia A vs B, confirm KPI values change and deltas appear correct.
- [ ] 4.2 Verify empty state renders message when no data is loaded. Verify zero-division case shows `'N/A'` instead of `Infinity`.
