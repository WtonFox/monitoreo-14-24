# Tasks: Indicator Detailed Boards

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1050 across 5 phases |
| 400-line budget risk | Low (each phase <400) |
| Chained PRs recommended | Yes |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Foundation: route types, layout, hook | PR 1 | `npx tsc --noEmit` | `npm run dev` → navigate /indicadores tabs | Revert PR 1 |
| 2 | Demográficos dashboard board | PR 2 | `npx tsc --noEmit` | `npm run dev` → /indicadores/demograficos | Revert PR 2 |
| 3 | Territoriales dashboard board | PR 3 | `npx tsc --noEmit` | `npm run dev` → /indicadores/territoriales | Revert PR 3 |
| 4 | Programa dashboard board | PR 4 | `npx tsc --noEmit` | `npm run dev` → /indicadores/programa | Revert PR 4 |
| 5 | Sociales dashboard board | PR 5 | `npx tsc --noEmit` | `npm run dev` → /indicadores/sociales | Revert PR 5 |

## Phase 1 — Foundation (~250 lines) ✅

- [x] 1.1 `types/routes.ts`: Add `INDICADORES_DEMOGRAFICOS`, `INDICADORES_TERRITORIALES`, `INDICADORES_PROGRAMA`, `INDICADORES_SOCIALES` route path constants
- [x] 1.2 `hooks/useIndicatorBoards.ts`: Create hook returning `BoardData` with 4 slices (demographic, territorial, program, social) via single-pass `useMemo` loops following design.md interface
- [x] 1.3 `pages/IndicadoresLayout.tsx`: Create layout with 5 NavLink tabs (Resumen, Demográficos, Territoriales, Programa, Sociales) + `<Outlet />` for child routes
- [x] 1.4 `router.tsx`: Convert `/indicadores` to nested layout route with lazy-loaded children (demograficos, territoriales, programa, sociales)

## Phase 2 — Demográficos Board (~200 lines)

- [x] 2.1 `pages/indicadores/DemograficosBoard.tsx`: Full dashboard with 4 KPI cards (Total, %Mujeres, %Hombres, Edad Promedio) + gender PieChart + age BarChart (14-17/18-20/21-24/25+) + marital status PieChart + gender×age stacked BarChart. Local filters: año, sexo. Empty data shows "Sin datos" fallback

## Phase 3 — Territoriales Board (~200 lines)

- [x] 3.1 `pages/indicadores/TerritorialesBoard.tsx`: Full dashboard with 3 KPI cards (#Municipios, #Centros, #Cursos) + top 10 horizontal bars for municipios, centros, cursos + gender-by-municipio grouped bar. Local filters: provincia, año

## Phase 4 — Programa Board (~200 lines)

- [x] 4.1 `pages/indicadores/ProgramaBoard.tsx`: Full dashboard with 4 KPI cards (%Activos, %Graduados, %Menores con tutor, %Tutores con teléfono) + status PieChart + Active vs Graduated grouped bars by centro and municipio (top 10). Local filters: año

## Phase 5 — Sociales Board (~200 lines)

- [ ] 5.1 `pages/indicadores/SocialesBoard.tsx`: Full dashboard with 2 progress KPI cards (teléfono %, dirección %) with progress bars + gender by centro + gender by curso + age by centro + age by curso horizontal bars (top 10). Local filters: provincia, año
