## Exploration: API Fields, Dashboard & Indicators

### Current State

The system is a **monolithic dashboard SPA** (React 19 + Vite 6 + TypeScript) that fetches participant data from a single API endpoint:

```
GET /api/estadisticasPresidencia/getParticipantsStaticsPaged?pageIndex=N&pageSize=M
```

**Data flow:**
1. `services/api.ts` fetches paginated data from the API with Bearer token auth, 30s timeout, 5-min in-memory cache, and exponential backoff retry (3 attempts).
2. `utils/dataUtils.ts` → `sanitizeParticipant()` normalizes API responses into the `Participant` interface, handling PascalCase/camelCase field name variations.
3. `services/database.ts` persists participants to IndexedDB (idb, version 1) with indexes on provincia, estado, and edad.
4. `hooks/useDashboardData.ts` orchestrates a smart batch sync (1000/page) with progress tracking, dedup, pause/resume, and auto-polling every 15 min.
5. `contexts/DashboardContext.tsx` exposes `dashboardData: Participant[]` app-wide.
6. `contexts/FiltersContext.tsx` wraps `useFilters()` for basic + advanced filtering (province, status, municipio, year range, age group, sexo).
7. `pages/Estadisticas.tsx` renders `StatsCards` + `ChartsSection` using filtered data.
8. `pages/Participantes.tsx` renders a server-paginated `DataTable` (separate live API fetch).

**Current Participant interface** (20 fields):
id, nombres, apellidos, cedula, edad, fechaNacimiento, fechaRegistro, fechaInclusion, tutor, cedulaTutor, vulnerabilidades, estado, sexo, provincia, municipio, centro, direccion, rutaFormativa, telefonos, telefonosResponsable

### New API Fields Analysis

7 new fields from the API NOT yet in the Participant type:

| New Field | Type | Expected | Types | DB | Sanitizer | UI Cards | DataTable | Charts | Indicators |
|-----------|------|----------|-------|----|-----------|----------|-----------|--------|-------------|
| `edadRegistro` | number | Age at registration time | ✅ | ✅ | ✅ | Possibly | Optional | Possibly | Cross-ref |
| `estadoCivil` | string | Marital status | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 21, 22 |
| `nivelEstudio` | string | Education level | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | New |
| `alergias` | string | Allergies (comma-sep?) | ✅ | ✅ | ✅ | ✅ | Optional | Possibly | New |
| `discapacidades` | string | Disabilities (comma-sep?) | ✅ | ✅ | ✅ | ✅ | Optional | ✅ | New |
| `enfermedades` | string | Diseases (comma-sep?) | ✅ | ✅ | ✅ | ✅ | Optional | ✅ | New |
| `programasSociales` | string | Social programs (comma-sep?) | ✅ | ✅ | ✅ | ✅ | Optional | ✅ | New |

**Total fields captured:** 20 of 27 currently
**After update:** 27 of 27 fields from API

### Indicators Feasibility

For each of the 36 indicators, evaluated against AVAILABLE data (current + new fields):

