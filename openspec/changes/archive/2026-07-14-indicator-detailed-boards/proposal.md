# Proposal: Indicator Detailed Boards

## Intent

Transform the 4 indicator categories (Demográficos, Territoriales, Estado del Programa, Sociales) from the existing flat `/indicadores` page into full Power-BI-style drill-down dashboards under `/indicadores/*` routes, with nested tab navigation and chart-rich data visualization.

## Scope

### In Scope
- Indicator layout with nested routing and tab navigation at `/indicadores/*`
- Structured data hook (`useIndicatorBoards`) for chart-ready data
- 4 full dashboard pages: Demographic, Territorial, Program, Social
- Responsive grid layout following existing ChartsSection patterns
- Filter by year + province + sex (board-specific, no month filter)

### Out of Scope
- Data tables (charts-only approach confirmed)
- Month-level filtering
- `/indicadores` redirect — stays as summary index
- RBAC or auth for indicator pages
- Backend API changes

## Capabilities

> This section is the CONTRACT between proposal and specs phases.

### New Capabilities
- `indicator-layout`: Nested routing + tabs navigation for `/indicadores/*` routes. Always-visible material-style tabs inside IndicadoresLayout shell.
- `indicator-boards-data`: Structured data hook (`useIndicatorBoards`) returning chart-ready datasets per board category.
- `demographic-board`: Full dashboard for demographic indicators (edad, estadoCivil, nivelEstudio distributions).
- `territorial-board`: Full dashboard for territorial/district indicators.
- `program-board`: Full dashboard for program status indicators.
- `social-board`: Full dashboard for social indicators (alergias, discapacidades, enfermedades, programasSociales).

### Modified Capabilities
None — no existing specs to delta against.

## Approach

Incremental 5-phase delivery (stacked PRs to main). Phase 1 merges first, then boards in any order:

1. **Foundation** — `IndicadoresLayout.tsx` (nested route shell + tabs), `useIndicatorBoards.ts` hook, update `router.tsx` and `routes.ts`. Old `/indicadores` still works as index.
2. **Demographic Board** — `DemographicBoard.tsx` with age, civil status, education level charts.
3. **Territorial Board** — `TerritorialBoard.tsx` with district/province charts.
4. **Program Board** — `ProgramBoard.tsx` with program status breakdowns.
5. **Social Board** — `SocialBoard.tsx` with social indicator charts.

Each board is a standalone page component using Recharts, local filter state (año + provincia + sexo), and data from `useIndicatorBoards`. Responsive grid: `grid-cols-1 lg:grid-cols-2`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `pages/Indicadores.tsx` | Modified | Refactored to layout shell + index content |
| `router.tsx` | Modified | Add nested routes under `/indicadores/*` |
| `routes.ts` | Modified | Add route path constants for boards |
| `components/Sidebar.tsx` | Optional | Update nav link target if needed |
| `pages/IndicadoresLayout.tsx` | New | Tabs + nested Outlet shell |
| `pages/DemographicBoard.tsx` | New | Demographic dashboard |
| `pages/TerritorialBoard.tsx` | New | Territorial dashboard |
| `pages/ProgramBoard.tsx` | New | Program status dashboard |
| `pages/SocialBoard.tsx` | New | Social indicators dashboard |
| `hooks/useIndicatorBoards.ts` | New | Structured data hook |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Chart perf with 10k+ records | Low | useMemo + memoized series; Recharts SVG is lightweight |
| Tab navigation state loss | Low | Persist active tab in URL params via route segment |
| Sidebar change breaks existing link | Low | Phase 1 handles routing; old `/indicadores` path preserved |

## Rollback Plan

- **Phase 1 revert**: Remove new route structure, restore old `Indicadores.tsx` — no data loss, no cascade.
- **Phases 2–5 revert**: Remove individual board components — fully independent, no cross-board coupling.
- Each phase is its own stacked PR → rollback is per-PR revert.

## Dependencies

- None external. Relies on existing Recharts + react-router-dom setup.

## Success Criteria

- [ ] `/indicadores/*` routes render the layout with category tabs
- [ ] `/indicadores` still shows summary index (no redirect)
- [ ] `useIndicatorBoards` returns structured, chart-ready data per board
- [ ] All 4 boards render charts filterable by año + provincia + sexo
- [ ] Responsive grid adapts from 1-col to 2-col on lg breakpoints
- [ ] Existing `/indicadores` functionality is preserved without regression
