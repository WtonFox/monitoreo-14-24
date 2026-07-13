# Tasks: API Fields, Dashboard & Indicators

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 650-900 (total) / ~120-200 (per phase) |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Schema) → PR 2 (Columns) → PR 3 (Dashboard) → PR 4 (Indicators) → PR 5 (Filters) |
| Delivery strategy | auto-forecast |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Test cmd | Runtime harness | Rollback boundary |
|------|------|-----------|----------|-----------------|-------------------|
| 1 | Schema: types + DB migration + sanitizer + exports | PR 1 | `vite build` | Load app; verify IndexedDB v2 stores new fields | Revert types.ts, database.ts, dataUtils.ts, exporter.ts, exportUtils.ts |
| 2 | DataTable columns | PR 2 | `vite build` | /participantes; ColumnSelector shows 7 new fields | Revert DataTable.tsx |
| 3 | Dashboard KPIs + charts | PR 3 | `vite build` | /estadisticas; 4 new KPIs + 3 chart blocks present | Revert StatsCards.tsx, ChartsSection.tsx |
| 4 | Indicators page + route | PR 4 | `vite build` | Navigate /indicadores; 34 indicators shown in 4 groups | Revert new files + router.tsx + Sidebar.tsx |
| 5 | Advanced filters (optional) | PR 5 | `vite build` | Advanced Filters modal shows estadoCivil/nivelEstudio | Revert AdvancedFiltersModal.tsx, hooks/useFilters.ts |

## Phase 1: Schema (Foundation)

- [x] 1.1 types.ts: Add 7 fields to `Participant` — `edadRegistro: number`, `estadoCivil`, `nivelEstudio`, `alergias`, `discapacidades`, `enfermedades`, `programasSociales: string | null`
- [x] 1.2 services/database.ts: Bump `DB_VERSION` 1→2; add `by-estadoCivil` and `by-nivelEstudio` indexes in `upgrade()` (existing upgrade already handles both stores)
- [x] 1.3 utils/dataUtils.ts: Extend `sanitizeParticipant()` return with 7 new fields via `getValue()`; update corrupted fallback object
- [x] 1.4 services/exporter.ts: Add 7 fields to CSV `data.map()` and Excel `excelData.map()` mappers + column widths
- [x] 1.5 utils/exportUtils.ts: Extend `exportCSV()` headers and row mapping with new fields

## Phase 2: Table Columns

- [x] 2.1 components/DataTable.tsx: Add 7 `DEFAULT_COLUMNS` entries (estadoCivil visible by default, 6 others hidden)
- [x] 2.2 components/DataTable.tsx: Add `renderCell()` cases for new columns (edadRegistro, estadoCivil, nivelEstudio, rutaFormativa, alergias, discapacidades, enfermedades, programasSociales, telefonos, cedulaTutor, telefonosResponsable)
- [x] 2.3 components/DataTable.tsx: Update `generateLocalCSV()` with all new fields (7 new + existing missing ones)

## Phase 3: Dashboard Enrichment

- [x] 3.1 components/StatsCards.tsx: Add 4 KPIs — avg edadRegistro, % discapacidades, % enfermedades, top programasSociales
- [x] 3.2 components/ChartsSection.tsx: Add estadoCivil pie chart (follow genderData + PieChart pattern)
- [x] 3.3 components/ChartsSection.tsx: Add nivelEstudio bar chart, programasSociales discapacidades/enfermedades bar chart (follow existing bar chart pattern)

## Phase 4: Indicators Page

- [x] 4.1 hooks/useIndicators.ts: Create hook computing 34 indicators grouped as Demográficos (1-12), Territoriales (13-26), Estado del Programa (27-30), Sociales (31-36) via `useMemo`
- [x] 4.2 components/IndicatorsBoard.tsx: Create reusable tile grid with category cards (name, value, formula, description, status badge)
- [x] 4.3 pages/Indicadores.tsx: Create page wrapping `<IndicatorsBoard>` with DashboardContext
- [x] 4.4 types/routes.ts: Add `INDICADORES: '/indicadores'` to `ROUTES`
- [x] 4.5 router.tsx: Add lazy-loaded `/indicadores` route via `React.lazy()` + `Suspense`; add `ROUTE_PERMISSIONS` entry
- [x] 4.6 components/Sidebar.tsx: Add "Indicadores" nav link to `MAIN_NAV_ITEMS` with BarChart3 icon
- [x] 4.7 hooks/useIndicators.ts: Mark indicators #13 and #14 as `"Pendiente de variables: sector"`

## Phase 5: Filters (Optional)

- [x] 5.1 components/AdvancedFiltersModal.tsx: Add `estadoCivil` and `nivelEstudio` filter selects
- [x] 5.2 hooks/useFilters.ts: Extend `AdvancedFilterState` with `estadoCivil` and `nivelEstudio`; add filter logic in `filteredData` useMemo
