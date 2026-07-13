# Tasks: Nuevos Reportes e Indicadores

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~700 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 Foundation → PR 2 → PR 3 → PR 4 → PR 5 (each board) |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Foundation (routes, router, layout) | PR 1 | `npx tsc --noEmit` | `npm run dev` → /indicadores | revert 3 foundation files |
| 2 | CentrosSinMenoresBoard | PR 2 | `npx tsc --noEmit` | `npm run dev` → /indicadores/centros-sin-menores | delete file + revert PR1 route |
| 3 | DesercionBoard | PR 3 | `npx tsc --noEmit` | `npm run dev` → /indicadores/desercion | delete file + revert PR1 route |
| 4 | RegistroDiarioBoard | PR 4 | `npx tsc --noEmit` | `npm run dev` → /indicadores/registro-diario | delete file + revert PR1 route |
| 5 | CalidadNdBoard | PR 5 | `npx tsc --noEmit` | `npm run dev` → /indicadores/calidad-nd | delete file + revert PR1 route |

**Note**: Spec and design disagree on CalidadNdBoard field count (spec: 13–15, design: 9). Apply phase to reconcile against actual `Participant` type fields.

## Phase 1: Foundation

- [x] 1.1 Add 4 route constants to `types/routes.ts`: `INDICADORES_CENTROS_SIN_MENORES`, `INDICADORES_DESERCION`, `INDICADORES_REGISTRO_DIARIO`, `INDICADORES_CALIDAD_ND` + permission entries
- [x] 1.2 Add 4 lazy imports + child routes in `router.tsx` under `/indicadores` with Suspense wrappers
- [x] 1.3 Add 4 tab entries (`Users`, `TrendingDown`, `CalendarDays`, `FileWarning`) to `MORE_TABS` in `IndicadoresLayout.tsx`

## Phase 2: CentrosSinMenoresBoard

- [x] 2.1 Create `pages/indicadores/CentrosSinMenoresBoard.tsx`: filter centros without 14–17yo via `useMemo` over `filteredData`, collect unique centros, diff against all centros → set with zero minors
- [x] 2.2 Add 4 KPI cards (Total centros, Centros sin cobertura, % sin cobertura, Total 14–17) + table sorted by total desc
- [x] 2.3 Empty state "Sin datos" when no centers match

## Phase 3: DesercionBoard

- [x] 3.1 Create `pages/indicadores/DesercionBoard.tsx`: compute per-center rate `(Retirados+Desertores+Bajas)/total*100` via `useMemo`; sort desc → top 10
- [x] 3.2 Add `viewMode` toggle `general | provincia`; in provincia mode filter by selected province
- [x] 3.3 Add 4 KPI cards (Tasa general, Centro mayor deserción, Total desertores, Centros analizados)
- [x] 3.4 Add horizontal BarChart (top 10) + ranking table (#, Centro, Total, Desertores, Tasa %)

## Phase 4: RegistroDiarioBoard

- [x] 4.1 Create `pages/indicadores/RegistroDiarioBoard.tsx`: group by `fechaRegistro` via `useMemo`; compute hoy/semana/mes counts from client date, 30-day timeline, center ranking
- [x] 4.2 Add 4 KPI cards (Fichas hoy, Esta semana +% vs anterior, Este mes, Promedio diario 30d)
- [x] 4.3 Add line/bar chart for 30-day timeline with 7-day moving average
- [x] 4.4 Add center ranking table by total registrations

## Phase 5: CalidadNdBoard

- [x] 5.1 Create `pages/indicadores/CalidadNdBoard.tsx`: local `hasNdValue()` helper; scan declared fields per participant via `useMemo`
- [x] 5.2 Add 4 KPI cards (% General ND, Peor campo, Campos >50% ND, Total registros)
- [x] 5.3 Add horizontal BarChart with color gradient (red >50% → green <10%) + ranking table (Campo, % ND, Count ND, Total)
- [x] 5.4 Add province breakdown showing ND % per province for the worst field