1. **Total participants** — VIABLE (totalItems from API, already captured in PaginationResult)
2. **% Women** — VIABLE (sexo field already captured, used in ChartsSection pie chart)
3. **% Men** — VIABLE (sexo field already captured)
4. **Average age** — VIABLE (edad field already captured, computed in StatsCards)
5. **% 14-17 years** — VIABLE (edad field already captured, age groups in ChartsSection)
6. **% 18-24 years** — VIABLE (edad field already captured, age groups 18-20 + 21-24)
7. **% Women 14-17** — VIABLE (sexo + edad, both already captured)
8. **% Women 18-24** — VIABLE (sexo + edad, both already captured)
9. **% Men 14-17** — VIABLE (sexo + edad, both already captured)
10. **% Men 18-24** — VIABLE (sexo + edad, both already captured)
11. **Participants by municipality** — VIABLE (municipio already captured)
12. **% by municipality** — VIABLE (municipio already captured)
13. **Participants by sector** — **PENDING** — Needs: `sector` (structured field, NOT available in API response — direccion is free-text address, not structured sector)
14. **% by sector** — **PENDING** — Needs: `sector` (same as #13)
15. **Participants by center** — VIABLE (centro already captured, done in ChartsSection)
16. **% by center** — VIABLE (centro already captured)
17. **Participants by course** — VIABLE (rutaFormativa already captured)
18. **% by course** — VIABLE (rutaFormativa already captured)
19. **Participants by status** — VIABLE (estado already captured, done in ChartsSection)
20. **% by status** — VIABLE (estado already captured)
21. **Participants by marital status** — **VIABLE after new fields** — Needs: `estadoCivil` (NEW field to capture)
22. **% by marital status** — **VIABLE after new fields** — Needs: `estadoCivil` (same as #21)
23. **% with phone registered** — VIABLE (telefonos already captured — check for non-null/non-empty)
24. **% with address registered** — VIABLE (direccion already captured)
25. **% minors with responsible registered** — VIABLE (edad + tutor, both already captured)
26. **% responsible with phone registered** — VIABLE (telefonosResponsable already captured)
27. **% Women by municipality** — VIABLE (sexo + municipio, both already captured)
28. **% Men by municipality** — VIABLE (sexo + municipio, both already captured)
29. **% by sex and center** — VIABLE (sexo + centro, both already captured)
30. **% by sex and course** — VIABLE (sexo + rutaFormativa, both already captured)
31. **% by age group and center** — VIABLE (edad + centro, both already captured)
32. **% by age group and course** — VIABLE (edad + rutaFormativa, both already captured)
33. **% Active by center** — VIABLE (estado + centro, both already captured)
34. **% Active by municipality** — VIABLE (estado + municipio, both already captured)
35. **% Graduated by center** — VIABLE (estado + centro, both already captured — estado=Egresado)
36. **% Graduated by municipality** — VIABLE (estado + municipio, both already captured)

**Summary:**

| Category | Count | Indicators |
|----------|-------|------------|
| VIABLE now | 30 | 1-12, 15-20, 23-36 |
| VIABLE after new fields | 2 | 21, 22 |
| PENDING (missing `sector`) | 2 | 13, 14 |
| **Total indicators** | **36** | |

**Missing variables needed for PENDING indicators:**
- `sector` — A structured geographic subdivision below municipality. The `direccion` field (free-text address) cannot reliably power sector-level aggregation. This would need to come from the API as a new field, or be derived via a geocoding/normalization process (high effort, low accuracy).

### Affected Areas

- **types.ts** — Add 7 new fields to Participant interface
- **services/database.ts** — Bump DB_VERSION to 2, add migration logic for new fields in the IndexedDB schema. No new indexes strictly required unless filtering by these fields becomes necessary (estadoCivil and nivelEstudio are candidates for index).
- **utils/dataUtils.ts** — Extend sanitizeParticipant() return object with getValue() calls for 7 new fields; extend the corrupted-record fallback with defaults for new fields.
- **services/exporter.ts** — Add new fields to CSV and Excel export field mappers (both `data.map(item => ({...}))` blocks)
- **utils/exportUtils.ts** — exportCSV/exportJSON already spread the entire Participant object — they will pick up the new fields automatically since they export `data` as-is (CSV explicitly maps fields so it would need updating; JSON spreads the whole object so it's auto).
- **components/StatsCards.tsx** — Add new KPIs: avg edadRegistro, % with discapacidades, % with enfermedades, % by estadoCivil distribution, % by nivelEstudio
- **components/DataTable.tsx** — Add new columns to DEFAULT_COLUMNS array; extend renderCell() switch for new field display (edadRegistro, estadoCivil, nivelEstudio, alergias, discapacidades, enfermedades, programasSociales)
- **components/ColumnSelector.tsx** — No changes needed (works from DEFAULT_COLUMNS)
- **components/ChartsSection.tsx** — Add new chart sections for estadoCivil pie, nivelEstudio bar, discapacidades/enfermedades bar (similar to vulnerabilityData pattern)
- **pages/Estadisticas.tsx** — Pass new filter options through (if estadoCivil or nivelEstudio filters are added to AdvancedFiltersModal)
- **components/AdvancedFiltersModal.tsx** — Optionally add estadoCivil and nivelEstudio as new filter dimensions
- **hooks/useFilters.ts** — Optionally extend AdvancedFilterState and filtering logic for new fields
- **router.tsx** — Add new route `/indicadores` for the Indicators page
- **pages/Indicadores.tsx** (NEW) — Full-page indicator board rendering 34+ computed indicators
- **components/IndicatorsBoard.tsx** (NEW) — Reusable indicator card grid component with KPI tiles, mini-charts
- **hooks/useIndicators.ts** (NEW) — Computation hook that derives all 34 viable indicators from Participant[] data
- **components/Sidebar.tsx** — Add navigation link to new Indicators page
- **App.tsx** — No changes (Outlet pattern handles new routes automatically)

### Approaches

1. **Approach A: Incremental (Recommended)** — Add new fields layer by layer, then dashboard improvements, then Indicators page
   - **Phase 1 — Core Schema**: Update types.ts → database.ts → dataUtils.ts → exporter.ts. Deployable after this phase: new fields exist in all data layers, exports include them.
   - **Phase 2 — Data Table**: Add new columns to DataTable.tsx. Deployable: users can see and search new fields.
   - **Phase 3 — Dashboard**: Update StatsCards + ChartsSection with new KPIs and charts. Deployable: richer stats on /estadisticas.
   - **Phase 4 — Indicators Page**: New route, new page, useIndicators hook. Deployable: full indicator board at /indicadores.
   - **Phase 5 — Filters (Optional)**: Add estadoCivil/nivelEstudio to AdvancedFiltersModal if needed.
   - **Pros**: Each phase independently deployable (≤400 lines per PR); lower risk; early value delivery; easy to roll back individual phases
   - **Cons**: Longer time to full delivery; need careful commit ordering if phases share types
   - **Effort**: Medium (spread across 5 focused PRs)

2. **Approach B: Full Rebuild** — Implement everything in one pass
   - All types, DB migration, sanitizer, exports, new charts, new cards, new indicators page, new filters in one monolithic change
   - **Pros**: Single coordinated change, no intermediate states
   - **Cons**: Estimated 800-1200 lines; exceeds review budget; high risk of merge conflicts; hard to roll back; no early value delivery
   - **Effort**: High

3. **Approach C: Minimal Viable** — Only capture new fields + Indicators page (skip dashboard improvements)
   - Types + DB + sanitizer + exports + Indicators page. No new chart sections, no new cards in /estadisticas.
   - **Pros**: Fastest path to indicator availability; minimal risk
   - **Cons**: Misses opportunity to enrich existing dashboards; indicators page feels disconnected without visual context
   - **Effort**: Low-Medium

### Recommendation

**Approach A: Incremental**. It aligns with the project's existing patterns (previous SDD change also used chained PRs), stays within the 400-line review budget per PR, and delivers value at each phase. Specifically:

1. The new API fields are **backward-compatible** — existing code ignores unknown fields, and the Participant interface is consumed by reference throughout.
2. The IndexedDB migration (version bump) is standard idb pattern and well-documented.
3. The Indicators page is a natural "Phase 4" that builds on all prior phases.
4. Pending indicators (sector-based) should be handled explicitly: mark them as not implemented and optionally add a note in the UI about the limitation.

### Dependency Update Assessment

| Package | Current | Latest Compatible | Notes |
|---------|---------|-------------------|-------|
| react | ^19.2.3 | 19.2.7 | Patch — safe to update |
| react-dom | ^19.2.3 | 19.2.7 | Patch — safe |
| react-router-dom | ^7.16.0 | 7.18.1 | Minor — safe within v7 |
| vite | ^6.2.0 | 8.1.4 | **MAJOR** (v6→v8) — breaking changes expected. Migration needed |
| @vitejs/plugin-react | ^5.0.0 | Works with v6.x | Check compatibility with higher vite versions |
| typescript | ~5.8.2 | 7.0.2 | **MAJOR** (5.8→7.0) — significant breaking changes expected |
| recharts | ^3.6.0 | 3.9.2 | Minor — safe |
| leaflet | ^1.9.4 | 1.9.4 | **Current** — no update needed |
| react-leaflet | ^5.0.0 | 5.0.0 | **Current** |
| @types/leaflet | ^1.9.21 | 1.9.21 | **Current** |
| lucide-react | ^0.562.0 | 1.24.0 | **MAJOR** (0.x→1.x) — breaking changes expected in icon exports |
| idb | ^8.0.3 | 8.0.3 | **Current** |
| papaparse | ^5.5.3 | 5.5.4 | Patch — safe |
| @types/papaparse | ^5.5.2 | 5.5.2 | **Current** |
| xlsx | ^0.18.5 | 0.18.5 | **Current** |
| @types/node | ^22.14.0 | 26.1.1 | **MAJOR** — for type definitions only, safe to defer |

**Recommendation**: Do NOT bump major versions (vite, typescript, lucide-react) as part of this change. They are independent concerns with their own risk profiles. Focus dependency updates on safe patches/minors only.

### Risks

1. **API field contract unknown** — The 7 new fields mentioned may use different naming conventions (PascalCase, camelCase, or something else). The `getValue()` helper handles common variations, but the exact API shape is not verified. Mitigation: log the first 3 API responses during sync (already done in `sanitizeParticipant` with `logCounter`) to confirm actual field names before finalizing.

2. **IndexedDB migration risk** — Bumping DB_VERSION triggers the `upgrade` callback. If any user has DB_VERSION = 1 already stored, the upgrade must handle both fresh installs and existing data. Need to test the migration path: old records will have `undefined` for new fields, which the Participant interface accepts as optional-ish (but currently all fields can be string|null). Must ensure the migration doesn't drop existing indexes.

3. **Estado civil / nivel estudio value ranges unknown** — Without seeing actual API values, UI filters and chart groupings cannot be hardcoded. Mitigation: let the Indicators hook compute unique values dynamically from the data, similar to how `useFilters.ts` computes `availableStatuses`.

4. **Sector data unavailability** — 2 of 36 indicators (13, 14) cannot be implemented. Stakeholders should be informed early rather than discovering it after implementation.

5. **Indicators computation performance** — 34 computed indicators on a dataset of potentially 10k+ participants in the browser. Mitigation: use `useMemo` with proper dependency arrays; consider memoizing cross-tabulations (e.g., pre-compute sex × municipio matrix once, used by indicators 27, 28).

### Ready for Proposal

**Yes** — The analysis is complete. All 34 of 36 indicators are viable (30 now, 2 after new field capture), the incremental approach is well-defined, and risks are identified. The orchestrator can proceed to the proposal phase with a clear picture of scope, effort, and limitations.
