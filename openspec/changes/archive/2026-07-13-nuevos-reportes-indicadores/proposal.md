# Proposal: Nuevos Reportes e Indicadores

## Intent

Add 4 indicator boards to `/indicadores/*` for coverage gaps in existing 9 boards: centers without 14–17 participants, desertion ranking, daily intake tracking, "nd" field quality. All client-side over existing `dashboardData` — zero API changes.

## Scope

### In Scope
- **CentrosSinMenoresBoard**: Centers with zero 14–17yo participants. Table + KPI.
- **DesercionBoard**: Top 10 centers by desertion rate `(Retirados+Desertores+Bajas)/total`. General + per-province.
- **RegistroDiarioBoard**: Daily intake KPIs (hoy/semana/mes), 30-day timeline, center ranking.
- **CalidadNdBoard**: % "nd"/null per field. Ranking + province breakdown. Distinct from existing CalidadDatoBoard.

### Out of Scope
- **Req #5** (visual polish pass) — deferred to separate change
- Series-temporal desertion (needs `fechaRetiro` in API)
- API, data model, schema, or filter system changes

## Capabilities

> Contract between proposal and specs phases.

### New Capabilities
- `centros-sin-menores`: Board showing centers with zero participants aged 14–17
- `desercion-centros`: Board with top-10 desertion ranking (general + province)
- `registro-diario-fichas`: Board with daily intake KPIs, timeline, center ranking
- `calidad-dato-nd`: Board with "nd"/null field ranking and province breakdown

### Modified Capabilities
None — purely additive. No existing specs change.

## Approach

4 independent boards, each following the established pattern (see `DesempenoCentroBoard.tsx`):

1. File in `pages/indicadores/{Name}Board.tsx`
2. Consumer `useIndicadoresFilters()` for `filteredData`
3. `useMemo`-based metrics derivation
4. KPI cards (`grid-cols-1 md:grid-cols-2 lg:grid-cols-4`) + Recharts chart(s)
5. Route constant in `types/routes.ts`
6. Lazy import + route in `router.tsx`
7. Tab entry in `IndicadoresLayout.tsx` (`MORE_TABS` dropdown)

Boards are independent — implementable in any order.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `pages/indicadores/CentrosSinMenoresBoard.tsx` | New | Board 1 |
| `pages/indicadores/DesercionBoard.tsx` | New | Board 2 |
| `pages/indicadores/RegistroDiarioBoard.tsx` | New | Board 3 |
| `pages/indicadores/CalidadNdBoard.tsx` | New | Board 4 |
| `types/routes.ts` | Modified | +4 route constants |
| `router.tsx` | Modified | +4 lazy imports + child routes |
| `pages/IndicadoresLayout.tsx` | Modified | +4 tabs in `MORE_TABS` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Desertion is snapshot-only (no temporal) | Medium | Document limitation in UI; API team owns `fechaRetiro` |
| O(n) perf on full dataset | Low | `useMemo` + `useDeferredValue`; no re-render cascade |

## Rollback Plan

Remove the 4 files + revert `routes.ts`, `router.tsx`, `IndicadoresLayout.tsx`. Zero coupling — no rollback cascade across boards.

## Dependencies

- None. Pure client-side computation over existing `useIndicadoresFilters()`.

## Success Criteria

- [ ] Each board renders correct metrics matching explore.md algorithms
- [ ] Filters (provincia/año/municipio) apply correctly to each board's metrics
- [ ] Empty states show "Sin datos" when `filteredData` is empty
- [ ] `tsc --noEmit` passes with no new errors
- [ ] `npm run build` succeeds
