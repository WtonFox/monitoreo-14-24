# Design: Indicator Detailed Boards

## Technical Approach

Evolve the flat `/indicadores` page into nested routes with tab navigation and per-category dashboard boards. Phase 1 adds the layout shell + data hook; phases 2–5 add each board independently. Existing summary page stays as the index route.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|-------------|-----------|
| Routing | `HashRouter` children under `/indicadores/*` | Flat routes + conditional rendering | Matches existing HashRouter setup; URL-driven tabs are bookmarkable and survive refresh |
| Auth guard | `ProtectedRoute` wraps `IndicadoresLayout` | Guard each child individually | Single guard point; children inherit protection implicitly |
| State per board | `useState` local filters | `useReducer`, global `FiltersContext` | Simple enough (year, province, sex); no cross-board state sharing needed |
| Data hook | `useIndicatorBoards` — dedicated hook | Reuse `useIndicators` | Boards need chart-ready arrays, not indicator tiles. Single-pass loops + `useMemo` |
| Lazy loading | `React.lazy` per board component | Eager import | 4 boards * 50KB each = 200KB+ upfront; lazy keeps initial bundle lean |
| Tab styling | `NavLink` `className` callback + Tailwind | External tab library | Zero dependencies; matches Sidebar pattern exactly |

## Data Flow

```
DashboardContext (dashboardData: Participant[])
    │
    ├── Indicadores (index) → useIndicators → IndicatorsBoard (unchanged)
    │
    └── IndicadoresLayout (tabs + <Outlet />)
            ├── demograficos → DemograficosBoard → useIndicatorBoards(data) → demographicData
            ├── territoriales → TerritorialesBoard → useIndicatorBoards(data) → territorialData
            ├── programa → ProgramaBoard → useIndicatorBoards(data) → programData
            └── sociales → SocialesBoard → useIndicatorBoards(data) → socialData
```

Each board calls `useDashboard()` for `dashboardData`, passes it to `useIndicatorBoards`, and destructures its slice. Filters are local `useState` — they slice the `useIndicatorBoards` output further (or the hook accepts filter params).

## Routing Structure

```tsx
// router.tsx — convert indicadores to children layout
{
  path: 'indicadores',
  element: <ProtectedRoute><IndicadoresLayout /></ProtectedRoute>,
  children: [
    { index: true, element: <Indicadores /> },
    { path: 'demograficos', element: <DemograficosBoard /> },
    { path: 'territoriales', element: <TerritorialesBoard /> },
    { path: 'programa', element: <ProgramaBoard /> },
    { path: 'sociales', element: <SocialesBoard /> },
  ],
}
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `pages/IndicadoresLayout.tsx` | Create | Tab nav + `<Outlet />` layout shell |
| `hooks/useIndicatorBoards.ts` | Create | Returns chart-ready `BoardData` via single-pass `useMemo` |
| `router.tsx` | Modify | Replace flat `/indicadores` route with children layout |
| `types/routes.ts` | Modify | Add `INDICADORES_DEMOGRAFICOS`, `INDICADORES_TERRITORIALES`, etc. |
| `pages/indicadores/DemograficosBoard.tsx` | Create | Age, gender, marital status charts |
| `pages/indicadores/TerritorialesBoard.tsx` | Create | Municipio, centro, curso charts |
| `pages/indicadores/ProgramaBoard.tsx` | Create | Status, active/graduated breakdown |
| `pages/indicadores/SocialesBoard.tsx` | Create | Completeness, gender/age by centro/curso |

## useIndicatorBoards Hook

```typescript
// Single-pass aggregation returning chart-ready arrays (Recharts-compatible)
interface BoardData {
  demographicData: { /* total, women, men, pcts, ageBuckets, maritalStatus, genderAgeCross */ };
  territorialData: { /* topMunicipios, topCentros, topCursos, genderByMunicipio */ };
  programData: { /* statusDistribution, activeVsGraduatedByCentro/Municipio */ };
  socialData: { /* phoneCompleteness, addressCompleteness, genderByCentro/Curso, ageByCentro/Curso */ };
}
```

Each board destructures only its slice. The hook uses a single loop over `data` + `useMemo` — follows the `ChartsSection.tsx` pattern exactly.

## Board Layout Pattern

Every board follows the same structure, matching `ChartsSection.tsx` and `StatsCards.tsx`:

- Local filter bar: row of `<select>` inputs (year, province, sex — board-specific subset)
- KPI row: `grid-cols-2 lg:grid-cols-4` following `StatsCards` card pattern
- Charts grid: `grid-cols-1 lg:grid-cols-2 gap-6` with `bg-white p-6 rounded-xl shadow-sm border border-gray-100` cards
- Each chart: `useMemo` data derivation + `<ResponsiveContainer>` + Recharts component

## Component Tree (per board)

```
DemograficosBoard
├── LocalFilters (year, sex)
├── KpiCards (4: total, women%, men%, avgAge)
├── GenderPieChart (PieChart)
├── AgeBarChart (BarChart)
├── MaritalStatusPieChart (PieChart)
└── GenderAgeStackedBar (BarChart — stacked)
```

## Threat Matrix

N/A — no shell commands, subprocesses, VCS/PR automation, executable-file classification, or process integration. Routing is within HashRouter (client-side only, no server rewrite boundary).

## Migration

No migration. Boards consume existing `dashboardData` — no API changes, no data shape changes. Old `/indicadores` route is preserved as the index, so no redirects needed.

## Open Questions

- [ ] Confirm board-specific filter dimensions: year (derived from `fechaRegistro`?), province (from `provincia` field), sex (from `sexo` field)

## Testing Strategy

| Layer | What | How |
|-------|------|-----|
| Unit | `useIndicatorBoards` aggregation | Mock `Participant[]`, assert shape and accuracy of each slice |
| Component | Board renders with/without data | Render with empty array, with sample data — check chart presence |
| E2E | Tab navigation + route access | Verify `/indicadores/demograficos` renders board + tab active state |
