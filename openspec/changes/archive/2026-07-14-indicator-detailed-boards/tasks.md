# Tasks: Indicator Detailed Boards

> **NOTA**: El alcance original eran 4 boards (Demográficos, Territoriales, Programa, Sociales). Durante la implementación se expandió a **9 boards** agregando: Calidad del Dato, Vulnerabilidad, Cobertura Temporal, Nivel Educativo, y Desempeño Centro. Los tasks están actualizados para reflejar el estado real del código.

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~2200 across 9 phases |
| 400-line budget risk | Low (each phase <400) |
| Chained PRs recommended | Yes |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |
| Scope expansion | +5 boards extras (CalidadDato, Vulnerabilidad, Cobertura, NivelEducativo, DesempenoCentro) |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Low

### Work Units Implemented

| Unit | Goal | Status |
|------|------|--------|
| 1 | Foundation: route types, layout, hook | ✅ |
| 2 | Demográficos dashboard board | ✅ |
| 3 | Territoriales dashboard board | ✅ |
| 4 | Programa dashboard board | ✅ |
| 5 | Sociales dashboard board | ✅ |
| 6 | Calidad del Dato board | ✅ (scope expansion) |
| 7 | Vulnerabilidad board | ✅ (scope expansion) |
| 8 | Cobertura Temporal board | ✅ (scope expansion) |
| 9 | Nivel Educativo board | ✅ (scope expansion) |
| 10 | Desempeño Centro board | ✅ (scope expansion) |

## Phase 1 — Foundation (~280 lines) ✅

- [x] 1.1 `types/routes.ts`: Add all route constants for 9 board paths
- [x] 1.2 `hooks/useIndicatorBoards.ts`: Create hook returning `BoardData` with slices for all 9 boards via single-pass `useMemo` loops
- [x] 1.3 `pages/IndicadoresLayout.tsx`: Create layout with tabs (5 main + dropdown "Más indicadores" con 5 extras) + `<Outlet />`
- [x] 1.4 `router.tsx`: Convert `/indicadores` to nested layout route with lazy-loaded children for all 9 boards

## Phase 2 — Demográficos Board (~200 lines) ✅

- [x] 2.1 `pages/indicadores/DemograficosBoard.tsx`: Full dashboard with 4 KPI cards (Total, %Mujeres, %Hombres, Edad Promedio) + gender PieChart + age BarChart (14-17/18-20/21-24/25+) + marital status PieChart + gender×age stacked BarChart. Local filters: año, sexo.

## Phase 3 — Territoriales Board (~200 lines) ✅

- [x] 3.1 `pages/indicadores/TerritorialesBoard.tsx`: Full dashboard with 3 KPI cards (#Municipios, #Centros, #Cursos) + top 10 horizontal bars for municipios, centros, cursos + gender-by-municipio grouped bar. Local filters: provincia, año

## Phase 4 — Programa Board (~200 lines) ✅

- [x] 4.1 `pages/indicadores/ProgramaBoard.tsx`: Full dashboard with 4 KPI cards (%Activos, %Graduados, %Menores con tutor, %Tutores con teléfono) + status PieChart + Active vs Graduated grouped bars by centro and municipio (top 10). Local filters: año

## Phase 5 — Sociales Board (~200 lines) ✅

- [x] 5.1 `pages/indicadores/SocialesBoard.tsx`: Full dashboard with 2 progress KPI cards (teléfono %, dirección %) with progress bars + gender by centro + gender by curso + age by centro + age by curso horizontal bars (top 10). Local filters: provincia, año

## Phase 6 — Calidad del Dato Board (~160 lines) ✅ (extra)

- [x] 6.1 `pages/indicadores/CalidadDatoBoard.tsx`: Dashboard with KPI (% completitud general + campos ≥80%) + completeness PieChart + bar chart de fields vs provincia + view toggle (grid/row). Local filters: provincia, año

## Phase 7 — Vulnerabilidad Board (~170 lines) ✅ (extra)

- [x] 7.1 `pages/indicadores/VulnerabilidadBoard.tsx`: Dashboard with KPI cards (#Vulnerables, % del total, tipos) + vulnerabilities PieChart + vulnerabilities by centro + vulnerables by provincia. Local filters: provincia, año

## Phase 8 — Cobertura Temporal Board (~180 lines) ✅ (extra)

- [x] 8.1 `pages/indicadores/CoberturaBoard.tsx`: Dashboard with KPI cards (Mes inicio, #Períodos) + monthly BarChart + quarterly BarChart + cumulative AreaChart. Local filters: año

## Phase 9 — Nivel Educativo Board (~180 lines) ✅ (extra)

- [x] 9.1 `pages/indicadores/NivelEducativoBoard.tsx`: Dashboard with KPI cards (Count por nivel, tasa) + nivel educativo PieChart + nivel por centro BarChart. Local filters: año

## Phase 10 — Desempeño Centro Board (~180 lines) ✅ (extra)

- [x] 10.1 `pages/indicadores/DesempenoCentroBoard.tsx`: Dashboard with KPI cards (Activos, Desertores, Egresados, Retirados, Bajas) + status PieChart + status by centro horizontal bars. Local filters: provincia, año
