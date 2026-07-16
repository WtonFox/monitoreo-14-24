# Proposal: Modo Comparativo

## Intent

Allow users to compare two participant datasets side-by-side — province A vs B, year A vs B, or center A vs B — with dual KPI cards and mirrored charts showing percentage differences.

## Scope

### In Scope
- `pages/Comparativo.tsx` — new page with dual selectors (A/B), side-by-side KPIs, mirrored charts
- `router.tsx` — add route `/comparativo`
- `hooks/useComparativo.ts` — manages two independent filter configs + computed stats for each side
- `components/ComparativoCharts.tsx` — reuses `GenderChart`, `AgeChart`, `StatusChart` for dual-column display
- KPIs: total participants, gender split %, average age, desertion rate, active count, centers count
- Charts: gender (pie), age distribution (bar), status comparison (bar) side-by-side
- Percentage delta shown on each KPI

### Out of Scope
- Map comparison (province heatmap overlay)
- Export comparative report to PDF
- More than 2 datasets compared simultaneously
- Historical trend comparison (>2 periods)

## Capabilities

### New Capabilities
- `modo-comparativo`: Dual-dataset selection, side-by-side KPI rendering with deltas, mirrored chart comparison using reusable chart components

### Modified Capabilities
- None

## Approach

1. **`hooks/useComparativo.ts`** — wraps `useFilterWorker` twice (A and B). Exposes `{ dataA, dataB, statsA, statsB, diffs }`. Stats computed via `useMemo` from each filtered set.
2. **`pages/Comparativo.tsx`** — reads `dashboardData` from `useParticipantStore`. Renders a top selector row (two `<select>` columns for province/centro/year). Below: two-column grid of KPI cards, then two-column grid of charts.
3. **`components/ComparativoCharts.tsx`** — receives `dataA`/`dataB`, renders mirrored `GenderChart`, `AgeChart`, `StatusChart` side-by-side using the existing chart component props.
4. **`router.tsx`** — adds lazy-loaded route under `ProtectedRoute`.
5. **KPI computation** — inline `useMemo` for each side: total, gender split, avg age, desertion rate (estado === 'DESERTADO'), active count, unique centers count.
6. **Delta display** — each KPI card shows A value, B value, and % difference with color coding (green/red).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `pages/Comparativo.tsx` | New | Main comparison page |
| `router.tsx` | Modified | Add route `/comparativo` (lazy import) |
| `hooks/useComparativo.ts` | New | Dual-filter + stats hook |
| `components/ComparativoCharts.tsx` | New | Dual-column chart layout |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Dual filter worker creates 2x computational load | Low | Workers run in parallel; filterWorker is already async |
| Percentage delta yields Infinity on zero | Low | Guard with `B === 0 ? 'N/A'` |
| Large side-by-side chart rendering | Low | Recharts handles gracefully; test with 10K+ per side |

## Rollback Plan

Revert `router.tsx` changes. Remove `pages/Comparativo.tsx`, `hooks/useComparativo.ts`, `components/ComparativoCharts.tsx`. One commit, one file removal.

## Dependencies

- `useFilterWorker` (already exists)
- Chart components `GenderChart`, `AgeChart`, `StatusChart` (already exist)
- `useParticipantStore` (already exists)

## Success Criteria

- [ ] Route `/comparativo` renders full page with two selectors
- [ ] Selecting province A vs B shows different KPI values
- [ ] Percentage delta is visible and correct on each KPI
- [ ] Gender, age, and status charts render side-by-side
- [ ] Empty state shows helpful message when no data loaded
- [ ] Works with existing data in `dashboardData`
